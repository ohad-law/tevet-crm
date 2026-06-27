import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Trash2, Edit, X, ListFilter, CheckSquare, Square, Send, MessageCircle } from "lucide-react";
import { sendWhatsApp } from "@/functions/sendWhatsApp";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import UnauthorizedAccess from "../components/common/UnauthorizedAccess";
import { base44 } from "@/api/base44Client";
import LeadCard from "@/components/leads/LeadCard";
import LeadSidePanel from "@/components/leads/LeadSidePanel";
import LeadStatsBar from "@/components/leads/LeadStatsBar";
import CallLogDialog from "@/components/leads/CallLogDialog";
import { getStep, FIRST_STEP_ID, buildTaskFromStep } from "@/lib/caseWorkflow";

export default function LeadManagement() {
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelLead, setSidePanelLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [quickFilter, setQuickFilter] = useState("all");
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsAppLead, setWhatsAppLead] = useState(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [callLogLead, setCallLogLead] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      if (userData.role !== 'admin') { setIsLoading(false); return; }

      const [leadsData, campaignsData, clientsData] = await Promise.all([
        base44.entities.Lead.list("-created_date"),
        base44.entities.MarketingCampaign.list(),
        base44.entities.Client.list()
      ]);

      setLeads(leadsData);
      setCampaigns(campaignsData);
      setClients(clientsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading leads:", error);
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const updates = { status: newStatus };
    if (newStatus === "יצר קשר" && !lead.first_contact_date) {
      updates.first_contact_date = new Date().toISOString().split('T')[0];
    }
    if (newStatus === "הפך ללקוח" && !lead.converted_to_client) {
      updates.converted_to_client = true;
      updates.conversion_date = new Date().toISOString().split('T')[0];
    }
    await base44.entities.Lead.update(leadId, updates);
    loadData();
  };

  const handleConvertToClient = async (lead) => {
    if (!confirm(`להמיר את ${lead.full_name} ללקוח ולפתוח לו תיק?`)) return;
    try {
      // 1. יצירת לקוח
      const client = await base44.entities.Client.create({
        full_name: lead.full_name, phone: lead.phone, email: lead.email,
        classification: "פרטי", status: "פעיל",
        join_date: new Date().toISOString().split('T')[0]
      });

      // 2. מספר תיק אוטומטי בפורמט YYYY-NNN (אותו מנגנון כמו במסך התיקים)
      const year = new Date().getFullYear();
      const allCases = await base44.entities.Case.list();
      const existingNumbers = allCases
        .filter(c => c.case_number?.startsWith(`${year}-`))
        .map(c => {
          const parts = c.case_number.split('-');
          return parts.length === 2 ? parseInt(parts[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      const nextNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
      const caseNumber = `${year}-${String(nextNumber).padStart(3, '0')}`;

      // 3. פתיחת תיק (שם התיק = שם הלקוח, כדי שיתאים לתיקיות ה-Drive)
      const newCase = await base44.entities.Case.create({
        case_number: caseNumber,
        case_name: lead.full_name,
        client_id: client.id,
        case_type: "דיני עבודה - שכר",
        status: "תיק נכנס",
        open_date: new Date().toISOString().split('T')[0]
      });

      // 4. פתיחת תיקיית Drive — נכשל בעדינות אם הדרייב מנותק
      let driveOk = true;
      try {
        await base44.functions.invoke('googleDriveV2', {
          action: 'create_case_folder',
          caseNumber,
          clientName: lead.full_name,
          caseId: newCase.id
        });
      } catch (driveErr) {
        driveOk = false;
        console.error('Drive folder creation failed:', driveErr);
      }

      // 5. משימה ראשונה בשרשרת — "איסוף מסמכים", משויכת למבצע ההמרה
      const firstStep = getStep(FIRST_STEP_ID);
      await base44.entities.Task.create(
        buildTaskFromStep(firstStep, { caseId: newCase.id, assignedTo: currentUser?.email })
      );

      // 6. עדכון הליד
      await base44.entities.Lead.update(lead.id, {
        status: "הפך ללקוח", converted_to_client: true,
        conversion_date: new Date().toISOString().split('T')[0], converted_client_id: client.id
      });

      // 7. התראה למנהל
      base44.functions.invoke('notifyAdmin', {
        entity: 'Case', action: 'create',
        details: `ליד הומר ללקוח ונפתח תיק:\nלקוח: ${lead.full_name}\nמספר תיק: ${caseNumber}\nמשימה ראשונה: ${firstStep.label}`
      });

      alert(
        `הליד הומר בהצלחה!\n\nנפתחו: לקוח + תיק ${caseNumber} + משימת "${firstStep.label}".` +
        (driveOk
          ? '\nתיקיית Drive נוצרה.'
          : '\n⚠️ תיקיית Drive לא נוצרה (כנראה הדרייב מנותק) — יש לפתוח ידנית.')
      );
      loadData();
    } catch (err) {
      console.error('Convert to client failed:', err);
      alert('אירעה שגיאה בהמרת הליד. בדוק את הפרטים ונסה שוב.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) {
      await base44.entities.Lead.delete(id);
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      loadData();
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`למחוק ${selectedIds.size} לידים? פעולה זו בלתי הפיכה.`)) {
      for (const id of selectedIds) {
        await base44.entities.Lead.delete(id);
      }
      setSelectedIds(new Set());
      loadData();
    }
  };

  const handleBatchStatus = async (newStatus) => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        const updates = { status: newStatus };
        if (newStatus === "יצר קשר" && !lead.first_contact_date) {
          updates.first_contact_date = new Date().toISOString().split('T')[0];
        }
        await base44.entities.Lead.update(id, updates);
      }
    }
    setSelectedIds(new Set());
    loadData();
  };

  const handleSidePanelSave = async (leadId, formData) => {
    await base44.entities.Lead.update(leadId, formData);
    setShowSidePanel(false);
    setSidePanelLead(null);
    loadData();
  };

  const handleUpdateLead = async (leadData) => {
    if (selectedLead) {
      await base44.entities.Lead.update(selectedLead.id, leadData);
    } else {
      await base44.entities.Lead.create(leadData);
    }
    setShowEditDialog(false);
    setSelectedLead(null);
    loadData();
  };

  const handleCall = (lead) => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleUpdateCallAttempts = async (leadId, attempts) => {
    await base44.entities.Lead.update(leadId, { call_attempts: attempts });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, call_attempts: attempts } : l));
  };

  const handleCallLogSave = (leadId, updates) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
  };

  const handleEmail = (lead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_self');
    } else {
      alert('אין כתובת אימייל לליד זה');
    }
  };

  const openSidePanel = (lead) => {
    setSidePanelLead(lead);
    setShowSidePanel(true);
  };

  const handleWhatsApp = (lead) => {
    setWhatsAppLead(lead);
    setWhatsAppMessage(`היי ${lead.full_name}, קיבלתי את הפנייה שלך ואשמח לעזור!`);
    setShowWhatsAppDialog(true);
  };

  const handleSendWhatsApp = async () => {
    if (!whatsAppLead || !whatsAppMessage.trim()) return;
    setWhatsAppSending(true);
    try {
      await sendWhatsApp({ phone: whatsAppLead.phone, message: whatsAppMessage });
      alert('הודעת וואטסאפ נשלחה!');
      setShowWhatsAppDialog(false);
      setWhatsAppLead(null);
      setWhatsAppMessage("");
    } catch (error) {
      alert('שגיאה בשליחת ההודעה: ' + (error?.response?.data?.error || error.message));
    }
    setWhatsAppSending(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  if (isLoading) return <div className="p-8">טוען...</div>;
  if (currentUser?.role !== 'admin') return <UnauthorizedAccess />;

  const quickFilters = [
    { key: 'all', label: 'הכל' },
    { key: 'new', label: 'חדשים', count: leads.filter(l => l.status === 'חדש').length },
    { key: 'hot', label: 'חמים 🔥', count: leads.filter(l => l.lead_score >= 75 && l.status !== 'הפך ללקוח' && l.status !== 'לא רלוונטי').length },
    { key: 'urgent', label: 'דורשים טיפול', count: leads.filter(l => {
      const d = Math.floor((Date.now() - new Date(l.created_date).getTime()) / (1000 * 60 * 60 * 24));
      return d >= 2 && (l.status === 'חדש' || l.status === 'יצר קשר');
    }).length },
    { key: 'followup', label: 'פולו אפ', count: leads.filter(l => l.status === 'פולו אפ נדרש').length },
    { key: 'converted', label: 'הומרו', count: leads.filter(l => l.status === 'הפך ללקוח').length },
    { key: 'nocall', label: '📵 ללא שיחה', count: leads.filter(l => l.status !== 'הפך ללקוח' && l.status !== 'לא רלוונטי' && (!l.call_status || l.call_status === 'לא בוצעה')).length },
    { key: 'today', label: '📅 היום', count: leads.filter(l => { const d = new Date(l.created_date); const now = new Date(); return d.toDateString() === now.toDateString(); }).length },
    { key: 'yesterday', label: '📅 אתמול', count: leads.filter(l => { const d = new Date(l.created_date); const yest = new Date(); yest.setDate(yest.getDate() - 1); return d.toDateString() === yest.toDateString(); }).length },
  ];

  const filteredLeads = leads.filter(lead => {
    // Quick filter
    if (quickFilter === 'new' && lead.status !== 'חדש') return false;
    if (quickFilter === 'hot' && (lead.lead_score < 75 || lead.status === 'הפך ללקוח' || lead.status === 'לא רלוונטי')) return false;
    if (quickFilter === 'urgent') {
      const d = Math.floor((Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24));
      if (!(d >= 2 && (lead.status === 'חדש' || lead.status === 'יצר קשר'))) return false;
    }
    if (quickFilter === 'followup' && lead.status !== 'פולו אפ נדרש') return false;
    if (quickFilter === 'converted' && lead.status !== 'הפך ללקוח') return false;
    if (quickFilter === 'nocall' && !(lead.status !== 'הפך ללקוח' && lead.status !== 'לא רלוונטי' && (!lead.call_status || lead.call_status === 'לא בוצעה'))) return false;
    if (quickFilter === 'today') { const d = new Date(lead.created_date); const now = new Date(); if (d.toDateString() !== now.toDateString()) return false; }
    if (quickFilter === 'yesterday') { const d = new Date(lead.created_date); const yest = new Date(); yest.setDate(yest.getDate() - 1); if (d.toDateString() !== yest.toDateString()) return false; }

    const matchesSearch = lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) || lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    let matchesSource = filterSource === "all" || lead.source === filterSource;
    let matchesScore = filterScore === "all" ||
      (filterScore === "hot" && lead.lead_score >= 75) ||
      (filterScore === "warm" && lead.lead_score >= 50 && lead.lead_score < 75) ||
      (filterScore === "cold" && lead.lead_score < 50);

    return matchesSearch && matchesStatus && matchesSource && matchesScore;
  }).sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 tracking-tight">ניהול לידים</h1>
          <p className="text-slate-500 text-sm">Lead Pipeline · {filteredLeads.length} לידים</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setSelectedLead(null)}>
                <Plus className="w-5 h-5 ml-2" /> ליד חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{selectedLead ? 'עריכת ליד' : 'ליד חדש'}</DialogTitle></DialogHeader>
              <LeadForm lead={selectedLead} campaigns={campaigns} onSubmit={handleUpdateLead} onCancel={() => { setShowEditDialog(false); setSelectedLead(null); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      <LeadStatsBar leads={leads} />

      {/* Quick filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {quickFilters.map(qf => (
          <button
            key={qf.key}
            onClick={() => setQuickFilter(qf.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              quickFilter === qf.key
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {qf.label}
            {qf.count > 0 && (
              <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                quickFilter === qf.key ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {qf.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="חיפוש לפי שם, טלפון או אימייל..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-9" />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue placeholder="סטטוס" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="חדש">חדש</SelectItem>
                  <SelectItem value="יצר קשר">יצר קשר</SelectItem>
                  <SelectItem value="פגישה נקבעה">פגישה נקבעה</SelectItem>
                  <SelectItem value="פולו אפ נדרש">פולו אפ נדרש</SelectItem>
                  <SelectItem value="ליד חם 🔥">ליד חם</SelectItem>
                  <SelectItem value="הפך ללקוח">הפך ללקוח</SelectItem>
                  <SelectItem value="לא רלוונטי">לא רלוונטי</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue placeholder="מקור" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המקורות</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="אתר">אתר</SelectItem>
                  <SelectItem value="המלצה">המלצה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterScore} onValueChange={setFilterScore}>
                <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue placeholder="ציון" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הציונים</SelectItem>
                  <SelectItem value="hot">חמים (75+)</SelectItem>
                  <SelectItem value="warm">פושרים (50-74)</SelectItem>
                  <SelectItem value="cold">קרים (&lt;50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-lg sticky top-14 z-30"
          >
            <button onClick={() => setSelectedIds(new Set())} className="hover:bg-blue-500 rounded-lg p-1">
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold">{selectedIds.size} לידים נבחרו</span>
            <div className="flex-1" />
            <Button size="sm" variant="secondary" onClick={() => handleBatchStatus('יצר קשר')}>
              סמן "יצר קשר"
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBatchStatus('לא רלוונטי')}>
              סמן "לא רלוונטי"
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBatchStatus('פולו אפ נדרש')}>
              סמן "פולו אפ"
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600">
              <Trash2 className="w-4 h-4 ml-1" /> מחק
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select all toggle */}
      <div className="flex items-center gap-3 px-1">
        <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          {selectedIds.size === filteredLeads.length ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : selectedIds.size > 0 ? (
            <CheckSquare className="w-4 h-4 text-blue-400" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {selectedIds.size === filteredLeads.length ? 'בטל בחירה' : 'בחר הכל'}
        </button>
        <span className="text-xs text-slate-400">{filteredLeads.length} לידים מוצגים</span>
      </div>

      {/* Lead cards grid */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredLeads.map((lead, idx) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.02 }}
            >
              <LeadCard
                lead={lead}
                isSelected={selectedIds.has(lead.id)}
                onToggleSelect={toggleSelect}
                onStatusChange={handleStatusChange}
                onEdit={(l) => { setSelectedLead(l); setShowEditDialog(true); }}
                onDelete={handleDelete}
                onConvert={handleConvertToClient}
                onCall={handleCall}
                onEmail={handleEmail}
                onWhatsApp={handleWhatsApp}
                onViewDetails={openSidePanel}
                onUpdateCallAttempts={handleUpdateCallAttempts}
                onLogCall={(lead) => setCallLogLead(lead)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLeads.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ListFilter className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">לא נמצאו לידים</p>
            <p className="text-slate-400 text-sm mt-1">נסה לשנות את החיפוש או הפילטרים</p>
          </div>
        )}
      </div>

      {/* WhatsApp Dialog */}
      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              שליחת וואטסאפ
            </DialogTitle>
          </DialogHeader>
          {whatsAppLead && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                  {whatsAppLead.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{whatsAppLead.full_name}</p>
                  <p className="text-sm text-slate-500" dir="ltr">{whatsAppLead.phone}</p>
                </div>
              </div>
              <div>
                <Label>הודעה</Label>
                <Textarea
                  value={whatsAppMessage}
                  onChange={(e) => setWhatsAppMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleSendWhatsApp}
                disabled={whatsAppSending || !whatsAppMessage.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {whatsAppSending ? (
                  <>שולח...</>
                ) : (
                  <><Send className="w-4 h-4" /> שלח וואטסאפ</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Call Log Dialog */}
      {callLogLead && (
        <CallLogDialog
          lead={callLogLead}
          open={!!callLogLead}
          onClose={() => setCallLogLead(null)}
          onSave={handleCallLogSave}
        />
      )}

      {/* Side Panel */}
      <LeadSidePanel
        lead={sidePanelLead}
        isOpen={showSidePanel}
        onClose={() => { setShowSidePanel(false); setSidePanelLead(null); }}
        onSave={handleSidePanelSave}
        onCall={handleCall}
        onEmail={handleEmail}
        onWhatsApp={handleWhatsApp}
        onConvert={handleConvertToClient}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

// Lead Form Component
function LeadForm({ lead, campaigns, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(lead ? { ...lead } : {
    full_name: "", phone: "", email: "", source: "אתר", campaign_name: "", status: "חדש", lead_score: 50, notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const final = { ...formData };
    if (final.source !== 'אחר') final.source_other = '';
    onSubmit(final);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>שם מלא *</Label>
          <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
        </div>
        <div>
          <Label>טלפון *</Label>
          <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
        </div>
        <div>
          <Label>אימייל</Label>
          <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <Label>מקור *</Label>
          <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Google Ads">Google Ads</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="אתר">אתר</SelectItem>
              <SelectItem value="המלצה">המלצה</SelectItem>
              <SelectItem value="אחר">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.source === 'אחר' && (
          <div className="col-span-2">
            <Label>פרט מקור אחר</Label>
            <Input value={formData.source_other || ''} onChange={(e) => setFormData({...formData, source_other: e.target.value})} placeholder="למשל: כנס, מפגש, עיתון" />
          </div>
        )}
        <div>
          <Label>סטטוס</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="חדש">חדש</SelectItem>
              <SelectItem value="יצר קשר">יצר קשר</SelectItem>
              <SelectItem value="פגישה נקבעה">פגישה נקבעה</SelectItem>
              <SelectItem value="פולו אפ נדרש">פולו אפ נדרש</SelectItem>
              <SelectItem value="ליד חם 🔥">ליד חם 🔥</SelectItem>
              <SelectItem value="הפך ללקוח">הפך ללקוח</SelectItem>
              <SelectItem value="לא רלוונטי">לא רלוונטי</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>ציון ליד (0-100)</Label>
          <Input type="number" min="0" max="100" value={formData.lead_score} onChange={(e) => setFormData({...formData, lead_score: parseInt(e.target.value)})} />
        </div>
      </div>
      <div>
        <Label>הערות</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{lead ? 'עדכן' : 'צור ליד'}</Button>
      </div>
    </form>
  );
}