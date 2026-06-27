import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, Receipt, Building2, Shield, TrendingUp, 
  Upload, Plus, Lightbulb, AlertCircle, DollarSign,
  PiggyBank, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { calculateTaxLiability, calculateExpenseSavings, TAX_RATES } from "@/components/tax/taxCalculator";
import { base44 } from "@/api/base44Client";
import ExpenseScanner from "@/components/expenses/ExpenseScanner";
import MissingExpensesAlert from "@/components/expenses/MissingExpensesAlert";

export default function TaxDashboard() {
  // Default values - can be fetched from database
  const [monthlyIncome, setMonthlyIncome] = useState(40000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(15000);
  const [expensesWithVat, setExpensesWithVat] = useState(12000);
  
  // New expense form
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "",
    description: "",
    hasVatReceipt: true
  });
  const [expenseFile, setExpenseFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Calculate taxes
  const taxData = calculateTaxLiability(monthlyIncome, monthlyExpenses, expensesWithVat);
  
  // Suggested expense amount for savings tip
  const suggestedExpense = 5000;
  const savingsData = calculateExpenseSavings(suggestedExpense);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setExpenseFile(file);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category) {
      alert("נא למלא סכום וקטגוריה");
      return;
    }

    setIsUploading(true);
    
    try {
      let fileUrl = null;
      if (expenseFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: expenseFile });
        fileUrl = file_url;
      }

      // Add to expenses (in real app, save to database)
      const expenseAmount = parseFloat(newExpense.amount);
      setMonthlyExpenses(prev => prev + expenseAmount);
      if (newExpense.hasVatReceipt) {
        setExpensesWithVat(prev => prev + expenseAmount);
      }

      // Reset form
      setNewExpense({ amount: "", category: "", description: "", hasVatReceipt: true });
      setExpenseFile(null);
      
      alert(`הוצאה בסך ${expenseAmount.toLocaleString()} ₪ נוספה בהצלחה!`);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("שגיאה בהוספת ההוצאה");
    }
    
    setIsUploading(false);
  };

  // Color scale for gauges
  const getVatColor = (amount) => {
    if (amount <= 0) return "text-green-600 bg-green-50 border-green-200";
    if (amount < 3000) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTaxColor = (amount) => {
    if (amount < 1500) return "text-green-600 bg-green-50 border-green-200";
    if (amount < 3000) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            רואה חשבון דיגיטלי
          </h1>
          <p className="text-slate-500 text-sm md:text-lg">ניהול מיסים וחישובי חבות מס בזמן אמת</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-blue-700">הכנסה חודשית:</span>
          <span className="font-bold text-blue-900">{monthlyIncome.toLocaleString()} ₪</span>
        </div>
      </div>

      {/* Income/Expense Quick Edit */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-slate-50 to-blue-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-slate-500">הכנסה חודשית</Label>
              <Input 
                type="number" 
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">סה"כ הוצאות</Label>
              <Input 
                type="number" 
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">הוצאות עם חשבונית מע"מ</Label>
              <Input 
                type="number" 
                value={expensesWithVat}
                onChange={(e) => setExpensesWithVat(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* VAT Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className={`border-2 ${getVatColor(taxData.vatToPay)} shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium mb-1">מע"מ לתשלום</p>
                  <p className="text-xs opacity-70">עד ה-15 לחודש</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/50">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">
                {taxData.vatToPay.toLocaleString()} ₪
              </p>
              <div className="text-xs space-y-1 opacity-80">
                <div className="flex justify-between">
                  <span>מע"מ עסקאות:</span>
                  <span>{taxData.outputVat.toLocaleString()} ₪</span>
                </div>
                <div className="flex justify-between">
                  <span>מע"מ תשומות:</span>
                  <span>-{taxData.inputVat.toLocaleString()} ₪</span>
                </div>
              </div>
              <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (taxData.vatToPay / 7000) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Tax Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`border-2 ${getTaxColor(taxData.incomeTaxToPay)} shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium mb-1">מקדמות מס הכנסה</p>
                  <p className="text-xs opacity-70">{(TAX_RATES.INCOME_TAX_ADVANCE * 100)}% מההכנסה החייבת</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/50">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">
                {taxData.incomeTaxToPay.toLocaleString()} ₪
              </p>
              <div className="text-xs space-y-1 opacity-80">
                <div className="flex justify-between">
                  <span>הכנסה חייבת:</span>
                  <span>{taxData.taxableIncome.toLocaleString()} ₪</span>
                </div>
                <div className="flex justify-between">
                  <span>שיעור מקדמה:</span>
                  <span>6%</span>
                </div>
              </div>
              <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (taxData.incomeTaxToPay / 3000) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bituah Leumi Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`border-2 ${getTaxColor(taxData.bituahLeumiToPay)} shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium mb-1">ביטוח לאומי</p>
                  <p className="text-xs opacity-70">מדרגות עד {TAX_RATES.BITUAH_LEUMI.BRACKET_1_LIMIT.toLocaleString()} ₪</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/50">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">
                {taxData.bituahLeumiToPay.toLocaleString()} ₪
              </p>
              <div className="text-xs space-y-1 opacity-80">
                <div className="flex justify-between">
                  <span>מדרגה ראשונה (5.97%):</span>
                  <span>{Math.round(Math.min(taxData.taxableIncome, TAX_RATES.BITUAH_LEUMI.BRACKET_1_LIMIT) * TAX_RATES.BITUAH_LEUMI.BRACKET_1_RATE).toLocaleString()} ₪</span>
                </div>
                {taxData.taxableIncome > TAX_RATES.BITUAH_LEUMI.BRACKET_1_LIMIT && (
                  <div className="flex justify-between">
                    <span>מדרגה שנייה (17.83%):</span>
                    <span>{Math.round((taxData.taxableIncome - TAX_RATES.BITUAH_LEUMI.BRACKET_1_LIMIT) * TAX_RATES.BITUAH_LEUMI.BRACKET_2_RATE).toLocaleString()} ₪</span>
                  </div>
                )}
              </div>
              <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (taxData.bituahLeumiToPay / 5000) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Total Summary */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">סה"כ חבות מס חודשית</p>
                <p className="text-4xl font-bold text-blue-900">{taxData.totalTax.toLocaleString()} ₪</p>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-green-600 font-medium">רווח נקי משוער</p>
              <p className="text-3xl font-bold text-green-700">{taxData.netProfit.toLocaleString()} ₪</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Keeper Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg mb-2 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5" />
                  שומר הרווחים - טיפ לחיסכון!
                </h3>
                <p className="text-amber-800">
                  חבות מס משוערת: <strong>{taxData.totalTax.toLocaleString()} ₪</strong>. 
                  העלאת הוצאות נוספות בסך <strong>{suggestedExpense.toLocaleString()} ₪</strong> תחסוך לך כ-<strong>{savingsData.totalSaving.toLocaleString()} ₪</strong> במיסים!
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-white/50 px-2 py-1 rounded-full text-amber-700">
                    מע"מ: {savingsData.vatSaving.toLocaleString()} ₪
                  </span>
                  <span className="text-xs bg-white/50 px-2 py-1 rounded-full text-amber-700">
                    מס הכנסה: {savingsData.incomeTaxSaving.toLocaleString()} ₪
                  </span>
                  <span className="text-xs bg-white/50 px-2 py-1 rounded-full text-amber-700">
                    ביטוח לאומי: {savingsData.bituahLeumiSaving.toLocaleString()} ₪
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  💡 כ-{savingsData.savingPercentage}% מכל הוצאה מוכרת חוזרת אליך בחיסכון מס!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Expense Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Scanner */}
        <ExpenseScanner onExpenseAdded={() => {
          // Refresh data after adding expense
        }} />
        
        {/* Missing Expenses Alert */}
        <MissingExpensesAlert year="2025" />
      </div>

      {/* Tax Rates Info */}
      <Card className="shadow-sm border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500">
              <p className="font-medium text-slate-600 mb-1">שיעורי מס נוכחיים (2024):</p>
              <p>מע"מ: 18% | מקדמות מס הכנסה: 6% | ביטוח לאומי: 5.97% עד 7,522 ₪, 17.83% מעל</p>
              <p className="mt-1">* החישובים הינם הערכה בלבד. לייעוץ מס מקצועי יש לפנות לרואה חשבון.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}