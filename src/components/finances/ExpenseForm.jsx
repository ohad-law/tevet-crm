import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Save, Upload, FileText, Image, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DOCUMENT_TYPES = [
  { id: "invoice", name: "חשבונית מס", icon: Receipt, required: true },
  { id: "receipt", name: "קבלה", icon: FileText, required: false },
  { id: "contract", name: "חוזה/הסכם", icon: FileText, required: false },
  { id: "photo", name: "תמונה/צילום", icon: Image, required: false },
];

export default function ExpenseForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "אחר",
    amount: 0,
    amount_before_vat: 0,
    description: "",
    has_vat_receipt: true,
    documents: []
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const VAT_RATE = 0.18;
  
  const handleAmountChange = (value, isWithVat) => {
    const numValue = parseFloat(value) || 0;
    if (isWithVat) {
      setFormData({
        ...formData,
        amount: numValue,
        amount_before_vat: Math.round(numValue / (1 + VAT_RATE))
      });
    } else {
      setFormData({
        ...formData,
        amount_before_vat: numValue,
        amount: Math.round(numValue * (1 + VAT_RATE))
      });
    }
  };
  
  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newFile = {
        name: file.name,
        url: file_url,
        type: docType,
        size: file.size,
        uploadDate: new Date().toISOString()
      };
      setUploadedFiles([...uploadedFiles, newFile]);
      setFormData({
        ...formData,
        documents: [...formData.documents, newFile]
      });
    } catch (error) {
      alert("שגיאה בהעלאת הקובץ: " + error.message);
    }
    setIsUploading(false);
  };
  
  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setFormData({ ...formData, documents: newFiles });
  };
  
  const getMissingDocuments = () => {
    const uploadedTypes = uploadedFiles.map(f => f.type);
    return DOCUMENT_TYPES.filter(dt => dt.required && !uploadedTypes.includes(dt.id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">תאריך</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">סכום</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-slate-500">כולל מע"מ (₪)</span>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value, true)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-slate-500">לפני מע"מ (₪)</span>
                    </div>
                    <Input
                      type="number"
                      value={formData.amount_before_vat}
                      onChange={(e) => handleAmountChange(e.target.value, false)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-red-600">מע"מ: {(formData.amount - formData.amount_before_vat).toLocaleString()} ₪</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_vat_receipt}
                      onChange={(e) => setFormData({...formData, has_vat_receipt: e.target.checked})}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-slate-600">יש חשבונית מס</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="שכר">שכר</SelectItem>
                  <SelectItem value="משרד">משרד</SelectItem>
                  <SelectItem value="שיווק">שיווק</SelectItem>
                  <SelectItem value="אגרות">אגרות</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="תיאור ההוצאה"
                required
              />
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-3 border-t border-red-200 pt-4">
            <Label className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              העלאת מסמכים
            </Label>
            
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map((docType) => {
                const isUploaded = uploadedFiles.some(f => f.type === docType.id);
                const IconComponent = docType.icon;
                return (
                  <label
                    key={docType.id}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-all
                      ${isUploaded 
                        ? 'border-green-400 bg-green-50 text-green-700' 
                        : docType.required 
                          ? 'border-amber-300 bg-amber-50 hover:border-amber-400' 
                          : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    {isUploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <IconComponent className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">{docType.name}</span>
                    {docType.required && !isUploaded && (
                      <span className="text-xs text-amber-600">*</span>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, docType.id)}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                );
              })}
            </div>
            
            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded px-2 py-1 text-xs">
                    <span className="truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Missing Documents Alert */}
            {getMissingDocuments().length > 0 && formData.amount > 0 && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p className="font-medium">מסמכים חסרים לחיסכון מקסימלי במס:</p>
                  <ul className="mt-1 space-y-0.5">
                    {getMissingDocuments().map(doc => (
                      <li key={doc.id}>• {doc.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button type="submit" size="sm" variant="destructive" disabled={isUploading}>
              <Save className="w-4 h-4 ml-2" />
              {isUploading ? "מעלה..." : "שמור"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}