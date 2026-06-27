import { useState } from "react";
import { ChevronDown, ChevronLeft, Folder, FolderOpen, Plus, Edit, Trash2, Link as LinkIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function FolderTree({ 
  folders, 
  cases, 
  onFolderClick, 
  selectedFolderId, 
  onCreateFolder, 
  onEditFolder, 
  onDeleteFolder,
  onAssignFolder,
  onAddExistingSubfolder
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getCasesInFolder = (folderId, includeSubfolders = true) => {
    if (!includeSubfolders) {
      return cases.filter(c => c.folder_id === folderId && !c.subfolder_id);
    }
    return cases.filter(c => c.folder_id === folderId || c.subfolder_id === folderId);
  };

  const getSubfolders = (parentId) => {
    return folders.filter(f => f.parent_folder_id === parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const rootFolders = folders.filter(f => !f.parent_folder_id).sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const subfolders = getSubfolders(folder.id);
    const folderCases = getCasesInFolder(folder.id, true);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = subfolders.length > 0;
    const isCategory = folder.folder_type === 'category';
    const parentFolder = folder.parent_folder_id ? folders.find(f => f.id === folder.parent_folder_id) : null;

    return (
      <div key={folder.id} style={{ marginRight: `${level * 20}px` }}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-all ${
            isSelected ? 'bg-blue-50 border-2 border-blue-300' : ''
          }`}
        >
          {/* Expand/Collapse Button */}
          {(hasChildren || isCategory) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}

          {/* Folder Icon & Name */}
          <div
            onClick={() => onFolderClick(folder)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <span style={{ color: folder.color || '#4285F4' }}>
              {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
            </span>
            <span className="text-sm">{folder.icon}</span>
            <span className={`font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
              {folder.folder_name}
            </span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {folderCases.length}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
            {isCategory && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(folder.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="צור תת-תיקייה"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddExistingSubfolder(folder);
                  }}
                  className="h-6 w-6 p-0 text-green-600"
                  title="הוסף תת-תיקייה קיימת"
                >
                  <UserPlus className="w-3 h-3" />
                </Button>
              </>
            )}
            {!isCategory && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignFolder(folder);
                }}
                className="h-6 w-6 p-0 text-purple-600"
                title="שייך לתיקייה ראשית"
              >
                <LinkIcon className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEditFolder(folder);
              }}
              className="h-6 w-6 p-0"
              title="ערוך"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder);
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              title="מחק"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>

        {/* Parent indicator for unassigned client folders */}
        {!folder.parent_folder_id && folder.folder_type === 'client' && (
          <div className="mr-10 mb-1">
            <span className="text-xs text-orange-600">📍 לא משויכת</span>
          </div>
        )}

        {/* Parent indicator for assigned client folders */}
        {parentFolder && (
          <div className="mr-10 mb-1">
            <span className="text-xs text-gray-500">
              📍 תחת: {parentFolder.icon} {parentFolder.folder_name}
            </span>
          </div>
        )}

        {/* Subfolders */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {subfolders.map(subfolder => renderFolder(subfolder, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {rootFolders.map(folder => renderFolder(folder))}
      
      {rootFolders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">אין תיקיות עדיין</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateFolder(null)}
            className="mt-4"
          >
            <Plus className="w-4 h-4 ml-2" />
            צור תיקייה ראשונה
          </Button>
        </div>
      )}
    </div>
  );
}