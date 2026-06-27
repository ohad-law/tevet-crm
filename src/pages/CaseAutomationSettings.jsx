import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, Clock, FileText, MessageSquare, Send, Briefcase } from "lucide-react";

const STATUS_TASK_TEMPLATES = {
  'עריכת כתב תביעה': [
    { description: 'עריכת כתב תביעה מלא', priority: 'גבוה', days_until_due: 14 },
    { description: 'בדיקת חישוב סכום התביעה', priority: 'גבוה', days_until_due: 7 }
  ],
  'מעקב מספר הליך בנט': [
    { description: 'הגשת כתב תביעה לבית המשפט ומעקב אחר מספר הליך', priority: 'דחוף', days_until_due: 3 }
  ],
  'מסירה אישית/דואר ישראל': [
    { description: 'ביצוע המצאה לנתבע - אישי/דואר ישראל', priority: 'דחוף', days_until_due: 7 },
    { description: 'תיעוד אישור מסירה בתיק', priority: 'רגיל', days_until_due: 14 }
  ],
  'הודעה על המצאה': [
    { description: 'הגשת הודעה על ביצוע המצאה לבית המשפט', priority: 'דחוף', days_until_due: 5 }
  ],
  'תצהיר גילוי מסמכים': [
    { description: 'הכנת תצהיר גילוי מסמכים - איסוף כל המסמכים הרלוונטיים', priority: 'גבוה', days_until_due: 21 },
    { description: 'שליחת תצהיר גילוי מסמכים לצד שכנגד', priority: 'גבוה', days_until_due: 30 }
  ],
  'תצהיר עדות ראשית': [
    { description: 'פגישה עם לקוח לצורך הכנת תצהיר עדות ראשית', priority: 'גבוה', days_until_due: 14 },
    { description: 'עריכת תצהיר עדות ראשית', priority: 'גבוה', days_until_due: 21 }
  ],
  'הוכחות': [
    { description: 'הכנה לדיון הוכחות - ריענון עדים וחומר', priority: 'דחוף', days_until_due: 7 },
    { description: 'בדיקת כל המסמכים והראיות לדיון', priority: 'גבוה', days_until_due: 3 }
  ],
  'סיכומים': [
    { description: 'עריכת סיכומי טיעון בכתב', priority: 'דחוף', days_until_due: 21 }
  ],
  'פסק דין': [
    { description: 'קריאת פסק הדין וסיכום לעו"ד', priority: 'דחוף', days_until_due: 2 },
    { description: 'עדכון לקוח על תוצאת פסק הדין', priority: 'דחוף', days_until_due: 2 }
  ]
};

const priorityColors = {
  'דחוף': 'bg-red-100 text-red-700 border-red-200',
  'גבוה': 'bg-orange-100 text-orange-700 border-orange-200',
  'רגיל': 'bg-blue-100 text-blue-700 border-blue-200'
};

const statusIcons = {
  'עריכת כתב תביעה': FileText,
  'מעקב מספר הליך בנט': Clock,
  'מסירה אישית/דואר ישראל': Send,
  'הודעה על המצאה': MessageSquare,
  'תצהיר גילוי מסמכים': FileText,
  'תצהיר עדות ראשית': FileText,
  'הוכחות': Briefcase,
  'סיכומים': FileText,
  'פסק דין': CheckCircle2
};

export default function CaseAutomationSettings() {
  const [expandedStatus, setExpandedStatus] = useState(null);
  const totalTasks = Object.values(STATUS_TASK_TEMPLATES).reduce((sum, t) => sum + t.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            אוטומציית משימות
          </h1>
          <p className="text-slate-500 mt-1">
            כשסטטוס תיק משתנה — נוצרות משימות רלוונטיות אוטומטית
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center bg-green-50 border border-green-200 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-green-700">{Object.keys(STATUS_TASK_TEMPLATES).length}</p>
            <p className="text-xs text-green-600 font-medium">שלבים פעילים</p>
          </div>
          <div className="text-center bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-blue-700">{totalTasks}</p>
            <p className="text-xs text-blue-600 font-medium">משימות אוטומטיות</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
        <CardContent className="p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            איך זה עובד?
          </h3>
          <div className="flex items-center gap-3 text-sm text-slate-700 flex-wrap">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-yellow-100">
              <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>סטטוס תיק משתנה</span>
            </div>
            <span className="text-yellow-400 font-bold text-lg">→</span>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-yellow-100">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>אוטומציה מזוהה</span>
            </div>
            <span className="text-yellow-400 font-bold text-lg">→</span>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-yellow-100">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>משימות נוצרות + התראת WhatsApp</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Templates */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">מיפוי שלבים ← משימות</h2>
        {Object.entries(STATUS_TASK_TEMPLATES).map(([status, tasks]) => {
          const Icon = statusIcons[status] || FileText;
          const isExpanded = expandedStatus === status;
          return (
            <Card
              key={status}
              className="border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setExpandedStatus(isExpanded ? null : status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{status}</p>
                      <p className="text-xs text-slate-500">{tasks.length} משימות יוצרות אוטומטית</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs">
                      פעיל ✓
                    </Badge>
                    <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {tasks.map((task, i) => (
                      <div key={i} className="flex items-start justify-between bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-700">{task.description}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 mr-2">
                          <Badge className={`${priorityColors[task.priority]} border text-xs`}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-slate-400 bg-white border border-slate-200 rounded px-2 py-0.5">
                            עד {task.days_until_due} ימים
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}