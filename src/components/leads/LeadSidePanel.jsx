import React, { useState, useEffect } from "react";
import { X, Phone, Mail, Save, MessageSquare, Calendar, UserPlus, Check, Flame, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const statusColors = {
  'חדש': 'bg-blue-100 text-blue-800',
  'יצר קשר': 'bg-purple-100 text-purple-800',
  'פגישה נקבעה': 'bg-amber-100 text-amber-800',
  'הפך ללקוח': 'bg-green-100 text-green-800',
  'לא רלוונטי': 'bg-gray-100 text-gray-800',
  'פולו אפ נדרש': 'bg-orange-100 text-orange-800',
  'ליד חם 🔥': 'bg-red-100 text-red-800',
};

export default function LeadSidePanel({ lead, isOpen, onClose, onSave, onCall, onEmail, onConvert, onStatusChange, onWhatsApp }) {
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        full_name: lead.full_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || 'אתר',
        status: lead.status || 'חדש',
        lead_score: lead.lead_score || 50,
        notes: lead.notes || '',
      });
      setIsDirty(false);
    }
  }, [lead]);

  if (!lead || !isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(lead.id, formData);
    setIsDirty(false);
  };

  const daysAgo = Math.floor((Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24));
  const isHot = (lead.lead_score || 0) >= 75;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {isHot && <Flame className="w-5 h-5 text-red-500" />}
                <h2 className="text-xl font-bold text-slate-900">{lead.full_name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-5">
              {/* Quick info badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                <Badge variant="outline">{lead.source === 'אחר' ? lead.source_other || 'אחר' : lead.source}</Badge>
                <Badge variant="outline" className={lead.lead_score >= 75 ? 'text-red-600 border-red-200' : lead.lead_score >= 50 ? 'text-amber-600 border-amber-200' : 'text-gray-600'}>
                  ציון {lead.lead_score}
                </Badge>
                <span className="text-xs text-slate-400 self-center">
                  {daysAgo === 0 ? 'היום' : daysAgo === 1 ? 'אתמול' : `לפני ${daysAgo} ימים`}
                </span>
              </div>

              {/* Contact actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 gap-2" onClick={() => onCall(lead)}>
                  <Phone className="w-4 h-4" /> חייג {lead.phone}
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => onEmail(lead)}>
                  <Mail className="w-4 h-4" /> מייל
                </Button>
                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 gap-2" onClick={() => onWhatsApp(lead)}>
                  <MessageCircle className="w-4 h-4" /> וואטסאפ
                </Button>
                {lead.status !== 'הפך ללקוח' && lead.status !== 'לא רלוונטי' && (
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 gap-2" onClick={() => onConvert(lead)}>
                    <UserPlus className="w-4 h-4" /> המר
                  </Button>
                )}
              </div>

              {/* Edit form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-500">שם מלא</Label>
                  <Input value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">טלפון</Label>
                    <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">אימייל</Label>
                    <Input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} dir="ltr" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">סטטוס</Label>
                    <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
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
                    <Label className="text-xs text-slate-500">ציון ליד</Label>
                    <Input type="number" min="0" max="100" value={formData.lead_score} onChange={(e) => handleChange('lead_score', parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-500">הערות</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={5}
                    placeholder="הוסף הערות על הליד..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={!isDirty} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                    <Save className="w-4 h-4" /> שמור שינויים
                  </Button>
                  <Button variant="outline" onClick={onClose}>ביטול</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}