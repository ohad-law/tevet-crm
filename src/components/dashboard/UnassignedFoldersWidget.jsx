import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FolderPlus } from "lucide-react";
import { motion } from "framer-motion";

export default function UnassignedFoldersWidget({ folders, cases, onAssignClick }) {
  // Find client-type folders without parent assignment
  const unassignedFolders = folders.filter(f => 
    f.folder_type === 'client' && !f.parent_folder_id
  );

  if (unassignedFolders.length === 0) {
    return null; // Don't show widget if no unassigned folders
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-lg border-2 border-orange-300 bg-orange-50">
        <CardHeader className="border-b border-orange-200">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            ⚠️ תיקיות לקוח ללא שיוך לקטגוריה
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700 mb-4">
            יש {unassignedFolders.length} תיקיות לקוח שטרם שויכו לקטגוריה ראשית. מומלץ לשייך אותן לארגון טוב יותר.
          </p>

          <div className="space-y-2 mb-4">
            {unassignedFolders.slice(0, 5).map((folder) => {
              const folderCases = cases.filter(c => c.subfolder_id === folder.id);
              return (
                <div key={folder.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{folder.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{folder.folder_name}</p>
                      <p className="text-xs text-gray-500">{folderCases.length} תיקים</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    לא משויך
                  </Badge>
                </div>
              );
            })}
            
            {unassignedFolders.length > 5 && (
              <p className="text-sm text-gray-600 text-center mt-2">
                ועוד {unassignedFolders.length - 5} תיקיות...
              </p>
            )}
          </div>

          <Button
            onClick={() => onAssignClick()}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <FolderPlus className="w-4 h-4 ml-2" />
            עבור לדף תיקים לשיוך
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}