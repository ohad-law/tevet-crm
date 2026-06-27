import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get Gmail access token via OAuth connector
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

        // Search for Net Hamishpat emails - including NetHamishpat@court.gov.il
        // Search last 7 days (not just unread) to catch any missed emails
        const query = encodeURIComponent("from:NetHamishpat@court.gov.il OR from:net@court.gov.il newer_than:7d");
        const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`;
        
        const searchResponse = await fetch(searchUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        
        const searchData = await searchResponse.json();
        
        if (!searchData.messages || searchData.messages.length === 0) {
            return Response.json({ 
                success: true, 
                processed: 0,
                message: "לא נמצאו מיילים חדשים מנט המשפט"
            });
        }

        // Get existing message IDs to avoid duplicates
        const existingEmails = await base44.entities.NetHamishpatEmail.list();
        const existingIds = new Set(existingEmails.map(e => e.message_id));

        // Fetch case list for linking
        const cases = await base44.entities.Case.list();
        
        const processedEmails = [];
        
        // Helper function to find attachments recursively
        const findAttachments = (payload, attachments = []) => {
            if (payload.filename && payload.body?.attachmentId) {
                attachments.push({
                    filename: payload.filename,
                    attachmentId: payload.body.attachmentId,
                    mimeType: payload.mimeType,
                    size: payload.body.size
                });
            }
            if (payload.parts) {
                for (const part of payload.parts) {
                    findAttachments(part, attachments);
                }
            }
            return attachments;
        };

        for (const msg of searchData.messages) {
            if (existingIds.has(msg.id)) continue;
            
            // Get full message
            const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
            const msgResponse = await fetch(msgUrl, {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });
            const msgData = await msgResponse.json();
            
            // Extract headers
            const headers = msgData.payload.headers;
            const subject = headers.find(h => h.name === "Subject")?.value || "";
            const from = headers.find(h => h.name === "From")?.value || "";
            const date = headers.find(h => h.name === "Date")?.value || "";
            
            // Extract body
            let body = "";
            if (msgData.payload.body?.data) {
                body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } else if (msgData.payload.parts) {
                const textPart = msgData.payload.parts.find(p => p.mimeType === "text/plain");
                if (textPart?.body?.data) {
                    body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }
            }

            // Try to extract case number - multiple formats
            // Format 1: Net Hamishpat format like 37959-09-25
            // Format 2: Your internal format like 2025-001
            const netHamishpatRegex = /\b(\d{4,6}-\d{2}-\d{2,4})\b/g;
            const allMatches = [...(subject.matchAll(netHamishpatRegex) || []), ...(body.matchAll(netHamishpatRegex) || [])];
            const extractedCaseNumber = allMatches.length > 0 ? allMatches[0][1] : null;

            // Link to case - check both case_number and net_hamishpat_number fields
            let linkedCaseId = null;
            let linkedCase = null;
            if (extractedCaseNumber) {
                linkedCase = cases.find(c => 
                    c.case_number === extractedCaseNumber || 
                    c.net_hamishpat_number === extractedCaseNumber
                );
                if (linkedCase) linkedCaseId = linkedCase.id;
            }

            // Find and download attachments
            const attachmentInfos = findAttachments(msgData.payload);
            const savedAttachments = [];
            
            for (const att of attachmentInfos) {
                try {
                    // Download attachment from Gmail
                    const attUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${att.attachmentId}`;
                    const attResponse = await fetch(attUrl, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                    });
                    const attData = await attResponse.json();
                    
                    if (attData.data) {
                        // Convert base64url to regular base64
                        const base64Data = attData.data.replace(/-/g, '+').replace(/_/g, '/');
                        
                        // Create a blob and upload to Base44
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: att.mimeType });
                        const file = new File([blob], att.filename, { type: att.mimeType });
                        
                        // Upload file
                        const uploadResult = await base44.integrations.Core.UploadFile({ file });
                        
                        savedAttachments.push({
                            filename: att.filename,
                            url: uploadResult.file_url,
                            content_type: att.mimeType
                        });

                        // If linked to a case, also add to case documents
                        if (linkedCase) {
                            const caseDocuments = linkedCase.documents || [];
                            caseDocuments.push({
                                name: att.filename,
                                url: uploadResult.file_url,
                                category: "החלטת בית משפט",
                                upload_date: new Date().toISOString(),
                                uploaded_by: "נט המשפט (אוטומטי)"
                            });
                            await base44.asServiceRole.entities.Case.update(linkedCase.id, {
                                documents: caseDocuments
                            });
                        }
                    }
                } catch (attError) {
                    console.error("Attachment download error:", attError);
                }
            }

            // Save to DB
            const emailRecord = {
                message_id: msg.id,
                subject: subject,
                received_date: new Date(date).toISOString(),
                sender: from,
                body_preview: body.substring(0, 300),
                full_content: body,
                case_number_extracted: extractedCaseNumber,
                linked_case_id: linkedCaseId,
                status: linkedCaseId ? "processed" : "new",
                attachments: savedAttachments
            };

            await base44.entities.NetHamishpatEmail.create(emailRecord);
            processedEmails.push(emailRecord);
            
            // Mark as read in Gmail
            await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ removeLabelIds: ["UNREAD"] })
            });
        }

        return Response.json({ 
            success: true, 
            processed: processedEmails.length,
            emails: processedEmails
        });

    } catch (error) {
        console.error("Gmail Fetch Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});