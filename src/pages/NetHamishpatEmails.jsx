import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Mail, Link as LinkIcon, AlertTriangle, FileText, Search, X, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NetHamishpatEmails() {
    const [emails, setEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmail, setSelectedEmail] = useState(null);

    useEffect(() => {
        loadEmails();
    }, []);

    const loadEmails = async () => {
        setIsLoading(true);
        try {
            const data = await base44.entities.NetHamishpatEmail.list("-received_date");
            setEmails(data);
        } catch (error) {
            console.error("Error loading emails", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEmails = emails.filter(email => 
        email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.case_number_extracted?.includes(searchTerm) ||
        email.sender?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Mail className="w-8 h-8 text-blue-600" />
                        דואר נט המשפט
                    </h1>
                    <p className="text-slate-500">סנכרון וניהול הודעות ומסמכים ממערכת בתי המשפט</p>
                </div>
                <div className="flex gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                        <RefreshCw className="w-3 h-3 ml-1" />
                        סנכרון אוטומטי פעיל (Make)
                    </Badge>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="חיפוש לפי נושא, מספר תיק או שולח..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md bg-white border-slate-200"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">טוען הודעות...</div>
                        ) : filteredEmails.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Mail className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">אין הודעות להצגה</h3>
                                <p className="text-slate-500 max-w-sm mt-1">
                                    לחץ על "סנכרן עכשיו" כדי למשוך הודעות חדשות מהמייל המוגדר.
                                </p>
                            </div>
                        ) : (
                            filteredEmails.map((email) => (
                                <div 
                                    key={email.id} 
                                    className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedEmail(email)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-slate-900 truncate">
                                                    {email.subject || "No Subject"}
                                                </h4>
                                                {email.case_number_extracted && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {email.case_number_extracted}
                                                    </Badge>
                                                )}
                                                {email.status === 'new' && (
                                                    <Badge className="bg-green-500">חדש</Badge>
                                                )}
                                                {email.attachments?.length > 0 && (
                                                    <Paperclip className="w-3 h-3 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                                                <span>{new Date(email.received_date).toLocaleString('he-IL')}</span>
                                                <span>•</span>
                                                <span>{email.sender || "Unknown Sender"}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                {email.body_preview}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {email.linked_case_id ? (
                                                <Link to={createPageUrl(`CaseDetails?id=${email.linked_case_id}`)} onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                                                        <LinkIcon className="w-3 h-3 ml-1" />
                                                        מקושר לתיק
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                                                    <AlertTriangle className="w-3 h-3 ml-1" />
                                                    לא מקושר
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEmail(null)}>
                    <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b border-slate-200 flex flex-row items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-xl mb-2">{selectedEmail.subject || "No Subject"}</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span>מאת: {selectedEmail.sender || "Unknown"}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedEmail.received_date).toLocaleString('he-IL')}</span>
                                </div>
                                {selectedEmail.case_number_extracted && (
                                    <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                                        מספר תיק: {selectedEmail.case_number_extracted}
                                    </Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm">
                                {selectedEmail.full_content || selectedEmail.body_preview || "אין תוכן להצגה"}
                            </div>
                            
                            {selectedEmail.attachments?.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" />
                                        מצורף המסמך המבוקש ({selectedEmail.attachments.length} קבצים)
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedEmail.attachments.map((att, idx) => (
                                            <a 
                                                key={idx} 
                                                href={att.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-slate-800 block">
                                                        {att.filename?.includes('.pdf') ? 'מסמך PDF' : att.filename || `קובץ ${idx + 1}`}
                                                    </span>
                                                    <span className="text-xs text-slate-500">לחץ לצפייה והורדה</span>
                                                </div>
                                                <Badge className="bg-blue-600">פתח</Badge>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}