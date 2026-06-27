import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Pencil, Trash2, Scale, Plus } from "lucide-react";

/**
 * רשימת דיונים של תיק מסוים.
 * props:
 *   hearings — מערך
 *   onAdd, onEdit(hearing, index), onDelete(index)
 */
export default function HearingsList({ hearings = [], onAdd, onEdit, onDelete }) {
  const sorted = [...hearings].sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            דיונים בתיק ({hearings.length})
          </h3>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 ml-2" />
            הוסף דיון
          </Button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>אין דיונים מתוזמנים</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((hearing, idx) => {
              const hearingDate = new Date(hearing.date);
              const isPast = hearingDate < now;
              return (
                <div
                  key={idx}
                  className={`p-4 border rounded-xl flex items-start justify-between gap-4 ${
                    isPast ? "bg-slate-50 border-slate-200" : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={isPast ? "bg-slate-200 text-slate-700" : "bg-amber-200 text-amber-900"}>
                        {hearingDate.toLocaleDateString("he-IL", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Badge>
                      {hearing.time && (
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {hearing.time}
                        </span>
                      )}
                      {hearing.proceeding_number && (
                        <Badge variant="outline" className="font-mono text-xs">
                          הליך: {hearing.proceeding_number}
                        </Badge>
                      )}
                    </div>
                    {hearing.description && (
                      <p className="text-sm text-slate-700 mb-1">{hearing.description}</p>
                    )}
                    {hearing.location && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {hearing.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-900"
                      onClick={() => onEdit(hearing, idx)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-600"
                      onClick={() => onDelete(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}