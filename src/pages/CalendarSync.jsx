import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Check, ExternalLink, Clock, Scale, Flag } from "lucide-react";
import { motion } from "framer-motion";

export default function CalendarSync() {
  const [events, setEvents] = useState([]);
  const [cases, setCases] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [casesData, milestonesData] = await Promise.all([
        base44.entities.Case.list(),
        base44.entities.CaseMilestone.list()
      ]);
      setCases(casesData);
      setMilestones(milestonesData);

      // Load upcoming events from Google Calendar
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const { data } = await base44.functions.invoke('googleCalendar', {
        action: 'list_events',
        timeMin: now.toISOString(),
        timeMax: nextMonth.toISOString()
      });
      
      setEvents(data.events || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const syncHearingToCalendar = async (caseItem, hearing) => {
    setIsSyncing(true);
    try {
      const { data } = await base44.functions.invoke('googleCalendar', {
        action: 'sync_hearing',
        hearing,
        caseName: caseItem.case_name,
        caseNumber: caseItem.case_number
      });
      setSyncResult({ type: 'success', message: 'הדיון נוסף ליומן בהצלחה!' });
      loadData();
    } catch (error) {
      setSyncResult({ type: 'error', message: 'שגיאה בסנכרון: ' + error.message });
    }
    setIsSyncing(false);
    setTimeout(() => setSyncResult(null), 3000);
  };

  const syncMilestoneToCalendar = async (milestone) => {
    setIsSyncing(true);
    try {
      const caseItem = cases.find(c => c.id === milestone.case_id);
      const { data } = await base44.functions.invoke('googleCalendar', {
        action: 'sync_milestone',
        milestone,
        caseName: caseItem?.case_name || 'תיק'
      });
      setSyncResult({ type: 'success', message: 'אבן הדרך נוספה ליומן!' });
      loadData();
    } catch (error) {
      setSyncResult({ type: 'error', message: 'שגיאה בסנכרון: ' + error.message });
    }
    setIsSyncing(false);
    setTimeout(() => setSyncResult(null), 3000);
  };

  // Get all hearings from cases
  const allHearings = cases.flatMap(c => 
    (c.hearings || []).map(h => ({ ...h, caseItem: c }))
  ).filter(h => new Date(h.date) > new Date())
   .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get upcoming milestones
  const upcomingMilestones = milestones
    .filter(m => m.due_date && m.status !== 'הושלם' && new Date(m.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500">טוען נתוני יומן...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            סנכרון יומן Google
          </h1>
          <p className="text-slate-500 mt-1">סנכרן דיונים ואבני דרך ליומן שלך</p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {/* Sync Result Toast */}
      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${
            syncResult.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {syncResult.message}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Hearings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              דיונים לסנכרון
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {allHearings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                אין דיונים עתידיים
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allHearings.slice(0, 10).map((hearing, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">{hearing.caseItem.case_name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(hearing.date).toLocaleDateString('he-IL')}
                        {hearing.description && <span>• {hearing.description}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => syncHearingToCalendar(hearing.caseItem, hearing)}
                      disabled={isSyncing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="w-4 h-4 ml-1" />
                      סנכרן
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-indigo-600" />
              אבני דרך לסנכרון
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingMilestones.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                אין אבני דרך עתידיות
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingMilestones.slice(0, 10).map((milestone) => {
                  const caseItem = cases.find(c => c.id === milestone.case_id);
                  return (
                    <div key={milestone.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{milestone.milestone_name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          יעד: {new Date(milestone.due_date).toLocaleDateString('he-IL')}
                          {caseItem && <span>• {caseItem.case_name}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => syncMilestoneToCalendar(milestone)}
                        disabled={isSyncing}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Calendar className="w-4 h-4 ml-1" />
                        סנכרן
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Events Preview */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            אירועים ביומן (30 יום קרובים)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              אין אירועים ביומן
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {events.map((event, idx) => (
                <div key={event.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-900">{event.summary}</p>
                    <p className="text-sm text-slate-500">
                      {event.start?.dateTime 
                        ? new Date(event.start.dateTime).toLocaleString('he-IL')
                        : event.start?.date
                      }
                    </p>
                  </div>
                  {event.htmlLink && (
                    <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}