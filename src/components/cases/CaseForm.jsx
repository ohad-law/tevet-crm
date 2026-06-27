import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { Case } from "@/entities/Case";

export default function CaseForm({ caseData, clients, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(caseData || {
    case_number: "",
    case_name: "",
    client_id: "",
    case_type: "דיני עבודה - תביעה",
    status: "תיק נכנס",
    value: 0,
    open_date: new Date().toISOString().split('T')[0],
    target_close_date: "",
    assigned_to: "",
    net_hamishpat_number: "",
    hearings: []
  });

  useEffect(() => {
    const generateCaseNumber = async () => {
      if (!caseData) {
        const allCases = await Case.list();
        const year = new Date().getFullYear();
        const casesThisYear = allCases.filter(c => c.case_number?.startsWith(`${year}-`));
        const nextNumber = casesThisYear.length + 1;
        const newCaseNumber = `${year}-${String(nextNumber).padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, case_number: newCaseNumber }));
      }
    };
    generateCaseNumber();
  }, [caseData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addHearing = () => {
    setFormData(prev => ({
      ...prev,
      hearings: [...(prev.hearings || []), { date: "", description: "" }]
    }));
  };

  const removeHearing = (index) => {
    setFormData(prev => ({
      ...prev,
      hearings: prev.hearings.filter((_, i) => i !== index)
    }));
  };

  const updateHearing = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      hearings: prev.hearings.map((h, i) => i === index ? { ...h, [field]: value } : h)
    }));
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
            {caseData ? 'עריכת תיק' : 'תיק חדש'}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="case_number">מספר תיק *</Label>
                <Input
                  id="case_number"
                  value={formData.case_number}
                  onChange={(e) => handleChange('case_number', e.target.value)}
                  placeholder="מספר תיק"
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">מספר התיק נוצר אוטומטית</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_name">שם תיק *</Label>
                <Input
                  id="case_name"
                  value={formData.case_name}
                  onChange={(e) => handleChange('case_name', e.target.value)}
                  placeholder="שם התיק"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">לקוח *</Label>
                <Select value={formData.client_id} onValueChange={(value) => handleChange('client_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_type">סוג תיק *</Label>
                <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג תיק" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="דיני עבודה - תביעה">דיני עבודה - תביעה</SelectItem>
                    <SelectItem value="דיני עבודה - עובדים זרים">דיני עבודה - עובדים זרים</SelectItem>
                    <SelectItem value="חדלות פירעון">חדלות פירעון</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="תיק נכנס">תיק נכנס</SelectItem>
                    <SelectItem value="עריכת כתב תביעה">עריכת כתב תביעה</SelectItem>
                    <SelectItem value="מעקב מספר הליך בנט">מעקב מספר הליך בנט</SelectItem>
                    <SelectItem value="מסירה אישית/דואר ישראל">מסירה אישית/דואר ישראל</SelectItem>
                    <SelectItem value="הודעה על המצאה">הודעה על המצאה</SelectItem>
                    <SelectItem value="תצהיר גילוי מסמכים">תצהיר גילוי מסמכים</SelectItem>
                    <SelectItem value="תצהיר עדות ראשית">תצהיר עדות ראשית</SelectItem>
                    <SelectItem value="הוכחות">הוכחות</SelectItem>
                    <SelectItem value="סיכומים">סיכומים</SelectItem>
                    <SelectItem value="פסק דין">פסק דין</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">ערך תיק (₪)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="open_date">תאריך פתיחה</Label>
                <Input
                  id="open_date"
                  type="date"
                  value={formData.open_date}
                  onChange={(e) => handleChange('open_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_close_date">יעד לסגירה</Label>
                <Input
                  id="target_close_date"
                  type="date"
                  value={formData.target_close_date}
                  onChange={(e) => handleChange('target_close_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">עובד אחראי</Label>
                <Input
                  id="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => handleChange('assigned_to', e.target.value)}
                  placeholder="שם העובד האחראי"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="net_hamishpat_number">מספר תיק בנט המשפט</Label>
                <Input
                  id="net_hamishpat_number"
                  value={formData.net_hamishpat_number}
                  onChange={(e) => handleChange('net_hamishpat_number', e.target.value)}
                  placeholder="מספר תיק בנט המשפט (אופציונלי)"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>תאריכי דיונים</Label>
                <Button type="button" variant="outline" size="sm" onClick={addHearing}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף דיון
                </Button>
              </div>
              
              {formData.hearings?.map((hearing, index) => (
                <div key={index} className="flex gap-3 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`hearing-date-${index}`}>תאריך</Label>
                    <Input
                      id={`hearing-date-${index}`}
                      type="date"
                      value={hearing.date}
                      onChange={(e) => updateHearing(index, 'date', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`hearing-desc-${index}`}>תיאור</Label>
                    <Input
                      id={`hearing-desc-${index}`}
                      value={hearing.description}
                      onChange={(e) => updateHearing(index, 'description', e.target.value)}
                      placeholder="תיאור הדיון"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHearing(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-gray-100 p-6 bg-gray-50">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
              <Save className="w-4 h-4 ml-2" />
              {caseData ? 'עדכון' : 'יצירה'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}