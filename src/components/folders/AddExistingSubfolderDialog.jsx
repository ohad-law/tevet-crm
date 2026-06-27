import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { X, Plus, Folder } from "lucide-react";

export default function AddExistingSubfolderDialog({ parentFolder, folders, cases, onAdd, onCancel }) {
  const [selectedFolderIds, setSelectedFolderIds] = useState(new Set());

  // Get folders that are not assigned and are of type 'client'
  const unassignedFolders = folders.filter(f => 
    !f.parent_folder_id && 
    f.folder_type === 'client' &&
    f.id !== parentFolder.id
  );

  const toggleFolder = (folderId) => {
    const newSelection = new Set(selectedFolderIds);
    if (newSelection.has(folderId)) {
      newSelection.delete(folderId);
    } else {
      newSelection.add(folderId);
    }
    setSelectedFolderIds(newSelection);
  };

  const handleAdd = () => {
    onAdd(Array.from(selectedFolderIds));
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
        className="max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-6 h-6" />
            ➕ הוסף תת-תיקייה קיימת
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            תחת: {parentFolder.icon} {parentFolder.folder_name}
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {unassignedFolders.length > 0 ? (
            <>
              <p className="text-sm text-gray-600">
                בחר תת-תיקיות לשיוך ל-"{parentFolder.folder_name}":
              </p>
              <div className="space-y-3">
                {unassignedFolders.map((folder) => {
                  const folderCases = cases.filter(c => c.folder_id === folder.id || c.subfolder_id === folder.id);
                  const isSelected = selectedFolderIds.has(folder.id);
                  
                  return (
                    <div
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFolder(folder.id)}
                        />
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${folder.color}20` }}
                        >
                          <Folder className="w-5 h-5" style={{ color: folder.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{folder.icon}</span>
                            <h4 className="font-bold text-gray-900">{folder.folder_name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {folderCases.length} תיקים • 📍 לא משויכת
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedFolderIds.size > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-900">
                    ✅ {selectedFolderIds.size} תיקיות נבחרו
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    יועברו תחת: {parentFolder.icon} {parentFolder.folder_name}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">אין תת-תיקיות זמינות</p>
              <p className="text-sm">כל התת-תיקיות כבר משויכות</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-3 border-t border-gray-100 p-6 bg-gray-50">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button 
            onClick={handleAdd} 
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedFolderIds.size === 0}
          >
            <Plus className="w-4 h-4 ml-2" />
            שייך {selectedFolderIds.size > 0 ? `(${selectedFolderIds.size})` : ''}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}