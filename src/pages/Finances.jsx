import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Plus, Calendar, X, FileText, Lock, Receipt, Building2, Shield, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/components/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";

import IncomeForm from "../components/finances/IncomeForm";
import ExpenseForm from "../components/finances/ExpenseForm";
import FinancialProjections from "../components/finances/FinancialProjections";
import MillionRoadmap from "../components/finances/MillionRoadmap";
import BusinessKnowledge from "../components/finances/BusinessKnowledge";
import ScenarioPlanner from "../components/finances/ScenarioPlanner";
import InteractiveMixCalculator from "../components/finances/InteractiveMixCalculator";
import UnauthorizedAccess from "../components/common/UnauthorizedAccess";
import { calculateTaxLiability, calculateExpenseSavings } from "../components/tax/taxCalculator";

export default function Finances() {
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeDetails, setShowIncomeDetails] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      if (userData.role !== 'admin') {
        setIsLoading(false);
        return;
      }

      const [casesData, clientsData, incomesData, expensesData] = await Promise.all([
        base44.entities.Case.list(),
        base44.entities.Client.list(),
        base44.entities.Income.list("-date"),
        base44.entities.Expense.list("-date")
      ]);

      setCases(casesData);
      setClients(clientsData);
      setIncomes(incomesData);
      setExpenses(expensesData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading finances:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const isAdmin = currentUser?.role === 'admin';
  const hasPermission = currentUser?.specific_permissions?.includes('view_finance');

  if (!isAdmin && !hasPermission) {
    return <UnauthorizedAccess />;
  }

  // Admin password protection
  const ADMIN_PASSWORD = "5100";
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsUnlocked(true);
    } else {
      alert("סיסמה שגויה");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">ניהול פיננסי</CardTitle>
            <p className="text-gray-500 mt-2">הזן סיסמת מנהל לכניסה</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="סיסמת מנהל"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="text-center text-lg h-12"
                autoFocus
              />
              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg">
                כניסה
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleIncomeSubmit = async (data) => {
    await base44.entities.Income.create(data);
    setShowIncomeForm(false);
    const incomesData = await base44.entities.Income.list("-date");
    setIncomes(incomesData);
  };

  const handleExpenseSubmit = async (data) => {
    await base44.entities.Expense.create(data);
    setShowExpenseForm(false);
    const expensesData = await base44.entities.Expense.list("-date");
    setExpenses(expensesData);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthIncomes = incomes.filter(i => {
    const date = new Date(i.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const thisMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const lastMonthIncomes = incomes.filter(i => {
    const date = new Date(i.date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === lastMonth && date.getFullYear() === year;
  });

  const lastMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === lastMonth && date.getFullYear() === year;
  });

  const totalIncome = thisMonthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const lastMonthIncome = lastMonthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const lastMonthExpense = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthProfit = lastMonthIncome - lastMonthExpense;

  const profitChange = lastMonthProfit > 0 ? ((netProfit - lastMonthProfit) / lastMonthProfit * 100).toFixed(1) : 0;

  // Tax calculations using the tax calculator
  const taxData = calculateTaxLiability(totalIncome, totalExpense, totalExpense * 0.8); // Assume 80% of expenses have VAT receipts
  const savingsData = calculateExpenseSavings(5000);

  const getCaseName = (caseId) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem ? `${caseItem.case_name} (#${caseItem.case_number})` : 'לא משויך לתיק';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">ניהול פיננסי</h1>
          <p className="text-slate-500 text-sm md:text-lg">מעקב הכנסות, הוצאות ותחזיות</p>
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              className="shadow-lg border-none bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:shadow-xl transition-all"
              onClick={() => setShowIncomeDetails(true)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">הכנסות החודש</p>
                    <p className="text-3xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{thisMonthIncomes.length} הכנסות</p>
                  <p className="text-xs text-green-600 font-semibold">לחץ לפרטים →</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              className="shadow-lg border-none bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:shadow-xl transition-all"
              onClick={() => setShowExpenseDetails(true)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">הוצאות החודש</p>
                    <p className="text-3xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{thisMonthExpenses.length} הוצאות</p>
                  <p className="text-xs text-red-600 font-semibold">לחץ לפרטים →</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Card className={`shadow-lg border-none ${netProfit >= 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">רווח נקי</p>
                  <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-blue-600' : 'bg-orange-600'}`}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              {profitChange !== 0 && (
                <p className={`text-xs font-medium ${parseFloat(profitChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(profitChange) >= 0 ? '+' : ''}{profitChange}% לעומת חודש קודם
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Income Details Modal */}
        <AnimatePresence>
          {showIncomeDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowIncomeDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">הכנסות החודש</h2>
                      <p className="text-green-100 text-sm">סה"כ: {formatCurrency(totalIncome)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowIncomeDetails(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {thisMonthIncomes.length > 0 ? (
                    <div className="space-y-3">
                      {thisMonthIncomes.map((income) => (
                        <Card key={income.id} className="border-2 border-green-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-green-600" />
                                  <p className="font-bold text-lg text-gray-900">{getCaseName(income.case_id)}</p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(income.date).toLocaleDateString('he-IL', { 
                                      day: 'numeric', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })}
                                  </span>
                                  <Badge className={income.status === 'שולם' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                    {income.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(income.amount)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">אין הכנסות החודש</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expense Details Modal */}
        <AnimatePresence>
          {showExpenseDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowExpenseDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">הוצאות החודש</h2>
                      <p className="text-red-100 text-sm">סה"כ: {formatCurrency(totalExpense)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowExpenseDetails(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {thisMonthExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {thisMonthExpenses.map((expense) => (
                        <Card key={expense.id} className="border-2 border-red-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-gray-100 text-gray-800 border border-gray-300">
                                    {expense.category}
                                  </Badge>
                                  <p className="font-bold text-lg text-gray-900">{expense.description}</p>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(expense.date).toLocaleDateString('he-IL', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">אין הוצאות החודש</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tax Dashboard Section */}
        {totalIncome > 0 && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-900">
                <Receipt className="w-5 h-5 text-blue-600" />
                רואה חשבון דיגיטלי - חבות מס משוערת
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">מע"מ לתשלום</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(taxData.vatToPay)}</p>
                  <p className="text-xs text-slate-400">עד ה-15</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">מקדמות מס</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(taxData.incomeTaxToPay)}</p>
                  <p className="text-xs text-slate-400">6%</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">ביטוח לאומי</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(taxData.bituahLeumiToPay)}</p>
                  <p className="text-xs text-slate-400">מדורג</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">סה"כ חבות</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(taxData.totalTax)}</p>
                  <p className="text-xs text-slate-400">חודשי</p>
                </div>
              </div>

              {/* Profit Keeper Tip */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800">
                    <strong>טיפ לחיסכון:</strong> העלאת הוצאות נוספות בסך 5,000 ₪ תחסוך לך כ-{formatCurrency(savingsData.totalSaving)} במיסים!
                    <span className="text-xs text-amber-600 block mt-1">~40% מכל הוצאה מוכרת חוזרת אליך</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <BusinessKnowledge />
          <InteractiveMixCalculator />
        </div>

        <div>
          <ScenarioPlanner />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <FinancialProjections cases={cases} incomes={incomes} />
          <MillionRoadmap cases={cases} currentMonthly={totalIncome} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  הכנסות ({thisMonthIncomes.length})
                </CardTitle>
                <Button
                  onClick={() => setShowIncomeForm(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף הכנסה
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {showIncomeForm && (
                <IncomeForm
                  cases={cases}
                  clients={clients}
                  onSubmit={handleIncomeSubmit}
                  onCancel={() => setShowIncomeForm(false)}
                  onDataRefresh={loadData}
                />
              )}
              
              <div className="space-y-3 mt-4">
                {thisMonthIncomes.slice(0, 3).map((income) => (
                  <div key={income.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{getCaseName(income.case_id)}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(income.date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(income.amount)}</p>
                        <Badge className={income.status === 'שולם' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {income.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {thisMonthIncomes.length === 0 && (
                  <p className="text-center text-gray-500 py-8">אין הכנסות החודש</p>
                )}
                {thisMonthIncomes.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowIncomeDetails(true)}
                  >
                    הצג את כל ההכנסות ({thisMonthIncomes.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  הוצאות ({thisMonthExpenses.length})
                </CardTitle>
                <Button
                  onClick={() => setShowExpenseForm(true)}
                  size="sm"
                  variant="destructive"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף הוצאה
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {showExpenseForm && (
                <ExpenseForm
                  onSubmit={handleExpenseSubmit}
                  onCancel={() => setShowExpenseForm(false)}
                />
              )}
              
              <div className="space-y-3 mt-4">
                {thisMonthExpenses.slice(0, 3).map((expense) => (
                  <div key={expense.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge className="bg-gray-100 text-gray-800 mb-2">{expense.category}</Badge>
                        <p className="font-semibold text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(expense.date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>
                ))}
                {thisMonthExpenses.length === 0 && (
                  <p className="text-center text-gray-500 py-8">אין הוצאות החודש</p>
                )}
                {thisMonthExpenses.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowExpenseDetails(true)}
                  >
                    הצג את כל ההוצאות ({thisMonthExpenses.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}