import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { UploadFile } from "@/integrations/Core";

export default function DocumentUpload({ onUploadComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("כללי");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        alert("הקובץ גדול מדי. גודל מקסימלי: 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      const document = {
        name: file.name,
        url: file_url,
        upload_date: new Date().toISOString(),
        category: category
      };

      onUploadComplete(document);
      setFile(null);
      setCategory("כללי");
    } catch (error) {
      alert("שגיאה בהעלאת הקובץ");
    } finally {
      setIsUploading(false);
    }
  };

  const acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt";

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">בחר קובץ</Label>
            <Input
              id="file"
              type="file"
              accept={acceptedTypes}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              סוגי קבצים נתמכים: PDF, Word, Excel, תמונות (עד 10MB)
            </p>
          </div>

          <div>
            <Label htmlFor="category">קטגוריה</Label>
            <Select value={category} onValueChange={setCategory} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="כללי">כללי</SelectItem>
                <SelectItem value="כתב תביעה">כתב תביעה</SelectItem>
                <SelectItem value="כתב הגנה">כתב הגנה</SelectItem>
                <SelectItem value="תצהירים">תצהירים</SelectItem>
                <SelectItem value="ראיות">ראיות</SelectItem>
                <SelectItem value="פסקי דין">פסקי דין</SelectItem>
                <SelectItem value="התכתבות">התכתבות</SelectItem>
                <SelectItem value="חוזים">חוזים</SelectItem>
                <SelectItem value="אחר">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {file && (
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  העלה קובץ
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
            >
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}