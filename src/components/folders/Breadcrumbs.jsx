import React from "react";
import { ChevronLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Breadcrumbs({ folders, selectedFolderId, onNavigate }) {
  if (!selectedFolderId) {
    return (
      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border mb-4">
        <Home className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-gray-900">כל התיקים</span>
      </div>
    );
  }

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  if (!selectedFolder) return null;

  const breadcrumbs = [];
  let current = selectedFolder;

  // Build breadcrumb trail
  while (current) {
    breadcrumbs.unshift(current);
    current = current.parent_folder_id ? folders.find(f => f.id === current.parent_folder_id) : null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border mb-4 overflow-x-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:bg-blue-50"
      >
        <Home className="w-4 h-4 text-blue-600" />
        <span>תיקים</span>
      </Button>

      {breadcrumbs.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className={`flex items-center gap-1 ${
              index === breadcrumbs.length - 1 
                ? 'font-bold text-blue-700 bg-blue-50' 
                : 'hover:bg-blue-50'
            }`}
          >
            <span style={{ color: folder.color }}>{folder.icon}</span>
            <span>{folder.folder_name}</span>
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
}