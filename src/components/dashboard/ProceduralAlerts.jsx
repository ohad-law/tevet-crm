import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function ProceduralAlerts({ cases }) {
  const [overdueMilestones, setOverdueMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOverdueMilestones();
  }, [cases]);

  const loadOverdueMilestones = async () => {
    try {
      const allMilestones = await base44.entities.CaseMilestone.list();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter overdue milestones (due_date < today AND status != הושלם)
      const overdue = allMilestones.filter(m => {
        if (m.status === "הושלם") return false;
        if (!m.due_date) return false;
        return new Date(m.due_date) < today;
      });

      // Sort by due date (oldest first = most overdue)
      overdue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

      setOverdueMilestones(overdue.slice(0, 5));
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading milestones:", error);
      setIsLoading(false);
    }
  };

  const getCaseName = (caseId) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem?.case_name || "תיק לא ידוע";
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return null;
  }

  if (overdueMilestones.length === 0) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            חריגות סדרי דין
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-green-700">
            <span className="text-3xl mb-2 block">✓</span>
            כל שלבי סדרי הדין בזמנים - מצוין!
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
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-red-800">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            חריגות סדרי דין ({overdueMilestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overdueMilestones.map((milestone, idx) => (
            <Link key={milestone.id} to={createPageUrl(`CaseDetails?id=${milestone.case_id}`)}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100 hover:border-red-300 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-red-800 truncate group-hover:text-red-600 transition-colors">
                      {milestone.milestone_name}
                    </h4>
                    {milestone.is_mandatory && (
                      <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                        חובה
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">{getCaseName(milestone.case_id)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-red-600">
                      <Calendar className="w-3 h-3" />
                      יעד: {new Date(milestone.due_date).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <p className="text-lg font-bold text-red-600">
                      +{getDaysOverdue(milestone.due_date)}
                    </p>
                    <p className="text-xs text-slate-400">ימים</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}