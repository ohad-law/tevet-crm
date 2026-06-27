import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Clock, Timer, History, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACTIVITY_TYPES = [
  "כתב תביעה",
  "כתב הגנה",
  "בקשה לנט המשפט",
  "תגובה",
  "הכנה לדיון",
  "דיון בבית משפט",
  "מחקר משפטי",
  "תיאום עם לקוח",
  "עריכת מסמכים",
  "סיכומים",
  "ערעור",
  "משא ומתן",
  "אחר"
];

export default function WorkTimer({ caseId, caseName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeLog, setActiveLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [description, setDescription] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [caseId]);

  useEffect(() => {
    let interval;
    if (activeLog) {
      interval = setInterval(() => {
        const start = new Date(activeLog.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  const loadData = async () => {
    setIsLoading(true);
    const [user, allLogs] = await Promise.all([
      base44.auth.me(),
      base44.entities.WorkLog.filter({ case_id: caseId }, '-start_time', 50)
    ]);
    
    setCurrentUser(user);
    
    // Find active log for current user
    const active = allLogs.find(log => log.is_active && log.user_email === user.email);
    setActiveLog(active || null);
    
    // Recent completed logs
    setRecentLogs(allLogs.filter(log => !log.is_active).slice(0, 10));
    setIsLoading(false);
  };

  const startTimer = async () => {
    if (!selectedActivity) return;
    
    const newLog = await base44.entities.WorkLog.create({
      case_id: caseId,
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      activity_type: selectedActivity,
      activity_description: description,
      start_time: new Date().toISOString(),
      is_active: true
    });
    
    setActiveLog(newLog);
    setElapsedTime(0);
    setDescription("");
  };

  const stopTimer = async () => {
    if (!activeLog) return;
    
    const endTime = new Date();
    const startTime = new Date(activeLog.start_time);
    const durationMinutes = Math.round((endTime - startTime) / 60000);
    
    await base44.entities.WorkLog.update(activeLog.id, {
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      is_active: false
    });
    
    setActiveLog(null);
    setElapsedTime(0);
    loadData();
  };

  const deleteLog = async (logId) => {
    await base44.entities.WorkLog.delete(logId);
    loadData();
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs} שעות ${mins} דקות`;
    return `${mins} דקות`;
  };

  const totalTimeToday = recentLogs
    .filter(log => new Date(log.start_time).toDateString() === new Date().toDateString())
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 flex justify-center">
          <Clock className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-l from-indigo-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Timer className="w-5 h-5 text-indigo-600" />
            שעון עבודה
          </CardTitle>
          <Badge variant="outline" className="bg-white">
            היום: {formatDuration(totalTimeToday)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {activeLog ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-bold text-green-800">טיימר פעיל</span>
              </div>
              <Badge className="bg-green-600 text-white">{activeLog.activity_type}</Badge>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-mono font-bold text-green-700">
                {formatTime(elapsedTime)}
              </div>
              {activeLog.activity_description && (
                <p className="text-sm text-green-600 mt-1">{activeLog.activity_description}</p>
              )}
            </div>
            
            <Button
              onClick={stopTimer}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 ml-2" />
              עצור טיימר
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג פעולה" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="תיאור קצר (אופציונלי)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <Button
              onClick={startTimer}
              disabled={!selectedActivity}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Play className="w-4 h-4 ml-2" />
              התחל טיימר
            </Button>
          </div>
        )}

        <div className="pt-3 border-t">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              היסטוריית עבודה ({recentLogs.length})
            </span>
            <span className="text-xs">{showHistory ? '▲' : '▼'}</span>
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {recentLogs.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">אין רשומות עדיין</p>
                  ) : (
                    recentLogs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {log.activity_type}
                            </Badge>
                            <span className="text-slate-500 truncate">{log.user_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>{new Date(log.start_time).toLocaleDateString('he-IL')}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-600">{formatDuration(log.duration_minutes)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteLog(log.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}