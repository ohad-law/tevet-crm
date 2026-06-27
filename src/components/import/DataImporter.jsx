import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";

export default function DataImporter({ entityName, schema, onImportComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (fileExt !== '.csv') {
        setError('אנא העלה קובץ CSV בלבד');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
      setImportStatus(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { file_url } = await UploadFile({ file });
      const result = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === 'error') {
        setError(result.details || 'שגיאה בעיבוד הקובץ');
        setIsProcessing(false);
        return;
      }

      const dataArray = Array.isArray(result.output) ? result.output : [result.output];
      setExtractedData(dataArray);
      
    } catch (err) {
      setError('שגיאה בעיבוד הקובץ: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!extractedData || extractedData.length === 0) return;

    setIsProcessing(true);
    setImportStatus({ total: extractedData.length, current: 0, errors: [] });

    try {
      await onImportComplete(extractedData);
      setImportStatus({ 
        total: extractedData.length, 
        current: extractedData.length, 
        errors: [],
        success: true 
      });
    } catch (err) {
      setError('שגיאה בייבוא הנתונים: ' + err.message);
      setImportStatus(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const getEntityDisplayName = () => {
    if (entityName === 'Client') return 'לקוחות';
    if (entityName === 'Case') return 'תיקים';
    return entityName;
  };

  const getSchemaFields = () => {
    return Object.keys(schema.properties).map(key => ({
      key,
      ...schema.properties[key]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-2xl border-none">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              ייבוא {getEntityDisplayName()} מקובץ CSV
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Critical Instructions */}
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-3 text-lg">⚠️ חשוב מאוד!</h3>
                <p className="text-sm text-red-800 font-medium mb-3">
                  Excel לא שומר CSV בקידוד נכון לעברית. יש 2 אפשרויות:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="font-bold text-red-900 mb-2">✅ אופציה 1: Google Sheets (מומלץ!)</p>
                    <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                      <li>העלה את הקובץ ל-Google Sheets</li>
                      <li>File → Download → CSV (.csv)</li>
                      <li>העלה את הקובץ כאן</li>
                    </ol>
                  </div>

                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="font-bold text-red-900 mb-2">✅ אופציה 2: Notepad (Windows)</p>
                    <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                      <li>שמור מ-Excel כ-CSV רגיל</li>
                      <li>פתח את הקובץ ב-Notepad</li>
                      <li>File → Save As</li>
                      <li>בחר Encoding: <strong>UTF-8</strong></li>
                      <li>שמור והעלה כאן</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Upload File */}
          {!extractedData && !importStatus?.success && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  שלב 1: העלה קובץ CSV (UTF-8)
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  העלה קובץ CSV שנשמר בקידוד UTF-8 (ראה הוראות למעלה)
                </p>
                
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="mb-3"
                />

                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                    <CheckCircle className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">📋 שדות נדרשים:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {getSchemaFields().map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <Badge variant={schema.required?.includes(field.key) ? 'default' : 'outline'}>
                        {field.key}
                      </Badge>
                      {schema.required?.includes(field.key) && (
                        <span className="text-red-500">*</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* שדות חובה</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-900">שגיאה</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                  
                  {error.includes('unicode') || error.includes('utf-8') || error.includes('encoding') && (
                    <div className="bg-white p-3 rounded border border-red-300">
                      <p className="font-bold text-red-900 mb-2">💡 פתרון:</p>
                      <p className="text-sm text-red-800">
                        הקובץ לא מקודד ב-UTF-8. אנא השתמש ב-Google Sheets או שמור ב-Notepad עם UTF-8 (ראה הוראות למעלה).
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleExtract}
                disabled={!file || isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מעבד קובץ...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5 ml-2" />
                    עבד ותצוגה מקדימה
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Preview & Confirm */}
          {extractedData && !importStatus?.success && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  תצוגה מקדימה
                </h3>
                <p className="text-sm text-green-800">
                  נמצאו {extractedData.length} רשומות. אנא בדוק את הנתונים לפני הייבוא.
                </p>
              </div>

              <div className="max-h-96 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {Object.keys(extractedData[0] || {}).map((key) => (
                        <th key={key} className="p-3 text-right font-semibold border-b">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="p-3">
                            {value?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {extractedData.length > 10 && (
                  <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                    מוצגות 10 רשומות ראשונות מתוך {extractedData.length}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setExtractedData(null);
                    setFile(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      מייבא...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 ml-2" />
                      אישור וייבוא
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {importStatus?.success && (
            <div className="space-y-4">
              <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-900 mb-2">הייבוא הושלם בהצלחה!</h3>
                <p className="text-green-700">
                  {importStatus.total} רשומות יובאו בהצלחה
                </p>
              </div>
              
              <Button
                onClick={onCancel}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                סיום
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}