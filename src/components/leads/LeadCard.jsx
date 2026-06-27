import React from "react";
import { Phone, Mail, MoreHorizontal, CheckCircle, XCircle, Calendar, MessageSquare, Flame, MessageCircle, PhoneCall, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  'חדש': 'bg-blue-100 text-blue-800 border-blue-300',
  'יצר קשר': 'bg-purple-100 text-purple-800 border-purple-300',
  'פגישה נקבעה': 'bg-amber-100 text-amber-800 border-amber-300',
  'הפך ללקוח': 'bg-green-100 text-green-800 border-green-300',
  'לא רלוונטי': 'bg-gray-100 text-gray-500 border-gray-300',
  'פולו אפ נדרש': 'bg-orange-100 text-orange-800 border-orange-300',
  'ליד חם 🔥': 'bg-red-100 text-red-800 border-red-300',
};

const SCORE_BG = (score) => {
  if (!score) return "bg-slate-100 text-slate-500";
  if (score >= 7) return "bg-green-100 text-green-700";
  if (score >= 4) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

export default function LeadCard({ lead, isSelected, onToggleSelect, onStatusChange, onEdit, onDelete, onConvert, onCall, onEmail, onWhatsApp, onViewDetails, onUpdateCallAttempts, onLogCall }) {
  const daysAgo = Math.floor((Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24));
  const score = lead.lead_score || 0;
  const callAttempts = lead.call_attempts || 0;
  const MAX_CALLS = 5;
  const isHot = score >= 75 && lead.status !== 'הפך ללקוח' && lead.status !== 'לא רלוונטי';
  const isUrgent = daysAgo >= 2 && lead.status === 'חדש';
  const isClient = lead.status === 'הפך ללקוח';
  const isIrrelevant = lead.status === 'לא רלוונטי';

  // Row background
  let cardBg = 'bg-white';
  if (isClient) cardBg = 'bg-green-50/60';
  else if (isIrrelevant) cardBg = 'bg-gray-50/40';
  else if (isHot) cardBg = 'bg-red-50/40';
  else if (isUrgent) cardBg = 'bg-amber-50/40';

  const quickStatuses = isClient ? [] : isIrrelevant
    ? [{ label: 'החזר לפעיל', value: 'חדש', icon: CheckCircle, color: 'text-blue-600 hover:bg-blue-50' }]
    : [
        { label: 'יצר קשר', value: 'יצר קשר', icon: Phone, color: 'text-purple-600 hover:bg-purple-50' },
        { label: 'לא רלוונטי', value: 'לא רלוונטי', icon: XCircle, color: 'text-gray-500 hover:bg-gray-50' },
        { label: 'קבע פגישה', value: 'פגישה נקבעה', icon: Calendar, color: 'text-amber-600 hover:bg-amber-50' },
      ];

  return (
    <div className={`${cardBg} border ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'} rounded-xl p-3 md:p-4 transition-all duration-200 hover:shadow-md group`}>
      {/* Top row: checkbox + score + name + actions */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(lead.id)}
          className="mt-1.5 shrink-0"
        />

        {/* Score badge */}
        <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold ${
          score >= 75 ? 'bg-red-100 text-red-700' :
          score >= 50 ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {score}
        </div>

        {/* Name + details */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewDetails}>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-base md:text-lg truncate ${isClient ? 'text-green-800' : 'text-slate-900'}`}>
              {lead.full_name}
            </h3>
            {isHot && <Flame className="w-4 h-4 text-red-500 shrink-0" />}
            {isUrgent && <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">דחוף!</span>}
          </div>
          <p className="text-sm text-slate-600 mt-0.5 font-medium" dir="ltr">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{lead.source === 'אחר' ? lead.source_other || 'אחר' : lead.source}</Badge>
            <span className={`text-xs font-medium ${
              daysAgo === 0 ? 'text-red-600' :
              daysAgo === 1 ? 'text-orange-600' :
              daysAgo >= 3 ? 'text-amber-600' :
              'text-slate-400'
            }`}>
              {daysAgo === 0 ? 'היום 🔥' : daysAgo === 1 ? 'אתמול' : `לפני ${daysAgo} ימים`}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <Badge className={`${statusColors[lead.status] || 'bg-gray-100 text-gray-800'} border shrink-0`}>
          {lead.status}
        </Badge>
      </div>

      {/* Notes preview */}
      {lead.notes && (
        <div className="mt-2 mr-14 text-xs text-slate-500 line-clamp-1 cursor-pointer" onClick={onViewDetails}>
          💬 {lead.notes}
        </div>
      )}

      {/* Call next action hint */}
      {lead.call_next_action && (
        <div className="mt-1 mr-14 text-xs text-indigo-600 font-medium line-clamp-1">
          ➡️ {lead.call_next_action}
        </div>
      )}

      {/* Call attempts tracker */}
      {!isClient && !isIrrelevant && (
        <div className="flex items-center gap-2 mt-2 mr-14">
          <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_CALLS }).map((_, i) => (
              <button
                key={i}
                onClick={() => onUpdateCallAttempts && onUpdateCallAttempts(lead.id, i + 1 === callAttempts ? i : i + 1)}
                className={`w-5 h-5 rounded-full text-xs font-bold border transition-all ${
                  i < callAttempts
                    ? callAttempts >= MAX_CALLS
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-slate-300 text-slate-400 hover:border-blue-400'
                }`}
                title={`${i + 1} שיחות`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {callAttempts > 0 && (
            <span className={`text-xs font-medium ${callAttempts >= MAX_CALLS ? 'text-red-600' : 'text-slate-500'}`}>
              {callAttempts >= MAX_CALLS ? '⛔ מוצה – שקול להמשיך הלאה' : `${callAttempts}/${MAX_CALLS} שיחות`}
            </span>
          )}
        </div>
      )}

      {/* Quick actions row */}
      <div className="flex items-center gap-1 mt-3 mr-14 flex-wrap">
        {/* Primary: Call button */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300 font-medium"
          onClick={() => onCall(lead)}
        >
          <Phone className="w-3.5 h-3.5" />
          חייג
        </Button>

        {/* WhatsApp button */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 font-medium"
          onClick={() => onWhatsApp(lead)}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          וואטסאפ
        </Button>

        {/* Log call button */}
        {!isClient && !isIrrelevant && (
          <Button
            size="sm"
            variant="outline"
            className={`h-8 gap-1.5 font-medium ${
              lead.call_status === 'בוצעה'
                ? 'text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                : 'text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            onClick={() => onLogCall && onLogCall(lead)}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {lead.call_status === 'בוצעה' ? (
              <span className="flex items-center gap-1">
                שיחה
                {lead.call_score ? (
                  <span className={`text-xs font-bold px-1 rounded ${SCORE_BG(lead.call_score)}`}>
                    {lead.call_score}/10
                  </span>
                ) : null}
              </span>
            ) : 'תעד שיחה'}
          </Button>
        )}

        {/* Quick status buttons */}
        {quickStatuses.map((qs) => (
          <Button
            key={qs.value}
            size="sm"
            variant="ghost"
            className={`h-8 gap-1 text-xs ${qs.color}`}
            onClick={() => onStatusChange(lead.id, qs.value)}
          >
            <qs.icon className="w-3 h-3" />
            {qs.label}
          </Button>
        ))}

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {!isClient && lead.status !== 'לא רלוונטי' && (
              <DropdownMenuItem onClick={() => onConvert(lead)} className="text-green-600">
                <CheckCircle className="w-4 h-4 ml-2" />
                המר ללקוח
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              <MessageSquare className="w-4 h-4 ml-2" />
              עריכה והערות
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEmail(lead)}>
              <Mail className="w-4 h-4 ml-2" />
              שלח מייל
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-red-600">
              <XCircle className="w-4 h-4 ml-2" />
              מחק ליד
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}