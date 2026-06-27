import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const VALID_API_KEY = "f8f98495094f4d55a3fb4fdfdf108260";

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, api_key, Api-Key, API_KEY'
            }
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // Log all headers for debugging
        console.log("=== INCOMING REQUEST ===");
        console.log("Method:", req.method);
        const allHeaders = {};
        req.headers.forEach((value, key) => {
            allHeaders[key] = value;
        });
        console.log("All headers:", JSON.stringify(allHeaders));
        
        // Check API key from header (case-insensitive)
        const apiKey = req.headers.get('api_key') || req.headers.get('Api-Key') || req.headers.get('API_KEY');
        console.log("API Key received:", apiKey ? "***" + apiKey.slice(-4) : "NONE");
        
        if (apiKey !== VALID_API_KEY) {
            console.log("API Key validation failed");
            return Response.json({ error: 'Invalid API key' }, { status: 401 });
        }
        
        console.log("API Key validation passed");

        // Parse multipart form data
        const formData = await req.formData();
        
        // Log all form fields to debug
        const allFields = [];
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                allFields.push({ key, type: 'file', name: value.name, size: value.size });
            } else {
                allFields.push({ key, type: 'string', value: String(value).substring(0, 100) });
            }
        }
        console.log("All form fields:", JSON.stringify(allFields));
        
        const subject = formData.get('subject') || '';
        const text = formData.get('text') || '';
        const sender = formData.get('שולח') || formData.get('sender') || '';
        
        // Try multiple possible file field names
        let file = formData.get('file') || formData.get('attachment') || formData.get('קובץ') || formData.get('pdf');
        let fileUrl = formData.get('file_url') || formData.get('attachment_url') || formData.get('url');
        let fileName = formData.get('file_name') || formData.get('filename') || formData.get('attachment_name');
        
        // Also check for any File type in form data
        if (!file) {
            for (const [key, value] of formData.entries()) {
                if (value instanceof File && value.size > 0) {
                    file = value;
                    console.log("Found file in field:", key);
                    break;
                }
            }
        }
        
        // Check for URL strings that might be file URLs
        if (!file && !fileUrl) {
            for (const [key, value] of formData.entries()) {
                if (typeof value === 'string' && value.includes('http') && (value.includes('.pdf') || value.includes('attachment') || value.includes('download'))) {
                    fileUrl = value;
                    console.log("Found file URL in field:", key, "URL:", value);
                    break;
                }
            }
        }
        
        console.log("Received data:", { subject, sender, hasFile: !!file, hasFileUrl: !!fileUrl, fileName: file?.name || fileName, fileSize: file?.size });

        // Generate unique message ID
        const messageId = `MAKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Extract case number from subject or body
        const caseNumberRegex = /\b\d{2,6}-\d{2}-\d{2,4}\b/;
        const match = (subject || '').match(caseNumberRegex) || (text || '').match(caseNumberRegex);
        const extractedCaseNumber = match ? match[0] : null;

        // Try to link to existing case
        let linkedCaseId = null;
        let linkedCase = null;
        const cases = await base44.asServiceRole.entities.Case.list();
        
        if (extractedCaseNumber) {
            linkedCase = cases.find(c => 
                c.case_number === extractedCaseNumber || 
                c.net_hamishpat_number === extractedCaseNumber
            );
            if (linkedCase) linkedCaseId = linkedCase.id;
        }

        // Handle file attachment if present
        let attachments = [];
        let uploadedFileUrl = null;
        let uploadedFileName = null;

        // Option 1: Direct file upload
        if (file && file.name) {
            try {
                const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
                uploadedFileUrl = uploadResult.file_url;
                uploadedFileName = file.name;
                console.log("File uploaded directly:", file.name);
            } catch (uploadErr) {
                console.error("Direct file upload error:", uploadErr);
            }
        }
        
        // Option 2: File URL provided - download and re-upload
        if (!uploadedFileUrl && fileUrl) {
            try {
                console.log("Downloading file from URL:", fileUrl);
                const fileResponse = await fetch(fileUrl);
                if (fileResponse.ok) {
                    const contentType = fileResponse.headers.get('content-type') || 'application/pdf';
                    const blob = await fileResponse.blob();
                    
                    // Determine filename
                    const guessedName = fileName || 
                        fileUrl.split('/').pop()?.split('?')[0] || 
                        `document_${Date.now()}.pdf`;
                    
                    const downloadedFile = new File([blob], guessedName, { type: contentType });
                    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: downloadedFile });
                    uploadedFileUrl = uploadResult.file_url;
                    uploadedFileName = guessedName;
                    console.log("File downloaded and uploaded:", guessedName);
                } else {
                    console.error("Failed to download file:", fileResponse.status);
                }
            } catch (downloadErr) {
                console.error("File download/upload error:", downloadErr);
            }
        }

        // Save attachment info and add to case if we got a file
        if (uploadedFileUrl) {
            attachments.push({
                filename: uploadedFileName,
                url: uploadedFileUrl,
                content_type: file?.type || 'application/pdf'
            });

            // If linked to a case, also add to case documents
            if (linkedCase) {
                const caseDocuments = linkedCase.documents || [];
                caseDocuments.push({
                    name: uploadedFileName,
                    url: uploadedFileUrl,
                    category: "החלטת בית משפט",
                    upload_date: new Date().toISOString(),
                    uploaded_by: "נט המשפט (אוטומטי)"
                });
                await base44.asServiceRole.entities.Case.update(linkedCase.id, {
                    documents: caseDocuments
                });
                console.log("Document added to case:", linkedCase.case_name);
            }
        }

        // Create email record
        const emailRecord = {
            message_id: messageId,
            subject: subject || "ללא נושא",
            received_date: new Date().toISOString(),
            sender: sender || "לא ידוע",
            body_preview: (text || '').substring(0, 300),
            full_content: text || '',
            case_number_extracted: extractedCaseNumber,
            linked_case_id: linkedCaseId,
            status: linkedCaseId ? "processed" : "new",
            attachments: attachments
        };

        const created = await base44.asServiceRole.entities.NetHamishpatEmail.create(emailRecord);

        return Response.json({ 
            success: true, 
            id: created.id,
            subject: subject,
            linked: !!linkedCaseId,
            caseNumber: extractedCaseNumber,
            hasAttachment: attachments.length > 0
        });

    } catch (error) {
        console.error("Webhook error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});