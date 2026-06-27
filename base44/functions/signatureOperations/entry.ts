import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1';

const APP_URL = "https://legal-flow-crm-1d774f3f.base44.app";

// 1. שליחה (רגיל)
export async function sendSignatureRequest(base44, body) {
    try {
        const requestId = body.requestId || body.id;
        const requests = await base44.asServiceRole.entities.SignatureRequest.list();
        const request = requests.find(r => r.id === requestId);
        if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

        const signingLink = `${APP_URL}/SignDocument?token=${request.access_token}`;
        
        if (request.client_email) {
            try {
                await base44.integrations.Core.SendEmail({
                    to: request.client_email,
                    subject: `ממתין לחתימתך: ${request.document_name}`,
                    body: `<div dir="rtl"><h2>שלום ${request.client_name},</h2><p>לחתימה לחץ כאן:</p><a href="${signingLink}">${signingLink}</a></div>`,
                    from_name: "משרד עו\"ד"
                });
            } catch (e) {}
        }

        if (request.client_phone) {
            try {
                const greenApiToken = Deno.env.get("GREEN_API_TOKEN");
                const greenApiInstance = Deno.env.get("GREEN_API_ID_INSTANCE");
                console.log("WhatsApp config:", { hasToken: !!greenApiToken, hasInstance: !!greenApiInstance, phone: request.client_phone });
                
                if (greenApiToken && greenApiInstance) {
                    let phone = request.client_phone.replace(/[^0-9]/g, '');
                    if (phone.startsWith('0')) phone = '972' + phone.substring(1);
                    
                    const whatsappUrl = `https://api.green-api.com/waInstance${greenApiInstance}/sendMessage/${greenApiToken}`;
                    const whatsappBody = { 
                        chatId: `${phone}@c.us`, 
                        message: `שלום ${request.client_name}, לחתימה על המסמך "${request.document_name}" לחץ כאן:\n${signingLink}` 
                    };
                    
                    console.log("Sending WhatsApp to:", phone);
                    const whatsappRes = await fetch(whatsappUrl, {
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(whatsappBody)
                    });
                    const whatsappResult = await whatsappRes.json();
                    console.log("WhatsApp result:", whatsappResult);
                } else {
                    console.log("WhatsApp credentials missing");
                }
            } catch (e) {
                console.error("WhatsApp send error:", e.message);
            }
        }

        await base44.asServiceRole.entities.SignatureRequest.update(requestId, { status: 'sent', sent_date: new Date().toISOString() });
        return Response.json({ success: true, link: signingLink });
    } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

// 2. תצוגה (רגיל)
export async function getPublicSignatureData(base44, token) {
    try {
        if (!token) return Response.json({ error: 'Token required' }, { status: 400 });
        const requests = await base44.asServiceRole.entities.SignatureRequest.list(); 
        const request = requests.find(r => r.access_token === token);
        if (!request) return Response.json({ error: 'Invalid token' }, { status: 404 });
        
        if (request.status === 'sent') await base44.asServiceRole.entities.SignatureRequest.update(request.id, { status: 'viewed' });
        const pdfUrl = request.file_url || request.original_file_url;
        return Response.json({ request: { ...request, pdf_url: pdfUrl } });
    } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

// 3. חתימה - הקוד המדויק למיקום שלך
export async function finalizeSignature(base44, token, fieldValues) {
    try {
        const requests = await base44.asServiceRole.entities.SignatureRequest.list();
        const request = requests.find(r => r.access_token === token);
        if (!request) throw new Error("Request not found");

        let finalSignedUrl = request.file_url || request.original_file_url;
        let signatureBase64 = fieldValues.signature;

        if (signatureBase64) {
            try {
                // מוריד את ה-PDF
                const sourceUrl = request.file_url || request.original_file_url;
                const pdfRes = await fetch(sourceUrl);
                const pdfDoc = await PDFDocument.load(await pdfRes.arrayBuffer(), { ignoreEncryption: true });
                const img = await pdfDoc.embedPng(Uint8Array.from(atob(signatureBase64.split(',')[1]), c => c.charCodeAt(0)));
                
                // === שליפת המיקום המדויק מהמערכת ===
                const allFields = await base44.asServiceRole.entities.SignatureField.list();
                // מוצא את הריבוע שסימנת
                const sigField = allFields.find(f => f.request_id === request.id && f.type === 'signature');

                if (sigField) {
                    console.log("Using coordinates from DB:", sigField);

                    // 1. קביעת העמוד
                    let pageIndex = 0;
                    if (sigField.page) {
                        pageIndex = sigField.page - 1;
                    }
                    if (pageIndex >= pdfDoc.getPages().length) pageIndex = pdfDoc.getPages().length - 1;

                    const page = pdfDoc.getPages()[pageIndex];
                    const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
                    
                    // 2. חישוב גודל החתימה - פרופורציונאלי וקטן
                    const targetHeight = 35;
                    const aspectRatio = img.width / img.height;
                    const drawHeight = targetHeight;
                    const drawWidth = targetHeight * aspectRatio;

                    // 3. חישוב המיקום - ממורכז מעל השם (קצת יותר ימינה ומעל הקו)
                    const xPercent = sigField.x;
                    const yPercent = sigField.y;
                    
                    // X: הזזה ימינה כדי להתאים למיקום מעל השם
                    const drawX = (xPercent / 100) * pdfPageWidth + 20;
                    
                    // Y: קצת יותר למעלה כדי להיות מעל הקו
                    const drawY = pdfPageHeight - ((yPercent / 100) * pdfPageHeight) - drawHeight + 15;

                    console.log(`PDF size: ${pdfPageWidth}x${pdfPageHeight}, Drawing at: x=${drawX}, y=${drawY}, w=${drawWidth}, h=${drawHeight}`);

                    // 4. ציור החתימה
                    page.drawImage(img, { 
                        x: drawX, 
                        y: drawY, 
                        width: drawWidth, 
                        height: drawHeight 
                    });

                } else {
                    // אם לא סימנת כלום - נשים בצד ימין למטה
                    console.log("No field found, using fallback");
                    const page = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
                    const { width: pdfPageWidth } = page.getSize();
                    page.drawImage(img, { x: pdfPageWidth - 150, y: 80, width: 70, height: 35 });
                }

                const saved = await pdfDoc.save();
                const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([saved], `signed_${request.document_name}.pdf`, { type: 'application/pdf' }) });
                finalSignedUrl = upload.file_url;
            } catch (e) { console.error("PDF embed failed", e); }
        }

        await base44.asServiceRole.entities.SignatureRequest.update(request.id, {
            status: 'signed', signed_date: new Date().toISOString(), signed_file_url: finalSignedUrl
        });

        // תיוק לתיק
        if (request.case_id) {
            try {
                const caseItem = await base44.asServiceRole.entities.Case.get(request.case_id);
                if (caseItem) {
                    const newDoc = { name: `חתום - ${request.document_name}`, url: finalSignedUrl, type: 'pdf', uploaded_at: new Date().toISOString() };
                    const currentDocs = caseItem.documents || [];
                    await base44.asServiceRole.entities.Case.update(request.case_id, { documents: [...currentDocs, newDoc] });
                }
            } catch (err) { console.error("Filing error", err); }
        }

        return Response.json({ success: true });
    } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        if (body.action === 'send') return await sendSignatureRequest(base44, body);
        if (body.action === 'get-public') return await getPublicSignatureData(base44, body.token);
        if (body.action === 'finalize') return await finalizeSignature(base44, body.token, body.fieldValues);
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
});