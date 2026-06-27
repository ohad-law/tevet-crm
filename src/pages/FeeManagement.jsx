
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Lock, Download, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
import UnauthorizedAccess from "../components/common/UnauthorizedAccess";

export default function FeeManagement() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      // Check if user is admin
      if (userData.role !== 'admin') {
        setIsLoading(false);
        return; // Stop loading further data if not admin
      }

      const [casesData, clientsData] = await Promise.all([
        base44.entities.Case.list(),
        base44.entities.Client.list()
      ]);

      setCases(casesData.filter(c => c.case_type === 'דיני עבודה - עובדים זרים'));
      setClients(clientsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading fees:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const isAdmin = currentUser?.role === 'admin';

  // Show unauthorized access if not admin
  if (!isAdmin) {
    return <UnauthorizedAccess />;
  }

  const currentMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const currentMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

  // Monthly calculations
  const paidThisMonth = cases.filter(c => {
    if (!c.fee_paid_date || c.fee_status !== 'שולמה') return false;
    const paidDate = new Date(c.fee_paid_date);
    return paidDate >= currentMonthStart && paidDate <= currentMonthEnd;
  });

  const refundedThisMonth = cases.filter(c => {
    if (!c.fee_refund_date || c.fee_status !== 'הוחזרה') return false;
    const refundDate = new Date(c.fee_refund_date);
    return refundDate >= currentMonthStart && refundDate <= currentMonthEnd;
  });

  const totalPaidThisMonth = paidThisMonth.reduce((sum, c) => sum + (c.fee_amount || 0), 0);
  const totalRefundedThisMonth = refundedThisMonth.reduce((sum, c) => sum + (c.fee_refund_amount || 0), 0);
  const monthlyBalance = totalRefundedThisMonth - totalPaidThisMonth;

  // Frozen fees (paid but not refunded)
  const frozenFees = cases.filter(c => c.fee_status === 'שולמה');
  const totalFrozen = frozenFees.reduce((sum, c) => sum + (c.fee_amount || 0), 0);

  const frozenOpen = frozenFees.filter(c => c.status !== 'פסק דין' && c.status !== 'ארכיון');
  const frozenClosed = frozenFees.filter(c => c.status === 'פסק דין' || c.status === 'ארכיון');

  // Yearly stats
  const yearStart = new Date(selectedMonth.getFullYear(), 0, 1);
  const yearEnd = new Date(selectedMonth.getFullYear(), 11, 31);

  const totalPaidYear = cases.filter(c => {
    if (!c.fee_paid_date) return false;
    const date = new Date(c.fee_paid_date);
    return date >= yearStart && date <= yearEnd;
  }).reduce((sum, c) => sum + (c.fee_amount || 0), 0);

  const totalRefundedYear = cases.filter(c => {
    if (!c.fee_refund_date) return false;
    const date = new Date(c.fee_refund_date);
    return date >= yearStart && date <= yearEnd;
  }).reduce((sum, c) => sum + (c.fee_refund_amount || 0), 0);

  const yearlyBalance = totalRefundedYear - totalPaidYear;
  const refundRate = totalPaidYear > 0 ? ((totalRefundedYear / totalPaidYear) * 100).toFixed(1) : 0;

  // Chart data - last 12 months
  const chartData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const paid = cases.filter(c => {
      if (!c.fee_paid_date) return false;
      const paidDate = new Date(c.fee_paid_date);
      return paidDate >= monthStart && paidDate <= monthEnd;
    }).reduce((sum, c) => sum + (c.fee_amount || 0), 0);

    const refunded = cases.filter(c => {
      if (!c.fee_refund_date) return false;
      const refundDate = new Date(c.fee_refund_date);
      return refundDate >= monthStart && refundDate <= monthEnd;
    }).reduce((sum, c) => sum + (c.fee_refund_amount || 0), 0);

    chartData.push({ month: monthStr, paid, refunded });
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לא ידוע';
  };

  const downloadExcel = () => {
    const exportData = cases.map(c => ({
      'מספר תיק': c.case_number,
      'לקוח': getClientName(c.client_id),
      'סטטוס אגרה': c.fee_status || 'לא שולמה',
      'סכום ששולם': c.fee_amount || 0,
      'תאריך תשלום': c.fee_paid_date || '',
      'סכום הוחזר': c.fee_refund_amount || 0,
      'תאריך החזר': c.fee_refund_date || '',
      'הערות': c.fee_notes || ''
    }));

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `אגרות_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">💰 ניהול אגרות</h1>
            <p className="text-gray-600">מעקב אחר אגרות בתיקי עובדים זרים</p>
          </div>
          <Button onClick={downloadExcel} variant="outline">
            <Download className="w-4 h-4 ml-2" />
            ייצוא לExcel
          </Button>
        </div>

        {/* Month selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              >
                ←
              </Button>
              <h2 className="text-xl font-bold">
                {selectedMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="outline"
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                disabled={selectedMonth >= new Date()}
              >
                →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">💸 שולם החודש</p>
                    <p className="text-3xl font-bold text-red-600">₪{totalPaidThisMonth.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">({paidThisMonth.length} תיקים)</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">💵 הוחזר החודש</p>
                    <p className="text-3xl font-bold text-green-600">₪{totalRefundedThisMonth.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">({refundedThisMonth.length} תיקים)</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">📊 מאזן חודשי</p>
                    <p className={`text-3xl font-bold ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyBalance >= 0 ? '+' : ''}₪{Math.abs(monthlyBalance).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">🔒 מוקפא</p>
                    <p className="text-3xl font-bold text-orange-600">₪{totalFrozen.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">({frozenFees.length} תיקים)</p>
                  </div>
                  <Lock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Frozen Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🔒 אגרות מוקפאות (ממתינות להחזר)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-orange-600">₪{totalFrozen.toLocaleString()}</p>
              <p className="text-gray-600">({frozenFees.length} תיקים)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">תיקים פתוחים</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₪{frozenOpen.reduce((sum, c) => sum + (c.fee_amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">({frozenOpen.length})</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">תיקים סגורים (ממתינים)</p>
                <p className="text-2xl font-bold text-green-600">
                  ₪{frozenClosed.reduce((sum, c) => sum + (c.fee_amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">({frozenClosed.length})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Stats - ADMIN ONLY */}
        {isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>📈 סטטיסטיקות שנתיות - {selectedMonth.getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600">סה"כ ששולם</p>
                  <p className="text-2xl font-bold text-red-600">₪{totalPaidYear.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">סה"כ הוחזר</p>
                  <p className="text-2xl font-bold text-green-600">₪{totalRefundedYear.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">מאזן שנתי</p>
                  <p className={`text-2xl font-bold ${yearlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {yearlyBalance >= 0 ? '+' : ''}₪{Math.abs(yearlyBalance).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">שיעור החזר</p>
                  <p className="text-2xl font-bold text-blue-600">{refundRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart - ADMIN ONLY */}
        {isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>תזרים אגרות - 12 חודשים אחרונים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="paid" fill="#ef4444" name="שולם" />
                  <Bar dataKey="refunded" fill="#22c55e" name="הוחזר" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט תיקים ({cases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 text-sm font-semibold">תיק</th>
                    <th className="text-right p-3 text-sm font-semibold">לקוח</th>
                    <th className="text-right p-3 text-sm font-semibold">סכום</th>
                    <th className="text-right p-3 text-sm font-semibold">תאריך</th>
                    <th className="text-right p-3 text-sm font-semibold">סטטוס</th>
                    <th className="text-right p-3 text-sm font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-semibold">{caseItem.case_name}</p>
                        <p className="text-xs text-gray-500">#{caseItem.case_number}</p>
                      </td>
                      <td className="p-3">{getClientName(caseItem.client_id)}</td>
                      <td className="p-3">
                        <p className="font-semibold">₪{(caseItem.fee_amount || 500).toLocaleString()}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {caseItem.fee_paid_date ? new Date(caseItem.fee_paid_date).toLocaleDateString('he-IL') : '-'}
                        {caseItem.fee_status === 'הוחזרה' && caseItem.fee_refund_date && (
                          <p className="text-xs text-green-600">
                            {new Date(caseItem.fee_refund_date).toLocaleDateString('he-IL')}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={
                          caseItem.fee_status === 'הוחזרה' ? 'bg-green-100 text-green-800' :
                          caseItem.fee_status === 'שולמה' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {caseItem.fee_status === 'הוחזרה' ? '✅ הוחזר' :
                           caseItem.fee_status === 'שולמה' ? '💰 שולם' :
                           '⏳ ממתין'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(createPageUrl(`CaseDetails?id=${caseItem.id}`))}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
