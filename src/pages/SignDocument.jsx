import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useSearchParams } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { FileText, Loader2, CheckCircle2, Send, ExternalLink, PenLine } from "lucide-react";

export default function SignDocument() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [requestData, setRequestData] = useState(null);
    const [status, setStatus] = useState('loading'); 
    const [error, setError] = useState(null);
    const sigCanvas = useRef({});

    useEffect(() => {
        if (!token) { setError("שגיאה: חסר מזהה בקישור"); setStatus('error'); return; }
        base44.functions.invoke("signatureOperations", { action: "get-public", token })
            .then(res => {
                if (res.data?.error) throw new Error(res.data.error);
                setRequestData(res.data.request);
                setStatus('ready');
            })
            .catch(e => { setError(e.message || "שגיאה בטעינה"); setStatus('error'); });
    }, [token]);

    const handleSubmit = async () => {
        if (sigCanvas.current.isEmpty()) return alert("חובה לחתום");
        setStatus('submitting');
        try {
            // יצירת canvas עם רקע לבן כדי לשמר את הצבע הכחול
            const trimmedCanvas = sigCanvas.current.getTrimmedCanvas();
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = trimmedCanvas.width;
            finalCanvas.height = trimmedCanvas.height;
            const ctx = finalCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            ctx.drawImage(trimmedCanvas, 0, 0);
            const signature = finalCanvas.toDataURL('image/png');
            const res = await base44.functions.invoke("signatureOperations", {
                action: "finalize", token, fieldValues: { signature }
            });
            if (res.data?.error) throw new Error(res.data.error);
            setStatus('success');
        } catch (e) { alert("שגיאה: " + e.message); setStatus('ready'); }
    };

    if (status === 'loading') return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-4 shadow-lg">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                        <span className="font-extrabold text-slate-800 text-sm">טב״ת</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">משרד עורכי דין טבת</h2>
                    </div>
                </div>
            </div>
            <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                <Loader2 className="animate-spin w-12 h-12 text-slate-600"/>
            </div>
        </div>
    );
    if (status === 'error') return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-4 shadow-lg">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                        <span className="font-extrabold text-slate-800 text-sm">טב״ת</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">משרד עורכי דין טבת</h2>
                    </div>
                </div>
            </div>
            <div className="p-10 text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
                    <p className="text-red-700 font-bold text-lg mb-2">שגיאה בטעינת המסמך</p>
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            </div>
        </div>
    );
    if (status === 'success') return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-4 shadow-lg">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                        <span className="font-extrabold text-slate-800 text-sm">טב״ת</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">משרד עורכי דין טבת</h2>
                    </div>
                </div>
            </div>
            <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-800 mb-2">המסמך נחתם בהצלחה!</h1>
                <p className="text-gray-500">תודה, החתימה התקבלה. ניתן לסגור את הדף.</p>
            </div>
        </div>
    );

    // קביעת הלינק למסמך
    const fileUrl = requestData?.pdf_url || requestData?.file_url || requestData?.original_file_url;
    // שימוש בגוגל ויוור כדי למנוע מסך לבן
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-32" dir="rtl">
            {/* Header with firm branding */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-4 shadow-lg sticky top-0 z-30">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                            <span className="font-extrabold text-slate-800 text-sm">טב״ת</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base leading-tight">משרד עורכי דין טבת</h2>
                            <p className="text-blue-200 text-xs">מומחיות משפטית בכל פרט</p>
                        </div>
                    </div>
                    <span className="text-white/60 text-xs">tevet-law.co.il</span>
                </div>
            </div>

            {/* Document info bar */}
            <div className="bg-white p-4 shadow border-b">
                <div className="max-w-3xl mx-auto">
                    <h1 className="font-bold text-lg text-gray-900">{requestData?.document_name}</h1>
                    <p className="text-xs text-gray-500">שלום {requestData?.client_name}, אנא חתום/י על המסמך</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                
                {/* תצוגת מסמך */}
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="bg-gray-100 p-2 text-center text-xs text-gray-500 border-b">
                        צפייה במסמך
                    </div>
                    {/* גוגל ויוור מונע את המסך הלבן */}
                    <div className="h-[400px] w-full bg-gray-200 relative">
                        <iframe src={viewerUrl} className="w-full h-full border-0" title="PDF" />
                    </div>
                </div>

                {/* כפתור גיבוי - תמיד טוב שיש */}
                <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-50">
                    <ExternalLink className="w-4 h-4" /> פתח מסמך בחלון חדש
                </a>

                {/* אזור חתימה */}
                <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <PenLine className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-lg">חתימה:</h3>
                    </div>
                    <div className="border-2 border-dashed border-gray-400 rounded-lg bg-white h-48 relative touch-none">
                        <SignatureCanvas ref={sigCanvas} penColor="#1e40af" canvasProps={{ className: "w-full h-full cursor-crosshair" }} />
                        <button onClick={() => sigCanvas.current.clear()} className="absolute top-2 left-2 text-xs text-red-600 border border-red-200 bg-white px-2 py-1 rounded">נקה</button>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
                <button onClick={handleSubmit} disabled={status === 'submitting'} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                    {status === 'submitting' ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />} אשר/י וחתום/י
                </button>
            </div>
        </div>
    );
}