import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // קריאת הנתונים - ננסה כמה דרכים
        let data = {};
        
        // נסיון 1: קריאת JSON מה-body
        const rawBody = await req.text();
        console.log("RAW BODY RECEIVED:", rawBody);
        
        if (rawBody) {
            try {
                data = JSON.parse(rawBody);
                console.log("PARSED JSON:", JSON.stringify(data));
            } catch (e) {
                console.error("Failed to parse JSON:", e.message);
            }
        }
        
        // נסיון 2: אם ה-JSON ריק, ננסה query params
        const url = new URL(req.url);
        if (!data.subject && url.searchParams.get('subject')) {
            data = {
                message_id: url.searchParams.get('message_id'),
                subject: url.searchParams.get('subject'),
                from: url.searchParams.get('from'),
                date: url.searchParams.get('date'),
                body: url.searchParams.get('body')
            };
            console.log("USING QUERY PARAMS:", JSON.stringify(data));
        }

        const messageId = data.message_id || data.messageId || data["message Id"] || `GENERATED-ID-${Date.now()}`;
        const subject = data.subject || data.Subject || "";
        const from = data.from || data.From || "";
        const date = data.date || data.Date || "";
        const body = data.body || data.Body || "";
        const attachments = data.attachments || [];
        
        console.log("EXTRACTED VALUES - subject:", subject, "from:", from, "messageId:", messageId);

        // לוג לדיבוג
        if (!subject) {
            console.log("WARNING: No subject found in data");
        }

        // בדיקה אם המייל קיים (רק אם באמת קיבלנו ID אמיתי)
        if (!messageId.startsWith('GENERATED')) {
            const existing = await base44.asServiceRole.entities.NetHamishpatEmail.filter({ message_id: messageId });
            if (existing && existing.length > 0) {
                return Response.json({ success: true, message: "Email already exists", id: existing[0].id });
            }
        }

        // חילוץ מספר תיק
        const caseNumberRegex = /\b\d{2,6}-\d{2}-\d{2,4}\b/;
        const match = (subject || '').match(caseNumberRegex) || (body || '').match(caseNumberRegex);
        const extractedCaseNumber = match ? match[0] : null;

        // ניסיון קישור לתיק
        let linkedCaseId = null;
        if (extractedCaseNumber) {
            const cases = await base44.asServiceRole.entities.Case.list();
            const foundCase = cases.find(c => 
                c.case_number === extractedCaseNumber || 
                c.net_hamishpat_number === extractedCaseNumber
            );
            if (foundCase) linkedCaseId = foundCase.id;
        }

        // יצירת הרשומה
        const emailRecord = {
            message_id: messageId,
            subject: subject || "No Subject", // ברירת מחדל
            received_date: date ? new Date(date).toISOString() : new Date().toISOString(),
            sender: from || "Unknown Sender",
            body_preview: (body || '').substring(0, 300),
            full_content: body || '',
            case_number_extracted: extractedCaseNumber,
            linked_case_id: linkedCaseId,
            status: linkedCaseId ? "processed" : "new",
            attachments: attachments || []
        };

        const created = await base44.asServiceRole.entities.NetHamishpatEmail.create(emailRecord);

        return Response.json({ 
            success: true, 
            id: created.id, 
            linked: !!linkedCaseId, 
            caseNumber: extractedCaseNumber
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // אנחנו מחזירים 200 גם בשגיאה כדי ש-Make יראה ירוק ונראה את הלוגים
        return Response.json({ error: errorMessage, status: "error_caught" }, { status: 200 });
    }
});