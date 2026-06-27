import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Folder, FileText, ArrowRight, ExternalLink, Loader2, Home, Image as ImageIcon, FileSpreadsheet, Presentation, Upload, FolderPlus, X, Link as LinkIcon, AlertTriangle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ROOT_FOLDER_KEY = 'googledrive_root_folder';
const DEFAULT_ROOT_FOLDER_ID = '1pyFHawmGtyW0nJdUSeAi_2W3BKABjZmH';

export default function GoogleDriveBrowser() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rootFolderId, setRootFolderId] = useState(DEFAULT_ROOT_FOLDER_ID);
    const [currentFolder, setCurrentFolder] = useState(DEFAULT_ROOT_FOLDER_ID);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: DEFAULT_ROOT_FOLDER_ID, name: 'מכתבי התראה וכתבי תביעה דיני עבודה' }]);
    const [error, setError] = useState(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkInput, setLinkInput] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadFiles(currentFolder);
    }, [currentFolder]);

    const loadFiles = async (folderId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await base44.functions.invoke('googleDriveV2', { 
                action: 'list_files', 
                folderId: folderId 
            });
            
            if (res.data && res.data.files) {
                // Sort: folders first, then files
                const sorted = res.data.files.sort((a, b) => {
                    const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
                    const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    return a.name.localeCompare(b.name, 'he');
                });
                setFiles(sorted);
            } else if (res.data.error) {
                setError(res.data.error);
            }
        } catch (err) {
            console.error("Failed to load Drive files", err);
            setError("Failed to load files. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folderId, folderName) => {
        setCurrentFolder(folderId);
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
    };

    const handleBreadcrumbClick = (index) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    };

    const getFileIcon = (mimeType) => {
        if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-6 h-6 text-blue-500 fill-blue-100" />;
        if (mimeType.includes('image')) return <ImageIcon className="w-6 h-6 text-purple-500" />;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="w-6 h-6 text-orange-500" />;
        return <FileText className="w-6 h-6 text-slate-500" />;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploading(true);
        try {
            // Upload file to Base44 first, then to Drive
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            await base44.functions.invoke('googleDriveV2', {
                action: 'upload_file',
                fileUrl: file_url,
                fileName: file.name,
                folderId: currentFolder
            });
            setShowUploadDialog(false);
            loadFiles(currentFolder);
        } catch (err) {
            console.error("Upload failed", err);
            setError("שגיאה בהעלאת הקובץ");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        
        setUploading(true);
        try {
            await base44.functions.invoke('googleDriveV2', {
                action: 'create_folder',
                folderName: newFolderName,
                parentFolderId: currentFolder
            });
            setShowFolderDialog(false);
            setNewFolderName("");
            loadFiles(currentFolder);
        } catch (err) {
            console.error("Create folder failed", err);
            setError("שגיאה ביצירת התיקייה");
        } finally {
            setUploading(false);
        }
    };

    const handleSetRootFolder = () => {
        let folderId = linkInput.trim();
        
        // Extract ID from various URL formats
        if (folderId.includes('drive.google.com')) {
            const match = folderId.match(/folders\/([-a-zA-Z0-9_]+)/);
            if (match) folderId = match[1];
        }
        
        if (!folderId) {
            setError("נא להזין קישור תקין לתיקייה");
            return;
        }
        
        localStorage.setItem(ROOT_FOLDER_KEY, folderId);
        setRootFolderId(folderId);
        setCurrentFolder(folderId);
        setBreadcrumbs([{ id: folderId, name: 'תיקייה ראשית' }]);
        setShowLinkDialog(false);
        setLinkInput("");
    };

    const handleGoToMyDrive = () => {
        localStorage.removeItem(ROOT_FOLDER_KEY);
        setRootFolderId(null);
        setCurrentFolder(null);
        setBreadcrumbs([{ id: null, name: 'My Drive' }]);
    };

    const handleClearRootFolder = () => {
        localStorage.removeItem(ROOT_FOLDER_KEY);
        setRootFolderId(null);
        setCurrentFolder(null);
        setBreadcrumbs([{ id: null, name: 'My Drive' }]);
        loadFiles(null);
    };

    const handleCreateRootFolder = async () => {
        setUploading(true);
        try {
            const res = await base44.functions.invoke('googleDriveV2', {
                action: 'create_folder',
                folderName: 'משרד עורכי דין - תיקים'
            });
            
            if (res.data && res.data.folderId) {
                localStorage.setItem(ROOT_FOLDER_KEY, res.data.folderId);
                setRootFolderId(res.data.folderId);
                setCurrentFolder(res.data.folderId);
                setBreadcrumbs([{ id: res.data.folderId, name: 'תיקייה ראשית' }]);
                loadFiles(res.data.folderId);
            } else if (res.data.error) {
                setError(res.data.error);
            }
        } catch (err) {
            console.error("Failed to create root folder", err);
            setError("שגיאה ביצירת התיקייה הראשית");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <HardDrive className="w-8 h-8 text-blue-600" />
                        Google Drive
                    </h1>
                    <p className="text-slate-500">סייר קבצים - גש לקבצים שלך ישירות מהמערכת</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                     <Button onClick={() => setShowFolderDialog(true)} variant="outline">
                        <FolderPlus className="w-4 h-4 ml-2" />
                        תיקייה חדשה
                     </Button>
                     <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Upload className="w-4 h-4 ml-2" />
                        העלאת קובץ
                     </Button>
                     <Button onClick={() => loadFiles(currentFolder)} variant="outline">
                        <Loader2 className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                        סנכרן
                     </Button>
                     <a href={currentFolder ? `https://drive.google.com/drive/folders/${currentFolder}` : 'https://drive.google.com/drive/my-drive'} target="_blank" rel="noreferrer">
                        <Button variant="outline">
                            <ExternalLink className="w-4 h-4 ml-2" />
                            פתח ב-Google Drive
                        </Button>
                     </a>
                     <Button onClick={() => setShowLinkDialog(true)} variant="ghost" size="icon" title="הגדרות">
                        ⚙️
                     </Button>
                </div>
            </div>



            <Card className="shadow-sm border-slate-200 min-h-[500px]">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-2">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm overflow-x-auto no-scrollbar">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id || 'root'} className="flex items-center whitespace-nowrap">
                                {index > 0 && <span className="mx-1 text-slate-400">/</span>}
                                <button
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`hover:bg-slate-200 px-2 py-1 rounded transition-colors ${
                                        index === breadcrumbs.length - 1 ? 'font-bold text-slate-800' : 'text-slate-600'
                                    }`}
                                >
                                    {index === 0 ? <Home className="w-4 h-4" /> : crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="bg-red-50 p-4 rounded-full mb-3">
                                <HardDrive className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-800">שגיאה בטעינת הקבצים</h3>
                            <p className="text-slate-500 mb-4">{error}</p>
                            <Button onClick={() => loadFiles(currentFolder)}>נסה שוב</Button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-slate-500">טוען קבצים...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Folder className="w-12 h-12 text-slate-300 mb-2" />
                            <p className="text-slate-500">התיקייה ריקה</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                            {files.map(file => {
                                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => isFolder ? handleFolderClick(file.id, file.name) : window.open(file.webViewLink, '_blank')}
                                        className="group relative flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all cursor-pointer text-center"
                                    >
                                        <div className="w-12 h-12 mb-3 flex items-center justify-center bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            {file.thumbnailLink && !isFolder ? (
                                                <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100" />
                                            ) : (
                                                getFileIcon(file.mimeType)
                                            )}
                                        </div>
                                        <h3 className="text-sm font-medium text-slate-700 truncate w-full px-2" title={file.name}>
                                            {file.name}
                                        </h3>
                                        {!isFolder && (
                                            <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload File Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>העלאת קובץ ל-Google Drive</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-500">
                            הקובץ יועלה ל: {breadcrumbs[breadcrumbs.length - 1]?.name || 'My Drive'}
                        </p>
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                        <span className="text-slate-500">מעלה קובץ...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-slate-600 font-medium">לחץ לבחירת קובץ</span>
                                        <span className="text-sm text-slate-400 mt-1">או גרור לכאן</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Folder Dialog */}
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-500">
                            התיקייה תיווצר ב: {breadcrumbs[breadcrumbs.length - 1]?.name || 'My Drive'}
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">שם התיקייה</Label>
                            <Input
                                id="folder-name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="הכנס שם לתיקייה"
                                disabled={uploading}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowFolderDialog(false)} disabled={uploading}>
                                ביטול
                            </Button>
                            <Button onClick={handleCreateFolder} disabled={uploading || !newFolderName.trim()} className="bg-blue-600 hover:bg-blue-700">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'צור תיקייה'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog for Root Folder */}
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>הגדרות תיקייה ראשית</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>קבע תיקייה ראשית (קישור או ID)</Label>
                            <Input
                                value={linkInput}
                                onChange={e => setLinkInput(e.target.value)}
                                placeholder="הדבק קישור לתיקיית Drive או ID"
                            />
                            <p className="text-xs text-slate-400">לדוגמא: https://drive.google.com/drive/folders/1abc... או רק ה-ID</p>
                        </div>
                        {rootFolderId && (
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                                <span className="text-green-700">תיקייה ראשית: <span className="font-mono">{rootFolderId.substring(0, 20)}...</span></span>
                                <Button size="sm" variant="ghost" onClick={handleGoToMyDrive} className="text-red-500 hover:bg-red-50">
                                    <X className="w-4 h-4 ml-1" />
                                    נקה
                                </Button>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>ביטול</Button>
                            <Button onClick={handleSetRootFolder} disabled={!linkInput.trim()} className="bg-blue-600 hover:bg-blue-700">
                                קבע תיקייה ראשית
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}