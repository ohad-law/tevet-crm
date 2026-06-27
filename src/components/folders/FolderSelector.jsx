import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function FolderSelector({ folders, cases, selectedFolderId, selectedSubfolderId, onFolderChange, onSubfolderChange }) {
  const rootFolders = folders.filter(f => !f.parent_folder_id && f.is_active);
  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const subfolders = selectedFolderId ? folders.filter(f => f.parent_folder_id === selectedFolderId && f.is_active) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>תיקייה ראשית</Label>
        <Select value={selectedFolderId || ""} onValueChange={onFolderChange}>
          <SelectTrigger>
            <SelectValue placeholder="בחר קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>ללא תיקייה</SelectItem>
            {rootFolders.map(folder => (
              <SelectItem key={folder.id} value={folder.id}>
                <span className="flex items-center gap-2">
                  <span>{folder.icon}</span>
                  <span>{folder.folder_name}</span>
                  <span className="text-xs text-gray-500">
                    ({cases.filter(c => c.folder_id === folder.id).length} תיקים)
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFolderId && subfolders.length > 0 && (
        <div className="space-y-2">
          <Label>תת-תיקייה (אופציונלי)</Label>
          <Select value={selectedSubfolderId || ""} onValueChange={onSubfolderChange}>
            <SelectTrigger>
              <SelectValue placeholder="בחר תת-תיקייה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>ללא תת-תיקייה</SelectItem>
              {subfolders.map(subfolder => (
                <SelectItem key={subfolder.id} value={subfolder.id}>
                  <span className="flex items-center gap-2">
                    <span>{subfolder.icon}</span>
                    <span>{subfolder.folder_name}</span>
                    <span className="text-xs text-gray-500">
                      ({cases.filter(c => c.subfolder_id === subfolder.id).length} תיקים)
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedFolder && (
        <div className="md:col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm">
            <span className="font-semibold">תיקייה נבחרת:</span>{' '}
            <span>{selectedFolder.icon} {selectedFolder.folder_name}</span>
            {selectedSubfolderId && subfolders.find(sf => sf.id === selectedSubfolderId) && (
              <>
                {' '}/{' '}
                <span>
                  {subfolders.find(sf => sf.id === selectedSubfolderId).icon}{' '}
                  {subfolders.find(sf => sf.id === selectedSubfolderId).folder_name}
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}