import React from "react";
import { AlertTriangle, Flame, Clock, UserCheck, PhoneMissed, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function LeadStatsBar({ leads }) {
  const totalLeads = leads.length;
  const newUntreated = leads.filter(l => l.status === 'חדש').length;
  const hotLeads = leads.filter(l => l.lead_score >= 75 && l.status !== 'הפך ללקוח' && l.status !== 'לא רלוונטי').length;
  const urgentLeads = leads.filter(l => {
    const daysAgo = Math.floor((Date.now() - new Date(l.created_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo >= 2 && (l.status === 'חדש' || l.status === 'יצר קשר');
  }).length;

  // New: call KPIs
  const noCallLeads = leads.filter(l =>
    l.status !== 'הפך ללקוח' && l.status !== 'לא רלוונטי' &&
    (!l.call_status || l.call_status === 'לא בוצעה')
  ).length;

  const calledLeads = leads.filter(l => l.call_score != null && l.call_score > 0);
  const avgCallScore = calledLeads.length > 0
    ? (calledLeads.reduce((sum, l) => sum + (l.call_score || 0), 0) / calledLeads.length).toFixed(1)
    : null;

  if (totalLeads === 0) return null;

  const items = [
    { label: 'סה"כ לידים', value: totalLeads, icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'חדשים', value: newUntreated, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'לידים חמים', value: hotLeads, icon: Flame, color: 'text-red-600', bg: 'bg-red-50', pulse: hotLeads > 0 },
    { label: 'דורשים טיפול דחוף', value: urgentLeads, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', pulse: urgentLeads > 0 },
    {
      label: 'ללא שיחה',
      value: noCallLeads,
      icon: PhoneMissed,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      pulse: noCallLeads > 0,
      highlight: noCallLeads > 0,
    },
    {
      label: 'ציון שיחה ממוצע',
      value: avgCallScore ? `${avgCallScore}/10` : '—',
      icon: Star,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 md:gap-3"
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`flex items-center gap-2 ${item.bg} rounded-xl px-3 py-2 border ${
            item.highlight ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200/50'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
            <item.icon className={`w-4 h-4 ${item.color} ${item.pulse ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}