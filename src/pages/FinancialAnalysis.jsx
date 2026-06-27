import React, { useState, useEffect } from "react";
import { Case, Income, Expense, User } from "@/entities/all";
import { TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatCurrency } from "@/components/utils/formatters";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [timeRange, setTimeRange] = useState("6months");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // ⚠️ הגנה: אדמין או בעל הרשאה
      const userData = await User.me().catch(() => null);
      const hasPermission = userData?.specific_permissions?.includes('view_analytics');
      if (!userData || (userData.role !== 'admin' && !hasPermission)) {
        navigate(createPageUrl("Dashboard"));
        return;
      }

      const [casesData, incomesData, expensesData] = await Promise.all([
        Case.list(),
        Income.list("-date"),
        Expense.list("-date")
      ]);
      setCases(casesData);
      setIncomes(incomesData);
      setExpenses(expensesData);
      setIsLoading(false);
    };
    loadData();
  }, [navigate]);

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const activeCases = cases.filter(c => c.status !== 'פסק דין' && c.status !== 'ארכיון');
  const totalActiveValue = activeCases.reduce((sum, c) => sum + (c.value || 0), 0);

  // Cases value by type
  const caseValueByType = [
    { 
      name: 'עובדים זרים', 
      value: cases.filter(c => c.case_type === 'דיני עבודה - עובדים זרים').reduce((sum, c) => sum + (c.value || 0), 0) 
    },
    { 
      name: 'דיני עבודה', 
      value: cases.filter(c => c.case_type === 'דיני עבודה - תביעה').reduce((sum, c) => sum + (c.value || 0), 0) 
    },
    { 
      name: 'חדלות פירעון', 
      value: cases.filter(c => c.case_type === 'חדלות פירעון').reduce((sum, c) => sum + (c.value || 0), 0) 
    }
  ].filter(item => item.value > 0);

  // Top 5 cases by value
  const top5Cases = [...cases]
    .filter(c => c.value)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.case_name.length > 20 ? c.case_name.substring(0, 20) + '...' : c.case_name,
      value: c.value
    }));

  // Monthly value trend (last 12 months)
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
    
    const monthIncome = incomes.filter(inc => {
      if (!inc.date) return false;
      const incDate = new Date(inc.date);
      return incDate.getMonth() === date.getMonth() && incDate.getFullYear() === date.getFullYear();
    }).reduce((sum, inc) => sum + inc.amount, 0);

    const monthExpense = expenses.filter(exp => {
      if (!exp.date) return false;
      const expDate = new Date(exp.date);
      return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
    }).reduce((sum, exp) => sum + exp.amount, 0);

    monthlyData.push({ 
      month: monthStr, 
      income: monthIncome,
      expense: monthExpense,
      profit: monthIncome - monthExpense
    });
  }

  const COLORS = ['#4A90E2', '#7B68EE', '#50C878', '#FF6B6B', '#FFB347'];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">ניתוח פיננסי</h1>
            <p className="text-gray-600">Financial Analysis Dashboard</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 חודשים</SelectItem>
              <SelectItem value="6months">6 חודשים</SelectItem>
              <SelectItem value="12months">שנה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-lg border-none mb-8">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                סה"כ הכנסות והוצאות לאורך זמן
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#50C878" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#50C878" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#50C878" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    name="הכנסות"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#FF6B6B" 
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                    name="הוצאות"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Distribution Pie Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-lg border-none h-full">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  התפלגות ערך תיקים לפי סוג
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={caseValueByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {caseValueByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {caseValueByType.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top 5 Cases Bar Chart */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-lg border-none h-full">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  5 התיקים הכי שווים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top5Cases} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis dataKey="name" type="category" width={150} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" fill="#4A90E2" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">סה"כ ערך תיקים פעילים</p>
                    <p className="text-3xl font-bold text-green-700">{formatCurrency(totalActiveValue)}</p>
                    <p className="text-xs text-gray-600 mt-2">{activeCases.length} תיקים</p>
                  </div>
                  <div className="p-4 bg-green-600 rounded-xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ממוצע ערך תיק</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {activeCases.length > 0 ? formatCurrency(totalActiveValue / activeCases.length) : '₪0'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">תיקים פעילים</p>
                  </div>
                  <div className="p-4 bg-blue-600 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-lg border-none bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">רווח צפוי</p>
                    <p className="text-3xl font-bold text-purple-700">{formatCurrency(totalActiveValue * 0.7)}</p>
                    <p className="text-xs text-gray-600 mt-2">70% מערך פעיל</p>
                  </div>
                  <div className="p-4 bg-purple-600 rounded-xl">
                    <PieChartIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}