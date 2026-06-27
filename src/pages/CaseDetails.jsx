import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, Calendar, DollarSign, User as UserIcon, CheckSquare, FileText, Pencil, Trash2, Archive, Upload, Clock, MapPin, Phone, Building, MoreHorizontal, Activity, Briefcase, Scale, Link as LinkIcon, Copy, Flag, HardDrive, RefreshCw, ExternalLink, Plus, LayoutDashboard, File, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import CaseForm from "../components/cases/CaseForm";
import DocumentUpload from "../components/cases/DocumentUpload";
import DocumentList from "../components/cases/DocumentList";
import IntakeFormViewer from "../components/cases/IntakeFormViewer";
import SignedDocumentsViewer from "../components/cases/SignedDocumentsViewer";
import CaseTimeline from "../components/cases/CaseTimeline";
import StatsCard from "../components/dashboard/StatsCard";
import TaskItem from "../components/tasks/TaskItem";
import NextStepDialog from "../components/tasks/NextStepDialog";
import { getStepByLabel, applyNextSteps } from "@/lib/caseWorkflow";
import ProceduralRoadmap from "../components/cases/ProceduralRoadmap";
import AppendicesEditor from "../components/cases/AppendicesEditor";
import GoogleDriveWidget from "../components/cases/GoogleDriveWidget";
import WorkTimer from "../components/cases/WorkTimer";
import CaseSignatureWidget from "../components/cases/CaseSignatureWidget";
import HearingsList from "../components/hearings/HearingsList";
import HearingDialog from "../components/hearings/HearingDialog";
import { BookOpen, Timer, FileSignature } from "lucide-react";

export default function CaseDetails() {
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [caseTasks, setCaseTasks] = useState([]);
  const [intakeForm, setIntakeForm] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [detailedDescription, setDetailedDescription] = useState("");
  const [showClientLink, setShowClientLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showHearingDialog, setShowHearingDialog] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [completedTask, setCompletedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    description: '',
    priority: 'רגיל',
    due_date: '',
    status: 'לביצוע'
  });

  useEffect(() => {
    const loadCaseData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const caseId = urlParams.get('id');
      
      if (!caseId) {
        navigate(createPageUrl("Cases"));
        return;
      }

      const [allCases, allClients, allTasks, userData] = await Promise.all([
        base44.entities.Case.list(),
        base44.entities.Client.list(),
        base44.entities.Task.list(),
        base44.auth.me().catch(() => null)
      ]);

      const foundCase = allCases.find(c => c.id === caseId);
      if (!foundCase) {
        navigate(createPageUrl("Cases"));
        return;
      }

      const foundClient = allClients.find(c => c.id === foundCase.client_id);
      const relatedTasks = allTasks.filter(t => t.case_id === caseId);

      let formData = null;
      if (foundCase.case_type === 'דיני עבודה - עובדים זרים') {
        const allForms = await base44.entities.WorkerIntakeForm.list();
        formData = allForms.find(f => f.created_case_id === caseId);
      }

      setCaseData(foundCase);
      setDetailedDescription(foundCase.case_detailed_description || "");
      setClient(foundClient);
      setClients(allClients);
      setCaseTasks(relatedTasks);
      setIntakeForm(formData);
      setCurrentUser(userData);
      setIsLoading(false);
    };

    loadCaseData();
  }, [navigate]);

  // ... (keep handlers the same as previous version for brevity, implementing updated render only)
  const handleUpdateCase = async (updatedData) => {
    await base44.entities.Case.update(caseData.id, updatedData);
    setIsEditing(false);
    // Reload logic simplified
    setCaseData({ ...caseData, ...updatedData });
  };

  const handleSaveDescription = async () => {
    await base44.entities.Case.update(caseData.id, { ...caseData, case_detailed_description: detailedDescription });
    setCaseData({ ...caseData, case_detailed_description: detailedDescription });
    setIsEditingDescription(false);
  };

  const handleDelete = async () => {
    if (!caseData?.id) return;
    await base44.entities.Case.delete(caseData.id);
    navigate(createPageUrl("Cases"));
  };

  const handleArchive = async () => {
    if (!caseData?.id) return;
    await base44.entities.Case.update(caseData.id, { ...caseData, status: 'ארכיון' });
    setCaseData({ ...caseData, status: 'ארכיון' });
  };

  const handleDocumentUpload = async (document) => {
    const documents = caseData.documents || [];
    const updatedDocuments = [...documents, { ...document, uploaded_by: currentUser?.email || 'משתמש' }];
    await base44.entities.Case.update(caseData.id, { ...caseData, documents: updatedDocuments });
    setCaseData({ ...caseData, documents: updatedDocuments });
    setShowUpload(false);
  };

  const handleDocumentDelete = async (index) => {
    const documents = caseData.documents || [];
    const updatedDocuments = documents.filter((_, i) => i !== index);
    await base44.entities.Case.update(caseData.id, { ...caseData, documents: updatedDocuments });
    setCaseData({ ...caseData, documents: updatedDocuments });
  };

  const handleDocumentEdit = async (doc, index) => {
    try {
      // Call backend to get edit link or upload
      const { data } = await base44.functions.invoke('googleDrive', {
          action: doc.drive_id ? 'open_edit_link' : 'upload_and_convert',
          fileUrl: doc.url,
          fileName: doc.name,
          fileId: doc.drive_id
      });
      
      if (data.error) {
          alert("שגיאה: " + data.error);
          return;
      }
      
      // If newly uploaded/converted, update the local document record
      if (!doc.drive_id && data.driveId) {
          const documents = [...caseData.documents];
          documents[index] = {
              ...doc,
              drive_id: data.driveId,
              drive_view_link: data.webViewLink
          };
          
          await base44.entities.Case.update(caseData.id, {
              ...caseData,
              documents
          });
          setCaseData({ ...caseData, documents });
      }
      
      // Open the edit link
      if (data.webViewLink) {
          window.open(data.webViewLink, '_blank');
      }
    } catch (error) {
        console.error("Edit error:", error);
        alert("שגיאה בפתיחת העריכה. וודא שהרשאות Google Drive מוגדרות.");
    }
  };

  const getClientUploadLink = () => {
    // Use the production URL for the client upload link
    const baseUrl = "https://legal-flow-crm-1d774f3f.base44.app";
    return `${baseUrl}${createPageUrl('ClientDocumentUpload')}?case_id=${caseData.id}`;
  };

  const handleCopyLink = () => {
    const link = getClientUploadLink();
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const openNewTaskDialog = () => {
    setEditingTask(null);
    setTaskForm({ description: '', priority: 'רגיל', due_date: '', status: 'לביצוע' });
    setShowTaskDialog(true);
  };

  const openEditTaskDialog = (task) => {
    setEditingTask(task);
    setTaskForm({
      description: task.description || '',
      priority: task.priority || 'רגיל',
      due_date: task.due_date || '',
      status: task.status || 'לביצוע'
    });
    setShowTaskDialog(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.description.trim()) return;
    
    const taskData = {
      ...taskForm,
      case_id: caseData.id
    };

    if (editingTask) {
      await base44.entities.Task.update(editingTask.id, taskData);
      setCaseTasks(caseTasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask = await base44.entities.Task.create(taskData);
      setCaseTasks([...caseTasks, newTask]);
    }
    
    setShowTaskDialog(false);
  };

  const handleDeleteTask = async (taskId) => {
    await base44.entities.Task.delete(taskId);
    setCaseTasks(caseTasks.filter(t => t.id !== taskId));
  };

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'הושלמה' ? 'לביצוע' : 'הושלמה';
    await base44.entities.Task.update(task.id, { status: newStatus });
    setCaseTasks(caseTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    // אם המשימה הושלמה והיא חלק מרצף העבודה — הצע את הצעד הבא
    if (newStatus === 'הושלמה') {
      const step = getStepByLabel(task.description);
      if (step) {
        setCompletedTask(task);
        setNextStep(step);
      }
    }
  };

  const handleNextStepConfirm = async (selections) => {
    await applyNextSteps(base44, selections, completedTask);
    setNextStep(null);
    setCompletedTask(null);
    // רענון משימות התיק והסטטוס המעודכן
    if (caseData?.id) {
      const [allTasks, allCases] = await Promise.all([
        base44.entities.Task.list(),
        base44.entities.Case.list()
      ]);
      setCaseTasks(allTasks.filter(t => t.case_id === caseData.id));
      const refreshedCase = allCases.find(c => c.id === caseData.id);
      if (refreshedCase) setCaseData(refreshedCase);
    }
  };

  const handleNextStepClose = () => {
    setNextStep(null);
    setCompletedTask(null);
  };

  const openNewHearingDialog = () => {
    setEditingHearing(null);
    setShowHearingDialog(true);
  };

  const openEditHearingDialog = (hearing, index) => {
    setEditingHearing({ caseId: caseData.id, hearing, index });
    setShowHearingDialog(true);
  };

  const handleSaveHearing = async ({ hearing }) => {
    const hearings = [...(caseData.hearings || [])];
    if (editingHearing) {
      hearings[editingHearing.index] = hearing;
    } else {
      hearings.push(hearing);
    }
    await base44.entities.Case.update(caseData.id, { hearings });
    setCaseData({ ...caseData, hearings });
  };

  const handleDeleteHearing = async (index) => {
    if (!confirm("למחוק את הדיון?")) return;
    const hearings = (caseData.hearings || []).filter((_, i) => i !== index);
    await base44.entities.Case.update(caseData.id, { hearings });
    setCaseData({ ...caseData, hearings });
  };

  const getQuickDueDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  if (isLoading || !caseData) return null;

  const isAdmin = currentUser?.role === 'admin';
  
  const financials = caseData.case_type === 'דיני עבודה - עובדים זרים' ? {
    fee: 300, salary: 4095, profit: 4065, total: 4395
  } : null;

  const statusColors = {
    'תיק נכנס': 'bg-blue-100 text-blue-800',
    'עריכת כתב תביעה': 'bg-indigo-100 text-indigo-800',
    'פסק דין': 'bg-green-100 text-green-800',
    'ארכיון': 'bg-slate-100 text-slate-800'
  };

  const daysOpen = caseData.open_date ? Math.floor((Date.now() - new Date(caseData.open_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const nextHearing = caseData.hearings?.find(h => new Date(h.date) > new Date()) || null;

  // Mini Dashboard Stats
  const stats = [
    { title: "ימים פתוח", value: daysOpen, icon: Clock, color: "bg-blue-600" },
    { title: "משימות פתוחות", value: caseTasks.filter(t => t.status !== 'הושלמה').length, icon: CheckSquare, color: "bg-orange-500" },
    { title: "מסמכים", value: caseData.documents?.length || 0, icon: FileText, color: "bg-purple-500" },
    ...(isAdmin && financials ? [{ title: "רווח צפוי", value: financials.profit, icon: DollarSign, color: "bg-emerald-600", isCurrency: true }] : [])
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900">{caseData.case_name}</h1>
            <Badge className={`${statusColors[caseData.status] || 'bg-slate-100 text-slate-800'} text-xs md:text-sm px-2 md:px-3 py-1 shadow-sm w-fit`}>
              {caseData.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-slate-500">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">#{caseData.case_number}</span>
            {caseData.net_hamishpat_number && <span className="text-xs md:text-sm">נט המשפט: {caseData.net_hamishpat_number}</span>}
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <Button onClick={() => setIsEditing(true)} variant="outline" className="bg-white hover:bg-slate-50 flex-1 md:flex-none">
            <Pencil className="w-4 h-4 ml-2" /> ערוך
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="bg-white text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <CaseForm caseData={caseData} clients={clients} onSubmit={handleUpdateCase} onCancel={() => setIsEditing(false)} />
      ) : (
        <Tabs defaultValue="overview" className="space-y-6 md:space-y-8">
          <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent gap-6 overflow-x-auto flex-nowrap">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 ml-2" />
              סקירה
            </TabsTrigger>
            <TabsTrigger 
              value="roadmap" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Flag className="w-4 h-4 ml-2" />
              סדרי דין
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 ml-2" />
              פרטים
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <CheckSquare className="w-4 h-4 ml-2" />
              משימות ({caseTasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <FolderOpen className="w-4 h-4 ml-2" />
              מסמכים
            </TabsTrigger>
            <TabsTrigger 
              value="appendices" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 ml-2" />
              עורך נספחים
            </TabsTrigger>
            <TabsTrigger 
              value="signature" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <FileSignature className="w-4 h-4 ml-2" />
              חתימה מרחוק
            </TabsTrigger>
            <TabsTrigger 
              value="hearings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Scale className="w-4 h-4 ml-2" />
              דיונים ({caseData.hearings?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Activity className="w-4 h-4 ml-2" />
              ציר זמן
            </TabsTrigger>
            <TabsTrigger 
              value="worktime" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Timer className="w-4 h-4 ml-2" />
              שעון עבודה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Mini Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <StatsCard key={i} {...stat} bgColor={stat.color} />
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    פרטי התיק
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                  <InfoItem label="סוג תיק" value={caseData.case_type} />
                  <InfoItem label="תאריך פתיחה" value={new Date(caseData.open_date).toLocaleDateString('he-IL')} icon={Calendar} />
                  <InfoItem label="יעד לסגירה" value={caseData.target_close_date ? new Date(caseData.target_close_date).toLocaleDateString('he-IL') : '-'} icon={Clock} />
                  <InfoItem label="אחראי" value={caseData.assigned_to || 'לא שויך'} icon={UserIcon} />
                  
                  {caseData.case_description && (
                   <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <p className="text-xs font-bold text-slate-500 uppercase mb-2">תיאור המקרה</p>
                     <p className="text-sm text-slate-700 whitespace-pre-wrap">{caseData.case_description}</p>
                   </div>
                  )}

                  {nextHearing && (
                   <div className="md:col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                     <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                       <Scale className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="text-xs font-bold text-amber-800 uppercase">דיון קרוב</p>
                       <p className="font-medium text-amber-900">
                         {new Date(nextHearing.date).toLocaleDateString('he-IL')} - {nextHearing.description}
                       </p>
                     </div>
                   </div>
                  )}
                </CardContent>
              </Card>

              {/* Client & Defendant */}
              <div className="space-y-6">
                {client && (
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-base">לקוח</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                          {client.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{client.full_name}</h3>
                          <p className="text-sm text-slate-500">{client.classification}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                          <Phone className="w-4 h-4 text-slate-400" /> {client.phone}
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                          <Briefcase className="w-4 h-4 text-slate-400" /> {client.id_number}
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => navigate(createPageUrl(`ClientDetails?id=${client.id}`))}>
                        כרטיס לקוח
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {caseData.defendant_name && (
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-base">נתבע / צד שכנגד</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xl">
                          <Building className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{caseData.defendant_name}</h3>
                          <p className="text-sm text-slate-500">{caseData.defendant_contact || 'אין איש קשר'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roadmap">
            <ProceduralRoadmap caseId={caseData.id} />
          </TabsContent>

          <TabsContent value="details">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>תיאור מפורט</CardTitle>
                {!isEditingDescription ? (
                  <Button variant="ghost" onClick={() => setIsEditingDescription(true)}>
                    <Pencil className="w-4 h-4 ml-2" /> ערוך
                  </Button>
                ) : (
                  <Button onClick={handleSaveDescription}>שמור</Button>
                )}
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none p-6">
                {isEditingDescription ? (
                  <ReactQuill theme="snow" value={detailedDescription} onChange={setDetailedDescription} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: detailedDescription || '<p class="text-slate-400 italic">אין תיאור מפורט.</p>' }} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="shadow-sm border-slate-200 bg-slate-50/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>משימות התיק</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={openNewTaskDialog} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 ml-2" /> משימה חדשה
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl("Tasks"))}>ניהול מלא</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 grid gap-4">
                {caseTasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.status === 'הושלמה' 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {task.status === 'הושלמה' && <Check className="w-4 h-4" />}
                      </button>
                      <div>
                        <p className={`font-bold ${task.status === 'הושלמה' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {task.description}
                        </p>
                        <div className="flex gap-2 text-xs text-slate-500 mt-1">
                          <Badge variant="outline" className={
                            task.priority === 'דחוף' ? 'border-red-300 text-red-700' :
                            task.priority === 'גבוה' ? 'border-orange-300 text-orange-700' :
                            'border-slate-300'
                          }>{task.priority}</Badge>
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString('he-IL')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={task.status === 'הושלמה' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                        {task.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEditTaskDialog(task)} className="h-8 w-8 text-slate-400 hover:text-slate-700">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {caseTasks.length === 0 && (
                  <div className="text-center py-12">
                    <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">אין משימות לתיק זה</p>
                    <Button onClick={openNewTaskDialog} variant="outline">
                      <Plus className="w-4 h-4 ml-2" /> צור משימה ראשונה
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Dialog */}
            <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>{editingTask ? 'עריכת משימה' : 'משימה חדשה'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">תיאור המשימה</label>
                    <Textarea
                      placeholder="מה צריך לעשות?"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">עדיפות</label>
                      <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
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

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">סטטוס</label>
                      <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v })}>
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
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">תאריך יעד</label>
                    <Input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setTaskForm({ ...taskForm, due_date: getQuickDueDate(1) })}
                      >
                        מחר
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setTaskForm({ ...taskForm, due_date: getQuickDueDate(3) })}
                      >
                        3 ימים
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setTaskForm({ ...taskForm, due_date: getQuickDueDate(7) })}
                      >
                        שבוע
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setShowTaskDialog(false)}>ביטול</Button>
                  <Button onClick={handleSaveTask} disabled={!taskForm.description.trim()}>
                    {editingTask ? 'עדכן' : 'צור משימה'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <GoogleDriveWidget 
                                  caseId={caseData.id}
                                  caseNumber={caseData.case_number}
                                  clientName={client?.full_name || 'לקוח'}
                                  initialFolderId={caseData.google_drive_folder_id}
                                  onFolderCreated={async (folderId) => {
                                      const updated = await base44.entities.Case.get(caseData.id);
                                      setCaseData(updated);
                                  }}
                              />

            <div className="flex flex-col md:flex-row justify-end gap-3">
              <Button onClick={() => setShowClientLink(!showClientLink)} variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
                <LinkIcon className="w-4 h-4 ml-2" /> {showClientLink ? 'סגור קישור' : 'קישור ללקוח'}
              </Button>
              <Button onClick={() => setShowUpload(!showUpload)}>
                <Upload className="w-4 h-4 ml-2" /> {showUpload ? 'ביטול' : 'העלה מסמך'}
              </Button>
            </div>
            
            <AnimatePresence>
              {showClientLink && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <LinkIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-bold text-slate-900 mb-1">קישור להעלאת מסמכים ללקוח</h3>
                            <p className="text-sm text-slate-600">שלח קישור זה ללקוח כדי שיוכל להעלות מסמכים ישירות לתיק</p>
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              value={getClientUploadLink()} 
                              readOnly 
                              className="bg-white border-slate-300 text-sm font-mono"
                            />
                            <Button 
                              onClick={handleCopyLink} 
                              variant="outline"
                              className="shrink-0"
                            >
                              {linkCopied ? (
                                <>
                                  <Check className="w-4 h-4 ml-2 text-green-600" />
                                  הועתק
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 ml-2" />
                                  העתק
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs text-slate-600">
                            <strong>💡 טיפ:</strong> שלח את הקישור הזה ללקוח בווטסאפ, SMS או אימייל. הלקוח יוכל להעלות מסמכים ישירות והם יתווספו אוטומטית לתיק.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showUpload && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <DocumentUpload onUploadComplete={handleDocumentUpload} onCancel={() => setShowUpload(false)} />
                </motion.div>
              )}
            </AnimatePresence>
            {intakeForm && <IntakeFormViewer formData={intakeForm} />}
            {intakeForm && <SignedDocumentsViewer intakeForm={intakeForm} />}
            <DocumentList 
                documents={caseData.documents || []} 
                onDelete={handleDocumentDelete} 
                onEdit={handleDocumentEdit}
            />
          </TabsContent>

          <TabsContent value="appendices">
            <AppendicesEditor caseId={caseData.id} />
          </TabsContent>

          <TabsContent value="signature">
            <CaseSignatureWidget 
              caseId={caseData.id}
              clientId={client?.id}
              clientName={client?.full_name || caseData.client_name}
              clientPhone={client?.phone}
              clientEmail={client?.email}
            />
          </TabsContent>

          <TabsContent value="hearings">
            <HearingsList
              hearings={caseData.hearings || []}
              onAdd={openNewHearingDialog}
              onEdit={openEditHearingDialog}
              onDelete={handleDeleteHearing}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <CaseTimeline caseData={caseData} />
          </TabsContent>

          <TabsContent value="worktime">
            <WorkTimer caseId={caseData.id} caseName={caseData.case_name} />
          </TabsContent>
        </Tabs>
      )}

      <HearingDialog
        open={showHearingDialog}
        onOpenChange={setShowHearingDialog}
        caseId={caseData.id}
        editing={editingHearing}
        onSave={handleSaveHearing}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תיק</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו היא בלתי הפיכה.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">מחק לצמיתות</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NextStepDialog
        open={!!nextStep}
        completedStep={nextStep}
        onClose={handleNextStepClose}
        onConfirm={handleNextStepConfirm}
      />
    </div>
  );
}

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-2 text-slate-700 font-medium">
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      {value}
    </div>
  </div>
);

const DriveFolderWidget = ({ caseData, onSyncComplete }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [manualFolderId, setManualFolderId] = useState("");

    const handleCreateFolder = async () => {
        setIsCreating(true);
        try {
            const { data } = await base44.functions.invoke('googleDrive', {
                action: 'create_case_folder',
                uploadData: {
                    caseId: caseData.id,
                    caseName: `${caseData.case_name} - ${caseData.case_number}`
                }
            });
            if (data.error) throw new Error(data.error);
            
            const updatedCase = await base44.entities.Case.get(caseData.id);
            onSyncComplete(updatedCase);
            alert("תיקייה נוצרה בהצלחה ב-Google Drive!");
        } catch (error) {
            console.error(error);
            alert("שגיאה ביצירת תיקייה: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleLinkFolder = async () => {
        if (!manualFolderId) return;
        setIsLinking(true);
        try {
             let folderId = manualFolderId;
             // Extract ID if full URL pasted
             if (folderId.includes('drive.google.com')) {
                 const match = folderId.match(/folders\/([-a-zA-Z0-9_]+)/);
                 if (match) folderId = match[1];
             }

            await base44.entities.Case.update(caseData.id, {
                google_drive_folder_id: folderId
            });
            
            const updatedCase = await base44.entities.Case.get(caseData.id);
            onSyncComplete(updatedCase);
            setShowLinkInput(false);
            alert("תיקייה קושרה בהצלחה!");
        } catch (error) {
            console.error(error);
            alert("שגיאה בקישור תיקייה: " + error.message);
        } finally {
            setIsLinking(false);
        }
    };

    const handleSync = async () => {
        if (!caseData.google_drive_folder_id) return;
        setIsSyncing(true);
        try {
            const { data } = await base44.functions.invoke('googleDrive', {
                action: 'sync_folder_to_case',
                uploadData: {
                    caseId: caseData.id,
                    folderId: caseData.google_drive_folder_id
                }
            });
            if (data.error) throw new Error(data.error);
            
            const updatedCase = await base44.entities.Case.get(caseData.id);
            onSyncComplete(updatedCase);
            alert(`סנכרון הושלם! נוספו ${data.added} קבצים חדשים.`);
        } catch (error) {
            console.error(error);
            alert("שגיאה בסנכרון: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleOpenDrive = () => {
        if (caseData.google_drive_folder_id) {
            window.open(`https://drive.google.com/drive/folders/${caseData.google_drive_folder_id}`, '_blank');
        }
    };

    return (
        <Card className="border-blue-100 bg-white shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                        <HardDrive className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">תיקיית Drive</h3>
                        <p className="text-sm text-slate-500">
                            {caseData.google_drive_folder_id 
                                ? "תיקייה מקושרת ומסונכרנת" 
                                : "עדיין לא מקושר ל-Google Drive"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {caseData.google_drive_folder_id ? (
                        <>
                            <Button 
                                onClick={handleOpenDrive} 
                                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <ExternalLink className="w-4 h-4 ml-2" />
                                פתח תיקיית Drive
                            </Button>
                            <Button 
                                onClick={handleSync} 
                                variant="outline"
                                className="flex-1 md:flex-none border-slate-200 text-slate-700 hover:bg-slate-50"
                                disabled={isSyncing}
                            >
                                <RefreshCw className={`w-4 h-4 ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'מסנכרן...' : 'סנכרן עם Drive'}
                            </Button>
                        </>
                    ) : (
                        !showLinkInput ? (
                            <>
                                <Button 
                                    onClick={handleCreateFolder} 
                                    className="bg-slate-900 hover:bg-slate-800 text-white"
                                    disabled={isCreating}
                                >
                                    <Plus className="w-4 h-4 ml-2" />
                                    {isCreating ? 'יוצר...' : 'צור תיקיית Drive חדשה'}
                                </Button>
                                <Button 
                                    onClick={() => setShowLinkInput(true)} 
                                    variant="outline"
                                    className="border-slate-300"
                                >
                                    <LinkIcon className="w-4 h-4 ml-2" />
                                    חבר תיקייה קיימת
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <Input 
                                    placeholder="הדבק קישור לתיקייה או ID" 
                                    value={manualFolderId}
                                    onChange={e => setManualFolderId(e.target.value)}
                                    className="w-64 bg-white"
                                    autoFocus
                                />
                                <Button onClick={handleLinkFolder} disabled={isLinking || !manualFolderId} size="sm">
                                    {isLinking ? 'שומר...' : 'שמור'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowLinkInput(false)}>
                                    ביטול
                                </Button>
                            </div>
                        )
                    )}
                </div>
            </div>
            {!caseData.google_drive_folder_id && (
                <div className="px-4 pb-4 text-xs text-slate-500 bg-slate-50/50 pt-2 border-t border-slate-100">
                    💡 יצירת תיקייה תאפשר לך לנהל את מסמכי התיק ב-Google Drive ולסנכרן אותם אוטומטית למערכת.
                </div>
            )}
        </Card>
    );
};