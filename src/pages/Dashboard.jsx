import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users as UsersIcon, Briefcase, CheckSquare, TrendingUp, DollarSign, Clock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StatsCard from "../components/dashboard/StatsCard";
import RevenueBarChart from "../components/dashboard/RevenueBarChart";
import CaseDistribution from "../components/dashboard/CaseDistribution";
import WorkloadStatus from "../components/dashboard/WorkloadStatus";

import UrgentCases from "../components/dashboard/UrgentCases";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FeeWidget from "../components/dashboard/FeeWidget";
import UnassignedFoldersWidget from "../components/dashboard/UnassignedFoldersWidget";
import FinancialForecast from "../components/dashboard/FinancialForecast";
import StagnantCases from "../components/dashboard/StagnantCases";
import ProceduralAlerts from "../components/dashboard/ProceduralAlerts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({ pages: [], specific: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);



  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      const [casesData, clientsData, tasksData, attendancesData, foldersData, allPerms] = await Promise.all([
        base44.entities.Case.list(),
        base44.entities.Client.list(),
        base44.entities.Task.list(),
        base44.entities.Attendance.list("-date"),
        base44.entities.Folder.list(),
        base44.entities.UserPermission.list()
      ]);

      setCases(casesData);
      setClients(clientsData);
      setTasks(tasksData);
      setAttendances(attendancesData);
      setFolders(foldersData);

      const myPerms = allPerms.find(p => p.email === userData.email);
      if (myPerms) {
        setUserPermissions({
          pages: myPerms.allowed_pages || [],
          specific: myPerms.specific_permissions || []
        });
      }

      if (userData.role === 'admin' || (myPerms?.specific_permissions?.includes("view_finance"))) {
        const incomesData = await base44.entities.Income.list("-date");
        setIncomes(incomesData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setIsLoading(false);
    }
  };

  const handleAssignFromWidget = (folder) => {
    navigate(createPageUrl("Cases"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const hasPermission = (permission) => isAdmin || userPermissions.specific.includes(permission);
  const hasPageAccess = (page) => isAdmin || userPermissions.pages.includes(page);
  
  const userCases = isAdmin ? cases : cases.filter(c => c.assigned_to === currentUser.email);
  const userTasks = isAdmin ? tasks : tasks.filter(t => t.assigned_to === currentUser.email);
  
  const activeCases = isAdmin 
    ? cases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין')
    : userCases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין');
    
  const pendingTasks = isAdmin
    ? tasks.filter(t => t.status === 'לביצוע' || t.status === 'בטיפול')
    : userTasks.filter(t => t.status === 'לביצוע' || t.status === 'בטיפול');
    
  const urgentTasks = isAdmin
    ? tasks.filter(t => t.priority === 'דחוף' && t.status !== 'הושלמה')
    : userTasks.filter(t => t.priority === 'דחוף' && t.status !== 'הושלמה');

  const todayTasks = userTasks.filter(t => {
    if (t.status === 'הושלמה') return false;
    if (!t.due_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.due_date === today;
  }).slice(0, 5);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const userAttendances = attendances.filter(a => {
    if (a.user_email !== currentUser.email) return false;
    const date = new Date(a.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalWorkHours = userAttendances.reduce((sum, a) => sum + (a.total_hours || 0), 0);

  const revenueData = [];
  if (hasPermission("view_finance")) {
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('he-IL', { month: 'short' });
      
      const monthIncome = incomes.filter(inc => {
        if (!inc.date) return false;
        const incDate = new Date(inc.date);
        return incDate.getMonth() === date.getMonth() && 
               incDate.getFullYear() === date.getFullYear() &&
               inc.status === 'שולם';
      }).reduce((sum, inc) => sum + inc.amount, 0);

      revenueData.push({ month: monthStr, revenue: monthIncome });
    }
  }

  const thisMonthIncome = hasPermission("view_finance") ? incomes.filter(i => {
    const date = new Date(i.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear() &&
           i.status === 'שולם';
  }).reduce((sum, i) => sum + i.amount, 0) : 0;

  const getCaseName = (caseId) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem ? `${caseItem.case_name} (#${caseItem.case_number})` : '';
  };

  const priorityColors = {
    'דחוף': 'bg-red-50 text-red-700 border-red-200',
    'גבוה': 'bg-orange-50 text-orange-700 border-orange-200',
    'רגיל': 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 tracking-tight">
            👋 שלום, {currentUser?.full_name || 'משתמש'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isAdmin ? 'סקירה מערכתית בזמן אמת' : 'ניהול משימות ותיקים אישי'}
          </p>
        </div>
        
        <Button
          onClick={() => navigate(createPageUrl("Cases"))}
          size="sm"
          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-9 px-4 rounded-lg shadow-sm transition-all duration-200 hover:translate-y-[-1px]"
        >
          <Plus className="w-4 h-4 ml-2" />
          תיק חדש
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {hasPageAccess("Clients") && (
          <StatsCard
            title={isAdmin ? "לקוחות פעילים" : "לקוחות"}
            value={clients.filter(c => c.status === 'פעיל').length}
            icon={UsersIcon}
            bgColor="bg-blue-600"
            subtitle={`${clients.length} סה"כ`}
          />
        )}
        
        {hasPageAccess("Cases") && (
          <StatsCard
            title={isAdmin ? "תיקים פתוחים" : "התיקים שלי"}
            value={activeCases.length}
            icon={Briefcase}
            bgColor="bg-indigo-600"
            subtitle={isAdmin ? `${cases.length} סה"כ` : `${userCases.length} הוקצו`}
          />
        )}
        
        {hasPageAccess("Tasks") && (
          <StatsCard
            title={isAdmin ? "משימות פתוחות" : "משימות לביצוע"}
            value={pendingTasks.length}
            icon={CheckSquare}
            bgColor="bg-sky-600"
            subtitle={urgentTasks.length > 0 ? `${urgentTasks.length} דחופות` : 'הכל בשליטה'}
          />
        )}
        
        {hasPermission("view_finance") ? (
          <StatsCard
            title="הכנסות החודש"
            value={thisMonthIncome}
            icon={DollarSign}
            bgColor="bg-emerald-600"
            isCurrency={true}
          />
        ) : (
          <StatsCard
            title="שעות החודש"
            value={totalWorkHours.toFixed(1)}
            icon={Clock}
            bgColor="bg-emerald-600"
            subtitle="דיווח נוכחות"
          />
        )}
      </div>

      {/* Urgent Cases Section */}
      {(activeCases.length > 0) && (
        <div className="grid grid-cols-1 gap-6">
          <UrgentCases cases={activeCases} clients={clients} />
        </div>
      )}

      {/* Personal Tasks Section (Non-Admin) */}
      {!isAdmin && todayTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                משימות להיום
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl("Tasks"))} className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium">
                לכל המשימות
              </Button>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                {todayTasks.map((task, index) => (
                  <div key={task.id} className="group flex items-start justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-default">
                    <div className="flex gap-4">
                      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        task.priority === 'דחוף' ? 'bg-red-500 ring-red-100' : 
                        task.priority === 'גבוה' ? 'bg-orange-500 ring-orange-100' : 'bg-blue-500 ring-blue-100'
                      }`} />
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{task.description}</p>
                        {task.case_id && (
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            {getCaseName(task.case_id)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={priorityColors[task.priority] + " shadow-none font-medium"}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Personal Cases Section (Non-Admin) */}
      {!isAdmin && userCases.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                התיקים שלי
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl("Cases"))} className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium">
                לכל התיקים
              </Button>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCases.slice(0, 4).map((caseItem) => {
                  const caseClient = clients.find(c => c.id === caseItem.client_id);
                  return (
                    <Link key={caseItem.id} to={createPageUrl(`CaseDetails?id=${caseItem.id}`)}>
                      <div className="p-5 border border-slate-100 rounded-xl hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-900/5 transition-all duration-300 group bg-white h-full flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-lg">{caseItem.case_name}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 bg-slate-50 inline-block px-1.5 py-0.5 rounded">#{caseItem.case_number}</p>
                          </div>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-medium">
                            {caseItem.status}
                          </Badge>
                        </div>
                        <div className="mt-auto flex items-center gap-2 text-sm text-slate-600 pt-2 border-t border-slate-50">
                          <UsersIcon className="w-4 h-4 text-slate-400" />
                          {caseClient?.full_name || 'ללא לקוח'}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Admin/Advanced Widgets */}
      <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        {/* Analytics & Finance */}
        {(hasPermission("view_analytics") || hasPermission("view_finance")) && (
          <div className="grid lg:grid-cols-2 gap-6">
            {hasPermission("view_analytics") && <FinancialForecast cases={cases} />}
            {hasPermission("view_analytics") && <StagnantCases cases={cases} clients={clients} />}
          </div>
        )}

        {/* Safety Net - For Admins or Procedural Dashboard Access */}
        {(isAdmin || hasPageAccess("ProceduresDashboard")) && (
          <ProceduralAlerts cases={cases} />
        )}

        {/* Folders Management - Admin Only usually */}
        {isAdmin && (
          <UnassignedFoldersWidget 
            folders={folders} 
            cases={cases}
            onAssignClick={handleAssignFromWidget}
          />
        )}

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {hasPermission("view_finance") && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 hover:shadow-md transition-shadow">
              <RevenueBarChart data={revenueData} />
            </div>
          )}
          {hasPermission("view_analytics") && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 hover:shadow-md transition-shadow">
              <CaseDistribution cases={cases} />
            </div>
          )}
        </div>

        {/* Workload & Fees */}
        <div className="grid lg:grid-cols-2 gap-6">
          {isAdmin && <WorkloadStatus cases={activeCases} tasks={tasks} />}
          {hasPermission("view_finance") && <FeeWidget />}
        </div>
      </div>
    </div>
  );
}