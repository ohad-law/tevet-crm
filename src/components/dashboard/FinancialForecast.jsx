import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function FinancialForecast({ cases }) {
  // Advanced stages that count towards forecast
  const advancedStages = [
    'תצהיר עדות ראשית',
    'הוכחות', 
    'סיכומים',
    'פסק דין'
  ];

  const advancedCases = cases.filter(c => advancedStages.includes(c.status));
  
  const totalForecast = advancedCases.reduce((sum, c) => {
    return sum + (c.potential_fee || 0);
  }, 0);

  const totalValue = advancedCases.reduce((sum, c) => {
    return sum + (c.value || 0);
  }, 0);

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `₪${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `₪${(amount / 1000).toFixed(0)}K`;
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            צפי פיננסי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-slate-500 mb-1">צפי שכר טרחה</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalForecast)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-slate-500 mb-1">שווי תיקים</p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-emerald-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">תיקים בשלבים מתקדמים</span>
              <span className="font-bold text-emerald-700">{advancedCases.length}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {advancedStages.map(stage => {
                const count = advancedCases.filter(c => c.status === stage).length;
                if (count === 0) return null;
                return (
                  <span key={stage} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    {stage}: {count}
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}