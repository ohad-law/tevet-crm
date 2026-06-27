import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HardDrive, RefreshCw, ExternalLink, Plus, Link as LinkIcon, Upload, File, Folder, Loader2, Check, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROOT_FOLDER_ID = '1pyFHawmGtyW0nJdUSeAi_2W3BKABjZmH';

export default function GoogleDriveWidget({ caseId, caseNumber, clientName, initialFolderId, onFolderCreated }) {
    const [folderId, setFolderId] = useState(initialFolderId);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [manualFolderId, setManualFolderId] = useState("");
    const [isLinking, setIsLinking] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [pickerFolders, setPickerFolders] = useState([]);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [pickerPath, setPickerPath] = useState([{ id: ROOT_FOLDER_ID, name: 'תיקים' }]);

    useEffect(() => {
        setFolderId(initialFolderId);
    }, [initialFolderId]);

    useEffect(() => {
        checkConnection();
    }, []);

    useEffect(() => {
        if (folderId) {
            loadFiles();
        }
    }, [folderId]);

    const checkConnection = async () => {
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'check_connection'
            });
            setConnectionStatus(data.connected ? 'connected' : 'disconnected');
        } catch (error) {
            setConnectionStatus('error');
        }
    };

    const loadFiles = async () => {
        if (!folderId) return;
        setIsLoading(true);
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'list_files',
                folderId
            });
            if (data.files) {
                setFiles(data.files);
            } else if (data.error) {
                // Silently fail - folder might be externally linked
                console.log("Cannot access folder - might be externally linked");
                setFiles([]);
            }
        } catch (error) {
            console.error("Error loading files:", error);
            setFiles([]);
        }
        setIsLoading(false);
    };

    const handleCreateFolder = async () => {
        setIsCreating(true);
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'create_case_folder',
                caseNumber,
                clientName,
                caseId
            });
            
            if (data.error) throw new Error(data.error);
            
            setFolderId(data.folderId);
            if (onFolderCreated) {
                onFolderCreated(data.folderId);
            }
        } catch (error) {
            console.error(error);
            alert("שגיאה ביצירת תיקייה: " + error.message);
        }
        setIsCreating(false);
    };

    const handleLinkFolder = async () => {
        if (!manualFolderId) return;
        setIsLinking(true);
        try {
            let extractedId = manualFolderId.trim();
            if (extractedId.includes('drive.google.com')) {
                const match = extractedId.match(/folders\/([-a-zA-Z0-9_]+)/);
                if (match) extractedId = match[1];
            }

            await base44.entities.Case.update(caseId, {
                google_drive_folder_id: extractedId
            });
            
            setFolderId(extractedId);
            setShowLinkInput(false);
            setManualFolderId("");
            
            if (onFolderCreated) {
                onFolderCreated(extractedId);
            }
        } catch (error) {
            console.error(error);
            alert("שגיאה בקישור תיקייה: " + error.message);
        }
        setIsLinking(false);
    };

    const handleSync = async () => {
        if (!folderId) return;
        setIsSyncing(true);
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'sync_folder_to_case',
                folderId,
                caseId
            });
            
            if (data.error) throw new Error(data.error);
            
            await loadFiles();
            alert(`סנכרון הושלם! נוספו ${data.added} קבצים חדשים.`);
        } catch (error) {
            console.error(error);
            alert("שגיאה בסנכרון: " + error.message);
        }
        setIsSyncing(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !folderId) return;

        setIsUploading(true);
        try {
            // First upload to Base44
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            // Then upload to Google Drive
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'upload_to_case',
                caseId,
                fileName: file.name,
                fileUrl: file_url
            });

            if (data.error) throw new Error(data.error);
            
            await loadFiles();
        } catch (error) {
            console.error(error);
            alert("שגיאה בהעלאה: " + error.message);
        }
        setIsUploading(false);
        e.target.value = '';
    };

    const openFolderPicker = async (folderId = ROOT_FOLDER_ID, folderName = 'תיקים') => {
        setShowFolderPicker(true);
        setPickerLoading(true);
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'list_files',
                folderId
            });
            const folders = (data.files || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder');
            setPickerFolders(folders);
        } catch (e) {
            console.error(e);
        }
        setPickerLoading(false);
    };

    const pickerNavigate = async (folder) => {
        setPickerPath(prev => [...prev, { id: folder.id, name: folder.name }]);
        setPickerLoading(true);
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'list_files',
                folderId: folder.id
            });
            const folders = (data.files || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder');
            setPickerFolders(folders);
        } catch (e) { console.error(e); }
        setPickerLoading(false);
    };

    const pickerBack = async () => {
        if (pickerPath.length <= 1) return;
        const newPath = pickerPath.slice(0, -1);
        setPickerPath(newPath);
        setPickerLoading(true);
        try {
            const { data } = await base44.functions.invoke('googleDriveV2', {
                action: 'list_files',
                folderId: newPath[newPath.length - 1].id
            });
            const folders = (data.files || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder');
            setPickerFolders(folders);
        } catch (e) { console.error(e); }
        setPickerLoading(false);
    };

    const selectPickerFolder = async (folder) => {
        await base44.entities.Case.update(caseId, { google_drive_folder_id: folder.id });
        setFolderId(folder.id);
        setShowFolderPicker(false);
        setPickerPath([{ id: ROOT_FOLDER_ID, name: 'תיקים' }]);
        if (onFolderCreated) onFolderCreated(folder.id);
    };

    const handleOpenDrive = () => {
        if (folderId) {
            window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
        }
    };

    if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        return (
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <HardDrive className="w-5 h-5 text-amber-600" />
                        <p className="text-amber-800">Google Drive לא מחובר. פנה למנהל המערכת.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                            <HardDrive className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base">תיקיית Google Drive</CardTitle>
                            <p className="text-sm text-slate-500">
                                {folderId ? "תיקייה מקושרת" : "עדיין לא מקושר"}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {folderId ? (
                            <>
                                <Button 
                                    onClick={handleOpenDrive} 
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                    פתח ב-Drive
                                </Button>
                                <Button 
                                    onClick={handleSync} 
                                    variant="outline"
                                    size="sm"
                                    disabled={isSyncing}
                                >
                                    <RefreshCw className={`w-4 h-4 ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                    סנכרן
                                </Button>
                                <label>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploading}
                                        asChild
                                    >
                                        <span>
                                            {isUploading ? (
                                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4 ml-2" />
                                            )}
                                            העלה קובץ
                                        </span>
                                    </Button>
                                </label>
                            </>
                        ) : (
                            !showLinkInput ? (
                                <>
                                    <Button 
                                        onClick={() => openFolderPicker()} 
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Folder className="w-4 h-4 ml-2" />
                                        בחר תיקייה מ-Drive
                                    </Button>
                                    <Button 
                                        onClick={handleCreateFolder} 
                                        size="sm"
                                        variant="outline"
                                        disabled={isCreating}
                                    >
                                        {isCreating ? (
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4 ml-2" />
                                        )}
                                        צור תיקייה חדשה
                                    </Button>
                                    <Button 
                                        onClick={() => setShowLinkInput(true)} 
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <LinkIcon className="w-4 h-4 ml-2" />
                                        הכנס ID ידנית
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        placeholder="הדבק קישור לתיקייה או ID" 
                                        value={manualFolderId}
                                        onChange={e => setManualFolderId(e.target.value)}
                                        className="w-64 bg-white"
                                    />
                                    <Button onClick={handleLinkFolder} disabled={isLinking || !manualFolderId} size="sm">
                                        {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowLinkInput(false)}>
                                        ביטול
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </CardHeader>

            {folderId && (
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : files.length > 0 ? (
                        <div className="grid gap-2">
                            {files.slice(0, 10).map((file) => (
                                <a
                                    key={file.id}
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    {file.mimeType?.includes('folder') ? (
                                        <Folder className="w-5 h-5 text-blue-500" />
                                    ) : (
                                        <File className="w-5 h-5 text-slate-400" />
                                    )}
                                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {file.modifiedTime && new Date(file.modifiedTime).toLocaleDateString('he-IL')}
                                    </span>
                                </a>
                            ))}
                            {files.length > 10 && (
                                <p className="text-center text-sm text-slate-500 py-2">
                                    ועוד {files.length - 10} קבצים נוספים...
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-8">
                            התיקייה ריקה. העלה קבצים או סנכרן מ-Drive.
                        </p>
                    )}
                </CardContent>
            )}

            {!folderId && (
                <div className="px-4 py-3 text-xs text-slate-500 bg-slate-50/50 border-t border-slate-100">
                    💡 בחר תיקייה קיימת מה-Drive שלך, או צור תיקייה חדשה לתיק זה.
                </div>
            )}

            {/* Folder Picker Modal */}
            {showFolderPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowFolderPicker(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden" onClick={e => e.stopPropagation()} dir="rtl">
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                            <h3 className="font-bold text-slate-800">בחר תיקייה</h3>
                            <button onClick={() => setShowFolderPicker(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
                        </div>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1 px-4 py-2 text-xs text-slate-500 border-b overflow-x-auto">
                            {pickerPath.map((p, i) => (
                                <React.Fragment key={p.id}>
                                    {i > 0 && <ChevronLeft className="w-3 h-3 flex-shrink-0" />}
                                    <span className={i === pickerPath.length - 1 ? 'font-semibold text-slate-800' : 'cursor-pointer hover:underline'} 
                                        onClick={i < pickerPath.length - 1 ? () => { setPickerPath(pickerPath.slice(0, i+1)); pickerNavigate({ id: p.id, name: p.name }); } : undefined}>
                                        {p.name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="max-h-72 overflow-y-auto p-2">
                            {pickerLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                            ) : pickerFolders.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 text-sm">אין תיקיות משנה</p>
                            ) : (
                                pickerFolders.map(folder => (
                                    <div key={folder.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 group cursor-pointer"
                                        onClick={() => pickerNavigate(folder)}>
                                        <div className="flex items-center gap-2">
                                            <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            <span className="text-sm text-slate-700 truncate">{folder.name}</span>
                                        </div>
                                        <Button size="sm" className="opacity-0 group-hover:opacity-100 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                            onClick={e => { e.stopPropagation(); selectPickerFolder(folder); }}>
                                            בחר
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50 gap-2">
                            <Button variant="outline" size="sm" onClick={pickerBack} disabled={pickerPath.length <= 1}>
                                <ChevronLeft className="w-4 h-4 ml-1" />
                                חזור
                            </Button>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => selectPickerFolder(pickerPath[pickerPath.length - 1])}>
                                בחר תיקייה זו
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}