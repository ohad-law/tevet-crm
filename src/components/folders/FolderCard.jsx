import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderOpen, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function FolderCard({ folder, cases, subfolders, onClick, isSelected }) {
  const folderCases = cases.filter(c => c.folder_id === folder.id || c.subfolder_id === folder.id);
  const activeCases = folderCases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין');
  const closedCases = folderCases.filter(c => c.status === 'פסק דין');
  const urgentCases = folderCases.filter(c => {
    if (!c.target_close_date) return false;
    const daysUntilClose = Math.floor((new Date(c.target_close_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilClose <= 7 && daysUntilClose >= 0 && c.status !== 'ארכיון' && c.status !== 'פסק דין';
  });

  const statusColor = urgentCases.length > 0 ? 'text-red-600' :
                      activeCases.length > 0 ? 'text-blue-600' :
                      'text-green-600';

  const statusIcon = urgentCases.length > 0 ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                     activeCases.length > 0 ? <Clock className="w-5 h-5 text-blue-500" /> :
                     <CheckCircle className="w-5 h-5 text-green-500" />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        onClick={() => onClick(folder)}
        className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{ borderTop: `4px solid ${folder.color || '#4285F4'}` }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${folder.color}20` }}
              >
                {isSelected ? (
                  <FolderOpen className="w-6 h-6" style={{ color: folder.color }} />
                ) : (
                  <Folder className="w-6 h-6" style={{ color: folder.color }} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{folder.icon}</span>
                  <h3 className="font-bold text-lg text-gray-900">{folder.folder_name}</h3>
                </div>
                {folder.folder_type === 'category' && subfolders.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{subfolders.length} תתי-תיקיות</p>
                )}
              </div>
            </div>
            {statusIcon}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{folderCases.length}</p>
              <p className="text-xs text-gray-500">סה"כ</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{activeCases.length}</p>
              <p className="text-xs text-gray-500">פעילים</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{closedCases.length}</p>
              <p className="text-xs text-gray-500">נסגרו</p>
            </div>
          </div>

          {urgentCases.length > 0 && (
            <div className="p-2 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-600">
                {urgentCases.length} דחופים
              </span>
            </div>
          )}

          {folder.description && (
            <p className="text-xs text-gray-500 mt-3 line-clamp-2">{folder.description}</p>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {folder.folder_type === 'category' && (
              <Badge variant="outline" className="text-xs">
                📁 קטגוריה
              </Badge>
            )}
            {folder.folder_type === 'client' && (
              <Badge variant="outline" className="text-xs">
                👤 לקוח
              </Badge>
            )}
            {activeCases.length === 0 && folderCases.length > 0 && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                ✅ הושלם
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}