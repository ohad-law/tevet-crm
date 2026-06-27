import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientDocumentUpload() {
  const [caseData, setCaseData] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCase();
  }, []);

  const loadCase = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const caseId = params.get('case_id');
      
      if (!caseId) {
        setError("קישור לא תקין - חסר מזהה תיק");
        setIsLoading(false);
        return;
      }

      // Just store the case ID, we'll send it with the upload
      setCaseData({ id: caseId, case_name: "התיק שלך" });
      setIsLoading(false);
    } catch (err) {
      setError("שגיאה בטעינת הדף");
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("אנא בחר קבצים להעלאה");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedDocs = [];

      // Upload each file
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        uploadedDocs.push({
          name: file.name,
          url: file_url,
          upload_date: new Date().toISOString(),
          uploaded_by: "לקוח",
          category: "מסמכים מהלקוח"
        });
      }

      // Use backend function to update case (works without authentication)
      const { data } = await base44.functions.invoke('clientUpload', {
        caseId: caseData.id,
        documents: uploadedDocs
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Update case name if we got it from the response
      if (data.case_name && caseData.case_name === "התיק שלך") {
        setCaseData({ ...caseData, case_name: data.case_name });
      }

      setUploadComplete(true);
      setFiles([]);
      setTimeout(() => setUploadComplete(false), 5000);
    } catch (err) {
      setError("שגיאה בהעלאת הקבצים. אנא נסה שנית: " + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">טוען...</p>
        </div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-md w-full shadow-xl border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">שגיאה</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-blue-600 to-indigo-600 text-white p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold">העלאת מסמכים</CardTitle>
                  <p className="text-blue-100 text-sm mt-1">תיק: {caseData?.case_name}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">שלום,</h3>
                <p className="text-slate-600 leading-relaxed">
                  בבקשה העלה את המסמכים הרלוונטיים לתיק שלך. 
                  המסמכים יתווספו אוטומטית לתיק ויהיו זמינים לעורך הדין שלך.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">סוגי קבצים מומלצים:</p>
                    <p className="text-blue-700">PDF, Word, Excel, תמונות (JPG, PNG)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="files" className="text-slate-700 font-semibold">
                  בחר קבצים להעלאה
                </Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="border-slate-300 file:bg-blue-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg file:font-medium file:ml-3 hover:file:bg-blue-700 cursor-pointer"
                  disabled={uploading}
                />
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-slate-600 font-medium">קבצים שנבחרו ({files.length}):</p>
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-slate-400 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="w-full h-12 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מעלה קבצים...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 ml-2" />
                    העלה מסמכים
                  </>
                )}
              </Button>

              <AnimatePresence>
                {uploadComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-900 font-bold">הקבצים הועלו בהצלחה!</p>
                      <p className="text-green-700 text-sm">המסמכים שלך נוספו לתיק</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <p className="text-center text-slate-500 text-sm mt-6">
            יש בעיה? צור קשר עם משרדנו
          </p>
        </motion.div>
      </div>
    </div>
  );
}