import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, FileText, FileImage, File, Eye, Clock, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DocumentList({ documents, onDelete, onEdit }) {
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (['pdf'].includes(extension)) return <FileText className="w-8 h-8 text-red-500" />;
    if (['doc', 'docx'].includes(extension)) return <FileText className="w-8 h-8 text-blue-700" />;
    if (['xls', 'xlsx'].includes(extension)) return <FileText className="w-8 h-8 text-green-600" />;
    return <File className="w-8 h-8 text-slate-400" />;
  };

  const categoryColors = {
    'כתב תביעה': 'bg-blue-100 text-blue-700',
    'כתב הגנה': 'bg-purple-100 text-purple-700',
    'ראיות': 'bg-emerald-100 text-emerald-700',
    'פסקי דין': 'bg-red-100 text-red-700',
    'חוזים': 'bg-amber-100 text-amber-700',
    'כללי': 'bg-slate-100 text-slate-700'
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <File className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">אין מסמכים בתיק זה</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc, index) => (
        <Card key={index} className="group hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 flex items-start gap-4">
              <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                {getFileIcon(doc.name)}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="font-bold text-slate-900 truncate mb-1" title={doc.name}>
                  {doc.name}
                </h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary" className={`text-[10px] px-1.5 h-5 ${categoryColors[doc.category] || categoryColors['כללי']}`}>
                    {doc.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('he-IL') : 'לא ידוע'}
                  <span>•</span>
                  <span className="truncate max-w-[80px]">{doc.uploaded_by || 'מערכת'}</span>
                </div>
              </div>
            </div>
            
            {/* Actions Footer */}
            <div className="bg-slate-50/50 border-t border-slate-100 p-2 flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => window.open(doc.url, '_blank')} title="צפייה">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-green-600 hover:bg-green-50" onClick={() => onEdit && onEdit(doc, index)} title="עריכה ב-Google Drive">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => {
                const a = document.createElement('a');
                a.href = doc.url;
                a.download = doc.name;
                a.click();
              }}>
                <Download className="w-4 h-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>מחיקת מסמך</AlertDialogTitle>
                    <AlertDialogDescription>האם אתה בטוח שברצונך למחוק את המסמך "{doc.name}"?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(index)} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}