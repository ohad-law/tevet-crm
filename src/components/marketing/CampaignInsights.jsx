import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Check, Edit3, Save, X, Zap } from "lucide-react";

const formatMoney = (num) => {
  if (!num && num !== 0) return "—";
  return "₪" + Math.abs(num).toLocaleString();
};

const VAT_RATE = 0.18;

export default function CampaignInsights({ leads, campaigns, totalSpent, totalRevenue }) {
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // --- Insight Calculations ---
  const insights = [];

  // 1. Best performing source (by closed deal value — gross)
  const sourcePerformance = {};
  leads.forEach(l => {
    if (!sourcePerformance[l.source]) {
      sourcePerformance[l.source] = { count: 0, revenueNet: 0, leads: 0 };
    }
    sourcePerformance[l.source].leads++;
    if (l.closed_deal_value > 0) {
      sourcePerformance[l.source].count++;
      sourcePerformance[l.source].revenueNet += l.closed_deal_value;
    }
  });

  const bestSource = Object.entries(sourcePerformance)
    .sort((a, b) => b[1].revenueNet - a[1].revenueNet)[0];

  if (bestSource && bestSource[1].revenueNet > 0) {
    const grossRevenue = Math.round(bestSource[1].revenueNet * (1 + VAT_RATE));
    insights.push({
      type: "success",
      icon: TrendingUp,
      text: `הערוץ "${bestSource[0]}" הכי רווחי — ${formatMoney(grossRevenue)} (כולל מע״מ) מ-${bestSource[1].count} לקוחות משלמים`,
    });
  }

  // 2. Worst performing source
  const worstSource = Object.entries(sourcePerformance)
    .filter(([_, d]) => d.leads >= 5)
    .sort((a, b) => a[1].revenueNet - b[1].revenueNet)[0];

  if (worstSource && worstSource[1].revenueNet === 0 && worstSource[1].leads >= 5) {
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      text: `מ-${worstSource[1].leads} לידים בערוץ "${worstSource[0]}" — אף אחד עוד לא סגר עסקה. שווה לבדוק את איכות הלידים.`,
    });
  }

  // 3. Conversion efficiency
  const totalLeads = leads.length;
  const payingLeads = leads.filter(l => l.closed_deal_value > 0).length;
  const conversionPercent = totalLeads > 0 ? ((payingLeads / totalLeads) * 100).toFixed(1) : 0;

  if (payingLeads > 0 && conversionPercent < 5) {
    insights.push({
      type: "info",
      icon: Lightbulb,
      text: `רק ${conversionPercent}% מהלידים הפכו ללקוחות משלמים. התמקד בשיפור איכות הלידים — פחות כמות, יותר איכות.`,
    });
  }

  // 4. Profitability analysis (revenue is already gross)
  const netProfit = totalRevenue - totalSpent;
  const profitPerLead = totalLeads > 0 ? Math.round(netProfit / totalLeads) : 0;

  if (netProfit > 0) {
    insights.push({
      type: "success",
      icon: Check,
      text: `רווח נקי של ${formatMoney(netProfit)} (כולל מע״מ) — כל ליד שווה ${formatMoney(profitPerLead)} בממוצע. תמשיך להגדיל תקציב בהדרגה.`,
    });
  } else if (totalSpent > 0) {
    insights.push({
      type: "warning",
      icon: TrendingDown,
      text: `כרגע בהפסד של ${formatMoney(Math.abs(netProfit))}. בדוק: האם עלות הליד גבוהה מדי? האם הערך הממוצע לעסקה נמוך מדי?`,
    });
  }

  // 5. Customer lifetime value insight
  const avgDealValue = payingLeads > 0 ? Math.round(totalRevenue / payingLeads) : 0;
  const costPerPaying = payingLeads > 0 ? Math.round(totalSpent / payingLeads) : 0;

  if (avgDealValue > 0 && costPerPaying > 0) {
    const multiplier = (avgDealValue / costPerPaying).toFixed(1);
    if (parseFloat(multiplier) >= 3) {
      insights.push({
        type: "success",
        icon: Zap,
        text: `כל שקל בפרסום מחזיר ${multiplier} ש"ח (כולל מע״מ) — מכפיל ${multiplier}x. אפשר להאיץ תקציב בביטחון.`,
      });
    }
  }

  // 6. Unscored leads warning
  const unscoredLeads = leads.filter(l => !l.closed_deal_value && l.status === "הפך ללקוח").length;
  if (unscoredLeads > 0) {
    insights.push({
      type: "info",
      icon: Edit3,
      text: `יש ${unscoredLeads} לידים שהפכו ללקוח אבל אין ערך עסקה. מלא את הסכום (ללא מע״מ) בטבלה למטה לקבלת תמונה מלאה.`,
    });
  }

  // Lead value table - show converted leads and their deal values
  const convertedLeads = leads
    .filter(l => l.status === "הפך ללקוח" || l.closed_deal_value > 0)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 20);

  const startEdit = (lead) => {
    setEditingLeadId(lead.id);
    setEditValue(lead.closed_deal_value || "");
  };

  const saveEdit = (leadId) => {
    const val = parseFloat(editValue) || 0;
    base44.entities.Lead.update(leadId, { closed_deal_value: val }).then(() => {
      setEditingLeadId(null);
      window.dispatchEvent(new Event("lead-value-updated"));
    });
  };

  const typeColors = {
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className="space-y-6">
      {/* Insights Cards */}
      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            תובנות עסקיות — לא מספרים, כסף
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <AnimatePresence>
            <div className="space-y-2">
              {insights.length > 0 ? insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`p-4 rounded-xl border ${typeColors[insight.type]} flex items-start gap-3`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center shrink-0 mt-0.5">
                    <insight.icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-slate-500">
                  <p>הזן ערכי עסקה ללידים כדי לקבל תובנות חכמות</p>
                </div>
              )}
            </div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Lead Value Tracking Table */}
      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Edit3 className="w-5 h-5 text-indigo-500" />
            מעקב ערך עסקאות — כמה כל לקוח סגר
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">שם</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">מקור</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">תאריך</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">סטטוס</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">ערך עסקה (ללא מע״מ)</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {convertedLeads.map((lead) => {
                  const isEditing = editingLeadId === lead.id;
                  return (
                    <tr key={lead.id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-sm">{lead.full_name}</p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{lead.source}</Badge>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {new Date(lead.created_date).toLocaleDateString("he-IL")}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-xs ${
                          lead.closed_deal_value > 0 
                            ? "bg-green-100 text-green-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {lead.closed_deal_value > 0 ? "שולם ✓" : lead.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-28 h-8 text-sm"
                            placeholder="סכום"
                            autoFocus
                          />
                        ) : (
                          <span className={`font-bold text-sm ${lead.closed_deal_value > 0 ? "text-green-700" : "text-slate-400"}`}>
                            {lead.closed_deal_value ? formatMoney(lead.closed_deal_value) : "—"}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => saveEdit(lead.id)}>
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setEditingLeadId(null)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700" onClick={() => startEdit(lead)}>
                            <Edit3 className="w-3 h-3 ml-1" />
                            {lead.closed_deal_value ? "עדכן" : "הזן סכום"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {convertedLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <p>אין עדיין לידים עם ערך עסקה</p>
                      <p className="text-xs mt-1">סמן ליד כמשולם והזן את הסכום</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}