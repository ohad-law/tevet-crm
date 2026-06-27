import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, ListChecks } from "lucide-react";
import { CASE_WORKFLOW, getNextStep, computeDueDate } from "@/lib/caseWorkflow";

// דיאלוג דינמי שקופץ כשמשימה מסומנת "הושלמה".
// props:
//   open          — האם פתוח
//   completedStep — אובייקט הצעד שהושלם (מ-getStepByLabel)
//   onClose       — סגירה ("סיים", בלי לפתוח כלום)
//   onConfirm     — מקבל מערך של { step, dueDate } לפתיחת המשימות הבאות
export default function NextStepDialog({ open, completedStep, onClose, onConfirm }) {
  const recommended = completedStep ? getNextStep(completedStep.id) : null;
  const [mode, setMode] = useState("recommend"); // recommend | choose
  const [selectedIds, setSelectedIds] = useState([]);
  const [dates, setDates] = useState({});

  useEffect(() => {
    if (open) {
      setMode("recommend");
      setSelectedIds(recommended ? [recommended.id] : []);
      setDates({});
    }
  }, [open, recommended?.id]);

  if (!completedStep) return null;

  const toggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const buildSelection = (steps) =>
    steps.map((step) => ({
      step,
      dueDate: dates[step.id] || computeDueDate(step),
    }));

  const handleConfirmRecommended = () => {
    if (!recommended) return;
    onConfirm(buildSelection([recommended]));
  };

  const handleConfirmChosen = () => {
    const steps = CASE_WORKFLOW.filter((s) => selectedIds.includes(s.id));
    if (steps.length === 0) return;
    onConfirm(buildSelection(steps));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            סיימת: {completedStep.label}
          </DialogTitle>
        </DialogHeader>

        {mode === "recommend" ? (
          <div className="space-y-4">
            {recommended ? (
              <>
                <p className="text-sm text-gray-600">הצעד הבא המומלץ בתיק:</p>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="font-semibold text-gray-900">{recommended.label}</p>
                  {recommended.requiresManualDate ? (
                    <div className="mt-2">
                      <Label className="text-xs text-gray-500">תאריך יעד (לפי בית המשפט)</Label>
                      <Input
                        type="date"
                        value={dates[recommended.id] || ""}
                        onChange={(e) => setDates({ ...dates, [recommended.id]: e.target.value })}
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      יעד אוטומטי: {computeDueDate(recommended)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                זה הצעד האחרון בשרשרת. אפשר לבחור משימה ידנית או לסיים.
              </p>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {recommended && (
                <Button onClick={handleConfirmRecommended} className="w-full bg-green-600 hover:bg-green-700">
                  כן, פתח: {recommended.label}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => setMode("choose")}>
                <ListChecks className="w-4 h-4 ml-2" />
                בחר אחר / כמה משימות
              </Button>
              <Button variant="ghost" className="w-full text-gray-500" onClick={onClose}>
                סיים בלי לפתוח משימה
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">בחר אילו משימות לפתוח (אפשר כמה יחד):</p>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {CASE_WORKFLOW.map((step) => (
                <label
                  key={step.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border p-2 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedIds.includes(step.id)}
                    onCheckedChange={() => toggle(step.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{step.label}</p>
                    {selectedIds.includes(step.id) && (
                      <Input
                        type="date"
                        className="mt-1 h-8"
                        value={dates[step.id] || (step.requiresManualDate ? "" : computeDueDate(step))}
                        onChange={(e) => setDates({ ...dates, [step.id]: e.target.value })}
                      />
                    )}
                  </div>
                </label>
              ))}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleConfirmChosen}
                disabled={selectedIds.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                פתח {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </Button>
              <Button variant="ghost" className="w-full text-gray-500" onClick={() => setMode("recommend")}>
                <ArrowLeft className="w-4 h-4 ml-2" />
                חזרה
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
