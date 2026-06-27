import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KanbanColumn({ id, title, tasks, icon: Icon, color, onTaskClick, onDeleteTask, getCaseName, onAddTask }) {
  return (
    <div className="flex flex-col h-full min-w-[300px] w-full max-w-md">
      {/* Column Header */}
      <div className={`
        flex items-center justify-between p-4 mb-3 rounded-xl border shadow-sm backdrop-blur-sm
        bg-white border-slate-200/60
      `}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 min-w-[1.5rem] justify-center">
            {tasks.length}
          </Badge>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            onClick={() => onAddTask(id)} // Pass column ID to pre-fill status
        >
            <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`
              flex-1 rounded-2xl p-3 transition-colors duration-200
              ${snapshot.isDraggingOver ? "bg-slate-100/80 ring-2 ring-dashed ring-slate-300" : "bg-slate-50/50 border border-slate-200/50"}
              overflow-y-auto custom-scrollbar
            `}
            style={{ minHeight: '150px' }}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
                onDelete={onDeleteTask}
                getCaseName={getCaseName}
              />
            ))}
            {provided.placeholder}
            
            {/* Quick Add Placeholder */}
            <Button
                variant="ghost"
                className="w-full mt-2 border border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white hover:border-slate-300 h-10 rounded-xl justify-start px-4 text-sm"
                onClick={() => onAddTask(id)}
            >
                <Plus className="w-4 h-4 mr-2" />
                הוסף משימה ל{title}...
            </Button>
          </div>
        )}
      </Droppable>
    </div>
  );
}