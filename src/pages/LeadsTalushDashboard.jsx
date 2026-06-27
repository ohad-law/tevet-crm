import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, RefreshCw, Loader2, Phone, Mail, FileText, Calendar, Building2, Clock, Edit2, Paperclip, ExternalLink, Plus, CheckSquare } from "lucide-react";
import { format, addDays } from "date-fns";

export default function LeadsTalushDashboard() {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingLead, setEditingLead] = useState(null);
    const [viewingFiles, setViewingFiles] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [taskDialogLead, setTaskDialogLead] = useState(null);
    const [taskForm, setTaskForm] = useState({ description: "", due_date: "", priority: "רגיל" });

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setIsLoading(true);
        try {
            const data = await base44.entities.LeadTalush.list("-created_date");
            setLeads(data);
            
            // Mark unviewed leads as viewed
            const unviewedLeads = data.filter(l => !l.is_viewed);
            for (const lead of unviewedLeads) {
                await base44.entities.LeadTalush.update(lead.id, { is_viewed: true });
            }
        } catch (error) {
            console.error("Error loading leads:", error);
        }
        setIsLoading(false);
    };

    const handleCreateTask = async () => {
        if (!taskForm.description || !taskDialogLead) return;
        
        setIsSaving(true);
        try {
            await base44.entities.Task.create({
                description: taskForm.description,
                lead_talush_id: taskDialogLead.id,
                due_date: taskForm.due_date,
                priority: taskForm.priority,
                status: "לביצוע",
                task_type: "פולואפ ליד"
            });
            setTaskDialogLead(null);
            setTaskForm({ description: "", due_date: "", priority: "רגיל" });
        } catch (error) {
            console.error("Error creating task:", error);
        }
        setIsSaving(false);
    };

    const setQuickFollowup = (days) => {
        const dueDate = format(addDays(new Date(), days), "yyyy-MM-dd");
        setTaskForm(prev => ({ 
            ...prev, 
            due_date: dueDate,
            description: prev.description || `פולואפ עם ${taskDialogLead?.full_name}`
        }));
    };

    const handleUpdateLead = async (updatedData) => {
        setIsSaving(true);
        try {
            await base44.entities.LeadTalush.update(editingLead.id, updatedData);
            setEditingLead(null);
            loadLeads();
        } catch (error) {
            console.error("Error updating lead:", error);
        }
        setIsSaving(false);
    };

    const statusColors = {
        "חדש": "bg-blue-100 text-blue-800",
        "נוצר קשר": "bg-yellow-100 text-yellow-800",
        "מתאים": "bg-green-100 text-green-800",
        "לא מתאים": "bg-slate-100 text-slate-800",
        "הומר ללקוח": "bg-purple-100 text-purple-800"
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = !searchTerm || 
            lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone?.includes(searchTerm) ||
            lead.workplace?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === "חדש").length,
        contacted: leads.filter(l => l.status === "נוצר קשר").length,
        converted: leads.filter(l => l.status === "הומר ללקוח").length
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        לידים - בדיקת תלושים
                    </h1>
                    <p className="text-slate-500 mt-1">ניהול לידים מדף בדיקת תלושי שכר</p>
                </div>
                <Button onClick={loadLeads} variant="outline">
                    <RefreshCw className="w-4 h-4 ml-2" />
                    רענן
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-sm text-slate-500">סה״כ לידים</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                        <div className="text-sm text-slate-500">חדשים</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
                        <div className="text-sm text-slate-500">נוצר קשר</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">{stats.converted}</div>
                        <div className="text-sm text-slate-500">הומרו ללקוח</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="חיפוש לפי שם, טלפון או מקום עבודה..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="w-4 h-4 ml-2" />
                                <SelectValue placeholder="סינון לפי סטטוס" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הסטטוסים</SelectItem>
                                <SelectItem value="חדש">חדש</SelectItem>
                                <SelectItem value="נוצר קשר">נוצר קשר</SelectItem>
                                <SelectItem value="מתאים">מתאים</SelectItem>
                                <SelectItem value="לא מתאים">לא מתאים</SelectItem>
                                <SelectItem value="הומר ללקוח">הומר ללקוח</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="mr-2 text-slate-500">טוען...</span>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="text-center p-12 text-slate-500">
                            לא נמצאו לידים
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-right">שם</TableHead>
                                    <TableHead className="text-right">פרטי קשר</TableHead>
                                    <TableHead className="text-right">מקום עבודה</TableHead>
                                    <TableHead className="text-right">מצב תעסוקתי</TableHead>
                                    <TableHead className="text-right">בעיה עיקרית</TableHead>
                                    <TableHead className="text-right">קבצים</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-right">תאריך</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeads.map((lead) => (
                                    <TableRow key={lead.id} className={lead.status === "הומר ללקוח" ? "bg-green-50 hover:bg-green-100" : "hover:bg-slate-50/50"}>
                                        <TableCell className="font-medium">{lead.full_name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                                                    <Phone className="w-3 h-3" />
                                                    {lead.phone}
                                                </a>
                                                {lead.email && (
                                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-slate-600 hover:underline">
                                                        <Mail className="w-3 h-3" />
                                                        {lead.email}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {lead.workplace && (
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-slate-400" />
                                                        {lead.workplace}
                                                    </div>
                                                )}
                                                {lead.job_role && <div className="text-slate-500">{lead.job_role}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {lead.employment_status && <Badge variant="outline">{lead.employment_status}</Badge>}
                                                {lead.work_duration && <div className="text-slate-500 mt-1">{lead.work_duration}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.main_concern ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="max-w-[200px] text-sm text-slate-600 truncate h-auto p-1 font-normal justify-start"
                                                    onClick={() => setEditingLead(lead)}
                                                    title="לחץ לצפייה בטקסט המלא"
                                                >
                                                    {lead.main_concern}
                                                </Button>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {lead.uploaded_files && lead.uploaded_files.length > 0 ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs gap-1"
                                                    onClick={() => setViewingFiles(lead)}
                                                >
                                                    <Paperclip className="w-3 h-3" />
                                                    {lead.uploaded_files.length} קבצים
                                                </Button>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[lead.status]} border-0`}>
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(lead.created_date), "dd/MM/yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingLead(lead)}
                                                    title="עריכה"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setTaskDialogLead(lead);
                                                        setTaskForm({ 
                                                            description: `פולואפ עם ${lead.full_name}`, 
                                                            due_date: format(addDays(new Date(), 3), "yyyy-MM-dd"), 
                                                            priority: "רגיל" 
                                                        });
                                                    }}
                                                    title="צור משימה"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Files Dialog */}
            <Dialog open={!!viewingFiles} onOpenChange={() => setViewingFiles(null)}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Paperclip className="w-5 h-5" />
                            קבצים מצורפים - {viewingFiles?.full_name}
                        </DialogTitle>
                    </DialogHeader>
                    {viewingFiles?.uploaded_files && (
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {viewingFiles.uploaded_files.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
                                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                                </a>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>עריכת ליד - {editingLead?.full_name}</DialogTitle>
                    </DialogHeader>
                    {editingLead && (
                        <div className="space-y-4">
                            {/* הבעיה העיקרית - טקסט מלא */}
                            {editingLead.main_concern && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">הבעיה העיקרית</label>
                                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                        {editingLead.main_concern}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">סטטוס</label>
                                <Select
                                    value={editingLead.status}
                                    onValueChange={(v) => setEditingLead({ ...editingLead, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="חדש">חדש</SelectItem>
                                        <SelectItem value="נוצר קשר">נוצר קשר</SelectItem>
                                        <SelectItem value="מתאים">מתאים</SelectItem>
                                        <SelectItem value="לא מתאים">לא מתאים</SelectItem>
                                        <SelectItem value="הומר ללקוח">הומר ללקוח</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">הערות פנימיות</label>
                                <Textarea
                                    value={editingLead.notes || ""}
                                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                                    rows={4}
                                    placeholder="הוסף הערות..."
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={() => handleUpdateLead({ status: editingLead.status, notes: editingLead.notes })}
                                    disabled={isSaving}
                                    className="flex-1"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                    שמור
                                </Button>
                                <Button variant="outline" onClick={() => setEditingLead(null)}>
                                    ביטול
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Task Dialog */}
            <Dialog open={!!taskDialogLead} onOpenChange={() => setTaskDialogLead(null)}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                            יצירת משימה - {taskDialogLead?.full_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Quick Followup Buttons */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">פולואפ מהיר</label>
                            <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" onClick={() => setQuickFollowup(1)}>
                                    מחר
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setQuickFollowup(3)}>
                                    עוד 3 ימים
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setQuickFollowup(7)}>
                                    עוד שבוע
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">תיאור המשימה</label>
                            <Textarea
                                value={taskForm.description}
                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                rows={3}
                                placeholder="לדוגמא: פולואפ - לבדוק אם הלקוח קיבל את המסמכים..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">תאריך יעד</label>
                                <Input
                                    type="date"
                                    value={taskForm.due_date}
                                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">עדיפות</label>
                                <Select
                                    value={taskForm.priority}
                                    onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="רגיל">רגיל</SelectItem>
                                        <SelectItem value="גבוה">גבוה</SelectItem>
                                        <SelectItem value="דחוף">דחוף</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleCreateTask}
                                disabled={isSaving || !taskForm.description}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                                צור משימה
                            </Button>
                            <Button variant="outline" onClick={() => setTaskDialogLead(null)}>
                                ביטול
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}