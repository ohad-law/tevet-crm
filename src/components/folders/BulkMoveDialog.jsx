import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, MoveRight, Check } from "lucide-react";
import FolderSelector from "./FolderSelector";

export default function BulkMoveDialog({ selectedCases, folders, cases, clients, onMove, onCancel }) {
  const [targetFolderId, setTargetFolderId] = useState("");
  const [targetSubfolderId, setTargetSubfolderId] = useState("");

  const handleMove = () => {
    onMove(targetFolderId, targetSubfolderId);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לקוח לא ידוע';
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
        className="max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MoveRight className="w-6 h-6" />
            העברת {selectedCases.length} תיקים
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Selected Cases List */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">תיקים נבחרים:</p>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
              {selectedCases.map((caseItem, index) => (
                <div key={caseItem.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{caseItem.case_name}</p>
                    <p className="text-xs text-gray-500">
                      {caseItem.case_number} • {getClientName(caseItem.client_id)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target Folder Selector */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">העבר אל תיקייה:</p>
            <FolderSelector
              folders={folders}
              cases={cases}
              selectedFolderId={targetFolderId}
              selectedSubfolderId={targetSubfolderId}
              onFolderChange={setTargetFolderId}
              onSubfolderChange={setTargetSubfolderId}
            />
          </div>

          {targetFolderId && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-semibold">
                  {selectedCases.length} תיקים יועברו ל:
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1 mr-7">
                {folders.find(f => f.id === targetFolderId)?.icon}{' '}
                {folders.find(f => f.id === targetFolderId)?.folder_name}
                {targetSubfolderId && (
                  <>
                    {' / '}
                    {folders.find(f => f.id === targetSubfolderId)?.icon}{' '}
                    {folders.find(f => f.id === targetSubfolderId)?.folder_name}
                  </>
                )}
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
            onClick={handleMove} 
            className="bg-blue-900 hover:bg-blue-800"
            disabled={!targetFolderId}
          >
            <MoveRight className="w-4 h-4 ml-2" />
            העבר תיקים
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}