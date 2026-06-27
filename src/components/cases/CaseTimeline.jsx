import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertCircle, FileText, Gavel, Briefcase, Flag } from "lucide-react";
import { motion } from "framer-motion";

export default function CaseTimeline({ caseData }) {
  const timelineEvents = [];

  // Case Creation
  if (caseData.created_date) {
    timelineEvents.push({
      date: caseData.created_date,
      title: "פתיחת התיק",
      description: `תיק ${caseData.case_number} נפתח במערכת`,
      icon: Briefcase,
      color: "bg-blue-500",
      type: "creation"
    });
  }

  // Custom Timeline Events
  if (caseData.timeline && caseData.timeline.length > 0) {
    caseData.timeline.forEach(event => {
      timelineEvents.push({
        date: event.date,
        title: event.event_type || "עדכון סטטוס",
        description: event.description,
        icon: Flag,
        color: "bg-purple-500",
        type: "update",
        user: event.created_by
      });
    });
  }

  // Hearings
  if (caseData.hearings && caseData.hearings.length > 0) {
    caseData.hearings.forEach(hearing => {
      timelineEvents.push({
        date: hearing.date,
        title: "דיון משפטי",
        description: hearing.description || "דיון בבית המשפט",
        icon: Gavel,
        color: "bg-amber-500",
        type: "hearing"
      });
    });
  }

  // Target Close Date
  if (caseData.target_close_date) {
    const daysUntil = Math.floor((new Date(caseData.target_close_date) - new Date()) / (1000 * 60 * 60 * 24));
    const isPast = daysUntil < 0;
    
    timelineEvents.push({
      date: caseData.target_close_date,
      title: isPast ? "יעד סגירה (עבר)" : "יעד סגירה משוער",
      description: isPast ? `חלף לפני ${Math.abs(daysUntil)} ימים` : `בעוד ${daysUntil} ימים`,
      icon: isPast ? AlertCircle : CheckCircle,
      color: isPast ? "bg-red-500" : "bg-emerald-500",
      type: "target"
    });
  }

  // Sort timeline: Future events at top? Or strict chronological?
  // Usually timelines are newest first or chronological. Let's do newest first for history, but future events should be visible.
  // Let's just simple sort by date descending.
  timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (timelineEvents.length === 0) return null;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-blue-600" />
          השתלשלות התיק ואירועים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 relative">
        {/* Vertical Line */}
        <div className="absolute top-8 bottom-8 right-[43px] w-0.5 bg-slate-200" />

        <div className="space-y-8">
          {timelineEvents.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-6"
            >
              {/* Icon Bubble */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white shrink-0 ${event.color} text-white`}>
                <event.icon className="w-5 h-5" />
              </div>

              {/* Content Card */}
              <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow relative">
                {/* Little arrow pointing to bubble */}
                <div className="absolute top-3 right-[-6px] w-3 h-3 bg-white border-t border-r border-slate-100 transform rotate-45" />
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{event.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  {event.type === 'hearing' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">דיון</Badge>}
                  {event.type === 'target' && <Badge variant="outline" className="bg-slate-50 text-slate-600">יעד</Badge>}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
                {event.user && (
                  <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                    עודכן ע"י: {event.user}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const ActivityIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);