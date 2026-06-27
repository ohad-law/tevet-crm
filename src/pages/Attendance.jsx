import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, Calendar, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistance } from "date-fns";
import { he } from "date-fns/locale";

export default function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setCurrentUser(userData);

    const allAttendances = await base44.entities.Attendance.list("-date");
    const userAttendances = allAttendances.filter(a => a.user_email === userData.email);
    setAttendances(userAttendances);

    const today = new Date().toISOString().split('T')[0];
    const todayRecord = userAttendances.find(a => a.date === today);
    
    if (todayRecord) {
      setTodayAttendance(todayRecord);
      setIsCheckedIn(!!todayRecord.check_in_time && !todayRecord.check_out_time);
    }

    setIsLoading(false);
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
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    const checkInTime = new Date(`2000-01-01T${todayAttendance.check_in_time}`);
    const checkOutTime = new Date(`2000-01-01T${time}`);
    const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    await base44.entities.Attendance.update(todayAttendance.id, {
      check_out_time: time,
      total_hours: parseFloat(hours.toFixed(2))
    });

    setIsCheckedIn(false);
    loadData();
  };

  // Calculate monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthAttendances = attendances.filter(a => {
    const date = new Date(a.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalHours = thisMonthAttendances.reduce((sum, a) => sum + (a.total_hours || 0), 0);
  const avgHours = thisMonthAttendances.length > 0 ? totalHours / thisMonthAttendances.length : 0;

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">נוכחות</h1>
          <p className="text-gray-600">רישום כניסות ויציאות · Attendance Tracking</p>
        </div>

        {/* Today's Check-in/out Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-2xl border-none mb-8 bg-gradient-to-br from-blue-500 to-purple-600">
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

        {/* Monthly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">סה"כ ימי עבודה</p>
                  <p className="text-3xl font-bold text-gray-900">{thisMonthAttendances.length}</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">סה"כ שעות</p>
                  <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
                </div>
                <div className="p-4 bg-green-100 rounded-xl">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ממוצע יומי</p>
                  <p className="text-3xl font-bold text-gray-900">{avgHours.toFixed(1)}</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">היסטוריית נוכחות</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <AnimatePresence>
                {thisMonthAttendances.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">
                                {new Date(record.date).toLocaleDateString('he-IL', { 
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}
                              </p>
                              <p className="text-sm text-gray-500">
                                כניסה: {record.check_in_time} 
                                {record.check_out_time && ` · יציאה: ${record.check_out_time}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            {record.total_hours ? (
                              <>
                                <p className="text-2xl font-bold text-green-600">
                                  {record.total_hours.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">שעות</p>
                              </>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                טרם יצא
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {thisMonthAttendances.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">אין רישומי נוכחות החודש</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}