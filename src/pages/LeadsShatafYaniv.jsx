import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Phone, Mail, Calendar, Eye, Edit2, ExternalLink, Users, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function LeadsShatafYaniv() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await base44.entities.LeadShatafYaniv.list("-created_date");
      setLeads(data || []);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error("שגיאה בטעינת הלידים");
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (lead) => {
    if (lead.is_viewed) return;
    try {
      await base44.entities.LeadShatafYaniv.update(lead.id, { is_viewed: true });
      setLeads(leads.map(l => l.id === lead.id ? { ...l, is_viewed: true } : l));
    } catch (error) {
      console.error("Error marking as viewed:", error);
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      await base44.entities.LeadShatafYaniv.update(leadId, { status: newStatus });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success("הסטטוס עודכן");
    } catch (error) {
      toast.error("שגיאה בעדכון הסטטוס");
    }
  };

  const saveLeadNotes = async () => {
    if (!selectedLead) return;
    try {
      await base44.entities.LeadShatafYaniv.update(selectedLead.id, { notes: selectedLead.notes });
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, notes: selectedLead.notes } : l));
      toast.success("ההערות נשמרו");
      setEditDialogOpen(false);
    } catch (error) {
      toast.error("שגיאה בשמירת ההערות");
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "חדש").length,
    contacted: leads.filter(l => l.status === "נוצר קשר").length,
    suitable: leads.filter(l => l.status === "מתאים").length,
    converted: leads.filter(l => l.status === "הומר ללקוח").length,
    unviewed: leads.filter(l => !l.is_viewed).length
  };

  const statusColors = {
    "חדש": "bg-blue-100 text-blue-800",
    "נוצר קשר": "bg-yellow-100 text-yellow-800",
    "מתאים": "bg-green-100 text-green-800",
    "לא מתאים": "bg-red-100 text-red-800",
    "הומר ללקוח": "bg-purple-100 text-purple-800"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">לידים - קמפיין שתפ יניב</h1>
          <p className="text-slate-500 text-sm">לידים מפייסבוק - Google Sheets</p>
        </div>
        {stats.unviewed > 0 && (
          <Badge className="bg-red-500 text-white text-sm px-3 py-1">
            {stats.unviewed} לידים חדשים
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-600">סה"כ לידים</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-cyan-600 mb-2" />
            <p className="text-2xl font-bold text-cyan-900">{stats.new}</p>
            <p className="text-xs text-cyan-600">חדשים</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-900">{stats.contacted}</p>
            <p className="text-xs text-yellow-600">נוצר קשר</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-900">{stats.suitable}</p>
            <p className="text-xs text-green-600">מתאימים</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-900">{stats.converted}</p>
            <p className="text-xs text-purple-600">הומרו ללקוחות</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חיפוש לפי שם, טלפון או אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="סינון לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="חדש">חדש</SelectItem>
                <SelectItem value="נוצר קשר">נוצר קשר</SelectItem>
                <SelectItem value="מתאים">מתאים</SelectItem>
                <SelectItem value="לא מתאים">לא מתאים</SelectItem>
                <SelectItem value="הומר ללקוח">הומר ללקוח</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-right">שם מלא</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right hidden md:table-cell">שנות ותק</TableHead>
                <TableHead className="text-right hidden md:table-cell">שכר במזומן</TableHead>
                <TableHead className="text-right hidden lg:table-cell">שעות נוספות</TableHead>
                <TableHead className="text-right hidden lg:table-cell">סיבת סיום</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right hidden md:table-cell">תאריך</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    אין לידים להצגה
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className={`hover:bg-slate-50 ${!lead.is_viewed ? 'bg-blue-50/50' : ''}`}
                    onClick={() => markAsViewed(lead)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {!lead.is_viewed && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                        {lead.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.work_duration || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">{lead.salary_cash || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.overtime || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.termination_reason || "-"}</TableCell>
                    <TableCell>
                      <Select 
                        value={lead.status} 
                        onValueChange={(val) => updateLeadStatus(lead.id, val)}
                      >
                        <SelectTrigger className={`w-32 h-8 text-xs ${statusColors[lead.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="חדש">חדש</SelectItem>
                          <SelectItem value="נוצר קשר">נוצר קשר</SelectItem>
                          <SelectItem value="מתאים">מתאים</SelectItem>
                          <SelectItem value="לא מתאים">לא מתאים</SelectItem>
                          <SelectItem value="הומר ללקוח">הומר ללקוח</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                      {moment(lead.created_date).format("DD/MM/YY HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {lead.drive_link && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(lead.drive_link, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת ליד - {selectedLead?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">הערות</label>
              <Textarea
                value={selectedLead?.notes || ""}
                onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                placeholder="הוסף הערות..."
                rows={4}
              />
            </div>
            <Button onClick={saveLeadNotes} className="w-full">
              שמור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}