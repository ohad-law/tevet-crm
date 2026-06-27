import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Users, Wallet, BarChart3, PiggyBank, Zap } from "lucide-react";

const formatMoney = (num) => {
  if (!num && num !== 0) return "—";
  return "₪" + num.toLocaleString();
};

const VAT_RATE = 0.18; // 18% מע״מ

export default function BusinessInsights({ leads, campaigns, totalSpent }) {
  // Calculate closed deal value total (net)
  const closedLeads = leads.filter(l => l.closed_deal_value > 0);
  const totalRevenueNet = closedLeads.reduce((sum, l) => sum + (l.closed_deal_value || 0), 0);
  const totalRevenueGross = Math.round(totalRevenueNet * (1 + VAT_RATE));
  const closedCount = closedLeads.length;
  
  // Average deal value (gross)
  const avgDealValueGross = closedCount > 0 ? Math.round(totalRevenueGross / closedCount) : 0;
  
  // Cost per paying customer (spend is gross — ads already include VAT)
  const costPerCustomer = closedCount > 0 ? Math.round(totalSpent / closedCount) : 0;
  
  // Net profit (revenue gross minus spend)
  const netProfit = totalRevenueGross - totalSpent;
  const isProfitable = netProfit > 0;
  
  // Profit margin
  const profitMargin = totalRevenueGross > 0 ? ((netProfit / totalRevenueGross) * 100).toFixed(0) : 0;
  
  // Break-even: how many deals needed at avg gross value to cover spend
  const breakEvenDeals = avgDealValueGross > 0 ? Math.ceil(totalSpent / avgDealValueGross) : 0;
  
  // Conversion rate: leads that became paying clients
  const payingClients = leads.filter(l => l.closed_deal_value > 0);
  const conversionToPaying = leads.length > 0 ? ((payingClients.length / leads.length) * 100).toFixed(1) : 0;
  
  // Revenue per lead (gross)
  const revenuePerLead = leads.length > 0 ? Math.round(totalRevenueGross / leads.length) : 0;

  const kpiCards = [
    {
      label: "הכנסה מסגירות",
      value: formatMoney(totalRevenueGross),
      sub: `${closedCount} לקוחות שילמו (כולל מע״מ)`,
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600",
      gradient: "from-emerald-50 to-green-50",
    },
    {
      label: "הוצאה על פרסום",
      value: formatMoney(totalSpent),
      sub: "סך כל הקמפיינים",
      icon: BarChart3,
      color: "bg-orange-50 text-orange-600",
      gradient: "from-orange-50 to-amber-50",
    },
    {
      label: "רווח נקי",
      value: formatMoney(netProfit),
      sub: profitMargin + "% שיעור רווח (כולל מע״מ)",
      icon: isProfitable ? TrendingUp : TrendingDown,
      color: isProfitable ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600",
      gradient: isProfitable ? "from-green-50 to-emerald-50" : "from-red-50 to-rose-50",
      highlight: true,
    },
    {
      label: "עלות ללקוח משלם",
      value: formatMoney(costPerCustomer),
      sub: `ערך עסקה ממוצעת: ${formatMoney(avgDealValueGross)}`,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      gradient: "from-blue-50 to-sky-50",
    },
    {
      label: "הכנסה ממוצעת לליד",
      value: formatMoney(revenuePerLead),
      sub: `${conversionToPaying}% המרה ללקוח משלם`,
      icon: Target,
      color: "bg-purple-50 text-purple-600",
      gradient: "from-purple-50 to-violet-50",
    },
    {
      label: "נקודת איזון",
      value: `${breakEvenDeals} עסקאות`,
      sub: `צריך ${breakEvenDeals} לקוחות של ${formatMoney(avgDealValueGross)}`,
      icon: PiggyBank,
      color: "bg-amber-50 text-amber-600",
      gradient: "from-amber-50 to-yellow-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {kpiCards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.07 }}
          className={card.highlight ? "md:col-span-1" : ""}
        >
          <Card className={`shadow-md border-none overflow-hidden h-full ${card.highlight ? "ring-2 ring-offset-1 " + (isProfitable ? "ring-green-400" : "ring-red-300") : ""}`}>
            <CardContent className={`p-4 bg-gradient-to-br ${card.gradient}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-slate-600 font-medium">{card.label}</span>
              </div>
              <p className={`text-xl font-bold mb-0.5 ${netProfit < 0 && card.label === "רווח נקי" ? "text-red-600" : "text-slate-900"}`}>
                {card.value}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">{card.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}