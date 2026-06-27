import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
    Upload, Scan, Sparkles, Check, AlertCircle, Loader2, FileText, Receipt 
} from "lucide-react";

const CATEGORIES = [
    "עבודות חוץ וקבלני משנה",
    "משרדיות וחומרי עבודה",
    "טלפון סלולרי",
    "שליחות והובלות",
    "דואר",
    "אגרות",
    "שירותים מקצועיים",
    "נסיעות ציבוריות",
    "פרסום שיווק וקידום מכירות",
    "שכירות",
    "הוצאות רכב",
    "חשמל בית 25%",
    "השתלמות מקצועית",
    "השכרת רכב",
    "מחשוב ותוכנות",
    "חניות",
    "שכר",
    "תרומות",
    "אחר"
];

const VAT_RATE = 0.17;

export default function ExpenseScanner({ onExpenseAdded }) {
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: "",
        amount: 0,
        amount_before_vat: 0,
        vat_amount: 0,
        has_invoice: true,
        description: "",
        vendor_name: "",
        invoice_number: ""
    });

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        setIsUploading(true);
        
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({
                file: selectedFile
            });
            setFileUrl(file_url);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("שגיאה בהעלאת הקובץ");
        }
        setIsUploading(false);
    };

    const handleScan = async () => {
        if (!fileUrl) {
            alert("נא להעלות קובץ קודם");
            return;
        }
        
        setIsScanning(true);
        setScanResult(null);
        
        try {
            const res = await base44.functions.invoke("scanExpense", {
                action: "scan",
                file_url: fileUrl
            });
            
            if (res.data?.extracted) {
                const extracted = res.data.extracted;
                setScanResult(extracted);
                
                // Calculate VAT if not provided
                let amount = extracted.amount || 0;
                let beforeVat = extracted.amount_before_vat || 0;
                let vatAmount = extracted.vat_amount || 0;
                
                if (amount && !beforeVat) {
                    beforeVat = Math.round(amount / (1 + VAT_RATE));
                    vatAmount = amount - beforeVat;
                }
                
                setFormData({
                    date: extracted.date || new Date().toISOString().split('T')[0],
                    category: extracted.category || "",
                    amount: amount,
                    amount_before_vat: beforeVat,
                    vat_amount: vatAmount,
                    has_invoice: extracted.has_invoice !== false,
                    description: extracted.description || "",
                    vendor_name: extracted.vendor_name || "",
                    invoice_number: extracted.invoice_number || ""
                });
            }
        } catch (error) {
            console.error("Scan failed:", error);
            alert("שגיאה בסריקה: " + error.message);
        }
        setIsScanning(false);
    };

    const handleAmountChange = (value, isWithVat = true) => {
        const numValue = parseFloat(value) || 0;
        if (isWithVat) {
            const beforeVat = Math.round(numValue / (1 + VAT_RATE));
            setFormData({
                ...formData,
                amount: numValue,
                amount_before_vat: beforeVat,
                vat_amount: numValue - beforeVat
            });
        } else {
            const withVat = Math.round(numValue * (1 + VAT_RATE));
            setFormData({
                ...formData,
                amount: withVat,
                amount_before_vat: numValue,
                vat_amount: withVat - numValue
            });
        }
    };

    const handleSave = async () => {
        if (!formData.category || !formData.amount) {
            alert("נא למלא קטגוריה וסכום");
            return;
        }
        
        setIsSaving(true);
        try {
            await base44.entities.Expense.create({
                ...formData,
                receipt_url: fileUrl,
                ai_extracted: !!scanResult,
                ai_confidence: scanResult?.confidence || null
            });
            
            alert("ההוצאה נשמרה בהצלחה!");
            
            // Reset form
            setFile(null);
            setFileUrl(null);
            setScanResult(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                category: "",
                amount: 0,
                amount_before_vat: 0,
                vat_amount: 0,
                has_invoice: true,
                description: "",
                vendor_name: "",
                invoice_number: ""
            });
            
            if (onExpenseAdded) onExpenseAdded();
        } catch (error) {
            alert("שגיאה בשמירה: " + error.message);
        }
        setIsSaving(false);
    };

    return (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800">
                    <Receipt className="w-5 h-5" />
                    הוספת הוצאה חדשה
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:bg-green-50/50 transition-colors">
                    <input 
                        type="file" 
                        id="expense-file" 
                        className="hidden" 
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="expense-file" className="cursor-pointer block">
                        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            {isUploading ? (
                                <Loader2 className="w-7 h-7 animate-spin" />
                            ) : (
                                <Upload className="w-7 h-7" />
                            )}
                        </div>
                        <h3 className="font-medium text-slate-900">
                            {file ? file.name : "לחץ להעלאת קבלה/חשבונית"}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">PDF או תמונה</p>
                    </label>
                </div>

                {/* AI Scan Button */}
                {fileUrl && (
                    <Button 
                        onClick={handleScan} 
                        disabled={isScanning}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                סורק עם AI...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 ml-2" />
                                סרוק אוטומטית עם AI
                            </>
                        )}
                    </Button>
                )}

                {/* Scan Result Badge */}
                {scanResult && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Check className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-800">נסרק בהצלחה!</span>
                        {scanResult.confidence && (
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                                {scanResult.confidence}% ביטחון
                            </Badge>
                        )}
                    </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>סכום כולל מע"מ (₪)</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => handleAmountChange(e.target.value, true)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>סכום לפני מע"מ (₪)</Label>
                        <Input
                            type="number"
                            value={formData.amount_before_vat}
                            onChange={(e) => handleAmountChange(e.target.value, false)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    מע"מ: {formData.vat_amount.toLocaleString()} ₪
                </div>

                <div className="space-y-2">
                    <Label>קטגוריה</Label>
                    <Select 
                        value={formData.category} 
                        onValueChange={(v) => setFormData({...formData, category: v})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>תאריך</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>שם הספק</Label>
                        <Input
                            value={formData.vendor_name}
                            onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                            placeholder="שם העסק"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>תיאור ההוצאה (אופציונלי)</Label>
                    <Input
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="תיאור קצר"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="has_invoice"
                        checked={formData.has_invoice}
                        onCheckedChange={(checked) => setFormData({...formData, has_invoice: checked})}
                    />
                    <Label htmlFor="has_invoice" className="text-sm cursor-pointer">
                        יש חשבונית מס (ניכוי מע"מ)
                    </Label>
                </div>

                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                        <Check className="w-4 h-4 ml-2" />
                    )}
                    הוסף הוצאה
                </Button>
            </CardContent>
        </Card>
    );
}