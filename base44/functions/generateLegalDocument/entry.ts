import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { caseId, documentType, additionalInstructions } = await req.json();

    // Fetch case data
    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    const caseData = cases[0];
    if (!caseData) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Fetch client
    let clientData = null;
    if (caseData.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: caseData.client_id });
      clientData = clients[0] || null;
    }

    // Build hearings summary
    const hearings = (caseData.hearings || []).map(h =>
      `דיון ב-${h.date}${h.time ? ' שעה ' + h.time : ''}${h.description ? ': ' + h.description : ''}${h.location ? ' ב' + h.location : ''}`
    ).join('\n');

    const prompt = `אתה עורך דין ישראלי מנוסה בדיני עבודה. אתה כותב מסמכים משפטיים בשפה עברית מקצועית, מאוזנת ותקיפה.
הסגנון שלך: ישיר, ענייני, לוגי — לא מדברני מדי, לא חלש. משפטים ברורים, נימוקים חזקים.

הנחיות כתיבה:
- כתוב בעברית תקנית ומשפטית
- השתמש בכותרות ממוספרות
- כלול אסמכתאות משפטיות רלוונטיות (חוק הגנת השכר, חוק פיצויי פיטורין, חוק שעות עבודה ומנוחה וכו')
- הוסף פניה לבית המשפט/הגוף הרלוונטי
- סיים עם "בכבוד רב, עו"ד אוהד תבת"

פרטי התיק:
- שם התיק: ${caseData.case_name}
- מספר תיק: ${caseData.case_number || 'טרם הוקצה'}
- סוג תיק: ${caseData.case_type || 'לא צוין'}
- תאריך פתיחה: ${caseData.open_date || 'לא צוין'}
- סטטוס: ${caseData.status || 'לא צוין'}
- הצדדים: ${caseData.parties || 'לא צוין'}
- תיאור: ${caseData.case_description || 'לא צוין'}

פרטי הנתבע:
- שם: ${caseData.defendant_name || 'לא צוין'}
- ת.ז/ח.פ: ${caseData.defendant_id || 'לא צוין'}
- כתובת: ${caseData.defendant_address || 'לא צוין'}

פרטי התובע (לקוח):
- שם: ${clientData?.full_name || 'לא צוין'}
- ת.ז: ${clientData?.id_number || 'לא צוין'}
- טלפון: ${clientData?.phone || 'לא צוין'}
- כתובת: ${clientData?.address || 'לא צוין'}

תאריכי יחסי עבודה:
- תחילת עבודה: ${caseData.employment_start_date || 'לא צוין'}
- סיום עבודה: ${caseData.employment_end_date || 'לא צוין'}

ערך תיק: ${caseData.value ? caseData.value.toLocaleString('he-IL') + ' ₪' : 'לא צוין'}
מספר תיק נט-המשפט: ${caseData.net_hamishpat_number || 'לא צוין'}

דיונים שנקבעו:
${hearings || 'אין דיונים רשומים'}

${caseData.case_detailed_description ? 'תיאור מפורט:\n' + caseData.case_detailed_description : ''}

---
כתוב מסמך משפטי מלא מסוג: **${documentType}**
${additionalInstructions ? '\nהנחיות נוספות: ' + additionalInstructions : ''}

החזר JSON עם השדות:
- document_title: כותרת המסמך
- document_content: תוכן המסמך המלא
- document_summary: תקציר קצר של מה שכתבת (2-3 משפטים)`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          document_title: { type: 'string' },
          document_content: { type: 'string' },
          document_summary: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      document_title: result.document_title,
      document_content: result.document_content,
      document_summary: result.document_summary,
      case_name: caseData.case_name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});