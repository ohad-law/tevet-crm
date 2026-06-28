import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { caseId, documentType, additionalInstructions } = req.body;
    if (!caseId || !documentType)
      return res.status(400).json({ error: "caseId and documentType are required" });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: caseData, error: caseErr } = await supabase
      .from("cases")
      .select("*, clients(*)")
      .eq("id", caseId)
      .single();

    if (caseErr || !caseData)
      return res.status(404).json({ error: "Case not found" });

    const client = caseData.clients;

    const prompt = `אתה עורך דין ישראלי מומחה בדיני עבודה. כתוב ${documentType} עבור התיק הבא.

פרטי התיק:
- מספר תיק: ${caseData.case_number}
- שם תיק: ${caseData.case_name}
- סוג תיק: ${caseData.case_type || "דיני עבודה"}
- תיאור: ${caseData.case_description || "לא צוין"}
- שם התובע/לקוח: ${client?.full_name || "לא צוין"}
- ת.ז. לקוח: ${client?.id_number || "לא צוין"}
- כתובת לקוח: ${client?.address || "לא צוין"}
- שם הנתבע: ${caseData.defendant_name || "לא צוין"}
- ת.ז./ח.פ. נתבע: ${caseData.defendant_id || "לא צוין"}
- טלפון נתבע: ${caseData.defendant_phone || "לא צוין"}
- תקופת העסקה: ${caseData.employment_start_date || "?"} עד ${caseData.employment_end_date || "?"}
- שווי תביעה: ${caseData.value ? `₪${caseData.value.toLocaleString()}` : "לא צוין"}

${additionalInstructions ? `הוראות נוספות: ${additionalInstructions}` : ""}

כתוב את המסמך בפורמט משפטי מלא, כולל כותרות, סעיפים ממוספרים, ופרטים משפטיים מדויקים. השתמש בשפה משפטית ישראלית תקנית.

תחזיר JSON בפורמט הבא:
{
  "document_title": "כותרת המסמך",
  "document_content": "תוכן המסמך המלא",
  "document_summary": "תקציר קצר של המסמך",
  "case_name": "שם התיק"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system:
        "You are an Israeli labor law attorney. Respond ONLY with valid JSON, no markdown fences.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({ data: parsed });
  } catch (err) {
    console.error("generateLegalDocument error:", err);
    return res.status(500).json({ error: err.message });
  }
}
