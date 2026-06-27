import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Briefcase, MoreHorizontal, Clock, User, Edit2, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function KanbanCard({ task, index, onClick, onDelete, getCaseName, priorityColors }) {
  const priorityConfig = {
    'דחוף': { color: 'text-red-600 bg-red-50 border-red-100', icon: AlertCircle },
    'גבוה': { color: 'text-orange-600 bg-orange-50 border-orange-100', icon: AlertCircle },
    'רגיל': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Circle },
    'נמוך': { color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Circle },
  };

  function Circle({ className }) {
    return <div className={`w-3 h-3 rounded-full border-2 ${className}`} />;
  }

  const config = priorityConfig[task.priority] || priorityConfig['רגיל'];
  const PriorityIcon = config.icon;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          style={{ ...provided.draggableProps.style }}
        >
          <Card 
            onClick={() => onClick(task)}
            className={`
              group relative border border-slate-200 bg-white shadow-sm rounded-xl
              hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer
              ${snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500 rotate-2 z-50" : ""}
            `}
          >
            <CardContent className="p-4">
              {/* Header: Priority & Actions */}
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className={`${config.color} border px-2 py-0.5 rounded-md flex items-center gap-1.5 text-xs font-bold shadow-none`}>
                   <PriorityIcon className="w-3 h-3" />
                   {task.priority}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 hover:bg-slate-100 transition-all rounded-full">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(task); }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      ערוך
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      מחק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title */}
              <h4 className="text-slate-800 font-bold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {task.description}
              </h4>

              {/* Metadata Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
                 <div className="flex flex-col gap-1.5">
                    {task.due_date && (
                      <div className={`flex items-center gap-1.5 text-xs ${
                        new Date(task.due_date) < new Date() && task.status !== 'הושלמה' ? 'text-red-500 font-medium' : 'text-slate-400'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{format(new Date(task.due_date), "d MMM")}</span>
                      </div>
                    )}
                    
                    {task.case_id && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 max-w-[140px]">
                        <Briefcase className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate" title={getCaseName(task.case_id)}>
                          {getCaseName(task.case_id)}
                        </span>
                      </div>
                    )}
                 </div>

                 {task.assigned_to && (
                   <Avatar className="w-7 h-7 border-2 border-white shadow-sm ring-1 ring-slate-100">
                     <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold">
                       {task.assigned_to.charAt(0).toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                 )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}