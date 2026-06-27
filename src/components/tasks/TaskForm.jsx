import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseSelector } from "@/components/common/CaseSelector";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

export default function TaskForm({ task, cases, onSubmit, onCancel, initialStatus }) {
  const [formData, setFormData] = useState(task || {
    description: "",
    case_id: "",
    priority: "רגיל",
    due_date: "",
    status: initialStatus || "לביצוע"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-2xl border-none">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {task ? 'עריכת משימה' : 'משימה חדשה'}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">תיאור המשימה *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="תאר את המשימה..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="case_id">תיק</Label>
                <CaseSelector
                  cases={cases}
                  value={formData.case_id}
                  onChange={(value) => handleChange('case_id', value)}
                  placeholder="חפש תיק..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">עדיפות</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עדיפות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="רגיל">רגיל</SelectItem>
                    <SelectItem value="גבוה">גבוה</SelectItem>
                    <SelectItem value="דחוף">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">תאריך יעד</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="לביצוע">לביצוע</SelectItem>
                    <SelectItem value="בטיפול">בטיפול</SelectItem>
                    <SelectItem value="הושלמה">הושלמה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-gray-100 p-6 bg-gray-50">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
              <Save className="w-4 h-4 ml-2" />
              {task ? 'עדכון' : 'יצירה'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}