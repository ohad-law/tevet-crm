import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Scale } from "lucide-react";

/**
 * דיאלוג להוספה/עריכה של דיון לתיק.
 * props:
 *   open, onOpenChange
 *   cases (לבחירת תיק כשנפתח מ-HearingsDashboard) — אם לא מועבר, חובה caseId
 *   caseId (כשנפתח מתוך CaseDetails)
 *   editing — אובייקט דיון לעריכה (אופציונלי) + caseId שלו
 *   onSave(payload) — payload = { caseId, hearing: {date, time, description, proceeding_number, location} }
 */
export default function HearingDialog({ open, onOpenChange, cases, caseId, editing, onSave }) {
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [proceedingNumber, setProceedingNumber] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedCaseId(editing?.caseId || caseId || "");
      setDate(editing?.hearing?.date || "");
      setTime(editing?.hearing?.time || "");
      setDescription(editing?.hearing?.description || "");
      setProceedingNumber(editing?.hearing?.proceeding_number || "");
      setLocation(editing?.hearing?.location || "");
    }
  }, [open, editing, caseId]);

  const handleSave = async () => {
    if (!selectedCaseId || !date) return;
    setSaving(true);
    await onSave({
      caseId: selectedCaseId,
      originalDate: editing?.hearing?.date,
      hearing: {
        date,
        time: time || undefined,
        description: description || undefined,
        proceeding_number: proceedingNumber || undefined,
        location: location || undefined,
      },
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            {editing ? "עריכת דיון" : "הוספת דיון חדש"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* בחירת תיק (רק אם הועברה רשימת תיקים) */}
          {cases && (
            <div>
              <Label className="text-sm font-medium mb-2 block">תיק</Label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId} disabled={!!editing}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תיק" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      #{c.case_number} - {c.case_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">תאריך דיון *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">שעה</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">מספר הליך</Label>
            <Input
              placeholder="לדוגמה: 12345-67-89"
              value={proceedingNumber}
              onChange={(e) => setProceedingNumber(e.target.value)}
              className="font-mono"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">בית משפט / מקום</Label>
            <Input
              placeholder="לדוגמה: בית הדין האזורי לעבודה ת״א, אולם 5"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">תיאור / נושא הדיון</Label>
            <Textarea
              placeholder="למשל: דיון הוכחות, קדם משפט..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={!selectedCaseId || !date || saving}>
            <Calendar className="w-4 h-4 ml-2" />
            {saving ? "שומר..." : editing ? "עדכן דיון" : "שמור דיון"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}