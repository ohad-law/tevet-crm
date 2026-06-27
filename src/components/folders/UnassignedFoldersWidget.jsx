import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, Link as LinkIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function UnassignedFoldersWidget({ folders, cases, onAssignClick }) {
  const unassignedFolders = folders.filter(f => 
    !f.parent_folder_id && 
    f.folder_type === 'client'
  );

  if (unassignedFolders.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            📁 תיקיות לא משויכות
          </span>
          <Badge className="bg-orange-600 text-white">
            {unassignedFolders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          תת-תיקיות שלא שויכו לקטגוריה ראשית:
        </p>
        <div className="space-y-3">
          {unassignedFolders.map((folder, index) => {
            const folderCases = cases.filter(c => c.folder_id === folder.id || c.subfolder_id === folder.id);
            
            return (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border-2 rounded-lg bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${folder.color}20` }}
                    >
                      <Folder className="w-5 h-5" style={{ color: folder.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{folder.icon}</span>
                        <h4 className="font-bold text-gray-900">{folder.folder_name}</h4>
                      </div>
                      <p className="text-xs text-gray-500">
                        {folderCases.length} תיקים • 📍 לא משויכת
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAssignClick(folder)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <LinkIcon className="w-4 h-4 ml-2" />
                    🔗 שייך
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}