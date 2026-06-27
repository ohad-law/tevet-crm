import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { generateLegalDocument } from "@/functions/generateLegalDocument";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Sparkles, ChevronLeft, RotateCcw } from "lucide-react";
const DOCUMENT_TYPES = [
  { value: "בקשה לאיחוד תיקים", label: "בקשה לאיחוד תיקים" },
  { value: "כתב תביעה", label: "כתב תביעה" },
  { value: "כתב הגנה", label: "כתב הגנה" },
  { value: "בקשה לדחיית מועד דיון", label: "בקשה לדחיית מועד דיון" },
  { value: "בקשה לגילוי מסמכים", label: "בקשה לגילוי מסמכים" },
  { value: "סיכומים", label: "סיכומים" },
  { value: "הסכם שכר טרחה", label: "הסכם שכר טרחה" },
  { value: "ייפוי כח", label: "ייפוי כח" },
  { value: "מכתב דרישה", label: "מכתב דרישה" },
  { value: "בקשה לסעד זמני", label: "בקשה לסעד זמני" },
  { value: "תצהיר", label: "תצהיר" },
  { value: "הודעה על הגעה להסכם", label: "הודעה על הגעה להסכם" },
  { value: "בקשה למחיקת תביעה", label: "בקשה למחיקת תביעה" },
  { value: "אחר", label: "אחר (תאר בהנחיות)" },
];

export default function LegalDocumentWriter() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    base44.entities.Case.list("-open_date", 100).then(setCases);
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      const c = cases.find(c => c.id === selectedCaseId);
      setSelectedCase(c || null);
    }
  }, [selectedCaseId, cases]);

  const handleGenerate = async () => {
    if (!selectedCaseId || !documentType) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await generateLegalDocument({
        caseId: selectedCaseId,
        documentType,
        additionalInstructions
      });
      setResult(res.data);
      setEditedContent(res.data.document_content);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    const content = isEditing ? editedContent : (result?.document_content || "");
    const title = result?.document_title || documentType;
    const caseName = result?.case_name || "";
    const dateStr = new Date().toLocaleDateString("he-IL");

    // Build HTML for print-to-PDF (full Hebrew support)
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
  body { font-family: 'Assistant', Arial, sans-serif; direction: rtl; padding: 40px 60px; color: #1a1a2e; font-size: 13pt; line-height: 1.8; }
  h1 { font-size: 17pt; text-align: center; font-weight: 700; margin-bottom: 4px; }
  .meta { text-align: center; color: #555; font-size: 10pt; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 12px; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Assistant', Arial, sans-serif; font-size: 12pt; line-height: 1.9; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">תיק: ${caseName} &nbsp;|&nbsp; תאריך: ${dateStr}</div>
<pre>${content}</pre>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };

  const activeCases = cases.filter(c => c.status !== "ארכיון");

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">כתיבת מסמכים משפטיים</h1>
          <p className="text-sm text-slate-500">AI שכותב בסגנון שלך, על בסיס נתוני התיק</p>
        </div>
      </div>

      {!result ? (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">בחר תיק וסוג מסמך</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Case selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">תיק</label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר תיק..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCases.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium">{c.case_name}</span>
                      {c.case_number && <span className="text-slate-400 mr-2 text-xs">({c.case_number})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Case preview */}
            {selectedCase && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm space-y-1">
                <div className="flex gap-4 text-slate-600 flex-wrap">
                  <span><span className="font-medium">סוג:</span> {selectedCase.case_type || "—"}</span>
                  <span><span className="font-medium">סטטוס:</span> {selectedCase.status || "—"}</span>
                  {selectedCase.defendant_name && <span><span className="font-medium">נתבע:</span> {selectedCase.defendant_name}</span>}
                  {selectedCase.net_hamishpat_number && <span><span className="font-medium">נט-המשפט:</span> {selectedCase.net_hamishpat_number}</span>}
                </div>
                {selectedCase.case_description && (
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{selectedCase.case_description}</p>
                )}
              </div>
            )}

            {/* Document type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">סוג מסמך</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר סוג מסמך..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional instructions */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                הנחיות נוספות <span className="text-slate-400 font-normal">(אופציונלי)</span>
              </label>
              <Textarea
                placeholder="למשל: הבקשה לאיחוד תיקים כוללת גם תיק של ישראל ישראלי, ת.ז 123456789, תיק מס' 1234/25..."
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                className="resize-none h-24"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedCaseId || !documentType || isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  כותב את המסמך...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור מסמך
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Result header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { setResult(null); setIsEditing(false); }} className="text-slate-500">
                <ChevronLeft className="w-4 h-4 ml-1" />
                חזור
              </Button>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{result.document_title}</h2>
                <p className="text-sm text-slate-500">{result.case_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "תצוגה" : "עריכה"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                <RotateCcw className="w-3.5 h-3.5 ml-1" />
                צור מחדש
              </Button>
              <Button onClick={downloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                <Download className="w-4 h-4 ml-2" />
                הורד PDF
              </Button>
            </div>
          </div>

          {/* Summary */}
          {result.document_summary && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
              <span className="font-medium">תקציר: </span>{result.document_summary}
            </div>
          )}

          {/* Document content */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm resize-none border-0 focus-visible:ring-0 p-0"
                  dir="rtl"
                />
              ) : (
                <div
                  className="whitespace-pre-wrap text-sm text-slate-800 leading-7 font-assistant"
                  style={{ fontFamily: "'Assistant', sans-serif" }}
                  dir="rtl"
                >
                  {result.document_content}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}