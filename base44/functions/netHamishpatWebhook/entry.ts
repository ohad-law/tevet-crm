import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const base44 = createClientFromRequest(req);
        const adminClient = base44.asServiceRole;

        // בדיקת סוג התוכן
        const contentType = req.headers.get('content-type') || '';
        console.log("Content-Type received:", contentType);
        
        let subject = "No Subject";
        let from = "Unknown Sender";
        let body = "";
        let file = null;
        let fileUrl = null;
        let fileName = null;

        // טיפול לפי סוג התוכן
        if (contentType.includes('multipart/form-data')) {
            // קריאת הנתונים מ-Make (multipart/form-data)
            const formData = await req.formData();
            
            subject = formData.get('subject') || "No Subject";
            from = formData.get('שולח') || formData.get('sender') || "Unknown Sender";
            body = formData.get('text') || "";
            
            // לוג של כל המפתחות ב-FormData
            const allEntries = [];
            for (const [key, value] of formData.entries()) {
                const isFile = value instanceof File;
                const info = isFile 
                    ? `FILE: name=${value.name}, size=${value.size}, type=${value.type}`
                    : `TEXT: ${String(value).substring(0, 100)}`;
                allEntries.push(`${key}: ${info}`);
            }
            console.log("=== ALL FORM DATA ===");
            console.log(allEntries.join("\n"));
            
            // ניסיון לקבל קובץ
            const possibleFileKeys = ['file', 'attachment', 'attachments', 'File', 'Attachment'];
            for (const key of possibleFileKeys) {
                const val = formData.get(key);
                if (val instanceof File && val.size > 0) {
                    file = val;
                    console.log(`Found file with key "${key}": ${val.name}`);
                    break;
                }
            }
            
            if (!file) {
                for (const [key, value] of formData.entries()) {
                    if (value instanceof File && value.size > 0) {
                        file = value;
                        console.log(`Found file in key "${key}": ${value.name}`);
                        break;
                    }
                }
            }
            
            // בדיקת URL של קובץ
            fileUrl = formData.get('file_url') || formData.get('attachment_url');
            fileName = formData.get('file_name') || formData.get('filename');
            
        } else if (contentType.includes('application/json')) {
            // קריאת JSON
            const jsonData = await req.json();
            console.log("=== JSON DATA ===");
            console.log(JSON.stringify(jsonData, null, 2));
            
            subject = jsonData.subject || "No Subject";
            from = jsonData.שולח || jsonData.sender || "Unknown Sender";
            body = jsonData.text || jsonData.body || "";
            fileUrl = jsonData.file_url || jsonData.attachment_url;
            fileName = jsonData.file_name || jsonData.filename;
        } else {
            // ניסיון לקרוא כ-JSON בכל מקרה
            try {
                const text = await req.text();
                console.log("Raw body:", text.substring(0, 500));
                const jsonData = JSON.parse(text);
                subject = jsonData.subject || "No Subject";
                from = jsonData.שולח || jsonData.sender || "Unknown Sender";
                body = jsonData.text || jsonData.body || "";
                fileUrl = jsonData.file_url || jsonData.attachment_url;
                fileName = jsonData.file_name || jsonData.filename;
            } catch (parseErr) {
                console.error("Failed to parse body:", parseErr.message);
            }
        }

        // חילוץ מספר תיק
        const caseNumberMatch = subject.toString().match(/\d{1,6}-\d{2}-\d{2,4}/);
        const caseNumber = caseNumberMatch ? caseNumberMatch[0] : null;

        // טיפול בקבצים
        let attachments = [];
        let uploadedFileUrl = null;
        
        // אם יש קובץ ישיר
        if (file) {
            try {
                console.log(`Uploading: ${file.name}, size: ${file.size}`);
                const uploadResult = await adminClient.integrations.Core.UploadFile({ file });
                console.log("Upload success:", uploadResult.file_url);
                
                attachments.push({
                    filename: file.name,
                    url: uploadResult.file_url,
                    content_type: file.type || 'application/pdf'
                });
            } catch (uploadErr) {
                console.error("Upload error:", uploadErr.message, uploadErr.stack);
            }
        } else {
            console.log("NO FILE FOUND in form data");
        }

        // חיפוש תיק מתאים לפי מספר נט המשפט
        let linkedCaseId = null;
        if (caseNumber) {
            try {
                const allCases = await adminClient.entities.Case.list();
                const matchedCase = allCases.find(c => 
                    c.net_hamishpat_number === caseNumber || 
                    c.case_number === caseNumber
                );
                if (matchedCase) {
                    linkedCaseId = matchedCase.id;
                    console.log(`Linked to case: ${matchedCase.case_name} (${matchedCase.id})`);
                }
            } catch (err) {
                console.error("Error finding case:", err.message);
            }
        }

        // שמירת הרשומה - מתאים ל-Entity Schema של NetHamishpatEmail
        const emailRecord = {
            message_id: "webhook-" + Date.now(),
            subject: subject.toString(),
            received_date: new Date().toISOString(),
            sender: from.toString(),
            body_preview: body.toString().substring(0, 300),
            full_content: body.toString(),
            case_number_extracted: caseNumber,
            linked_case_id: linkedCaseId,
            status: linkedCaseId ? "processed" : "new",
            attachments: attachments
        };

        const result = await adminClient.entities.NetHamishpatEmail.create(emailRecord);

        return new Response(JSON.stringify({ 
            success: true, 
            id: result.id,
            attachments_count: attachments.length
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(JSON.stringify({ 
            error: error.message
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});