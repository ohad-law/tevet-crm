import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Briefcase, Download, Trash2, Edit, Archive, FileSpreadsheet, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

import CaseForm from "../components/cases/CaseForm";
import UnifiedCaseForm from "../components/cases/UnifiedCaseForm";
import DataImporter from "../components/import/DataImporter";


export default function Cases() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  

  




  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [casesData, clientsData, userData] = await Promise.all([
      base44.entities.Case.list("-created_date"),
      base44.entities.Client.list(),
      base44.auth.me().catch(() => null)
    ]);
    setCases(casesData);
    setClients(clientsData);
    setCurrentUser(userData);
    setIsLoading(false);
  };

  // Handler for editing existing cases
  const handleEditCaseSubmit = async (caseData) => {
    if (editingCase) {
      await base44.entities.Case.update(editingCase.id, caseData);
      
      // Notify Admin
      base44.functions.invoke('notifyAdmin', {
        entity: 'Case',
        action: 'update',
        details: `עודכן תיק:\nשם: ${caseData.case_name}\nמספר: ${caseData.case_number}\nסטטוס: ${caseData.status}`
      });
    }
    setShowForm(false);
    setEditingCase(null);
    loadData();
  };

  // Handler for creating new cases
  const handleNewCaseSubmit = async (formData) => {
    try {
      let clientId = formData.client_id;

      if (!clientId && formData.new_client) {
        const newClient = await base44.entities.Client.create(formData.new_client);
        clientId = newClient.id;
      } else if (!clientId) {
        throw new Error("חובה לבחור לקוח קיים או ליצור לקוח חדש.");
      }

      const allCases = await base44.entities.Case.list();
      const year = new Date().getFullYear();
      const casesThisYear = allCases.filter(c => c.case_number?.startsWith(`${year}-`));
      
      const existingNumbers = casesThisYear
        .map(c => {
          const parts = c.case_number.split('-');
          return parts.length === 2 ? parseInt(parts[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      let nextNumber = 1;
      if (existingNumbers.length > 0) {
          nextNumber = Math.max(...existingNumbers) + 1;
      }
      const caseNumber = `${year}-${String(nextNumber).padStart(3, '0')}`;

      const caseData = {
        case_number: caseNumber,
        case_name: formData.case_name,
        client_id: clientId,
        case_type: formData.case_type,
        parties: formData.parties,
        case_description: formData.case_description,
        value: formData.value,
        open_date: formData.open_date,
        assigned_to: formData.assigned_to,
        status: 'תיק נכנס',
        folder_id: formData.folder_id || null,
        subfolder_id: formData.subfolder_id || null
      };

      const newCase = await base44.entities.Case.create(caseData);

      // Notify Admin
      base44.functions.invoke('notifyAdmin', {
        entity: 'Case',
        action: 'create',
        details: `נוצר תיק חדש:\nשם: ${caseData.case_name}\nמספר: ${caseData.case_number}\nסוג: ${caseData.case_type}`
      });

      if (formData.create_initial_task && formData.task_description) {
        await base44.entities.Task.create({
          description: formData.task_description,
          case_id: newCase.id,
          priority: formData.task_priority,
          due_date: formData.task_due_date,
          status: 'לביצוע',
          assigned_to: formData.assigned_to,
          task_type: 'משימה ראשונית'
        });
      }

      if (formData.send_message_to_worker && formData.message_to_worker && currentUser) {
        await base44.entities.Message.create({
          from_email: currentUser.email,
          from_name: currentUser.full_name,
          to_email: formData.assigned_to, 
          to_name: formData.assigned_to,
          message: formData.message_to_worker,
          related_case_id: newCase.id,
          priority: formData.task_priority || 'רגיל',
          message_type: 'תיק חדש',
          is_read: false,
          is_confirmed: false
        });
      }

      setShowForm(false);
      setEditingCase(null);
      loadData();
    } catch (error) {
      console.error("Error creating case:", error);
      alert("שגיאה ביצירת התיק: " + error.message);
    }
  };

  const handleImport = async (data) => {
    const processedData = [];
    const allExistingCases = await base44.entities.Case.list();
    const year = new Date().getFullYear();

    const existingCaseNumbersForYear = allExistingCases
      .filter(c => c.case_number?.startsWith(`${year}-`))
      .map(c => {
        const parts = c.case_number.split('-');
        return parts.length === 2 ? parseInt(parts[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    let currentMaxNumber = existingCaseNumbersForYear.length > 0 ? Math.max(...existingCaseNumbersForYear) : 0;

    for (const caseData of data) {
      currentMaxNumber++;
      const caseNumber = `${year}-${String(currentMaxNumber).padStart(3, '0')}`;
      processedData.push({
        ...caseData,
        case_number: caseNumber,
        open_date: caseData.open_date || new Date().toISOString().split('T')[0],
        folder_id: null
      });
    }

    await base44.entities.Case.bulkCreate(processedData);
    setShowImporter(false);
    loadData();
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setShowForm(true);
  };

  const handleDelete = async () => {
    const isAdmin = currentUser?.role === 'admin';
    const hasPermission = currentUser?.specific_permissions?.includes('delete_cases');
    
    if (!isAdmin && !hasPermission) {
      alert("אין לך הרשאה למחוק תיקים");
      setDeleteDialogOpen(false);
      return;
    }

    if (caseToDelete) {
      await base44.entities.Case.delete(caseToDelete.id);
      
      // Notify Admin
      base44.functions.invoke('notifyAdmin', {
        entity: 'Case',
        action: 'delete',
        details: `נמחק תיק:\nשם: ${caseToDelete.case_name}\nמספר: ${caseToDelete.case_number}`
      });

      setDeleteDialogOpen(false);
      setCaseToDelete(null);
      loadData();
    }
  };

  const handleArchive = async (caseItem) => {
    await base44.entities.Case.update(caseItem.id, { ...caseItem, status: 'ארכיון' });
    
    // Notify Admin
    base44.functions.invoke('notifyAdmin', {
        entity: 'Case',
        action: 'archive',
        details: `תיק הועבר לארכיון:\nשם: ${caseItem.case_name}`
    });

    loadData();
  };



  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לקוח לא ידוע';
  };

  const calculateForeignWorkerFinancials = (caseItem) => {
    if (caseItem.case_type === 'דיני עבודה - עובדים זרים') {
      const fee = 300;
      const salary = 4095;
      const profit = 4065;
      return { fee, salary, profit, total: fee + salary };
    }
    return null;
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    const isAdmin = currentUser?.role === 'admin';
    
    const exportData = filteredCases.map(caseItem => {
      const financials = calculateForeignWorkerFinancials(caseItem);
      
      const baseData = {
        'מספר תיק': caseItem.case_number,
        'שם תיק': caseItem.case_name,
        'לקוח': getClientName(caseItem.client_id),
        'סוג תיק': caseItem.case_type,
        'סטטוס': caseItem.status,
        'תאריך פתיחה': caseItem.open_date ? new Date(caseItem.open_date).toLocaleDateString('he-IL') : '',
        'יעד לסגירה': caseItem.target_close_date ? new Date(caseItem.target_close_date).toLocaleDateString('he-IL') : '',
        'עובד אחראי': caseItem.assigned_to || ''
      };
      
      if (isAdmin) {
        if (financials) {
          return {
            ...baseData,
            'עלות אגרה (₪)': financials.fee,
            'שכ"ט (₪)': financials.salary,
            'רווח נקי (₪)': financials.profit,
            'סה"כ (₪)': financials.total
          };
        } else {
          return {
            ...baseData,
            'ערך תיק (₪)': caseItem.value || 0
          };
        }
      }
      
      return baseData;
    });

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `תיקים_${new Date().toLocaleDateString('he-IL')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.case_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_number?.includes(searchTerm) ||
      getClientName(caseItem.client_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || caseItem.status === filterStatus;
    const matchesType = filterType === "all" || caseItem.case_type === filterType;
    const matchesActiveFilter = !showActiveOnly || (caseItem.status !== 'ארכיון' && caseItem.status !== 'פסק דין');
    
    return matchesSearch && matchesStatus && matchesType && matchesActiveFilter;
  });

  const isAdmin = currentUser?.role === 'admin';

  const statusColors = {
    'תיק נכנס': 'bg-blue-50 text-blue-700 border-blue-200',
    'עריכת כתב תביעה': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'מעקב מספר הליך בנט': 'bg-purple-50 text-purple-700 border-purple-200',
    'מסירה אישית/דואר ישראל': 'bg-pink-50 text-pink-700 border-pink-200',
    'הודעה על המצאה': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'תצהיר גילוי מסמכים': 'bg-amber-50 text-amber-700 border-amber-200',
    'תצהיר עדות ראשית': 'bg-orange-50 text-orange-700 border-orange-200',
    'הוכחות': 'bg-red-50 text-red-700 border-red-200',
    'סיכומים': 'bg-teal-50 text-teal-700 border-teal-200',
    'פסק דין': 'bg-green-50 text-green-700 border-green-200',
    'ארכיון': 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <>
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-200/60">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">תיקים</h1>
            <p className="text-slate-500 text-lg">ניהול וארגון תיקים משפטיים</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowImporter(true)}
              className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              ייבוא
            </Button>
            <Button
              variant="outline"
              onClick={downloadExcel}
              disabled={isExporting || filteredCases.length === 0}
              className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            >
              <Download className="w-4 h-4 ml-2" />
              ייצוא
            </Button>
            <Button
              onClick={() => {
                setEditingCase(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 text-white"
            >
              <Plus className="w-5 h-5 ml-2" />
              תיק חדש
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Content - Cases */}
          <div>
            <AnimatePresence>
              {showImporter && (
                <DataImporter
                  entityName="Case"
                  schema={base44.entities.Case.schema()}
                  onImportComplete={handleImport}
                  onCancel={() => setShowImporter(false)}
                />
              )}
              {showForm && !editingCase && (
                <UnifiedCaseForm
                  existingClients={clients}
                  onSubmit={handleNewCaseSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingCase(null);
                  }}
                />
              )}
              {showForm && editingCase && (
                <CaseForm
                  caseData={editingCase}
                  clients={clients}
                  onSubmit={handleEditCaseSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingCase(null);
                  }}
                />
              )}
            </AnimatePresence>

            <Card className="mb-6 shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">סינון וחיפוש</span>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="חיפוש תיק..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-9 border-slate-200 focus:border-blue-500"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסטטוסים</SelectItem>
                      {Object.keys(statusColors).map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="סוג תיק" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסוגים</SelectItem>
                      <SelectItem value="דיני עבודה - תביעה">דיני עבודה - תביעה</SelectItem>
                      <SelectItem value="דיני עבודה - עובדים זרים">דיני עבודה - עובדים זרים</SelectItem>
                      <SelectItem value="חדלות פירעון">חדלות פירעון</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={showActiveOnly ? "active" : "all"} onValueChange={(value) => setShowActiveOnly(value === "active")}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">תיקים פעילים בלבד</SelectItem>
                      <SelectItem value="all">כל התיקים</SelectItem>
                    </SelectContent>
                  </Select>
                  
                </div>
              </CardContent>
            </Card>

            {/* Cases List */}
            <div className="grid gap-4">
              <AnimatePresence>
                    {filteredCases.map((caseItem, index) => {
                      const financials = calculateForeignWorkerFinancials(caseItem);
                      
                      return (
                            <motion.div
                              key={caseItem.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                            >
                              <Card className="hover:shadow-md transition-all duration-200 border border-slate-200 bg-white group">
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 flex-1">
                                      <Link to={createPageUrl(`CaseDetails?id=${caseItem.id}`)} className="flex-1 w-full">
                                        <div className="flex items-start gap-4 mb-2">
                                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Briefcase className="w-5 h-5 text-slate-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                              <h3 className="text-lg font-bold text-slate-900 truncate">{caseItem.case_name}</h3>
                                              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200 font-mono">
                                                #{caseItem.case_number}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">לקוח</p>
                                            <p className="font-medium text-sm text-slate-700 truncate">{getClientName(caseItem.client_id)}</p>
                                          </div>
                                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">סוג</p>
                                            <p className="font-medium text-sm text-slate-700 truncate">{caseItem.case_type}</p>
                                          </div>
                                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">אחראי</p>
                                            <p className="font-medium text-sm text-slate-700 truncate">{caseItem.assigned_to || 'לא שויך'}</p>
                                          </div>
                                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">נפתח ב</p>
                                            <p className="font-medium text-sm text-slate-700">{caseItem.open_date ? new Date(caseItem.open_date).toLocaleDateString('he-IL') : '-'}</p>
                                          </div>
                                        </div>
                                        
                                        {financials && isAdmin && (
                                          <div className="mt-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-emerald-700 font-medium">רווח נקי צפוי:</span>
                                              <span className="font-bold text-emerald-700">₪{financials.profit.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        )}
                                      </Link>

                                      <div className="flex flex-row md:flex-col gap-2 items-end">
                                        <Badge className={`${statusColors[caseItem.status]} border shadow-sm font-medium whitespace-nowrap`}>
                                          {caseItem.status}
                                        </Badge>
                                        
                                        <div className="flex gap-1 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleEdit(caseItem);
                                            }}
                                            title="ערוך"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          {caseItem.status !== 'ארכיון' && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                handleArchive(caseItem);
                                              }}
                                              title="ארכיון"
                                            >
                                              <Archive className="w-4 h-4" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setCaseToDelete(caseItem);
                                              setDeleteDialogOpen(true);
                                            }}
                                            title="מחק"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                      );
                    })}
                  </AnimatePresence>

              {filteredCases.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">לא נמצאו תיקים</h3>
                      <p className="text-slate-500">נסה לשנות את מונחי החיפוש או הסינון</p>
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את התיק לצמיתות. לא ניתן לשחזר תיק שנמחק.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}