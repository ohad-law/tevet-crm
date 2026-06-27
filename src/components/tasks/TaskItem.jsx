import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TaskItem({ task, cases }) {
  const relatedCase = cases.find(c => c.id === task.case_id);
  
  // Calculate priority based on case age
  let autoPriority = task.priority || "רגיל";
  let priorityColor = "bg-blue-100 text-blue-800";
  
  if (relatedCase?.open_date) {
    const daysSinceOpen = Math.floor((Date.now() - new Date(relatedCase.open_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOpen > 5) {
      autoPriority = "דחוף";
      priorityColor = "bg-red-100 text-red-800";
    } else if (daysSinceOpen > 3) {
      autoPriority = "גבוה";
      priorityColor = "bg-orange-100 text-orange-800";
    } else {
      autoPriority = "רגיל";
      priorityColor = "bg-green-100 text-green-800";
    }
  }

  // Check if overdue
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'הושלמה';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? 'border-2 border-red-400' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Priority Badge */}
            <div className="flex items-start justify-between gap-2">
              <Badge className={priorityColor}>
                {autoPriority}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-600 text-white">
                  <AlertTriangle className="w-3 h-3 ml-1" />
                  איחור!
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm font-medium text-gray-900 line-clamp-3">
              {task.description}
            </p>

            {/* Case Link */}
            {relatedCase && (
              <Link to={createPageUrl(`CaseDetails?id=${relatedCase.id}`)}>
                <div className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                  <Briefcase className="w-3 h-3" />
                  <span className="truncate">{relatedCase.case_name}</span>
                </div>
              </Link>
            )}

            {/* Due Date */}
            {task.due_date && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="w-3 h-3" />
                <span>יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>
              </div>
            )}

            {/* Auto Deadline Info */}
            {task.auto_deadline_info && (
              <p className="text-xs text-gray-500 italic">
                {task.auto_deadline_info}
              </p>
            )}

            {/* Assigned To */}
            {task.assigned_to && (
              <div className="text-xs text-gray-600">
                <span className="font-semibold">אחראי:</span> {task.assigned_to}
              </div>
            )}

            {/* Task Type */}
            {task.task_type && (
              <Badge variant="outline" className="text-xs">
                {task.task_type}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}