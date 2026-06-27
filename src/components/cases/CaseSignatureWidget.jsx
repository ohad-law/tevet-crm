import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    FileSignature, Send, Plus, Loader2, Check, Clock, Eye, 
    ExternalLink, RefreshCw, AlertCircle, FileText, Upload
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const APP_BASE_URL = 'https://legal-flow-crm-1d774f3f.base44.app';
const getSignatureLink = (request) => `${APP_BASE_URL}/signdocument?token=${request.access_token}`;

export default function CaseSignatureWidget({ caseId, clientId, clientName, clientPhone, clientEmail }) {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [isSending, setIsSending] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [newRequest, setNewRequest] = useState({
        document_name: '',
        message: '',
        file: null
    });

    useEffect(() => {
        loadRequests();
    }, [caseId]);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const allRequests = await base44.entities.SignatureRequest.list();
            const caseRequests = allRequests.filter(r => r.case_id === caseId);
            setRequests(caseRequests);
        } catch (error) {
            console.error("Error loading signature requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!newRequest.document_name || !newRequest.file) {
            alert("נא למלא את שם המסמך ולהעלות קובץ");
            return;
        }

        setIsCreating(true);
        try {
            // Upload the file
            const uploadResult = await base44.integrations.Core.UploadFile({ file: newRequest.file });
            
            // Generate access token
            const accessToken = crypto.randomUUID();
            
            // Create the signature request
            const request = await base44.entities.SignatureRequest.create({
                document_name: newRequest.document_name,
                case_id: caseId,
                client_id: clientId,
                client_name: clientName,
                client_phone: clientPhone,
                client_email: clientEmail,
                original_file_url: uploadResult.file_url,
                access_token: accessToken,
                message: newRequest.message,
                status: 'draft'
            });

            setRequests([request, ...requests]);
            setShowNewDialog(false);
            setNewRequest({ document_name: '', message: '', file: null });
        } catch (error) {
            console.error("Error creating request:", error);
            alert("שגיאה ביצירת בקשת חתימה: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSendRequest = async (requestId) => {
        setIsSending(requestId);
        try {
            const res = await base44.functions.invoke("signatureOperations", {
                action: "send",
                requestId: requestId
            });

            if (res.data?.error) throw new Error(res.data.error);

            // Update local state
            setRequests(requests.map(r => 
                r.id === requestId ? { ...r, status: 'sent', sent_date: new Date().toISOString() } : r
            ));

            alert("הבקשה נשלחה בהצלחה!");
        } catch (error) {
            console.error("Error sending request:", error);
            alert("שגיאה בשליחת הבקשה: " + error.message);
        } finally {
            setIsSending(null);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'draft': { label: 'טיוטה', className: 'bg-slate-100 text-slate-700' },
            'sent': { label: 'נשלח', className: 'bg-blue-100 text-blue-700' },
            'viewed': { label: 'נצפה', className: 'bg-amber-100 text-amber-700' },
            'signed': { label: 'נחתם', className: 'bg-green-100 text-green-700' },
            'expired': { label: 'פג תוקף', className: 'bg-red-100 text-red-700' }
        };
        const { label, className } = config[status] || config['draft'];
        return <Badge className={className}>{label}</Badge>;
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'signed': return <Check className="w-4 h-4 text-green-600" />;
            case 'viewed': return <Eye className="w-4 h-4 text-amber-600" />;
            case 'sent': return <Clock className="w-4 h-4 text-blue-600" />;
            default: return <FileText className="w-4 h-4 text-slate-400" />;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">חתימה מרחוק</CardTitle>
                            <p className="text-sm text-slate-500">שלח מסמכים לחתימה ללקוח</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadRequests}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => setShowNewDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 ml-2" />
                            בקשה חדשה
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {requests.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <FileSignature className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 mb-3">עדיין לא נשלחו בקשות חתימה לתיק זה</p>
                            <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                                <Plus className="w-4 h-4 ml-2" />
                                שלח מסמך לחתימה
                            </Button>
                        </div>
                    ) : (
                        requests.map(request => (
                            <div 
                                key={request.id} 
                                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(request.status)}
                                    <div>
                                        <h4 className="font-medium text-slate-900">{request.document_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            {request.sent_date && (
                                                <span>נשלח: {new Date(request.sent_date).toLocaleDateString('he-IL')}</span>
                                            )}
                                            {request.signed_date && (
                                                <span className="text-green-600">נחתם: {new Date(request.signed_date).toLocaleDateString('he-IL')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(request.status)}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => { navigator.clipboard.writeText(getSignatureLink(request)); alert("הקישור הועתק!"); }}
                                    >
                                        קישור
                                    </Button>

                                    {request.client_phone && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const link = getSignatureLink(request);
                                                const msg = encodeURIComponent("שלום " + request.client_name + ",\nלחתימה על " + request.document_name + " לחץ:\n" + link);
                                                const phone = request.client_phone.replace(/\D/g,'').replace(/^0/,'972');
                                                window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
                                            }}
                                        >
                                            וואטסאפ
                                        </Button>
                                    )}
                                    
                                    {request.status === 'draft' && (
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSendRequest(request.id)}
                                            disabled={isSending === request.id}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSending === request.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 ml-2" />
                                                    שלח
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {(request.status === 'sent' || request.status === 'viewed') && (
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleSendRequest(request.id)}
                                            disabled={isSending === request.id}
                                        >
                                            {isSending === request.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4 ml-2" />
                                                    שלח שוב
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {request.status === 'signed' && request.signed_file_url && (
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => window.open(request.signed_file_url, '_blank')}
                                        >
                                            <ExternalLink className="w-4 h-4 ml-2" />
                                            צפה
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* New Request Dialog */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSignature className="w-5 h-5 text-indigo-600" />
                            בקשת חתימה חדשה
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label className="text-sm font-medium mb-2 block">שם המסמך</Label>
                            <Input
                                placeholder="לדוגמה: הסכם שכר טרחה"
                                value={newRequest.document_name}
                                onChange={(e) => setNewRequest({ ...newRequest, document_name: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-2 block">קובץ PDF</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setNewRequest({ ...newRequest, file: e.target.files[0] })}
                                    className="hidden"
                                    id="pdf-upload"
                                />
                                <label htmlFor="pdf-upload" className="cursor-pointer">
                                    {newRequest.file ? (
                                        <div className="flex items-center justify-center gap-2 text-indigo-600">
                                            <Check className="w-5 h-5" />
                                            <span className="font-medium">{newRequest.file.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">
                                            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                            <span>לחץ להעלאת קובץ PDF</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-2 block">הודעה ללקוח (אופציונלי)</Label>
                            <Textarea
                                placeholder="הודעה שתצורף לבקשת החתימה..."
                                value={newRequest.message}
                                onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                            <strong>פרטי הלקוח:</strong>
                            <div className="mt-1">
                                {clientName} | {clientPhone || 'אין טלפון'} | {clientEmail || 'אין מייל'}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowNewDialog(false)}>ביטול</Button>
                        <Button 
                            onClick={handleCreateRequest} 
                            disabled={isCreating || !newRequest.document_name || !newRequest.file}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isCreating ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            ) : (
                                <Plus className="w-4 h-4 ml-2" />
                            )}
                            צור בקשה
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}