import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Circle,
  Pencil,
  Trash2,
  Calendar,
  Flag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProceduralRoadmap({ caseId }) {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    milestone_name: "",
    milestone_type: "מותאם אישית",
    status: "ממתין",
    due_date: "",
    completion_date: "",
    is_mandatory: true,
    notes: ""
  });

  useEffect(() => {
    loadMilestones();
  }, [caseId]);

  const loadMilestones = async () => {
    const data = await base44.entities.CaseMilestone.filter({ case_id: caseId });
    // Sort by order, then by due_date
    const sorted = data.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });
    setMilestones(sorted);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (editingMilestone) {
      await base44.entities.CaseMilestone.update(editingMilestone.id, {
        ...formData,
        case_id: caseId
      });
    } else {
      await base44.entities.CaseMilestone.create({
        ...formData,
        case_id: caseId,
        order: milestones.length
      });
    }
    resetForm();
    loadMilestones();
  };

  const handleDelete = async (id) => {
    if (confirm("האם למחוק אבן דרך זו?")) {
      await base44.entities.CaseMilestone.delete(id);
      loadMilestones();
    }
  };

  const handleStatusChange = async (milestone, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === "הושלם" && !milestone.completion_date) {
      updates.completion_date = new Date().toISOString().split('T')[0];
    }
    await base44.entities.CaseMilestone.update(milestone.id, updates);
    loadMilestones();
  };

  const resetForm = () => {
    setFormData({
      milestone_name: "",
      milestone_type: "מותאם אישית",
      status: "ממתין",
      due_date: "",
      completion_date: "",
      is_mandatory: true,
      notes: ""
    });
    setEditingMilestone(null);
    setShowAddDialog(false);
  };

  const openEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      milestone_name: milestone.milestone_name,
      milestone_type: milestone.milestone_type || "מותאם אישית",
      status: milestone.status,
      due_date: milestone.due_date || "",
      completion_date: milestone.completion_date || "",
      is_mandatory: milestone.is_mandatory ?? true,
      notes: milestone.notes || ""
    });
    setShowAddDialog(true);
  };

  const isOverdue = (milestone) => {
    if (milestone.status === "הושלם") return false;
    if (!milestone.due_date) return false;
    return new Date(milestone.due_date) < new Date();
  };

  const completedCount = milestones.filter(m => m.status === "הושלם").length;
  const mandatoryCount = milestones.filter(m => m.is_mandatory).length;
  const completedMandatory = milestones.filter(m => m.is_mandatory && m.status === "הושלם").length;
  const progressPercent = mandatoryCount > 0 ? Math.round((completedMandatory / mandatoryCount) * 100) : 0;
  const overdueCount = milestones.filter(isOverdue).length;

  const statusConfig = {
    "ממתין": { icon: Circle, color: "text-slate-400", bg: "bg-slate-100" },
    "בביצוע": { icon: Clock, color: "text-blue-500", bg: "bg-blue-100" },
    "הושלם": { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100" },
    "באיחור": { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-100" }
  };

  const milestoneTypes = [
    "מסירה בדואר רשום",
    "עדכון מספר תיק מבית המשפט",
    "קבלת כתב הגנה",
    "תצהיר גילוי מסמכים",
    "תצהירי עדות ראשית",
    "קדם משפט",
    "דיון הוכחות",
    "הגשת סיכומים",
    "מותאם אישית"
  ];

  if (isLoading) {
    return <div className="text-center py-8 text-slate-500">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">התקדמות פרוצדורלית</h3>
              <p className="text-sm text-slate-500">
                {completedMandatory} מתוך {mandatoryCount} שלבי חובה הושלמו
              </p>
            </div>
            <div className="flex items-center gap-4">
              {overdueCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  <AlertTriangle className="w-3 h-3 ml-1" />
                  {overdueCount} באיחור
                </Badge>
              )}
              <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף שלב
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">התקדמות כללית</span>
              <span className="font-bold text-slate-900">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-600" />
            מפת דרך - אבני דרך
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {milestones.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Flag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>אין אבני דרך עדיין</p>
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                הוסף את השלב הראשון
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence>
                {milestones.map((milestone, idx) => {
                  const overdue = isOverdue(milestone);
                  const config = overdue && milestone.status !== "הושלם" 
                    ? statusConfig["באיחור"] 
                    : statusConfig[milestone.status];
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${
                        overdue ? 'bg-red-50 hover:bg-red-100' : ''
                      }`}
                    >
                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${milestone.status === 'הושלם' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {milestone.milestone_name}
                          </h4>
                          {milestone.is_mandatory && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              חובה
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          {milestone.due_date && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              יעד: {new Date(milestone.due_date).toLocaleDateString('he-IL')}
                            </span>
                          )}
                          {milestone.completion_date && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              הושלם: {new Date(milestone.completion_date).toLocaleDateString('he-IL')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Selector */}
                      <Select
                        value={milestone.status}
                        onValueChange={(val) => handleStatusChange(milestone, val)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ממתין">ממתין</SelectItem>
                          <SelectItem value="בביצוע">בביצוע</SelectItem>
                          <SelectItem value="הושלם">הושלם</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(milestone)}>
                          <Pencil className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(milestone.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "עריכת אבן דרך" : "הוספת אבן דרך חדשה"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">סוג שלב</label>
              <Select
                value={formData.milestone_type}
                onValueChange={(val) => {
                  setFormData({
                    ...formData,
                    milestone_type: val,
                    milestone_name: val !== "מותאם אישית" ? val : formData.milestone_name
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {milestoneTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">שם אבן הדרך</label>
              <Input
                value={formData.milestone_name}
                onChange={(e) => setFormData({ ...formData, milestone_name: e.target.value })}
                placeholder="לדוגמא: שליחת תביעה בדואר רשום"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">תאריך יעד</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">תאריך השלמה</label>
                <Input
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">סטטוס</label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ממתין">ממתין</SelectItem>
                  <SelectItem value="בביצוע">בביצוע</SelectItem>
                  <SelectItem value="הושלם">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
              />
              <label htmlFor="mandatory" className="text-sm text-slate-700">שלב חובה</label>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">הערות</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>ביטול</Button>
            <Button onClick={handleSubmit} disabled={!formData.milestone_name}>
              {editingMilestone ? "שמור" : "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}