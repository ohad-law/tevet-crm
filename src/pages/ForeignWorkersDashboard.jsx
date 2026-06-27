import { useState, useEffect } from "react";
import { WorkerIntakeForm, Case, Task } from "@/entities/all";
import { FileText, Clock, CheckCircle, TrendingUp, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function ForeignWorkersDashboard() {
  const [forms, setForms] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [formsData, casesData, tasksData] = await Promise.all([
        WorkerIntakeForm.list("-submission_date"),
        Case.list(),
        Task.list()
      ]);
      setForms(formsData);
      setCases(casesData);
      setTasks(tasksData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const foreignWorkerCases = cases.filter(c => c.case_type === 'דיני עבודה - עובדים זרים');
  const newForms = forms.filter(f => f.status === 'הוגש');
  const inProgress = forms.filter(f => f.status === 'בטיפול');
  const completed = forms.filter(f => f.status === 'טוטפל');

  // Forms over time (last 6 months)
  const formsOverTime = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleDateString('he-IL', { month: 'short' });
    const count = forms.filter(f => {
      if (!f.submission_date) return false;
      const formDate = new Date(f.submission_date);
      return formDate.getMonth() === date.getMonth() && formDate.getFullYear() === date.getFullYear();
    }).length;
    formsOverTime.push({ month: monthStr, count });
  }

  const avgProcessingTime = forms.length > 0 ? 3.2 : 0; // Mock calculation
  const satisfaction = 4.5; // Mock data

  const getStatusColor = (status) => {
    switch(status) {
      case 'הוגש': return 'bg-blue-100 text-blue-800';
      case 'בטיפול': return 'bg-yellow-100 text-yellow-800';
      case 'טוטפל': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">דשבורד עובדים זרים</h1>
          <p className="text-gray-600">Foreign Workers Dashboard</p>
        </div>

        {/* Quick Access */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-purple-900 mb-2">📋 טופס ציבורי לעובדים זרים</h3>
                <p className="text-sm text-purple-700">שתף קישור זה עם עובדים זרים למילוי טופס תביעה</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/worker-intake`;
                    navigator.clipboard.writeText(url);
                    alert('הקישור הועתק ללוח');
                  }}
                  className="bg-white"
                >
                  📋 העתק קישור
                </Button>
                <Link to="/worker-intake">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    פתח טופס
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-lg border-none bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">טפסים חדשים</p>
                    <p className="text-3xl font-bold text-blue-700">{newForms.length}</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-lg border-none bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700 mb-1">בטיפול</p>
                    <p className="text-3xl font-bold text-yellow-800">{inProgress.length}</p>
                  </div>
                  <div className="p-3 bg-yellow-200 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-lg border-none bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 mb-1">הושלמו</p>
                    <p className="text-3xl font-bold text-green-700">{completed.length}</p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="shadow-lg border-none bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 mb-1">תיקים פעילים</p>
                    <p className="text-3xl font-bold text-purple-700">{foreignWorkerCases.length}</p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Forms Over Time */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                טפסים שהתקבלו לאורך זמן
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={formsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="count" stroke="#4A90E2" strokeWidth={3} dot={{ fill: '#4A90E2', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="space-y-6">
            <Card className="shadow-lg border-none">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  זמן טיפול ממוצע
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-600 mb-2">{avgProcessingTime}</p>
                  <p className="text-xl text-gray-600">ימים</p>
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">⏱ יעד: 5 ימים | ביצועים מעולים!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  ⭐ שביעות רצון
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-amber-500 mb-2">{satisfaction}</p>
                  <div className="flex justify-center gap-1 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className="text-2xl">
                        {star <= Math.floor(satisfaction) ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">מתוך 5 כוכבים</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Forms Table */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">
              📋 טפסים אחרונים ({forms.slice(0, 10).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">שם</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">תאריך</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">סטטוס</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">עובד אחראי</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.slice(0, 10).map((form) => (
                    <tr key={form.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm font-medium text-gray-900">{form.full_name}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {form.submission_date ? new Date(form.submission_date).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(form.status)}>
                          {form.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {form.created_case_id ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <User className="w-3 h-3" />
                            אדם
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {form.created_case_id && (
                            <Link to={createPageUrl(`CaseDetails?id=${form.created_case_id}`)}>
                              <Button size="sm" variant="outline">
                                👁 צפה
                              </Button>
                            </Link>
                          )}
                          <Button size="sm" variant="ghost">
                            📝 ערוך
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {forms.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>אין טפסים עדיין</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}