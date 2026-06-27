import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Upload, Sparkles, Loader2, CheckCircle, Mic } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SCORE_COLOR = (score) => {
  if (!score) return "text-slate-400";
  if (score >= 7) return "text-green-600";
  if (score >= 4) return "text-amber-500";
  return "text-red-500";
};

const SCORE_BG = (score) => {
  if (!score) return "bg-slate-100 text-slate-500";
  if (score >= 7) return "bg-green-100 text-green-700";
  if (score >= 4) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

export default function CallLogDialog({ lead, open, onClose, onSave }) {
  const [form, setForm] = useState({
    call_status: lead?.call_status || "בוצעה",
    call_date: lead?.call_date ? lead.call_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
    call_duration: lead?.call_duration || "",
    call_transcript: lead?.call_transcript || "",
    call_analysis: lead?.call_analysis || "",
    call_score: lead?.call_score || "",
    call_recommendation: lead?.call_recommendation || "",
    call_close_reason: lead?.call_close_reason || "",
    call_main_objection: lead?.call_main_objection || "",
    call_next_action: lead?.call_next_action || "",
  });

  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAudioUpload = async () => {
    if (!audioFile) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      const fd = new FormData();
      fd.append("audio", audioFile);
      fd.append("leadName", lead.full_name || "");
      fd.append("leadSource", lead.source || "");

      const res = await fetch("https://tevet-landing.vercel.app/api/transcribe-and-analyze", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      setForm(f => ({
        ...f,
        call_transcript: data.transcript || f.call_transcript,
        call_analysis: data.analysis || f.call_analysis,
        call_score: data.score || f.call_score,
        call_recommendation: data.recommendation || f.call_recommendation,
        call_main_objection: data.main_objection || f.call_main_objection,
        call_next_action: data.next_action || f.call_next_action,
        call_status: "בוצעה",
      }));
      setUploadSuccess(true);
    } catch (err) {
      alert("שגיאה בהעלאת האודיו: " + err.message);
    }
    setUploading(false);
  };

  const handleAnalyzeTranscript = async () => {
    if (!form.call_transcript.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("https://tevet-landing.vercel.app/api/analyze-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: form.call_transcript,
          leadName: lead.full_name || "",
          leadSource: lead.source || "",
        }),
      });
      const data = await res.json();
      setForm(f => ({
        ...f,
        call_analysis: data.analysis || f.call_analysis,
        call_score: data.score || f.call_score,
        call_recommendation: data.recommendation || f.call_recommendation,
        call_main_objection: data.main_objection || f.call_main_objection,
        call_next_action: data.next_action || f.call_next_action,
      }));
    } catch (err) {
      alert("שגיאה בניתוח: " + err.message);
    }
    setAnalyzing(false);
  };

  const handleSave = async () => {
    const updates = {
      ...form,
      call_duration: form.call_duration ? Number(form.call_duration) : undefined,
      call_score: form.call_score ? Number(form.call_score) : undefined,
    };
    await base44.entities.Lead.update(lead.id, updates);
    onSave(lead.id, updates);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Phone className="w-5 h-5 text-blue-600" />
            תיעוד שיחת מכירה — {lead?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Row 1: status + date + duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">סטטוס שיחה</Label>
              <Select value={form.call_status} onValueChange={v => set("call_status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["בוצעה", "לא בוצעה", "לא ענה", "הודעה נשארה"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">תאריך ושעה</Label>
              <Input type="datetime-local" className="mt-1" value={form.call_date} onChange={e => set("call_date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">משך שיחה (דקות)</Label>
              <Input type="number" className="mt-1" placeholder="5" value={form.call_duration} onChange={e => set("call_duration", e.target.value)} />
            </div>
          </div>

          {/* Audio upload */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-indigo-500" />
              העלה קובץ אודיו לתמלול אוטומטי
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => setAudioFile(e.target.files[0])}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current.click()} className="gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {audioFile ? audioFile.name : "בחר קובץ אודיו"}
              </Button>
              <Button
                size="sm"
                disabled={!audioFile || uploading}
                onClick={handleAudioUpload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {uploading ? "מתמלל..." : "תמלל ונתח"}
              </Button>
              {uploadSuccess && (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> הושלם בהצלחה
                </span>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">תמלול שיחה</Label>
              <Button
                size="sm"
                variant="outline"
                disabled={!form.call_transcript.trim() || analyzing}
                onClick={handleAnalyzeTranscript}
                className="h-7 text-xs gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {analyzing ? "מנתח..." : "נתח עם AI"}
              </Button>
            </div>
            <Textarea
              rows={4}
              placeholder="הדבק כאן את תמלול השיחה..."
              value={form.call_transcript}
              onChange={e => set("call_transcript", e.target.value)}
            />
          </div>

          {/* AI Analysis */}
          {form.call_analysis && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> ניתוח AI
              </p>
              <p className="text-sm text-indigo-900 whitespace-pre-wrap">{form.call_analysis}</p>
            </div>
          )}

          {/* Score + recommendation row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ציון שיחה (1-10)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.call_score}
                  onChange={e => set("call_score", e.target.value)}
                  className="w-20"
                />
                {form.call_score && (
                  <span className={`text-2xl font-bold ${SCORE_COLOR(Number(form.call_score))}`}>
                    {form.call_score}/10
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">המלצה לפעולה</Label>
              <Select value={form.call_recommendation} onValueChange={v => set("call_recommendation", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {["לסגור", "להמשיך", "לשלוח חומר", "לא רלוונטי"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Objection + next action */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">התנגדות עיקרית</Label>
              <Input className="mt-1" placeholder="למשל: מחיר גבוה" value={form.call_main_objection} onChange={e => set("call_main_objection", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">פעולה הבאה</Label>
              <Input className="mt-1" placeholder="למשל: שלח הצעת מחיר" value={form.call_next_action} onChange={e => set("call_next_action", e.target.value)} />
            </div>
          </div>

          {/* Close reason */}
          <div>
            <Label className="text-xs">סיבת סגירה / אי-המשך</Label>
            <Select value={form.call_close_reason} onValueChange={v => set("call_close_reason", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="בחר אם רלוונטי..." /></SelectTrigger>
              <SelectContent>
                {["מחיר", "לא ענה", "דחייה", "הלך למתחרה", "לא רלוונטי", "כבר סודר", "אחר"].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>ביטול</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
              <CheckCircle className="w-4 h-4" />
              שמור שיחה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}