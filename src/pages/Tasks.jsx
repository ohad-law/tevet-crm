import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle2, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext } from "@hello-pangea/dnd";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

import TaskForm from "../components/tasks/TaskForm";
import KanbanColumn from "../components/tasks/KanbanColumn";
import NextStepDialog from "../components/tasks/NextStepDialog";
import { getStepByLabel, applyNextSteps } from "@/lib/caseWorkflow";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [defaultStatusForNew, setDefaultStatusForNew] = useState("לביצוע");
  const [nextStep, setNextStep] = useState(null);   // הצעד שהושלם (לדיאלוג)
  const [completedTask, setCompletedTask] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [tasksData, casesData] = await Promise.all([
      base44.entities.Task.list(),
      base44.entities.Case.list()
    ]);
    
    // Simple local sorting by due date (DND persistence would require an 'order' field in DB)
    const sortedTasks = tasksData.sort((a, b) => {
         if (!a.due_date) return 1;
         if (!b.due_date) return -1;
         return new Date(a.due_date) - new Date(b.due_date);
    });

    setTasks(sortedTasks);
    setCases(casesData);
    setIsLoading(false);
  };

  const handleSubmit = async (taskData) => {
    let action = 'create';
    if (editingTask) {
      await base44.entities.Task.update(editingTask.id, taskData);
      action = 'update';
    } else {
      await base44.entities.Task.create(taskData);
    }
    
    // Notify Admin
    base44.functions.invoke('notifyAdmin', {
        entity: 'Task',
        action: action,
        details: `${action === 'create' ? 'נוצרה' : 'עודכנה'} משימה:\n${taskData.description}\nסטטוס: ${taskData.status}\nעדיפות: ${taskData.priority}`
    });

    setShowForm(false);
    setEditingTask(null);
    loadData();
  };

  const handleDeleteTask = async (task) => {
      if(confirm('האם למחוק משימה זו?')) {
        await base44.entities.Task.delete(task.id);
        
        // Notify Admin
        base44.functions.invoke('notifyAdmin', {
            entity: 'Task',
            action: 'delete',
            details: `נמחקה משימה:\n${task.description}`
        });

        loadData();
      }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside or same position
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    const newStatus = destination.droppableId;

    // Optimistic Update
    const updatedTasks = tasks.map(t => 
        t.id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    // API Call
    await base44.entities.Task.update(draggableId, { ...task, status: newStatus });

    // Notify Admin
    base44.functions.invoke('notifyAdmin', {
        entity: 'Task',
        action: 'status_change',
        details: `סטטוס משימה שונה:\n${task.description}\nמ-${task.status} ל-${newStatus}`
    });

    // אם המשימה הושלמה והיא חלק מרצף העבודה — הצע את הצעד הבא
    if (newStatus === "הושלמה") {
      const step = getStepByLabel(task.description);
      if (step) {
        setCompletedTask(task);
        setNextStep(step);
      }
    }

    // Silent reload to sync any other changes
    // base44.entities.Task.list().then(setTasks);
  };

  const handleNextStepConfirm = async (selections) => {
    await applyNextSteps(base44, selections, completedTask);
    setNextStep(null);
    setCompletedTask(null);
    loadData();
  };

  const handleNextStepClose = () => {
    setNextStep(null);
    setCompletedTask(null);
  };

  const getCaseName = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    return c ? c.case_name : "";
  };

  const handleOpenAdd = (status = "לביצוע") => {
      setDefaultStatusForNew(status);
      setEditingTask(null);
      setShowForm(true);
  };

  const handleEditTask = (task) => {
      setEditingTask(task);
      setShowForm(true);
  };

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
      const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (getCaseName(task.case_id).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
  });

  const columns = [
    {
      id: "לביצוע",
      title: "לביצוע",
      icon: AlertCircle,
      color: { bg: "bg-slate-100", text: "text-slate-600" },
      items: filteredTasks.filter(t => t.status === "לביצוע")
    },
    {
      id: "בטיפול",
      title: "בטיפול",
      icon: Clock,
      color: { bg: "bg-blue-100", text: "text-blue-600" },
      items: filteredTasks.filter(t => t.status === "בטיפול")
    },
    {
      id: "הושלמה",
      title: "הושלמה",
      icon: CheckCircle2,
      color: { bg: "bg-emerald-100", text: "text-emerald-600" },
      items: filteredTasks.filter(t => t.status === "הושלמה")
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-4 md:mb-6 shrink-0 pb-4 md:pb-6 border-b border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2 md:gap-3">
                <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
                ניהול משימות
            </h1>
            <p className="text-slate-500 text-sm md:text-base">גרירה ושחרור לניהול מהיר ויעיל</p>
          </div>
          
          <Button
            onClick={() => handleOpenAdd()}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 text-white rounded-xl"
          >
            <Plus className="w-5 h-5 ml-2" />
            משימה חדשה
          </Button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 w-full">
           <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="חיפוש משימה..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-9 bg-white border-slate-200 rounded-xl focus:ring-blue-500"
                />
           </div>
           <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[100px] md:w-[140px] bg-white border-slate-200 rounded-xl text-xs md:text-sm">
                    <SelectValue placeholder="עדיפות" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="דחוף">דחוף</SelectItem>
                    <SelectItem value="גבוה">גבוה</SelectItem>
                    <SelectItem value="רגיל">רגיל</SelectItem>
                </SelectContent>
           </Select>
        </div>
      </div>

      {/* Board Area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-6 h-full min-w-max px-1">
                {columns.map(col => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        icon={col.icon}
                        color={col.color}
                        tasks={col.items}
                        onTaskClick={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onAddTask={handleOpenAdd}
                        getCaseName={getCaseName}
                    />
                ))}
            </div>
        </div>
      </DragDropContext>

      <AnimatePresence>
        {showForm && (
          <TaskForm
            task={editingTask}
            initialStatus={defaultStatusForNew}
            cases={cases}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>

      <NextStepDialog
        open={!!nextStep}
        completedStep={nextStep}
        onClose={handleNextStepClose}
        onConfirm={handleNextStepConfirm}
      />
    </div>
  );
}