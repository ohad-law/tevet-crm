import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function StagnantCases({ cases, clients }) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find cases with no status change for > 30 days
  const stagnantCases = cases.filter(c => {
    if (c.status === 'ארכיון' || c.status === 'פסק דין') return false;
    
    // Check last_status_change_date or fall back to open_date
    const lastChange = c.last_status_change_date || c.open_date;
    if (!lastChange) return true; // No date = stagnant
    
    return new Date(lastChange) < thirtyDaysAgo;
  }).sort((a, b) => {
    const dateA = new Date(a.last_status_change_date || a.open_date || 0);
    const dateB = new Date(b.last_status_change_date || b.open_date || 0);
    return dateA - dateB; // Oldest first
  }).slice(0, 5);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לקוח לא ידוע';
  };

  const getDaysSinceChange = (caseItem) => {
    const lastChange = caseItem.last_status_change_date || caseItem.open_date;
    if (!lastChange) return '∞';
    const days = Math.floor((Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (stagnantCases.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            תיקים דורשי תשומת לב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-slate-500">
            <span className="text-3xl mb-2 block">✓</span>
            כל התיקים פעילים - אין תיקים תקועים!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            דורש תשומת לב ({stagnantCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stagnantCases.map((caseItem, idx) => (
            <Link key={caseItem.id} to={createPageUrl(`CaseDetails?id=${caseItem.id}`)}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                      {caseItem.case_name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{getClientName(caseItem.client_id)}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs bg-slate-50">
                      {caseItem.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <p className="text-lg font-bold text-amber-600">
                      {getDaysSinceChange(caseItem)}
                    </p>
                    <p className="text-xs text-slate-400">ימים</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}