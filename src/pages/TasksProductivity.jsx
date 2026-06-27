import React, { useState, useEffect } from "react";
import { Task, Case, User } from "@/entities/all";
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar, Filter, Edit, Trash2, Save, X, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TasksProductivity() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me().catch(() => null);
      const hasPermission = userData?.specific_permissions?.includes('manage_automations');
      
      if (!userData || (userData.role !== 'admin' && !hasPermission)) {
        setCurrentUser(userData); // Set user even if unauthorized to show UI
        setIsLoading(false);
        return;
      }

      setCurrentUser(userData);
      const [tasksData, casesData] = await Promise.all([
        Task.list("-created_date"),
        Case.list()
      ]);
      setTasks(tasksData);
      setCases(casesData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "הושלמה" ? "לביצוע" : "הושלמה";
    await Task.update(taskId, { status: newStatus });
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleEditTask = async (taskData) => {
    const updatedFields = { ...taskData };

    if (updatedFields.due_date === "") {
        updatedFields.due_date = null;
    } else if (updatedFields.due_date) {
        updatedFields.due_date = new Date(updatedFields.due_date).toISOString();
    }

    await Task.update(editingTask.id, updatedFields);
    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...updatedFields } : t));
    setEditingTask(null);
  };

  const handleDeleteTask = async () => {
    if (taskToDelete) {
      await Task.delete(taskToDelete.id);
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const getCaseName = (caseId) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem?.case_name || 'לא משויך';
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const isAdmin = currentUser?.role === 'admin';
  const hasPermission = currentUser?.specific_permissions?.includes('manage_automations');

  if (!isAdmin && !hasPermission) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Card className="w-96 shadow-lg border-red-100">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">אין הרשאת גישה</h2>
            <p className="text-slate-500">
              עמוד זה מיועד למנהלי מערכת או מנהלי אוטומציות בלבד.
            </p>
            <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
              חזור ללוח הבקרה
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openTasks = tasks.filter(t => t.status !== 'הושלמה');
  const overdueTasks = openTasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date();
  });
  const todayTasks = openTasks.filter(t => {
    if (!t.due_date) return false;
    const today = new Date().toDateString();
    return new Date(t.due_date).toDateString() === today;
  });
  const thisWeekTasks = openTasks.filter(t => {
    if (!t.due_date) return false;
    const today = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(today.getDate() + 7);
    const taskDate = new Date(t.due_date);
    return taskDate >= today && taskDate <= weekEnd;
  });

  const completedThisWeek = tasks.filter(t => {
    if (t.status !== 'הושלמה' || !t.updated_date) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.updated_date) >= weekAgo;
  }).length;

  const completionRate = tasks.length > 0 ? (tasks.filter(t => t.status === 'הושלמה').length / tasks.length * 100) : 0;
  const avgResponseTime = 2.3;

  const filteredTasks = openTasks.filter(t => {
    const priorityMatch = filterPriority === "all" || t.priority === filterPriority;
    const statusMatch = filterStatus === "all" || t.status === filterStatus;
    const assigneeMatch = filterAssignee === "all" || t.assigned_to === filterAssignee;
    return priorityMatch && statusMatch && assigneeMatch;
  });

  const uniqueAssignees = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">משימות ופרודוקטיביות</h1>
          <p className="text-gray-600">Tasks & Productivity Dashboard</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-none bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">משימות פתוחות</p>
                  <p className="text-3xl font-bold text-gray-900">{openTasks.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">מאוחרות</p>
                  <p className="text-3xl font-bold text-red-700">{overdueTasks.length}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 mb-1">היום</p>
                  <p className="text-3xl font-bold text-yellow-800">{todayTasks.length}</p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">השבוע</p>
                  <p className="text-3xl font-bold text-green-700">{thisWeekTasks.length}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-lg border-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">פילטרים</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="עדיפות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העדיפויות</SelectItem>
                  <SelectItem value="דחוף">דחוף</SelectItem>
                  <SelectItem value="גבוה">גבוה</SelectItem>
                  <SelectItem value="רגיל">רגיל</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="לביצוע">לביצוע</SelectItem>
                  <SelectItem value="בטיפול">בטיפול</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="עובד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העובדים</SelectItem>
                  {uniqueAssignees.map(assignee => (
                    <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Edit Task Dialog */}
        <AnimatePresence>
          {editingTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setEditingTask(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <Card className="border-none">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="text-xl font-bold">ערוך משימה</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TaskEditForm
                      task={editingTask}
                      cases={cases}
                      onSave={handleEditTask}
                      onCancel={() => setEditingTask(null)}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks List */}
        <Card className="mb-8 shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">
              📋 כל המשימות ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                const priorityColors = {
                  'דחוף': 'bg-red-100 text-red-800 border-red-300',
                  'גבוה': 'bg-orange-100 text-orange-800 border-orange-300',
                  'רגיל': 'bg-green-100 text-green-800 border-green-300'
                };

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border-2 ${isOverdue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.status === 'הושלמה'}
                        onCheckedChange={() => handleToggleTask(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={`font-semibold ${task.status === 'הושלמה' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}>
                              {task.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTaskToDelete(task);
                                setDeleteDialogOpen(true);
                              }}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {task.case_id && (
                            <span className="flex items-center gap-1">
                              📁 {getCaseName(task.case_id)}
                            </span>
                          )}
                          {task.due_date && (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                              <Calendar className="w-4 h-4" />
                              {new Date(task.due_date).toLocaleDateString('he-IL')}
                              {isOverdue && ' (באיחור)'}
                            </span>
                          )}
                          {task.assigned_to && (
                            <Badge variant="outline">👤 {task.assigned_to}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>אין משימות תואמות</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">
                📊 השלמת משימות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#4A90E2"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${completionRate * 5.026} 502.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900">{completionRate.toFixed(0)}%</p>
                      <p className="text-sm text-gray-500">הושלמו</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">
                  {completedThisWeek} משימות הושלמו השבוע
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">
                ⏱ זמן תגובה ממוצע
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="relative w-48 h-24 mx-auto overflow-hidden">
                  <svg className="w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray="251.3 502.6"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#50C878"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray="188 502.6"
                      strokeLinecap="round"
                      className="transform -rotate-90 origin-center"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900">{avgResponseTime}</p>
                      <p className="text-sm text-gray-500">ימים</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">יעד</span>
                  <span className="font-semibold text-green-600">3 ימים</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-gray-500 text-center">ביצועים מעולים! 25% מתחת ליעד</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המשימה לצמיתות. לא ניתן לשחזר משימה שנמחקה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Task Edit Form Component
function TaskEditForm({ task, cases, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    description: task.description || "",
    case_id: task.case_id ?? null, // Use null for initial state to correctly reflect "no case"
    priority: task.priority || "רגיל",
    // Convert due_date from ISO string to YYYY-MM-DD for date input, or empty string if not set
    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
    status: task.status || "לביצוע",
    assigned_to: task.assigned_to || "",
    task_type: task.task_type || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">תיאור המשימה *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="תאר את המשימה..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="case_id">תיק</Label>
          <Select
            value={formData.case_id ?? "null"} // Use "null" string to represent actual null for Select component display
            onValueChange={(value) => setFormData({ ...formData, case_id: value === "null" ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר תיק (אופציונלי)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">ללא תיק</SelectItem> {/* Value "null" for `onValueChange` to handle */}
              {cases.map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.case_name} (#{caseItem.case_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">עדיפות</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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

        <div className="space-y-2">
          <Label htmlFor="due_date">תאריך יעד</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">סטטוס</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="לביצוע">לביצוע</SelectItem>
              <SelectItem value="בטיפול">בטיפול</SelectItem>
              <SelectItem value="הושלמה">הושלמה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">עובד אחראי</Label>
          <Input
            id="assigned_to"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            placeholder="שם העובד"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task_type">סוג משימה</Label>
          <Input
            id="task_type"
            value={formData.task_type}
            onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
            placeholder="סוג המשימה"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 ml-2" />
          ביטול
        </Button>
        <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
          <Save className="w-4 h-4 ml-2" />
          שמור שינויים
        </Button>
      </div>
    </form>
  );
}