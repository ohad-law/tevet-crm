import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Save, Upload, FileText, Move } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming this exists or I'll use simple alert
import { createPageUrl } from "@/utils";
import DocumentBuilder from "../components/signature/DocumentBuilder";

export default function CreateSignatureRequest() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Step 1 Data
    const [basicInfo, setBasicInfo] = useState({
        document_name: "",
        client_name: "",
        client_email: "",
        client_phone: "",
        message: ""
    });
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);

    // Step 2 Data (Fields)
    const [fields, setFields] = useState([]);

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        
        // Upload immediately to get URL for the builder
        setIsLoading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({
                file: selectedFile
            });
            setFileUrl(file_url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("שגיאה בהעלאת הקובץ");
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (fields.length === 0) {
            alert("אנא הוסף לפחות שדה חתימה אחד");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Request
            const request = await base44.entities.SignatureRequest.create({
                ...basicInfo,
                client_id: "temp-id", // In a real flow we'd select a client
                status: "draft",
                original_file_url: fileUrl,
                access_token: crypto.randomUUID(), // Simple token generation
                created_date: new Date().toISOString()
            });

            // 2. Create Fields
            await Promise.all(fields.map(field => 
                base44.entities.SignatureField.create({
                    request_id: request.id,
                    type: field.type,
                    page: field.page,
                    x: field.x,
                    y: field.y,
                    width: field.width,
                    height: field.height,
                    label: field.label,
                    required: true
                })
            ));

            alert("בקשת החתימה נוצרה בהצלחה!");
            navigate(createPageUrl("SignatureDashboard"));
        } catch (error) {
            console.error(error);
            alert("שגיאה בשמירה: " + error.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowRight className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">יצירת בקשת חתימה חדשה</h1>
                    <p className="text-slate-500">
                        {step === 1 ? "פרטי הבקשה והעלאת מסמך" : "עריכת שדות החתימה"}
                    </p>
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h2 className="font-semibold text-lg mb-4">פרטי הלקוח והמסמך</h2>
                            
                            <div className="space-y-2">
                                <Label>שם המסמך</Label>
                                <Input 
                                    value={basicInfo.document_name}
                                    onChange={e => setBasicInfo({...basicInfo, document_name: e.target.value})}
                                    placeholder="לדוגמה: הסכם שכר טרחה - ישראל ישראלי"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>שם הלקוח</Label>
                                <Input 
                                    value={basicInfo.client_name}
                                    onChange={e => setBasicInfo({...basicInfo, client_name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>אימייל</Label>
                                    <Input 
                                        value={basicInfo.client_email}
                                        onChange={e => setBasicInfo({...basicInfo, client_email: e.target.value})}
                                        type="email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>טלפון (לווטסאפ)</Label>
                                    <Input 
                                        value={basicInfo.client_phone}
                                        onChange={e => setBasicInfo({...basicInfo, client_phone: e.target.value})}
                                        placeholder="0500000000"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h2 className="font-semibold text-lg mb-4">קובץ לחתימה</h2>
                            
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                                <input 
                                    type="file" 
                                    id="file-upload" 
                                    className="hidden" 
                                    accept="application/pdf,image/*"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-medium text-slate-900">
                                        {file ? file.name : "לחץ להעלאת קובץ"}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">PDF או תמונה (עד 10MB)</p>
                                </label>
                            </div>

                            {fileUrl && (
                                <div className="mt-6 flex justify-end">
                                    <Button 
                                        onClick={() => {
                                            if (!basicInfo.document_name || !basicInfo.client_name) {
                                                alert("אנא מלא את שם המסמך ושם הלקוח כדי להמשיך");
                                                return;
                                            }
                                            setStep(2);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        המשך לעריכה
                                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <DocumentBuilder 
                        fileUrl={fileUrl} 
                        fields={fields} 
                        setFields={setFields} 
                    />
                    
                    <div className="flex justify-end gap-4 border-t pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            חזרה
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
                        >
                            {isLoading ? "שומר..." : "שמור וצור בקשה"}
                            <Save className="w-4 h-4 mr-2" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}