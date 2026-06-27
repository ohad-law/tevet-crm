import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Download, ChevronLeft, ChevronRight, LogIn, LogOut, CheckCircle, Users, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistance, getDaysInMonth, startOfMonth, addDays, format } from "date-fns";
import { he } from "date-fns/locale";

export default function AttendanceReport() {
  const [attendances, setAttendances] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  
  // Admin & Edit Mode State
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    loadData();
    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
        fetchAttendances();
    }
  }, [selectedMonth, selectedUserEmail, currentUser]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      setSelectedUserEmail(userData.email);

      if (userData.role === 'admin') {
        const usersList = await base44.entities.User.list();
        setUsers(usersList);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setIsLoading(false);
    }
  };

  const fetchAttendances = async () => {
      const allAttendances = await base44.entities.Attendance.list("-date", 500); // Increased limit
      const targetEmail = selectedUserEmail || currentUser.email;
      const userAttendances = allAttendances.filter(a => a.user_email === targetEmail);
      
      setAttendances(userAttendances);

      // Check today's attendance (only if viewing self)
      if (targetEmail === currentUser.email) {
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = userAttendances.find(a => a.date === today);
        
        if (todayRecord) {
            setTodayAttendance(todayRecord);
            setIsCheckedIn(!!todayRecord.check_in_time && !todayRecord.check_out_time);
        } else {
            setTodayAttendance(null);
            setIsCheckedIn(false);
        }
      }
  };

  const handleCheckIn = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const record = await base44.entities.Attendance.create({
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      date: today,
      check_in_time: time,
      status: "נוכח"
    });

    setTodayAttendance(record);
    setIsCheckedIn(true);
    loadData();
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    const checkInTime = new Date(`2000-01-01T${todayAttendance.check_in_time}`);
    const checkOutTime = new Date(`2000-01-01T${time}`);
    const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    await base44.entities.Attendance.update(todayAttendance.id, {
      ...todayAttendance,
      check_out_time: time,
      total_hours: parseFloat(hours.toFixed(2))
    });

    setIsCheckedIn(false);
    fetchAttendances();
  };

  const handleInputChange = (dateStr, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value
      }
    }));
  };

  const handleSaveMonth = async () => {
    setIsLoading(true);
    try {
      const promises = Object.keys(editedData).map(async (dateStr) => {
        const data = editedData[dateStr];
        if (!data.check_in_time && !data.check_out_time) return; // Skip empty

        // Find existing record
        const existing = attendances.find(a => a.date === dateStr);
        
        // Calculate total hours
        let total_hours = 0;
        if (data.check_in_time && data.check_out_time) {
             const start = new Date(`2000-01-01T${data.check_in_time}`);
             const end = new Date(`2000-01-01T${data.check_out_time}`);
             total_hours = (end - start) / (1000 * 60 * 60);
             if (total_hours < 0) total_hours += 24; // Handle overnight? assuming same day for now
        } else if (existing) {
             // Maybe only one field changed
             const start = new Date(`2000-01-01T${data.check_in_time || existing.check_in_time}`);
             const end = new Date(`2000-01-01T${data.check_out_time || existing.check_out_time}`);
             if (data.check_in_time || existing.check_in_time && data.check_out_time || existing.check_out_time) {
                total_hours = (end - start) / (1000 * 60 * 60);
             }
        }

        const recordData = {
            check_in_time: data.check_in_time || (existing ? existing.check_in_time : ''),
            check_out_time: data.check_out_time || (existing ? existing.check_out_time : ''),
            total_hours: parseFloat(total_hours.toFixed(2)),
            status: 'נוכח'
        };

        if (existing) {
            return base44.entities.Attendance.update(existing.id, recordData);
        } else {
            const targetUser = users.find(u => u.email === selectedUserEmail) || currentUser;
            return base44.entities.Attendance.create({
                user_email: selectedUserEmail,
                user_name: targetUser.full_name,
                date: dateStr,
                ...recordData
            });
        }
      });

      await Promise.all(promises);
      setEditedData({});
      setIsEditMode(false);
      fetchAttendances();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("שגיאה בשמירת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHourBreakdown = (totalHours) => {
    if (!totalHours) return { regular: 0, time125: 0, time150: 0, break: 0, net: 0 };

    let workHours = totalHours;
    let breakTime = 0;
    
    // קיזוז הפסקה אם עבד יותר מ-6 שעות
    if (totalHours > 6) {
      breakTime = 0.5;
      workHours = Math.max(0, totalHours - 0.5);
    }

    let regular = 0;
    let time125 = 0;
    let time150 = 0;

    // שעות רגילות (עד 8.4 שעות)
    const BASE_HOURS = 8.4;
    const TIME_125_LIMIT = BASE_HOURS + 2;

    if (workHours <= BASE_HOURS) {
      regular = workHours;
    } else if (workHours <= TIME_125_LIMIT) {
      // 8.4 שעות רגילות + שעות 125%
      regular = BASE_HOURS;
      time125 = workHours - BASE_HOURS;
    } else {
      // 8.4 שעות רגילות + 2 שעות 125% + יתר 150%
      regular = BASE_HOURS;
      time125 = 2;
      time150 = workHours - TIME_125_LIMIT;
    }

    return {
      regular: parseFloat(regular.toFixed(2)),
      time125: parseFloat(time125.toFixed(2)),
      time150: parseFloat(time150.toFixed(2)),
      break: breakTime,
      net: parseFloat(workHours.toFixed(2)),
      gross: totalHours
    };
  };

  const getMonthAttendances = () => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    
    return attendances.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const monthAttendances = getMonthAttendances();
  
  // Generate all days for the table
  const daysInMonth = [];
  const start = startOfMonth(selectedMonth);
  const daysCount = getDaysInMonth(selectedMonth);
  for (let i = 0; i < daysCount; i++) {
      daysInMonth.push(addDays(start, i));
  }

  // חישוב סיכומים חודשיים
  const monthlyTotals = monthAttendances.reduce((acc, a) => {
    const breakdown = calculateHourBreakdown(a.total_hours || 0);
    return {
      regular: acc.regular + breakdown.regular,
      time125: acc.time125 + breakdown.time125,
      time150: acc.time150 + breakdown.time150,
      break: acc.break + breakdown.break,
      net: acc.net + breakdown.net,
      gross: acc.gross + breakdown.gross,
      days: acc.days + 1
    };
  }, { regular: 0, time125: 0, time150: 0, break: 0, net: 0, gross: 0, days: 0 });

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const exportToCSV = () => {
    const headers = ['תאריך', 'כניסה', 'יציאה', 'סה"כ שעות', 'הפסקה', 'שעות נטו', 'שעות 100%', 'שעות 125%', 'שעות 150%'];
    
    // Generate all days for the month for export as well? or just attended days?
    // Usually accountant wants all days or just attended. Let's stick to attended + missing logic if needed.
    // For now, existing logic is fine, but better to ensure we export what's seen.
    // Let's use monthAttendances but sorted by date.
    
    const sortedAttendances = [...monthAttendances].sort((a, b) => new Date(a.date) - new Date(b.date));

    const rows = sortedAttendances.map(a => {
      const breakdown = calculateHourBreakdown(a.total_hours || 0);
      return [
        new Date(a.date).toLocaleDateString('he-IL'),
        a.check_in_time || '',
        a.check_out_time || '',
        (a.total_hours || 0).toFixed(2),
        breakdown.break.toFixed(2),
        breakdown.net.toFixed(2),
        breakdown.regular.toFixed(2),
        breakdown.time125.toFixed(2),
        breakdown.time150.toFixed(2)
      ];
    });

    // הוספת שורת סיכום
    rows.push([
      'סה"כ',
      '',
      '',
      monthlyTotals.gross.toFixed(2),
      monthlyTotals.break.toFixed(2),
      monthlyTotals.net.toFixed(2),
      monthlyTotals.regular.toFixed(2),
      monthlyTotals.time125.toFixed(2),
      monthlyTotals.time150.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `דוח_נוכחות_${selectedUserEmail}_${selectedMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const monthName = selectedMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">נוכחות ודיווח שעות</h1>
            <p className="text-slate-500 text-sm md:text-lg">דיווח נוכחות + דוח מפורט לפי חוק העבודה הישראלי</p>
          </div>
          
          <div className="flex gap-2 flex-wrap w-full md:w-auto">
             {currentUser?.role === 'admin' && (
                 <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
                    <SelectTrigger className="w-full md:w-[200px] bg-white">
                        <SelectValue placeholder="בחר עובד" />
                    </SelectTrigger>
                    <SelectContent>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.email}>{u.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
             )}

             {!isEditMode ? (
                 <div className="flex gap-2 w-full md:w-auto">
                    {currentUser?.role === 'admin' && (
                        <Button onClick={() => setIsEditMode(true)} variant="outline" className="bg-white hover:bg-gray-50 flex-1 md:flex-none text-xs md:text-sm">
                            <Edit className="w-4 h-4 ml-1 md:ml-2" />
                            עריכה
                        </Button>
                    )}
                    <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none text-xs md:text-sm">
                        <Download className="w-4 h-4 ml-1 md:ml-2" />
                        ייצוא
                    </Button>
                 </div>
             ) : (
                 <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => { setIsEditMode(false); setEditedData({}); }} variant="outline" className="bg-white text-red-600 hover:bg-red-50 flex-1 md:flex-none text-xs md:text-sm">
                        <X className="w-4 h-4 ml-1 md:ml-2" />
                        ביטול
                    </Button>
                    <Button onClick={handleSaveMonth} className="bg-blue-600 hover:bg-blue-700 flex-1 md:flex-none text-xs md:text-sm">
                        <Save className="w-4 h-4 ml-1 md:ml-2" />
                        שמור
                    </Button>
                 </div>
             )}
          </div>
        </div>

        {/* Today's Check-in/out Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="shadow-2xl border-none bg-gradient-to-br from-blue-500 to-purple-600">
            <CardContent className="p-8">
              <div className="text-center text-white">
                <Clock className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-2">
                  {currentTime.toLocaleTimeString('he-IL')}
                </h2>
                <p className="text-lg mb-6">
                  {currentTime.toLocaleDateString('he-IL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>

                {!isCheckedIn && !todayAttendance && (
                  <Button
                    onClick={handleCheckIn}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 text-xl py-6 px-12"
                  >
                    <LogIn className="w-6 h-6 ml-3" />
                    כניסה לעבודה
                  </Button>
                )}

                {isCheckedIn && todayAttendance && (
                  <div>
                    <div className="mb-6 p-4 bg-white bg-opacity-20 rounded-lg">
                      <p className="text-sm mb-2">נכנסת בשעה</p>
                      <p className="text-3xl font-bold">{todayAttendance.check_in_time}</p>
                      <p className="text-sm mt-2">
                        {formatDistance(
                          new Date(`2000-01-01T${todayAttendance.check_in_time}`),
                          new Date(),
                          { addSuffix: true, locale: he }
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={handleCheckOut}
                      size="lg"
                      className="bg-white text-red-600 hover:bg-gray-100 text-xl py-6 px-12"
                    >
                      <LogOut className="w-6 h-6 ml-3" />
                      יציאה מעבודה
                    </Button>
                  </div>
                )}

                {!isCheckedIn && todayAttendance && todayAttendance.check_out_time && (
                  <div className="p-6 bg-white bg-opacity-20 rounded-lg">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-lg mb-2">עבדת היום</p>
                    <p className="text-3xl font-bold mb-2">
                      {todayAttendance.total_hours?.toFixed(2)} שעות
                    </p>
                    <p className="text-sm">
                      כניסה: {todayAttendance.check_in_time} · 
                      יציאה: {todayAttendance.check_out_time}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Month Selector */}
        <Card className="shadow-lg border-none mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePreviousMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold">{monthName}</h2>
              <Button 
                variant="outline" 
                onClick={handleNextMonth}
                disabled={selectedMonth >= new Date()}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8" />
                <Badge className="bg-white text-blue-600">100%</Badge>
              </div>
              <p className="text-sm mb-1 opacity-90">שעות רגילות</p>
              <p className="text-3xl font-bold">{monthlyTotals.regular.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8" />
                <Badge className="bg-white text-orange-600">125%</Badge>
              </div>
              <p className="text-sm mb-1 opacity-90">שעות נוספות</p>
              <p className="text-3xl font-bold">{monthlyTotals.time125.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8" />
                <Badge className="bg-white text-red-600">150%</Badge>
              </div>
              <p className="text-sm mb-1 opacity-90">שעות נוספות+</p>
              <p className="text-3xl font-bold">{monthlyTotals.time150.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-sm mb-1 opacity-90">ימי עבודה</p>
              <p className="text-3xl font-bold">{monthlyTotals.days}</p>
              <p className="text-xs mt-1 opacity-90">סה"כ נטו: {monthlyTotals.net.toFixed(2)} שעות</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">פירוט יומי</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כניסה</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">יציאה</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סה"כ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הפסקה</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">נטו</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">100%</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">125%</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50">150%</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {daysInMonth.map((dateObj, index) => {
                    const dateStr = format(dateObj, 'yyyy-MM-dd');
                    const attendance = monthAttendances.find(a => a.date === dateStr) || {};
                    
                    // Use edited data if available, otherwise existing, otherwise empty
                    const checkIn = isEditMode 
                        ? (editedData[dateStr]?.check_in_time ?? attendance.check_in_time ?? '')
                        : (attendance.check_in_time || '-');
                        
                    const checkOut = isEditMode 
                        ? (editedData[dateStr]?.check_out_time ?? attendance.check_out_time ?? '')
                        : (attendance.check_out_time || '-');

                    const breakdown = calculateHourBreakdown(attendance.total_hours || 0);
                    
                    return (
                      <motion.tr
                        key={dateStr}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }} // faster stagger
                        className={`hover:bg-gray-50 ${isEditMode ? 'bg-blue-50/20' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(dateObj).toLocaleDateString('he-IL', { 
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </td>
                        
                        {isEditMode ? (
                            <>
                                <td className="px-2 py-2">
                                    <Input 
                                        type="time" 
                                        value={checkIn} 
                                        onChange={(e) => handleInputChange(dateStr, 'check_in_time', e.target.value)}
                                        className="h-8 w-32"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <Input 
                                        type="time" 
                                        value={checkOut} 
                                        onChange={(e) => handleInputChange(dateStr, 'check_out_time', e.target.value)}
                                        className="h-8 w-32"
                                    />
                                </td>
                                <td colSpan="6" className="px-6 py-4 text-xs text-gray-400 text-center">
                                    (יישמר בלחיצה על שמור)
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {checkIn}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {checkOut}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {attendance.total_hours ? breakdown.gross.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {breakdown.break > 0 ? breakdown.break.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                                {attendance.total_hours ? breakdown.net.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 bg-blue-50">
                                {attendance.total_hours ? breakdown.regular.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600 bg-orange-50">
                                {breakdown.time125 > 0 ? breakdown.time125.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 bg-red-50">
                                {breakdown.time150 > 0 ? breakdown.time150.toFixed(2) : '-'}
                                </td>
                            </>
                        )}
                      </motion.tr>
                    );
                  })}
                  
                  {/* Summary Row */}
                  {!isEditMode && monthAttendances.length > 0 && (
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan="3">
                        סה"כ ({monthlyTotals.days} ימים)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {monthlyTotals.gross.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {monthlyTotals.break.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                        {monthlyTotals.net.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 bg-blue-50">
                        {monthlyTotals.regular.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 bg-orange-50">
                        {monthlyTotals.time125.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 bg-red-50">
                        {monthlyTotals.time150.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {monthAttendances.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">אין רישומי נוכחות לחודש זה</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm md:text-base">הסבר לפי חוק העבודה:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-500">100%</Badge>
                <div>
                  <p className="font-semibold">שעות רגילות</p>
                  <p className="text-gray-600">עד 8.4 שעות ביום (לאחר קיזוז הפסקה)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-orange-500">125%</Badge>
                <div>
                  <p className="font-semibold">שעות נוספות</p>
                  <p className="text-gray-600">שעתיים ראשונות מעבר לשעות הרגילות</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-red-500">150%</Badge>
                <div>
                  <p className="font-semibold">שעות נוספות מוגברות</p>
                  <p className="text-gray-600">כל שעה מעבר לשעתיים הנוספות הראשונות</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline">הפסקה</Badge>
                <div>
                  <p className="font-semibold">קיזוז הפסקה</p>
                  <p className="text-gray-600">0.5 שעה אוטומטית אם עבדת יותר מ-6 שעות</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}