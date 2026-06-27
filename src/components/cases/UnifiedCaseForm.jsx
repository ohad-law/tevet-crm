
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { X, Loader2, User, Briefcase, CheckSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UnifiedCaseForm({ onSubmit, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomClassification, setShowCustomClassification] = useState(false);

  const [formData, setFormData] = useState({
    // Client data
    client_full_name: "",
    client_id_number: "",
    client_phone: "",
    client_email: "",
    client_address: "",
    client_classification: "עובד זר",
    client_lead_source: "",
    
    // Case data
    case_name: "",
    case_type: "דיני עבודה - עובדים זרים",
    defendant_name: "",
    defendant_id: "",
    defendant_address: "",
    defendant_contact: "",
    defendant_phone: "",
    case_value: "",
    employment_start_date: "",
    employment_end_date: "",
    case_description: "",
    
    // Task data
    task_description: "",
    task_assigned_to: "",
    task_priority: "רגיל",
    task_due_date: "",
    task_type: "איסוף מסמכים"
  });

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill case name based on client name
      if (field === "client_full_name" && value) {
        updated.case_name = `תביעה - ${value}`;
      }
      
      // Auto-fill task description
      if (field === "client_full_name" && value) {
        updated.task_description = `תיק חדש - איסוף מסמכים ובדיקה ראשונית - ${value}`;
      }
      
      return updated;
    });
  };

  const handleClassificationChange = (value) => {
    if (value === 'custom') {
      setShowCustomClassification(true);
      handleChange('client_classification', ''); // Clear current classification to allow typing
    } else {
      setShowCustomClassification(false);
      handleChange('client_classification', value);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          upload_date: new Date().toISOString(),
          category: "כללי"
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      alert("שגיאה בהעלאת קבצים");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const calculateDueDate = () => {
    const date = new Date();
    let addedDays = 0;
    const targetDays = 3;

    while (addedDays < targetDays) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.client_full_name || !formData.client_phone) {
      alert("נא למלא לפחות שם מלא וטלפון לקוח");
      return;
    }

    if (!formData.case_type || !formData.defendant_name) {
      alert("נא למלא סוג תיק ושם נתבע");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalData = {
        // Client
        new_client: {
          full_name: formData.client_full_name,
          id_number: formData.client_id_number,
          phone: formData.client_phone,
          email: formData.client_email,
          address: formData.client_address,
          classification: formData.client_classification,
          status: "פעיל",
          join_date: new Date().toISOString().split('T')[0]
        },
        
        // Case
        case_name: formData.case_name,
        case_type: formData.case_type,
        parties: `${formData.client_full_name} נגד ${formData.defendant_name}`,
        case_description: formData.case_description,
        value: parseFloat(formData.case_value) || 0,
        open_date: new Date().toISOString().split('T')[0],
        assigned_to: formData.task_assigned_to,
        defendant_name: formData.defendant_name,
        defendant_id: formData.defendant_id,
        defendant_address: formData.defendant_address,
        defendant_contact: formData.defendant_contact,
        defendant_phone: formData.defendant_phone,
        employment_start_date: formData.employment_start_date,
        employment_end_date: formData.employment_end_date,
        documents: uploadedFiles,
        
        // Task
        create_initial_task: true,
        task_description: formData.task_description || `תיק חדש - איסוף מסמכים - ${formData.client_full_name}`,
        task_priority: formData.task_priority,
        task_due_date: formData.task_due_date || calculateDueDate(),
        task_type: formData.task_type,
        
        // Message
        send_message_to_worker: !!formData.task_assigned_to,
        message_to_worker: `תיק חדש הוקצה לך: ${formData.case_name}\n\nלקוח: ${formData.client_full_name}\nנתבע: ${formData.defendant_name}\n\nיש להתחיל בטיפול בהקדם.`
      };

      await onSubmit(finalData);
    } catch (error) {
      alert("שגיאה ביצירת התיק: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-2xl border-none">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">➕ יצירת לקוח + תיק + משימה</CardTitle>
            <Button variant="ghost" onClick={onCancel} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* Part 1: Client Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-blue-500 pb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">📋 חלק 1: פרטי לקוח</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם מלא *</Label>
                <Input
                  value={formData.client_full_name}
                  onChange={(e) => handleChange('client_full_name', e.target.value)}
                  placeholder="שם מלא"
                />
              </div>

              <div className="space-y-2">
                <Label>ת.ז</Label>
                <Input
                  value={formData.client_id_number}
                  onChange={(e) => handleChange('client_id_number', e.target.value)}
                  placeholder="123456789"
                />
              </div>

              <div className="space-y-2">
                <Label>טלפון *</Label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => handleChange('client_phone', e.target.value)}
                  placeholder="050-1234567"
                />
              </div>

              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleChange('client_email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>כתובת</Label>
                <Input
                  value={formData.client_address}
                  onChange={(e) => handleChange('client_address', e.target.value)}
                  placeholder="רחוב, מספר, עיר"
                />
              </div>

              <div className="space-y-2">
                <Label>סיווג</Label>
                {!showCustomClassification ? (
                  <Select value={formData.client_classification} onValueChange={handleClassificationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סיווג" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="עובד זר">עובד זר</SelectItem>
                      <SelectItem value="מעסיק">מעסיק</SelectItem>
                      <SelectItem value="פרטי">פרטי</SelectItem>
                      <SelectItem value="תאגיד">תאגיד</SelectItem>
                      <SelectItem value="custom">➕ הוסף סיווג חדש...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={formData.client_classification}
                      onChange={(e) => handleChange('client_classification', e.target.value)}
                      placeholder="הקלד סיווג חדש"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCustomClassification(false);
                        setFormData(prev => ({ ...prev, client_classification: 'עובד זר' })); // Reset to default
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>מקור ליד</Label>
                <Select value={formData.client_lead_source} onValueChange={(value) => handleChange('client_lead_source', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מקור" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="המלצה">המלצה</SelectItem>
                    <SelectItem value="אתר">אתר</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Part 2: Case Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-purple-500 pb-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">📁 חלק 2: פרטי תיק</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם התיק</Label>
                <Input
                  value={formData.case_name}
                  onChange={(e) => handleChange('case_name', e.target.value)}
                  placeholder='מתמלא אוטומטית: "תביעה - [שם]"'
                />
                <p className="text-xs text-gray-500">מתמלא אוטומטית לפי שם הלקוח</p>
              </div>

              <div className="space-y-2">
                <Label>סוג תיק *</Label>
                <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="דיני עבודה - עובדים זרים">דיני עבודה - עובדים זרים</SelectItem>
                    <SelectItem value="דיני עבודה - פיטורים">דיני עבודה - פיטורים</SelectItem>
                    <SelectItem value="דיני עבודה - שכר">דיני עבודה - שכר</SelectItem>
                    <SelectItem value="דיני עבודה - תביעה">דיני עבודה - תביעה כללית</SelectItem>
                    <SelectItem value="תביעה כספית">תביעה כספית</SelectItem>
                    <SelectItem value="חדלות פירעון">חדלות פירעון</SelectItem>
                    <SelectItem value="אזרחי - אחר">אזרחי - אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-3">נתבע (מי הוא תובע?) *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>שם החברה/אדם *</Label>
                    <Input
                      value={formData.defendant_name}
                      onChange={(e) => handleChange('defendant_name', e.target.value)}
                      placeholder="שם הנתבע"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ח.פ/ת.ז</Label>
                    <Input
                      value={formData.defendant_id}
                      onChange={(e) => handleChange('defendant_id', e.target.value)}
                      placeholder="514523658"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>כתובת</Label>
                    <Input
                      value={formData.defendant_address}
                      onChange={(e) => handleChange('defendant_address', e.target.value)}
                      placeholder="כתובת הנתבע"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>נציג</Label>
                    <Input
                      value={formData.defendant_contact}
                      onChange={(e) => handleChange('defendant_contact', e.target.value)}
                      placeholder="שם הנציג"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>טלפון נתבע</Label>
                    <Input
                      value={formData.defendant_phone}
                      onChange={(e) => handleChange('defendant_phone', e.target.value)}
                      placeholder="03-1234567"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ערך התביעה (₪)</Label>
                <Input
                  type="number"
                  value={formData.case_value}
                  onChange={(e) => handleChange('case_value', e.target.value)}
                  placeholder="25000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תאריך תחילת עבודה</Label>
                  <Input
                    type="date"
                    value={formData.employment_start_date}
                    onChange={(e) => handleChange('employment_start_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>תאריך סיום עבודה</Label>
                  <Input
                    type="date"
                    value={formData.employment_end_date}
                    onChange={(e) => handleChange('employment_end_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>תיאור תמציתי של המקרה</Label>
                <Textarea
                  value={formData.case_description}
                  onChange={(e) => handleChange('case_description', e.target.value)}
                  placeholder="תאר בקצרה את המקרה, הנסיבות, והטענות העיקריות..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label>📎 מסמכים</Label>
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    תלושים, חוזה, ת.ז, אישורים, ראיות וכו'
                  </p>

                  {isUploading && (
                    <div className="flex items-center gap-2 mt-3 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>מעלה קבצים...</span>
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Part 3: Task Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-green-500 pb-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">✅ חלק 3: משימה ראשונית</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>תיאור משימה</Label>
                <Input
                  value={formData.task_description}
                  onChange={(e) => handleChange('task_description', e.target.value)}
                  placeholder="תיק חדש - איסוף מסמכים ובדיקה ראשונית"
                />
                <p className="text-xs text-gray-500">מתמלא אוטומטית</p>
              </div>

              <div className="space-y-2">
                <Label>הקצה ל</Label>
                <Select value={formData.task_assigned_to} onValueChange={(value) => handleChange('task_assigned_to', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עובד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא מוקצה</SelectItem>
                    <SelectItem value="adam@tevet-law.com">אדם</SelectItem>
                    <SelectItem value="tevetlawfirm@gmail.com">דניאל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>עדיפות</Label>
                <Select value={formData.task_priority} onValueChange={(value) => handleChange('task_priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="רגיל">רגיל</SelectItem>
                    <SelectItem value="גבוה">גבוה</SelectItem>
                    <SelectItem value="דחוף">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>תאריך יעד</Label>
                <Input
                  type="date"
                  value={formData.task_due_date}
                  onChange={(e) => handleChange('task_due_date', e.target.value)}
                  placeholder={calculateDueDate()}
                />
                <p className="text-xs text-gray-500">ברירת מחדל: +3 ימי עבודה</p>
              </div>

              <div className="space-y-2">
                <Label>סוג משימה</Label>
                <Select value={formData.task_type} onValueChange={(value) => handleChange('task_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="איסוף מסמכים">איסוף מסמכים</SelectItem>
                    <SelectItem value="ייעוץ">ייעוץ</SelectItem>
                    <SelectItem value="בדיקה משפטית">בדיקה משפטית</SelectItem>
                    <SelectItem value="פגישה">פגישה</SelectItem>
                    <SelectItem value="הכנת מסמך">הכנת מסמך</SelectItem>
                    <SelectItem value="תחשיבים">תחשיבים</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  💾 שמור הכל וצור
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
