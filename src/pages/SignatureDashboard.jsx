import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Plus, Search, FileSignature, Send, Eye, CheckCircle2, AlertCircle, Loader2, RefreshCw, Smartphone, Mail 
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const APP_BASE_URL = window.location.origin;
const getSignatureLink = (req) => APP_BASE_URL + '/SignDocument?token=' + (req.access_token || req.token);

export default function SignatureDashboard() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await base44.entities.SignatureRequest.list("-created_date");
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
        }
        setIsLoading(false);
    };

    const handleSend = async (requestId) => {
        const request = requests.find(r => r.id === requestId);
        
        if (!request?.client_email && !request?.client_phone) {
            alert("חסרים פרטי התקשרות (אימייל או טלפון)");
            return;
        }
        
        const channels = [];
        if (request?.client_email) channels.push("מייל");
        if (request?.client_phone) channels.push("וואטסאפ");
        
        if (!confirm(`האם לשלוח את הבקשה ללקוח ב${channels.join(" וב")}?`)) return;
        
        try {
            const response = await base44.functions.invoke("signatureOperations", { 
                action: "send",
                requestId 
            });
            if (response.data?.error) {
                throw new Error(response.data.error);
            }
            
            const result = response.data;
            let successMsg = "נשלח בהצלחה!";
            if (result.emailSent && result.whatsappSent) {
                successMsg = "נשלח בהצלחה במייל ובוואטסאפ!";
            } else if (result.emailSent) {
                successMsg = "נשלח בהצלחה במייל! (וואטסאפ לא נשלח - בדוק שהטלפון מוזן נכון)";
            } else if (result.whatsappSent) {
                successMsg = "נשלח בהצלחה בוואטסאפ! (מייל לא נשלח)";
            }
            
            alert(successMsg);
            loadData();
        } catch (error) {
            alert("שגיאה בשליחה: " + error.message);
        }
    };

    const filteredRequests = requests.filter(r => 
        r.document_name?.includes(searchTerm) || 
        r.client_name?.includes(searchTerm)
    );

    const statusColors = {
        draft: "bg-slate-100 text-slate-700",
        sent: "bg-blue-100 text-blue-700",
        viewed: "bg-purple-100 text-purple-700",
        signed: "bg-green-100 text-green-700",
        expired: "bg-red-100 text-red-700"
    };

    const statusLabels = {
        draft: "טיוטה",
        sent: "נשלח",
        viewed: "נצפה",
        signed: "נחתם",
        expired: "פג תוקף"
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <FileSignature className="w-8 h-8 text-indigo-600" />
                        חתימה מרחוק
                    </h1>
                    <p className="text-slate-500 mt-1">ניהול מסמכים לחתימה דיגיטלית מול לקוחות</p>
                </div>
                <Button 
                    onClick={() => navigate(createPageUrl("CreateSignatureRequest"))}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    בקשה חדשה
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="חיפוש לפי שם לקוח או מסמך..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                        <Button variant="outline" onClick={loadData} title="רענן">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="rounded-lg border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-right">מסמך</TableHead>
                                    <TableHead className="text-right">לקוח</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-right">נוצר ב</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                טוען נתונים...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            לא נמצאו בקשות חתימה
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <TableRow key={req.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileSignature className="w-4 h-4 text-slate-400" />
                                                    {req.document_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>{req.client_name}</div>
                                                <div className="text-xs text-slate-500">{req.client_email || "אין מייל"}</div>
                                                <div className="text-xs text-slate-500">{req.client_phone || "אין טלפון"}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusColors[req.status]} border-0 font-normal`}>
                                                    {statusLabels[req.status] || req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">
                                                {format(new Date(req.created_at), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {req.status === 'draft' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            onClick={() => handleSend(req.id)}
                                                        >
                                                            <Send className="w-3 h-3 ml-1" />
                                                            שלח
                                                        </Button>
                                                    )}
                                                    {(req.status === 'sent' || req.status === 'viewed') && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleSend(req.id)}
                                                        >
                                                            <Smartphone className="w-3 h-3 ml-1" />
                                                            שלח שוב
                                                        </Button>
                                                    )}
                                                    {req.status === 'signed' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => window.open(req.signed_file_url, '_blank')}
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 ml-1" />
                                                            הורד חתום
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => { navigator.clipboard.writeText(getSignatureLink(req)); alert("הקישור הועתק!"); }}
                                                    >
                                                        קישור
                                                    </Button>

                                                    {req.client_phone && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const link = getSignatureLink(req);
                                                                const msg = encodeURIComponent("שלום " + req.client_name + ",\nלחתימה על " + req.document_name + " לחץ:\n" + link);
                                                                const phone = req.client_phone.replace(/\D/g,'').replace(/^0/,'972');
                                                                window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
                                                            }}
                                                        >
                                                            וואטסאפ
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}