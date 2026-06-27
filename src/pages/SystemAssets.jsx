import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, Trash2, Copy, Check, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SystemAssets() {
  const [assets, setAssets] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await base44.entities.SystemSettings.filter({ setting_key: "system_asset" });
      setAssets(data);
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.SystemSettings.create({
        setting_key: "system_asset",
        setting_value: file_url,
        description: file.name
      });

      loadAssets();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("שגיאה בהעלאת הקובץ");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (assetId) => {
    if (!confirm("האם למחוק את הקובץ?")) return;
    
    try {
      await base44.entities.SystemSettings.delete(assetId);
      loadAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">עזרים למערכת</h1>
          <p className="text-slate-500 text-lg">העלאה וניהול קבצי PDF ועזרים אחרים</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            העלאת קובץ חדש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label 
              htmlFor="file-upload" 
              className={`
                flex items-center justify-center gap-2 px-6 py-3 
                bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer
                transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "מעלה..." : "בחר קובץ"}
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.ttf,.otf,.woff,.woff2"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <span className="text-sm text-slate-500">
              PDF, TTF, OTF, WOFF, WOFF2
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            קבצים שהועלו ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <File className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>אין קבצים עדיין</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {assets.map((asset) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{asset.description}</p>
                        <p className="text-xs text-slate-500 truncate">{asset.setting_value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(asset.setting_value, asset.id)}
                        className="gap-1"
                      >
                        {copiedId === asset.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            הועתק
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            העתק URL
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(asset.setting_value, '_blank')}
                      >
                        צפה
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}