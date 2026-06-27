import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { 
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const daysBack = body.daysBack || null; // null = all time

        // Get Gmail access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

        // Build date filter - if daysBack is null, search all emails
        let dateFilter = '';
        if (daysBack) {
            const filterDate = new Date();
            filterDate.setDate(filterDate.getDate() - daysBack);
            const afterDate = filterDate.toISOString().split('T')[0].replace(/-/g, '/');
            dateFilter = ` after:${afterDate}`;
        }
        
        // Search query for invoices - expanded to catch all financial documents
        const subjectTerms = [
            'חשבונית',
            'חשבונית מס',
            'חשבונית מס קבלה',
            'קבלה',
            'מסמכים חשבונאיים',
            'מסמך חשבונאי',
            'חיוב',
            'תשלום',
            'אישור תשלום',
            'אישור עסקה',
            'כרטיס אשראי',
            'הצלחה',
            'invoice',
            'receipt',
            'tax invoice',
            'payment',
            'billing'
        ];
        
        // Also search by known invoice senders
        const senderTerms = [
            'invoice4u',
            '2sign',
            'חתימה ירוקה',
            'greeninvoice',
            'invoiceme',
            'hashavshevet',
            'חשבשבת',
            'rivhit',
            'רווחית',
            'רדי אקשן',
            'ready action',
            'readyaction',
            'סאמט',
            'samet',
            'cardcom',
            'tranzila',
            'payplus',
            'icredit',
            'pelecard',
            'meshulam',
            'משולם',
            'yaad',
            'יעד'
        ];
        
        const subjectQuery = subjectTerms.map(t => `subject:"${t}"`).join(' OR ');
        const senderQuery = senderTerms.map(t => `from:${t}`).join(' OR ');
        
        const searchQuery = `((${subjectQuery}) OR (${senderQuery})) has:attachment${dateFilter}`;
        
        // Fetch all messages using pagination
        let allMessages = [];
        let pageToken = null;
        
        do {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
            const searchRes = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
            const searchData = await searchRes.json();
            
            if (searchData.messages) {
                allMessages = allMessages.concat(searchData.messages);
            }
            pageToken = searchData.nextPageToken;
        } while (pageToken);

        const searchData = { messages: allMessages };
        
        if (!searchData.messages || searchData.messages.length === 0) {
            return Response.json({ success: true, imported: 0, message: 'לא נמצאו מיילים עם חשבוניות' });
        }

        // Get existing invoices to avoid duplicates
        const existingInvoices = await base44.asServiceRole.entities.Invoice.list();
        const existingMessageIds = new Set(existingInvoices.map(inv => inv.email_message_id));

        const newInvoices = [];
        
        for (const msg of searchData.messages) {
            if (existingMessageIds.has(msg.id)) continue;

            // Get full message details
            const msgRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const msgData = await msgRes.json();

            const headers = msgData.payload?.headers || [];
            const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
            const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
            const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value;
            const emailDate = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

            // Find PDF attachments
            const attachments = findAttachments(msgData.payload, []);
            const pdfAttachments = attachments.filter(att => 
                att.mimeType === 'application/pdf' || 
                att.filename?.toLowerCase().endsWith('.pdf')
            );

            // Check if sender is a known invoice service (always accept these)
            const isFromInvoiceService = /invoice4u|2sign|greeninvoice|חתימה.*ירוקה|חשבשבת|hashavshevet|rivhit|רווחית/i.test(from);

            for (const att of pdfAttachments) {
                // Check if filename looks like an invoice
                const filename = att.filename || 'document.pdf';
                const isLikelyInvoice = isFromInvoiceService ||
                                        /חשבונית|קבלה|invoice|receipt|tax/i.test(filename) || 
                                        /חשבונית|קבלה|invoice|receipt|tax/i.test(subject);
                
                if (!isLikelyInvoice && pdfAttachments.length > 1) continue;

                // Download attachment
                const attRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${att.attachmentId}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const attData = await attRes.json();

                if (!attData.data) continue;

                // Convert base64url to regular base64
                const base64Data = attData.data.replace(/-/g, '+').replace(/_/g, '/');
                const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                // Create a File object and upload
                const file = new File([binaryData], filename, { type: 'application/pdf' });
                const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

                // Try to extract data using AI
                let extractedData = {};
                try {
                    const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
                        file_url,
                        json_schema: {
                            type: "object",
                            properties: {
                                invoice_number: { type: "string", description: "מספר החשבונית" },
                                invoice_type: { type: "string", enum: ["חשבונית מס", "חשבונית מס קבלה", "קבלה", "חשבונית עסקה", "חשבונית", "אחר"] },
                                vendor_name: { type: "string", description: "שם הספק/העסק" },
                                vendor_id: { type: "string", description: "ח.פ או ע.מ של הספק" },
                                amount: { type: "number", description: "סכום כולל מע\"מ" },
                                amount_before_vat: { type: "number", description: "סכום לפני מע\"מ" },
                                vat_amount: { type: "number", description: "סכום המע\"מ" },
                                invoice_date: { type: "string", description: "תאריך החשבונית בפורמט YYYY-MM-DD" }
                            }
                        }
                    });
                    
                    if (extractResult.status === 'success' && extractResult.output) {
                        extractedData = extractResult.output;
                        extractedData.ai_extracted = true;
                        extractedData.ai_confidence = 80;
                    }
                } catch (e) {
                    console.log("AI extraction failed:", e.message);
                }

                // Create invoice record
                const invoiceData = {
                    email_message_id: msg.id,
                    email_subject: subject,
                    email_sender: from,
                    email_date: emailDate,
                    file_url,
                    file_name: filename,
                    status: 'חדש',
                    invoice_number: extractedData.invoice_number || '',
                    invoice_type: extractedData.invoice_type || 'אחר',
                    vendor_name: extractedData.vendor_name || extractVendorFromEmail(from),
                    vendor_id: extractedData.vendor_id || '',
                    amount: extractedData.amount || 0,
                    amount_before_vat: extractedData.amount_before_vat || 0,
                    vat_amount: extractedData.vat_amount || 0,
                    invoice_date: extractedData.invoice_date || emailDate.split('T')[0],
                    ai_extracted: extractedData.ai_extracted || false,
                    ai_confidence: extractedData.ai_confidence || 0
                };

                await base44.asServiceRole.entities.Invoice.create(invoiceData);
                newInvoices.push(invoiceData);
            }
        }

        return Response.json({ 
            success: true, 
            imported: newInvoices.length,
            total_scanned: searchData.messages.length,
            message: `יובאו ${newInvoices.length} חשבוניות חדשות`
        });

    } catch (error) {
        console.error("Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function findAttachments(part, attachments) {
    if (part.body?.attachmentId && part.filename) {
        attachments.push({
            attachmentId: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType
        });
    }
    if (part.parts) {
        for (const subPart of part.parts) {
            findAttachments(subPart, attachments);
        }
    }
    return attachments;
}

function extractVendorFromEmail(from) {
    // Extract name from email like "Company Name <email@company.com>"
    const match = from.match(/^([^<]+)/);
    if (match) {
        return match[1].trim().replace(/"/g, '');
    }
    return from.split('@')[0];
}