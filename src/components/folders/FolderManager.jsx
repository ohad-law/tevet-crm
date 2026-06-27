import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

const EMOJI_OPTIONS = ["📁", "👷", "📋", "⚖️", "💼", "📊", "🏢", "👥", "📝", "🔨", "⚡", "🎯", "💰", "🏗️", "📑"];
const COLOR_OPTIONS = [
  { name: "כחול", value: "#4285F4" },
  { name: "אדום", value: "#EA4335" },
  { name: "צהוב", value: "#FBBC04" },
  { name: "ירוק", value: "#34A853" },
  { name: "סגול", value: "#9C27B0" },
  { name: "כתום", value: "#FF9800" },
  { name: "ורוד", value: "#E91E63" },
  { name: "תכלת", value: "#00BCD4" }
];

export default function FolderManager({ folder, parentFolderId, folders, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(folder || {
    folder_name: "",
    parent_folder_id: parentFolderId || null,
    folder_type: parentFolderId ? "client" : "category",
    color: "#4285F4",
    icon: "📁",
    order: 0,
    description: "",
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const parentFolder = folders.find(f => f.id === parentFolderId);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card 
        className="max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {folder ? 'עריכת תיקייה' : parentFolderId ? 'תת-תיקייה חדשה' : 'תיקייה ראשית חדשה'}
          </CardTitle>
          {parentFolder && (
            <p className="text-sm text-gray-600">תחת: {parentFolder.icon} {parentFolder.folder_name}</p>
          )}
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="folder_name">שם התיקייה *</Label>
                <Input
                  id="folder_name"
                  value={formData.folder_name}
                  onChange={(e) => setFormData({...formData, folder_name: e.target.value})}
                  placeholder="למשל: עובדים פלסטינאים, אולג נמצא"
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder_type">סוג תיקייה</Label>
                <Select 
                  value={formData.folder_type} 
                  onValueChange={(value) => setFormData({...formData, folder_type: value})}
                  disabled={!!parentFolderId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">📁 קטגוריה ראשית</SelectItem>
                    <SelectItem value="client">👤 לקוח/פרויקט</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">סדר הצגה</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>אייקון</Label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({...formData, icon: emoji})}
                      className={`w-10 h-10 text-xl rounded-lg border-2 hover:scale-110 transition-transform ${
                        formData.icon === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>צבע</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({...formData, color: color.value})}
                      className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform ${
                        formData.color === color.value ? 'border-gray-800 ring-2 ring-offset-2' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="תיאור התיקייה..."
                />
              </div>

              {/* Preview */}
              <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-xs text-gray-500 mb-2">תצוגה מקדימה:</p>
                <div className="flex items-center gap-2">
                  <span style={{ color: formData.color }}>{formData.icon}</span>
                  <span className="font-semibold">{formData.folder_name || 'שם התיקייה'}</span>
                  {formData.folder_type === 'category' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">קטגוריה</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-3 border-t border-gray-100 p-6 bg-gray-50">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
              <Save className="w-4 h-4 ml-2" />
              {folder ? 'עדכון' : 'יצירה'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}