import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Clock, Users, Briefcase, TrendingUp, Timer, Target, Award, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

export default function WorkAnalytics() {
  const [workLogs, setWorkLogs] = useState([]);
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedUser, setSelectedUser] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [logs, allCases, allUsers, user] = await Promise.all([
      base44.entities.WorkLog.filter({ is_active: false }, '-start_time', 1000),
      base44.entities.Case.list(),
      base44.entities.User.list(),
      base44.auth.me()
    ]);
    
    setWorkLogs(logs);
    setCases(allCases);
    setUsers(allUsers);
    setCurrentUser(user);
    setIsLoading(false);
  };

  const getCaseName = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    return c?.case_name || 'תיק לא ידוע';
  };

  // Filter logs by selected month and user
  const filteredLogs = workLogs.filter(log => {
    const logDate = parseISO(log.start_time);
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = endOfMonth(monthStart);
    
    const inMonth = logDate >= monthStart && logDate <= monthEnd;
    const matchesUser = selectedUser === "all" || log.user_email === selectedUser;
    
    return inMonth && matchesUser;
  });

  // Calculate stats
  const totalMinutes = filteredLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgPerDay = filteredLogs.length > 0 
    ? (totalMinutes / Math.max(1, new Set(filteredLogs.map(l => format(parseISO(l.start_time), 'yyyy-MM-dd'))).size)).toFixed(0)
    : 0;

  // Time by activity type
  const timeByActivity = filteredLogs.reduce((acc, log) => {
    acc[log.activity_type] = (acc[log.activity_type] || 0) + (log.duration_minutes || 0);
    return acc;
  }, {});

  const activityChartData = Object.entries(timeByActivity)
    .map(([name, minutes]) => ({ name, minutes, hours: (minutes / 60).toFixed(1) }))
    .sort((a, b) => b.minutes - a.minutes);

  // Time by case
  const timeByCase = filteredLogs.reduce((acc, log) => {
    const caseName = getCaseName(log.case_id);
    acc[caseName] = (acc[caseName] || 0) + (log.duration_minutes || 0);
    return acc;
  }, {});

  const caseChartData = Object.entries(timeByCase)
    .map(([name, minutes]) => ({ name: name.substring(0, 20), minutes, hours: (minutes / 60).toFixed(1) }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10);

  // Time by user
  const timeByUser = filteredLogs.reduce((acc, log) => {
    acc[log.user_name || log.user_email] = (acc[log.user_name || log.user_email] || 0) + (log.duration_minutes || 0);
    return acc;
  }, {});

  const userChartData = Object.entries(timeByUser)
    .map(([name, minutes]) => ({ name, minutes, hours: (minutes / 60).toFixed(1) }))
    .sort((a, b) => b.minutes - a.minutes);

  // Daily trend
  const dailyData = filteredLogs.reduce((acc, log) => {
    const day = format(parseISO(log.start_time), 'dd/MM');
    acc[day] = (acc[day] || 0) + (log.duration_minutes || 0);
    return acc;
  }, {});

  const trendData = Object.entries(dailyData)
    .map(([day, minutes]) => ({ day, minutes, hours: (minutes / 60).toFixed(1) }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Average time per activity type
  const avgByActivity = Object.entries(
    filteredLogs.reduce((acc, log) => {
      if (!acc[log.activity_type]) acc[log.activity_type] = { total: 0, count: 0 };
      acc[log.activity_type].total += log.duration_minutes || 0;
      acc[log.activity_type].count += 1;
      return acc;
    }, {})
  ).map(([type, data]) => ({
    type,
    avgMinutes: Math.round(data.total / data.count),
    count: data.count
  })).sort((a, b) => b.avgMinutes - a.avgMinutes);

  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i);
    months.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: he })
    });
  }

  // Group logs by date for personal report
  const logsByDate = filteredLogs.reduce((acc, log) => {
    const date = format(parseISO(log.start_time), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  // Sort dates descending
  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

  // State for expanded dates
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Clock className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Timer className="w-8 h-8 text-indigo-600" />
            אנליטיקת זמן עבודה
          </h1>
          <p className="text-slate-500 mt-1">מעקב וניתוח זמני עבודה לפי תיק, פעולה ועובד</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentUser?.role === 'admin' && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="כל העובדים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העובדים</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">סה"כ שעות</p>
                <p className="text-3xl font-bold mt-1">{totalHours}</p>
              </div>
              <Clock className="w-10 h-10 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">רשומות</p>
                <p className="text-3xl font-bold mt-1">{filteredLogs.length}</p>
              </div>
              <Target className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">ממוצע ליום</p>
                <p className="text-3xl font-bold mt-1">{avgPerDay} דק'</p>
              </div>
              <TrendingUp className="w-10 h-10 text-pink-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">תיקים פעילים</p>
                <p className="text-3xl font-bold mt-1">{Object.keys(timeByCase).length}</p>
              </div>
              <Briefcase className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="personal" className="rounded-lg">דוח אישי מפורט</TabsTrigger>
          <TabsTrigger value="activities" className="rounded-lg">לפי פעולה</TabsTrigger>
          <TabsTrigger value="cases" className="rounded-lg">לפי תיק</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg">לפי עובד</TabsTrigger>
          <TabsTrigger value="trend" className="rounded-lg">מגמה יומית</TabsTrigger>
          <TabsTrigger value="averages" className="rounded-lg">ממוצעים</TabsTrigger>
        </TabsList>

        {/* Personal Detailed Report */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                דוח עבודה מפורט - {selectedUser === 'all' ? 'כל העובדים' : users.find(u => u.email === selectedUser)?.full_name || selectedUser}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedDates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>לא נמצאו רשומות עבודה בתקופה זו</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedDates.map(date => {
                    const dayLogs = logsByDate[date];
                    const dayTotal = dayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
                    const dayHours = Math.floor(dayTotal / 60);
                    const dayMinutes = dayTotal % 60;
                    const isExpanded = expandedDates[date] !== false; // Default to expanded
                    
                    return (
                      <div key={date} className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* Date Header */}
                        <button
                          onClick={() => toggleDate(date)}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <div className="text-right">
                              <p className="font-bold text-slate-900">
                                {format(parseISO(date), 'EEEE, d בMMMM yyyy', { locale: he })}
                              </p>
                              <p className="text-sm text-slate-500">
                                {dayLogs.length} פעולות
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1">
                              {dayHours > 0 ? `${dayHours} שעות ` : ''}{dayMinutes > 0 ? `${dayMinutes} דקות` : dayHours > 0 ? '' : '0 דקות'}
                            </Badge>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                          </div>
                        </button>
                        
                        {/* Day Details */}
                        {isExpanded && (
                          <div className="p-4 bg-white">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="text-right">שעה</TableHead>
                                  <TableHead className="text-right">תיק</TableHead>
                                  <TableHead className="text-right">סוג פעולה</TableHead>
                                  <TableHead className="text-right">תיאור</TableHead>
                                  <TableHead className="text-right">משך</TableHead>
                                  {selectedUser === 'all' && <TableHead className="text-right">עובד</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dayLogs
                                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                  .map(log => {
                                    const hours = Math.floor((log.duration_minutes || 0) / 60);
                                    const mins = (log.duration_minutes || 0) % 60;
                                    return (
                                      <TableRow key={log.id} className="hover:bg-slate-50">
                                        <TableCell className="font-mono text-sm">
                                          {format(parseISO(log.start_time), 'HH:mm')}
                                          {log.end_time && (
                                            <span className="text-slate-400"> - {format(parseISO(log.end_time), 'HH:mm')}</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <span className="font-medium text-slate-900">
                                            {getCaseName(log.case_id)}
                                          </span>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="bg-slate-100">
                                            {log.activity_type}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                          <span className="text-slate-600 text-sm line-clamp-2">
                                            {log.activity_description || log.notes || '-'}
                                          </span>
                                        </TableCell>
                                        <TableCell>
                                          <span className="font-semibold text-indigo-600">
                                            {hours > 0 ? `${hours}:` : ''}{mins.toString().padStart(2, '0')} {hours > 0 ? 'שעות' : 'דקות'}
                                          </span>
                                        </TableCell>
                                        {selectedUser === 'all' && (
                                          <TableCell>
                                            <span className="text-sm text-slate-600">
                                              {log.user_name || log.user_email}
                                            </span>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                התפלגות זמן לפי סוג פעולה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityChartData}
                        dataKey="minutes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, hours }) => `${name}: ${hours}h`}
                      >
                        {activityChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${(value / 60).toFixed(1)} שעות`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {activityChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-slate-600">{item.hours} שעות</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                זמן עבודה לפי תיק (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caseChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 60).toFixed(0)}h`} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `${(value / 60).toFixed(1)} שעות`} />
                    <Bar dataKey="minutes" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                זמן עבודה לפי עובד
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `${(v / 60).toFixed(0)}h`} />
                      <Tooltip formatter={(value) => `${(value / 60).toFixed(1)} שעות`} />
                      <Bar dataKey="minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {userChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {item.name.charAt(0)}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">{item.hours} שעות</p>
                        <p className="text-xs text-slate-500">{item.minutes} דקות</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                מגמת עבודה יומית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 60).toFixed(0)}h`} />
                    <Tooltip formatter={(value) => `${(value / 60).toFixed(1)} שעות`} />
                    <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="averages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                זמן ממוצע לפי סוג פעולה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {avgByActivity.map(item => (
                  <div key={item.type} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{item.type}</p>
                      <p className="text-sm text-slate-500">{item.count} רשומות</p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-indigo-600">{item.avgMinutes}</p>
                      <p className="text-xs text-slate-500">דקות בממוצע</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}