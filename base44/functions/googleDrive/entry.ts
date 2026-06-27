import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, folderId, fileId, uploadData } = await req.json();

        // Check for Google Drive authorization
        // We need to use service role to get the access token if using app connectors
        // BUT connectors.getAccessToken is a function on base44.asServiceRole.connectors
        // AND it returns a string token directly.

        let accessToken;
        try {
             accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");
        } catch (e) {
             console.error("Failed to get Drive token", e);
             return Response.json({ error: "Google Drive not authorized", details: e.message }, { status: 401 });
        }

        if (action === 'list') {
             // List files (Drive API v3)
             // Default lists files in root or specific folder
             const q = folderId ? `'${folderId}' in parents and trashed = false` : "'root' in parents and trashed = false";
             const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id, name, mimeType, iconLink, webViewLink, thumbnailLink)`;
             
             const res = await fetch(url, {
                 headers: { 'Authorization': `Bearer ${accessToken}` }
             });
             const data = await res.json();
             return Response.json(data);
        }

        if (action === 'upload') {
            // Upload a new file to Google Drive
            const { fileName, fileContent, mimeType, parentFolderId } = uploadData || {};
            
            if (!fileName || !fileContent) {
                return Response.json({ error: "Missing fileName or fileContent" }, { status: 400 });
            }

            // Create file metadata
            const metadata = {
                name: fileName,
                mimeType: mimeType || 'application/octet-stream'
            };
            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }

            // Use multipart upload
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const closeDelim = "\r\n--" + boundary + "--";

            // Decode base64 content
            const binaryContent = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));

            const body = delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + (mimeType || 'application/octet-stream') + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n\r\n' +
                fileContent +
                closeDelim;

            const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/related; boundary=' + boundary
                },
                body: body
            });

            const uploadData2 = await uploadRes.json();
            return Response.json(uploadData2);
        }

        if (action === 'createFolder') {
            // Create a new folder in Google Drive
            const { folderName, parentFolderId } = uploadData || {};
            
            if (!folderName) {
                return Response.json({ error: "Missing folderName" }, { status: 400 });
            }

            const metadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }

            const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            const folderData = await createRes.json();
            return Response.json(folderData);
        }

        if (action === 'status') {
            // Check connection status
            const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            return Response.json({ connected: true, user: data.user });
        }

        if (action === 'create_case_folder') {
            // Create a dedicated folder for a case and update the case entity
            const { caseId, caseName } = uploadData;
            
            if (!caseId || !caseName) {
                return Response.json({ error: "Missing caseId or caseName" }, { status: 400 });
            }

            // 1. Create Folder
            const metadata = {
                name: caseName,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            const folderData = await createRes.json();
            if (folderData.error) throw new Error(folderData.error.message);

            // 2. Update Case Entity
            await base44.asServiceRole.entities.Case.update(caseId, {
                google_drive_folder_id: folderData.id
            });

            return Response.json(folderData);
        }

        if (action === 'sync_folder_to_case') {
            // Sync files from a Drive folder to the Case documents
            const { caseId, folderId } = uploadData;

            if (!caseId || !folderId) {
                return Response.json({ error: "Missing caseId or folderId" }, { status: 400 });
            }

            // 1. List files in folder
            const q = `'${folderId}' in parents and trashed = false`;
            const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id, name, mimeType, webViewLink, webContentLink, createdTime)`;
            
            const listRes = await fetch(listUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const listData = await listRes.json();
            
            if (listData.error) {
                return Response.json({ error: listData.error.message }, { status: 500 });
            }

            const driveFiles = listData.files || [];

            // 2. Get current case documents
            const caseData = await base44.asServiceRole.entities.Case.get(caseId);
            const currentDocs = caseData.documents || [];
            const newDocs = [];

            // 3. Merge/Add new files
            let addedCount = 0;
            for (const file of driveFiles) {
                // Skip folders
                if (file.mimeType === 'application/vnd.google-apps.folder') continue;

                // Check if already exists (by drive_id)
                const exists = currentDocs.some(d => d.drive_id === file.id);
                if (!exists) {
                    newDocs.push({
                        name: file.name,
                        url: file.webViewLink, // Use webViewLink for viewing
                        drive_id: file.id,
                        drive_view_link: file.webViewLink,
                        upload_date: file.createdTime,
                        uploaded_by: 'Google Drive Sync',
                        category: 'מסמכי Drive'
                    });
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                const updatedDocs = [...currentDocs, ...newDocs];
                await base44.asServiceRole.entities.Case.update(caseId, {
                    documents: updatedDocs
                });
            }

            return Response.json({ 
                success: true, 
                added: addedCount, 
                total_synced: driveFiles.length,
                files: newDocs 
            });
        }

        return Response.json({ error: "Unknown action" }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});