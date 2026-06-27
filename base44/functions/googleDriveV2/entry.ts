import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // Get Google Drive access token from Base44 connector
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
        
        if (!accessToken) {
            return Response.json({ 
                error: "Google Drive not connected", 
                needsAuth: true 
            }, { status: 401 });
        }

        const { action, ...params } = await req.json();

        // Helper function for Google Drive API calls
        const driveAPI = async (endpoint, method = 'GET', body = null) => {
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            };
            if (body) options.body = JSON.stringify(body);
            
            const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, options);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(`Drive API Error: ${error}`);
            }
            return res.json();
        };

        switch (action) {
            case 'check_connection': {
                try {
                    const about = await driveAPI('about?fields=user');
                    return Response.json({ 
                        connected: true, 
                        user: about.user 
                    });
                } catch (e) {
                    return Response.json({ 
                        connected: false, 
                        error: e.message 
                    });
                }
            }

            case 'create_folder': {
                const { folderName, parentFolderId } = params;
                
                if (!folderName) {
                    return Response.json({ error: "Missing folder name" }, { status: 400 });
                }

                const metadata = {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    ...(parentFolderId && { parents: [parentFolderId] })
                };

                const folder = await driveAPI('files', 'POST', metadata);

                return Response.json({ 
                    success: true, 
                    folderId: folder.id,
                    name: folder.name
                });
            }

            case 'create_case_folder': {
                const { caseNumber, clientName, caseId } = params;
                
                if (!caseNumber || !clientName || !caseId) {
                    return Response.json({ error: "Missing required parameters" }, { status: 400 });
                }

                const folderName = `${caseNumber} - ${clientName}`;
                
                // Create folder in Google Drive
                const folder = await driveAPI('files', 'POST', {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                });

                // Update the case entity with the folder ID
                await base44.asServiceRole.entities.Case.update(caseId, {
                    google_drive_folder_id: folder.id
                });

                return Response.json({ 
                    success: true, 
                    folderId: folder.id,
                    folderName: folderName,
                    webViewLink: `https://drive.google.com/drive/folders/${folder.id}`
                });
            }

            case 'list_files': {
                const { folderId } = params;
                
                let query;
                if (folderId) {
                    query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
                } else {
                    query = encodeURIComponent(`'root' in parents and trashed = false`);
                }
                
                const result = await driveAPI(
                    `files?q=${query}&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,size,parents)&orderBy=modifiedTime desc&pageSize=100`
                );

                return Response.json({ 
                    success: true, 
                    files: result.files || [] 
                });
            }

            case 'upload_file': {
                const { folderId, fileName, fileUrl, mimeType } = params;
                
                if (!fileName || !fileUrl) {
                    return Response.json({ error: "Missing required parameters" }, { status: 400 });
                }

                // Fetch the file content
                const fileRes = await fetch(fileUrl);
                const fileBlob = await fileRes.blob();

                // Create multipart upload
                const metadata = {
                    name: fileName,
                    ...(folderId && { parents: [folderId] })
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', fileBlob);

                const uploadRes = await fetch(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,mimeType,modifiedTime',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: form,
                    }
                );

                if (!uploadRes.ok) {
                    const error = await uploadRes.text();
                    throw new Error(`Upload failed: ${error}`);
                }

                const uploadedFile = await uploadRes.json();
                return Response.json({ 
                    success: true, 
                    file: uploadedFile 
                });
            }

            case 'upload_to_case': {
                const { caseId, fileName, fileUrl } = params;
                
                if (!caseId || !fileName || !fileUrl) {
                    return Response.json({ error: "Missing required parameters" }, { status: 400 });
                }

                // Get the case to find folder ID
                const caseData = await base44.asServiceRole.entities.Case.get(caseId);
                
                if (!caseData.google_drive_folder_id) {
                    return Response.json({ 
                        error: "Case has no Google Drive folder. Create one first.",
                        needsFolder: true 
                    }, { status: 400 });
                }

                // Fetch the file content
                const fileRes = await fetch(fileUrl);
                const fileBlob = await fileRes.blob();

                // Create multipart upload
                const metadata = {
                    name: fileName,
                    parents: [caseData.google_drive_folder_id]
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', fileBlob);

                const uploadRes = await fetch(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,mimeType,modifiedTime',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: form,
                    }
                );

                if (!uploadRes.ok) {
                    const error = await uploadRes.text();
                    throw new Error(`Upload failed: ${error}`);
                }

                const uploadedFile = await uploadRes.json();

                // Also add to case documents
                const existingDocs = caseData.documents || [];
                const newDoc = {
                    name: uploadedFile.name,
                    url: uploadedFile.webViewLink,
                    drive_id: uploadedFile.id,
                    drive_view_link: uploadedFile.webViewLink,
                    upload_date: new Date().toISOString(),
                    category: 'Google Drive',
                    uploaded_by: 'System'
                };

                await base44.asServiceRole.entities.Case.update(caseId, {
                    documents: [...existingDocs, newDoc]
                });

                return Response.json({ 
                    success: true, 
                    file: uploadedFile,
                    addedToCase: true
                });
            }

            case 'sync_folder_to_case': {
                const { folderId, caseId } = params;
                
                if (!folderId || !caseId) {
                    return Response.json({ error: "Missing required parameters" }, { status: 400 });
                }

                // Get files from Drive
                const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
                const result = await driveAPI(
                    `files?q=${query}&fields=files(id,name,mimeType,webViewLink,modifiedTime)`
                );

                // Get current case
                const caseData = await base44.asServiceRole.entities.Case.get(caseId);
                const existingDocs = caseData.documents || [];
                const existingDriveIds = new Set(existingDocs.filter(d => d.drive_id).map(d => d.drive_id));

                // Add new files
                const newDocs = [];
                for (const file of (result.files || [])) {
                    if (!existingDriveIds.has(file.id) && !file.mimeType.includes('folder')) {
                        newDocs.push({
                            name: file.name,
                            url: file.webViewLink,
                            drive_id: file.id,
                            drive_view_link: file.webViewLink,
                            upload_date: file.modifiedTime,
                            category: 'Google Drive Sync',
                            uploaded_by: 'Google Drive'
                        });
                    }
                }

                if (newDocs.length > 0) {
                    await base44.asServiceRole.entities.Case.update(caseId, {
                        documents: [...existingDocs, ...newDocs]
                    });
                }

                return Response.json({ 
                    success: true, 
                    added: newDocs.length,
                    total: result.files?.length || 0
                });
            }

            case 'delete_file': {
                const { fileId } = params;
                
                if (!fileId) {
                    return Response.json({ error: "Missing file ID" }, { status: 400 });
                }

                await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                return Response.json({ success: true });
            }

            default:
                return Response.json({ error: "Unknown action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Google Drive Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});