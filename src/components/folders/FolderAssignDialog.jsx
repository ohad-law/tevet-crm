import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { X, Link as LinkIcon, AlertCircle } from "lucide-react";

export default function FolderAssignDialog({ folder, folders, cases, onAssign, onCancel }) {
  const [selectedParentId, setSelectedParentId] = useState(folder.parent_folder_id || "");

  const rootFolders = folders.filter(f => 
    !f.parent_folder_id && 
    f.id !== folder.id &&
    f.folder_type === 'category'
  );

  const currentParent = folder.parent_folder_id ? folders.find(f => f.id === folder.parent_folder_id) : null;
  const newParent = selectedParentId ? folders.find(f => f.id === selectedParentId) : null;
  
  const folderCases = cases.filter(c => c.folder_id === folder.id || c.subfolder_id === folder.id);

  const handleAssign = () => {
    onAssign(selectedParentId || null);
  };

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
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LinkIcon className="w-6 h-6" />
            🔗 שיוך תיקייה
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Current Folder Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{folder.icon}</span>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{folder.folder_name}</h3>
                <p className="text-sm text-gray-600">{folderCases.length} תיקים</p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          {currentParent && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">📍 שיוך נוכחי:</p>
              <div className="flex items-center gap-2">
                <span>{currentParent.icon}</span>
                <span className="font-semibold">{currentParent.folder_name}</span>
              </div>
            </div>
          )}

          {/* Parent Folder Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              📁 בחר תיקייה ראשית (קטגוריה):
            </label>
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר תיקייה או השאר עצמאית" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>אין (תיקייה עצמאית)</SelectItem>
                {rootFolders.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <span>{f.icon}</span>
                      <span>{f.folder_name}</span>
                      <span className="text-xs text-gray-500">
                        ({cases.filter(c => c.folder_id === f.id || c.subfolder_id === f.id).length} תיקים)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview of change */}
          {(selectedParentId !== (folder.parent_folder_id || "")) && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-2">⚠️ שינוי שיוך תיקייה</p>
                  {currentParent && newParent && (
                    <p className="text-sm text-yellow-800">
                      תעביר את "{folder.folder_name}" מ-"{currentParent.folder_name}" ל-"{newParent.folder_name}"
                    </p>
                  )}
                  {currentParent && !newParent && (
                    <p className="text-sm text-yellow-800">
                      תהפוך את "{folder.folder_name}" לתיקייה עצמאית (תוסר מ-"{currentParent.folder_name}")
                    </p>
                  )}
                  {!currentParent && newParent && (
                    <p className="text-sm text-yellow-800">
                      תשייך את "{folder.folder_name}" ל-"{newParent.folder_name}"
                    </p>
                  )}
                  <p className="text-sm text-yellow-800 mt-2">
                    📄 {folderCases.length} תיקים יועברו איתה.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Preview */}
          {newParent && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-2">✅ לאחר השיוך:</p>
              <div className="flex items-center gap-2 mr-4">
                <span>{newParent.icon}</span>
                <span className="font-semibold">{newParent.folder_name}</span>
                <span className="text-gray-500">›</span>
                <span>{folder.icon}</span>
                <span className="font-semibold">{folder.folder_name}</span>
              </div>
            </div>
          )}

          {!selectedParentId && folder.parent_folder_id && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                ℹ️ התיקייה תהפוך לתיקייה עצמאית (לא תחת אף קטגוריה)
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-3 border-t border-gray-100 p-6 bg-gray-50">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button 
            onClick={handleAssign} 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={selectedParentId === (folder.parent_folder_id || "")}
          >
            <LinkIcon className="w-4 h-4 ml-2" />
            {selectedParentId ? 'שייך' : 'הסר שיוך'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}