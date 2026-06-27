import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, Clock, Briefcase, Scale, AlertTriangle,
  CalendarDays, Zap, ChevronLeft, Sun, Sunset, Coffee
} from "lucide-react";

const TODAY = new Date().toISOString().split('T')[0];

const priorityConfig = {
  'דחוף': { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  'גבוה': { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  'רגיל': { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400' }
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'בוקר טוב', Icon: Coffee };
  if (hour < 17) return { text: 'צהריים טובים', Icon: Sun };
  return { text: 'ערב טוב', Icon: Sunset };
}

export default function WorkDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);

    const [allTasks, allCases] = await Promise.all([
      base44.entities.Task.list(),
      base44.entities.Case.list()
    ]);

    setTasks(allTasks);
    setCases(allCases);

    // Extract today's and upcoming hearings from cases
    const upcoming = [];
    allCases.forEach(c => {
      if (!c.hearings) return;
      c.hearings.forEach(h => {
        if (h.date >= TODAY) {
          upcoming.push({ ...h, case_name: c.case_name, case_id: c.id, case_number: c.case_number });
        }
      });
    });
    upcoming.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    setHearings(upcoming.slice(0, 10));

    setIsLoading(false);
  };

  const markTaskDone = async (taskId) => {
    await base44.entities.Task.update(taskId, { status: 'הושלמה' });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'הושלמה' } : t));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const myTasks = isAdmin ? tasks : tasks.filter(t => t.assigned_to === currentUser?.email);

  const todayTasks = myTasks.filter(t => t.due_date === TODAY && t.status !== 'הושלמה');
  const overdueTasks = myTasks.filter(t => t.due_date && t.due_date < TODAY && t.status !== 'הושלמה');
  const upcomingTasks = myTasks.filter(t => t.due_date && t.due_date > TODAY && t.status !== 'הושלמה');
  const urgentTasks = myTasks.filter(t => t.priority === 'דחוף' && t.status !== 'הושלמה' && (!t.due_date || t.due_date >= TODAY));

  const todayHearings = hearings.filter(h => h.date === TODAY);
  const futureHearings = hearings.filter(h => h.date > TODAY).slice(0, 5);

  const myCases = isAdmin ? cases : cases.filter(c => c.assigned_to === currentUser?.email);
  const activeCases = myCases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין');

  const getCaseName = (caseId) => {
    const c = cases.find(x => x.id === caseId);
    return c ? c.case_name : '';
  };

  const greeting = getGreeting();
  const GreetIcon = greeting.Icon;

  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <GreetIcon className="w-4 h-4" />
            <span>{greeting.text}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {currentUser?.full_name}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{dateStr}</p>
        </div>

        {/* Day Summary Chips */}
        <div className="flex flex-wrap gap-2">
          {todayHearings.length > 0 && (
            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-3 py-1.5 text-sm font-medium">
              <Scale className="w-4 h-4" />
              {todayHearings.length} דיון{todayHearings.length > 1 ? 'ים' : ''} היום
            </div>
          )}
          {todayTasks.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1.5 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {todayTasks.length} משימה{todayTasks.length > 1 ? 'ות' : ''} להיום
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full px-3 py-1.5 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {overdueTasks.length} באיחור
            </div>
          )}
        </div>
      </div>

      {/* TODAY'S HEARINGS */}
      {todayHearings.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600" />
            דיונים היום
          </h2>
          <div className="space-y-2">
            {todayHearings.map((h, i) => (
              <Link key={i} to={createPageUrl(`CaseDetails?id=${h.case_id}`)}>
                <Card className="border border-purple-200 bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{h.case_name}</p>
                        <p className="text-sm text-slate-500">{h.description || 'דיון'}{h.location ? ` · ${h.location}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {h.time && (
                        <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-lg px-3 py-1.5">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-purple-700">{h.time}</span>
                        </div>
                      )}
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* OVERDUE TASKS */}
      {overdueTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            באיחור — דורש טיפול מיידי
            <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">{overdueTasks.length}</Badge>
          </h2>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map(task => (
              <TaskRow key={task.id} task={task} getCaseName={getCaseName} onComplete={markTaskDone} isOverdue />
            ))}
          </div>
        </section>
      )}

      {/* TODAY TASKS */}
      {todayTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            משימות להיום
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs">{todayTasks.length}</Badge>
          </h2>
          <div className="space-y-2">
            {todayTasks.map(task => (
              <TaskRow key={task.id} task={task} getCaseName={getCaseName} onComplete={markTaskDone} />
            ))}
          </div>
        </section>
      )}

      {/* URGENT (no due date or future) */}
      {urgentTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            דחוף — ללא תאריך יעד קרוב
          </h2>
          <div className="space-y-2">
            {urgentTasks.slice(0, 5).map(task => (
              <TaskRow key={task.id} task={task} getCaseName={getCaseName} onComplete={markTaskDone} />
            ))}
          </div>
        </section>
      )}

      {/* 2-column: upcoming tasks + upcoming hearings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* UPCOMING TASKS */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            משימות קרובות
          </h2>
          <div className="space-y-2">
            {upcomingTasks.slice(0, 6).map(task => (
              <TaskRow key={task.id} task={task} getCaseName={getCaseName} onComplete={markTaskDone} compact />
            ))}
            {upcomingTasks.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">אין משימות קרובות</p>
            )}
          </div>
          {upcomingTasks.length > 6 && (
            <Link to={createPageUrl("Tasks")}>
              <Button variant="ghost" size="sm" className="mt-2 text-blue-600 hover:bg-blue-50 w-full">
                עוד {upcomingTasks.length - 6} משימות →
              </Button>
            </Link>
          )}
        </section>

        {/* UPCOMING HEARINGS */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            דיונים קרובים
          </h2>
          <div className="space-y-2">
            {futureHearings.map((h, i) => (
              <Link key={i} to={createPageUrl(`CaseDetails?id=${h.case_id}`)}>
                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/40 transition-all cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{h.case_name}</p>
                    <p className="text-xs text-slate-400">{h.description || 'דיון'}</p>
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <p className="text-sm font-bold text-purple-700">
                      {new Date(h.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    </p>
                    {h.time && <p className="text-xs text-slate-400">{h.time}</p>}
                  </div>
                </div>
              </Link>
            ))}
            {futureHearings.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">אין דיונים קרובים</p>
            )}
          </div>
        </section>
      </div>

      {/* ACTIVE CASES strip */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-500" />
            תיקים פעילים שלי ({activeCases.length})
          </h2>
          <Link to={createPageUrl("Cases")}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 text-xs">כל התיקים →</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeCases.slice(0, 6).map(c => {
            const pendingCount = tasks.filter(t => t.case_id === c.id && t.status !== 'הושלמה').length;
            return (
              <Link key={c.id} to={createPageUrl(`CaseDetails?id=${c.id}`)}>
                <div className="p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors leading-snug">{c.case_name}</p>
                    <span className="text-xs text-slate-400 font-mono shrink-0 mr-1">#{c.case_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs py-0 px-2 text-slate-500 border-slate-200">{c.status}</Badge>
                    {pendingCount > 0 && (
                      <span className="text-xs text-orange-600 font-medium">{pendingCount} משימות פתוחות</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TaskRow({ task, getCaseName, onComplete, isOverdue, compact }) {
  const [done, setDone] = useState(false);

  const handleComplete = async (e) => {
    e.preventDefault();
    setDone(true);
    await onComplete(task.id);
  };

  const cfg = priorityConfig[task.priority] || priorityConfig['רגיל'];

  if (done) return null;

  return (
    <div className={`flex items-start justify-between p-3 rounded-xl border transition-all group
      ${isOverdue ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'}
      ${compact ? 'py-2.5' : 'p-4'}
    `}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={handleComplete}
          className="mt-0.5 shrink-0 text-slate-300 hover:text-green-500 transition-colors"
        >
          <Circle className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className={`font-medium text-slate-800 leading-snug ${compact ? 'text-sm' : ''}`}>{task.description}</p>
          {task.case_id && !compact && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{getCaseName(task.case_id)}</p>
          )}
          {task.due_date && isOverdue && (
            <p className="text-xs text-red-500 mt-0.5 font-medium">
              היה אמור להסתיים: {new Date(task.due_date).toLocaleDateString('he-IL')}
            </p>
          )}
          {task.due_date && !isOverdue && !compact && (
            <p className="text-xs text-slate-400 mt-0.5">
              עד: {new Date(task.due_date).toLocaleDateString('he-IL')}
            </p>
          )}
        </div>
      </div>
      <Badge className={`${cfg.color} border text-xs shrink-0 mr-2 ${compact ? 'hidden' : ''}`}>
        {task.priority}
      </Badge>
    </div>
  );
}