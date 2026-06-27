import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Briefcase, MapPin, ChevronLeft, ChevronRight, Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import HearingDialog from "../components/hearings/HearingDialog";

export default function HearingsDashboard() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showHearingDialog, setShowHearingDialog] = useState(false);

  const handleSaveHearing = async ({ caseId, hearing }) => {
    const caseItem = cases.find((c) => c.id === caseId);
    if (!caseItem) return;
    const hearings = [...(caseItem.hearings || []), hearing];
    await base44.entities.Case.update(caseId, { hearings });
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [casesData, clientsData] = await Promise.all([
      base44.entities.Case.list(),
      base44.entities.Client.list()
    ]);
    setCases(casesData);
    setClients(clientsData);
    setIsLoading(false);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לקוח לא ידוע';
  };

  // Extract all hearings from all cases
  const allHearings = cases.flatMap(caseItem => {
    if (!caseItem.hearings || caseItem.hearings.length === 0) return [];
    return caseItem.hearings.map(hearing => ({
      ...hearing,
      case: caseItem,
      clientName: getClientName(caseItem.client_id)
    }));
  }).filter(h => h.date);

  // Filter hearings by selected month
  const filteredHearings = allHearings.filter(hearing => {
    const hearingDate = new Date(hearing.date);
    return hearingDate.getMonth() === selectedMonth.getMonth() &&
           hearingDate.getFullYear() === selectedMonth.getFullYear();
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group by date
  const hearingsByDate = filteredHearings.reduce((acc, hearing) => {
    const dateKey = hearing.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(hearing);
    return acc;
  }, {});

  const upcomingHearings = allHearings
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const changeMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const monthName = selectedMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">טוען דיונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-3">
            <Calendar className="w-9 h-9 text-blue-600" />
            יומן דיונים
          </h1>
          <p className="text-slate-500 text-lg">מעקב אחר דיונים קרובים ומתוזמנים</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(new Date())}
            className="border-slate-200"
          >
            חודש נוכחי
          </Button>
          <Button
            onClick={() => setShowHearingDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            הוסף דיון
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">דיונים החודש</p>
                <p className="text-3xl font-bold text-slate-900">{filteredHearings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">דיונים קרובים</p>
                <p className="text-3xl font-bold text-slate-900">{upcomingHearings.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">תיקים פעילים</p>
                <p className="text-3xl font-bold text-slate-900">
                  {cases.filter(c => c.hearings && c.hearings.length > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Hearings */}
      {upcomingHearings.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              דיונים קרובים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {upcomingHearings.map((hearing, idx) => (
                <Link key={idx} to={createPageUrl(`CaseDetails?id=${hearing.case.id}`)}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            {new Date(hearing.date).toLocaleDateString('he-IL', { 
                              day: 'numeric', 
                              month: 'short',
                              weekday: 'short'
                            })}
                          </Badge>
                          <h4 className="font-bold text-slate-900">{hearing.case.case_name}</h4>
                          <span className="text-xs text-slate-400 font-mono">#{hearing.case.case_number}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{hearing.description || 'ללא תיאור'}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {hearing.clientName}
                          </span>
                          {hearing.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {hearing.time}
                            </span>
                          )}
                          {hearing.proceeding_number && (
                            <span className="flex items-center gap-1 font-mono">
                              <FileText className="w-3 h-3" /> הליך: {hearing.proceeding_number}
                            </span>
                          )}
                          {hearing.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {hearing.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Calendar View */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {monthName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => changeMonth(1)} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {Object.keys(hearingsByDate).length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">אין דיונים מתוזמנים בחודש זה</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(hearingsByDate).map(([date, hearings]) => (
                <div key={date} className="border-r-4 border-blue-600 pr-4">
                  <h3 className="font-bold text-slate-900 mb-3 text-lg">
                    {new Date(date).toLocaleDateString('he-IL', { 
                      weekday: 'long',
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <div className="space-y-3">
                    {hearings.map((hearing, idx) => (
                      <Link key={idx} to={createPageUrl(`CaseDetails?id=${hearing.case.id}`)}>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900">{hearing.case.case_name}</h4>
                                <span className="text-xs text-slate-400 font-mono">#{hearing.case.case_number}</span>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{hearing.description || 'ללא תיאור'}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {hearing.clientName}
                                </span>
                                {hearing.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {hearing.time}
                                  </span>
                                )}
                                {hearing.proceeding_number && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <FileText className="w-3 h-3" /> הליך: {hearing.proceeding_number}
                                  </span>
                                )}
                                {hearing.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {hearing.location}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {hearing.case.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <HearingDialog
        open={showHearingDialog}
        onOpenChange={setShowHearingDialog}
        cases={cases}
        onSave={handleSaveHearing}
      />
    </div>
  );
}