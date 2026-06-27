
import { useState, useEffect } from "react";
import { WorkerIntakeForm, Client, Case, Task } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Globe, Upload, X, Loader2, FileText, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

import DocumentSignature from "../components/worker-intake/DocumentSignature";

// ⚠️ THIS PAGE IS PUBLIC - NO AUTHENTICATION REQUIRED
export const pageConfig = {
  public: true,
  requireAuth: false
};

export default function WorkerIntake() {
  const [language, setLanguage] = useState("עברית");
  const [step, setStep] = useState(1);
  const [agreedToWarning, setAgreedToWarning] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Set meta tags for WhatsApp sharing
  useEffect(() => {
    document.title = "טופס קליטת עובד - משרד עורכי דין טבת";
    
    const updateMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.querySelector(`meta[name="${property}"]`);
      }
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('description', 'טופס לקליטת עובדים ואיסוף מידע לתביעה. מלא את הטופס ונחזור אליך בהקדם.');
    updateMetaTag('og:title', 'טופס קליטת עובד - משרד עורכי דין טבת');
    updateMetaTag('og:description', 'טופס לקליטת עובדים ואיסוף מידע לתביעה. מלא את הטופס ונחזור אליך בהקדם.');
    updateMetaTag('og:title:ar', 'نموذج استقبال عامل - مكتب محاماة طابات');
    updateMetaTag('og:description:ar', 'نموذج لاستقبال العمال وجمع المعلومات للدعوى. املأ النموذج وسنتصل بك قريباً');
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'משרד עורכי דין טבת');
    
    return () => {
      document.title = "Legal CRM";
    };
  }, []);

  const [formData, setFormData] = useState({
    form_language: "עברית",
    full_name: "",
    id_number: "",
    phone: "",
    address: "",
    employer_name: "",
    employer_business: "",
    employer_phone: "",
    job_description: "",
    payment_type: "",
    salary_amount: 0,
    payment_method: "",
    received_payslips: false,
    work_start_date: "",
    work_end_date: "",
    daily_hours_details: "",
    weekly_days_details: "",
    termination_reason: "",
    termination_type: "",
    termination_explanation: "",
    accommodation_details: "",
    had_work_permit: false,
    work_permit_payment: "",
    uploaded_documents: []
  });

  const [signatures, setSignatures] = useState({
    fee_agreement: null,
    power_of_attorney: null
  });
  
  const [currentDocument, setCurrentDocument] = useState(0);
  const [finalConfirmation, setFinalConfirmation] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const isHebrew = language === "עברית";

  const toggleLanguage = () => {
    const newLang = isHebrew ? "العربية" : "עברית";
    setLanguage(newLang);
    setFormData(prev => ({ ...prev, form_language: newLang }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    const uploadedDocs = [];

    try {
      for (const file of files) {
        const { file_url } = await UploadFile({ file });
        uploadedDocs.push({
          name: file.name,
          url: file_url,
          type: file.type,
          size: file.size
        });
      }

      setFormData(prev => ({
        ...prev,
        uploaded_documents: [...prev.uploaded_documents, ...uploadedDocs]
      }));
    } catch (error) {
      alert(isHebrew ? "שגיאה בהעלאת קבצים" : "خطأ في تحميل الملفات");
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      uploaded_documents: prev.uploaded_documents.filter((_, i) => i !== index)
    }));
  };

  const isFormValid = () => {
    return (
      formData.full_name &&
      formData.id_number &&
      formData.phone &&
      formData.address &&
      formData.employer_name &&
      formData.employer_business &&
      formData.employer_phone &&
      formData.job_description &&
      formData.payment_type &&
      formData.salary_amount > 0 &&
      formData.payment_method &&
      formData.work_start_date &&
      formData.work_end_date &&
      formData.daily_hours_details &&
      formData.weekly_days_details &&
      formData.termination_reason &&
      formData.termination_type &&
      formData.accommodation_details &&
      formData.uploaded_documents.length > 0
    );
  };

  const documents = [
    {
      title: isHebrew ? "הסכם שכר טרחה" : "اتفاقية الأتعاب",
      type: "fee_agreement"
    },
    {
      title: isHebrew ? "ייפוי כח" : "التوكيل",
      type: "power_of_attorney"
    }
  ];

  const handleSignatureComplete = (signatureData) => {
    setSignatures(prev => ({
      ...prev,
      [signatureData.type]: signatureData.signature
    }));

    if (currentDocument < documents.length - 1) {
      setCurrentDocument(currentDocument + 1);
    } else {
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    if (!finalConfirmation) {
      alert(isHebrew ? "נא לאשר את האזהרה הסופית" : "يرجى تأكيد التحذير النهائي");
      return;
    }

    setSubmitting(true);

    try {
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // 1. Create intake form record
      const intakeForm = await WorkerIntakeForm.create({
        ...formData,
        fee_agreement_signature: signatures.fee_agreement,
        power_of_attorney_signature: signatures.power_of_attorney,
        submission_date: new Date().toISOString(),
        form_duration_seconds: duration,
        status: "הוגש"
      });

      // 2. Create client
      const client = await Client.create({
        full_name: formData.full_name,
        id_number: formData.id_number,
        phone: formData.phone,
        address: formData.address,
        classification: "עובד זר",
        status: "פעיל",
        join_date: new Date().toISOString().split('T')[0]
      });

      // 3. Generate case number
      const currentYear = new Date().getFullYear();
      const allCases = await Case.list();
      const yearCases = allCases.filter(c => c.case_number?.startsWith(`${currentYear}-`));
      const maxNumber = yearCases.length > 0 
        ? Math.max(...yearCases.map(c => parseInt(c.case_number.split('-')[1]) || 0))
        : 0;
      const caseNumber = `${currentYear}-${String(maxNumber + 1).padStart(3, '0')}`;

      // 4. Create case
      const newCase = await Case.create({
        case_number: caseNumber,
        case_name: `תביעה - ${formData.full_name}`,
        client_id: client.id,
        case_type: "דיני עבודה - עובדים זרים",
        status: "תיק נכנס",
        value: 4095,
        open_date: new Date().toISOString().split('T')[0],
        assigned_to: "",
        documents: formData.uploaded_documents || []
      });

      // 5. Calculate deadline
      const activeCases = allCases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין');
      let daysToAdd = 3;
      if (activeCases.length >= 30) daysToAdd = 10;
      else if (activeCases.length >= 20) daysToAdd = 7;
      else if (activeCases.length >= 10) daysToAdd = 5;

      const dueDate = new Date();
      let addedDays = 0;
      while (addedDays < daysToAdd) {
        dueDate.setDate(dueDate.getDate() + 1);
        const dayOfWeek = dueDate.getDay();
        if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Exclude Friday (5) and Saturday (6)
          addedDays++;
        }
      }

      // 6. Determine priority
      let priority = "רגיל";
      if (activeCases.length >= 25) priority = "דחוף";
      else if (activeCases.length >= 15) priority = "גבוה";

      // 7. Create task
      await Task.create({
        description: `טיפול בתיק חדש - עובד זר: ${formData.full_name}`,
        case_id: newCase.id,
        priority: priority,
        status: "לביצוע",
        due_date: dueDate.toISOString().split('T')[0],
        assigned_to: "",
        task_type: "איסוף מסמכים",
        auto_deadline_info: `חושב אוטומטית: ${activeCases.length} תיקים פעילים → ${daysToAdd} ימי עבודה`
      });

      // 8. Update intake form with references
      await WorkerIntakeForm.update(intakeForm.id, {
        created_client_id: client.id,
        created_case_id: newCase.id,
        status: "טופל"
      });

      setSubmissionResult({
        success: true,
        caseNumber: caseNumber,
        clientName: formData.full_name
      });
      setStep(8);

    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionResult({
        success: false,
        error: error.message || (isHebrew ? "שגיאה בשליחת הטופס. אנא נסה שוב או צור קשר טלפוני." : "خطأ في إرسال النموذج. يرجى المحاولة مرة أخرى أو الاتصال بنا.")
      });
      setStep(8);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Welcome & Warning
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4" dir={isHebrew ? "rtl" : "ltr"}>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={toggleLanguage} variant="outline" size="lg" className="bg-white shadow-lg border-2 border-blue-500">
            <Globe className="w-5 h-5 ml-2 text-blue-600" />
            {isHebrew ? "العربية" : "עברית"}
          </Button>
        </div>

        <div className="container mx-auto max-w-3xl mt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-2xl border-none">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-2xl md:text-3xl text-center font-bold">
                  {isHebrew ? "טופס תביעת זכויות עובדים" : "نموذج دعوى حقوق العمال"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="p-6 bg-red-50 rounded-lg border-4 border-red-500">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold text-red-900 mb-4">
                        {isHebrew ? "⚠️ חשוב מאוד - קרא לפני המשך!" : "⚠️ مهم جداً - اقرأ قبل المتابعة!"}
                      </h3>
                      <div className="text-red-800 text-lg space-y-2">
                        {isHebrew ? (
                          <>
                            <p className="font-bold">מילוי פרטים כוזבים או מטעים עלול לגרור:</p>
                            <ul className="list-disc list-inside space-y-1 mr-4">
                              <li>קנס כספי משמעותי מבית הדין לעבודה</li>
                              <li>חיוב בהוצאות משפט גבוהות מאוד</li>
                              <li>חיוב בשכר טרחה מוגדל לעורך הדין</li>
                              <li>פגיעה חמורה בסיכויי התיק שלך</li>
                              <li>דחיית התביעה על ידי בית הדין</li>
                            </ul>
                            <p className="font-bold mt-4">חובה מוחלטת למסור מידע אמת, מלא ומדויק בלבד!</p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold">تقديم معلומات كاذبة أو مضللة قد يؤدي إلى:</p>
                            <ul className="list-disc list-inside space-y-1 mr-4">
                              <li>غرامة مالية كبيرة من محكمة العمل</li>
                              <li>دفع نفقات قضائية عالية جداً</li>
                              <li>دفع أتعاب محاماة إضافية للمحامي</li>
                              <li>الإضرار الخطير بفرص قضيتك</li>
                              <li>رفض الدعوى من قبل المحكمة</li>
                            </ul>
                            <p className="font-bold mt-4">يجب تقديم معلومات صحيحة وكاملة ودقيقة فقط!</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-400">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agree"
                      checked={agreedToWarning}
                      onCheckedChange={setAgreedToWarning}
                      className="mt-1"
                    />
                    <label htmlFor="agree" className="text-lg font-semibold text-amber-900 cursor-pointer">
                      {isHebrew 
                        ? "הבנתי והנני מתחייב למסור מידע אמת בלבד" 
                        : "فهمت وأتعهد بتقديم معلومات صحيحة فقط"}
                    </label>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!agreedToWarning}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl py-6"
                >
                  {isHebrew ? "המשך למילוי הטופס" : "متابعة لملء النموذج"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 2: Main Questionnaire (21 questions)
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4" dir={isHebrew ? "rtl" : "ltr"}>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={toggleLanguage} variant="outline" size="lg" className="bg-white shadow-lg border-2 border-blue-500">
            <Globe className="w-5 h-5 ml-2 text-blue-600" />
            {isHebrew ? "العربية" : "עברית"}
          </Button>
        </div>

        <div className="container mx-auto max-w-4xl mt-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="shadow-2xl border-none">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-2xl">
                  {isHebrew ? "שאלון מפורט - 21 שאלות" : "استبيان مفصل - 21 سؤال"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-8">
                {/* Section 1: Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-blue-500 pb-2">
                    {isHebrew ? "1. פרטים אישיים (4 שאלות)" : "1. معلومات شخصية (4 أسئلة)"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>1. {isHebrew ? "שם מלא *" : "الاسم الكامل *"}</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        placeholder={isHebrew ? "שם מלא" : "الاسم الكامل"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>2. {isHebrew ? "תעודת זהות *" : "رقم الهوية *"}</Label>
                      <Input
                        value={formData.id_number}
                        onChange={(e) => handleChange('id_number', e.target.value)}
                        placeholder={isHebrew ? "ת.ז" : "رقم الهوية"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>3. {isHebrew ? "טלפון נייד *" : "رقم الهاتف *"}</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="050-1234567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>4. {isHebrew ? "כתובת מגורים *" : "العنوان *"}</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder={isHebrew ? "רחוב, מספר, עיר" : "شارع، رقم، مدينة"}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Employer Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-purple-500 pb-2">
                    {isHebrew ? "2. פרטי המעסיק (4 שאלות)" : "2. تفاصيل صاحب العمل (4 أسئلة)"}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>5. {isHebrew ? "באיזה חברה עבדת? *" : "في أي شركة عملت؟ *"}</Label>
                      <Input
                        value={formData.employer_name}
                        onChange={(e) => handleChange('employer_name', e.target.value)}
                        placeholder={isHebrew ? "שם החברה" : "اسم الشركة"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>6. {isHebrew ? "מה החברה עושה? *" : "ماذا تفعل الشركة؟ *"}</Label>
                      <Textarea
                        value={formData.employer_business}
                        onChange={(e) => handleChange('employer_business', e.target.value)}
                        placeholder={isHebrew ? "תאר את תחום העיסוק" : "صف مجال العمل"}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>7. {isHebrew ? "טלפון המעסיק *" : "هاتف صاحب العمل *"}</Label>
                      <Input
                        type="tel"
                        value={formData.employer_phone}
                        onChange={(e) => handleChange('employer_phone', e.target.value)}
                        placeholder="050-1234567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>8. {isHebrew ? "תפקידך בעבודה? *" : "دورك في العمل؟ *"}</Label>
                      <Textarea
                        value={formData.job_description}
                        onChange={(e) => handleChange('job_description', e.target.value)}
                        placeholder={isHebrew ? "תאר בפירוט מה עשית" : "صف بالتفصيل ماذا فعلت"}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Payment */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-green-500 pb-2">
                    {isHebrew ? "3. תנאי שכר ותשלום (4 שאלות)" : "3. شروط الراتب (4 أسئلة)"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>9. {isHebrew ? "סוג תשלום *" : "نوع الدفع *"}</Label>
                      <Select value={formData.payment_type} onValueChange={(value) => handleChange('payment_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="שעתי">{isHebrew ? "שעתי" : "بالساعة"}</SelectItem>
                          <SelectItem value="חודשי">{isHebrew ? "חודשי" : "بالشهر"}</SelectItem>
                          <SelectItem value="יומי">{isHebrew ? "יומי" : "باليوم"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>10. {isHebrew ? "גובה השכר בשקלים (₪) *" : "مبلغ الراتب (₪) *"}</Label>
                      <Input
                        type="number"
                        value={formData.salary_amount}
                        onChange={(e) => handleChange('salary_amount', parseFloat(e.target.value))}
                        placeholder="4000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>11. {isHebrew ? "אופן התשלום *" : "طريقة الدفع *"}</Label>
                      <Select value={formData.payment_method} onValueChange={(value) => handleChange('payment_method', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="במזומן">{isHebrew ? "במזומן" : "نقداً"}</SelectItem>
                          <SelectItem value="העברה בנקאית">{isHebrew ? "העברה בנקאית" : "تحويل بنكي"}</SelectItem>
                          <SelectItem value="חלק במזומן וחלק העברה בנקאית">{isHebrew ? "חלק במזומן וחלק העברה" : "جزء نقداً وجزء تحويل"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>12. {isHebrew ? "תלושי שכר *" : "قسائم الرواتب *"}</Label>
                      <Select 
                        value={formData.received_payslips ? "yes" : "no"} 
                        onValueChange={(value) => handleChange('received_payslips', value === "yes")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">{isHebrew ? "כן" : "نعم"}</SelectItem>
                          <SelectItem value="no">{isHebrew ? "לא" : "لا"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Work Period */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-orange-500 pb-2">
                    {isHebrew ? "4. תקופת העבודה ושעות (4 שאלות)" : "4. فترة العمل والساعات (4 أسئلة)"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>13. {isHebrew ? "תאריך התחלה *" : "تاريخ البداية *"}</Label>
                      <Input
                        type="date"
                        value={formData.work_start_date}
                        onChange={(e) => handleChange('work_start_date', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>14. {isHebrew ? "תאריך סיום *" : "تاريخ الانتهاء *"}</Label>
                      <Input
                        type="date"
                        value={formData.work_end_date}
                        onChange={(e) => handleChange('work_end_date', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>15. {isHebrew ? "שעות עבודה ביום *" : "ساعات العمل اليومية *"}</Label>
                      <Textarea
                        value={formData.daily_hours_details}
                        onChange={(e) => handleChange('daily_hours_details', e.target.value)}
                        placeholder={isHebrew ? 'דוגמה: "מ-7:00 עד 18:00 עם הפסקה של 30 דקות"' : 'مثال: "من 7:00 حتى 18:00 مع استراحة 30 دقيقة"'}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>16. {isHebrew ? "ימי עבודה בשבוע *" : "أيام العمل في الأسبوع *"}</Label>
                      <Input
                        value={formData.weekly_days_details}
                        onChange={(e) => handleChange('weekly_days_details', e.target.value)}
                        placeholder={isHebrew ? 'דוגמה: "6 ימים - ראשון עד שישי"' : 'مثال: "6 أيام - الأحد إلى الجمعة"'}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Termination */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-red-500 pb-2">
                    {isHebrew ? "5. סיום העבודה (3 שאלות)" : "5. إنهاء العمل (3 أسئلة)"}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>17. {isHebrew ? "סיבת סיום העבודה *" : "سبب إنهاء العمل *"}</Label>
                      <Textarea
                        value={formData.termination_reason}
                        onChange={(e) => handleChange('termination_reason', e.target.value)}
                        placeholder={isHebrew ? "הסבר מפורט" : "شرح تفصيلي"}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>18. {isHebrew ? "סוג הפסקה *" : "نوع الإنهاء *"}</Label>
                      <Select value={formData.termination_type} onValueChange={(value) => handleChange('termination_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="פוטרתי">{isHebrew ? "פוטרתי" : "تم فصلي"}</SelectItem>
                          <SelectItem value="התפטרתי">{isHebrew ? "התפטרתי" : "استقلت"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.termination_type && (
                      <div className="space-y-2">
                        <Label>19. {isHebrew ? "הסבר מפורט" : "شرح تفصيلي"}</Label>
                        <Textarea
                          value={formData.termination_explanation}
                          onChange={(e) => handleChange('termination_explanation', e.target.value)}
                          placeholder={
                            formData.termination_type === "פוטרתי"
                              ? isHebrew ? "למה פוטרת?" : "لماذا تم فصلك؟"
                              : isHebrew ? "למה התפטרת?" : "لماذا استقلت؟"
                          }
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 6: Accommodation */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-pink-500 pb-2">
                    {isHebrew ? "6. תנאי מגורים ואישורים (2 שאלות)" : "6. شروط السكن والتصاريح (2 أسئلة)"}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>20. {isHebrew ? "איפה ישנת? *" : "أين كنت تنام؟ *"}</Label>
                      <Textarea
                        value={formData.accommodation_details}
                        onChange={(e) => handleChange('accommodation_details', e.target.value)}
                        placeholder={isHebrew ? 'דוגמה: "בדירה שהמעסיק השכיר"' : 'مثال: "في شقة استأجرها صاحب العمل"'}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>21. {isHebrew ? "אישור עבודה" : "تصريح العمل"}</Label>
                      <Select 
                        value={formData.had_work_permit ? "yes" : "no"} 
                        onValueChange={(value) => handleChange('had_work_permit', value === "yes")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">{isHebrew ? "כן" : "نعم"}</SelectItem>
                          <SelectItem value="no">{isHebrew ? "לא" : "لا"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.had_work_permit && (
                      <div className="space-y-2">
                        <Label>{isHebrew ? "מי שילם על האישור?" : "من دفع ثمن التصريح؟"}</Label>
                        <Input
                          value={formData.work_permit_payment}
                          onChange={(e) => handleChange('work_permit_payment', e.target.value)}
                          placeholder={isHebrew ? "פירוט" : "تفاصيل"}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 7: File Upload */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 border-b-4 border-indigo-500 pb-2">
                    {isHebrew ? "7. העלאת מסמכים וראיות *" : "7. تحميل المستندات والأدلة *"}
                  </h3>
                  
                  <div className="p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-400">
                    <div className="text-center mb-4">
                      <Upload className="w-16 h-16 mx-auto text-blue-600 mb-2" />
                      <p className="text-lg font-semibold text-blue-900 mb-2">
                        {isHebrew 
                          ? "גרור קבצים לכאן או לחץ להעלאה" 
                          : "قم بسحب الملفات هنا أو انقر للتحميل"}
                      </p>
                      <p className="text-sm text-blue-800 mb-3">
                        {isHebrew 
                          ? "העלה: תלושים, WhatsApp, הקלטות, תמונות, חוזה, ת.ז, אישור" 
                          : "قم بتحميل: قسائم، واتساب، تسجيلات، صور، عقد، هوية، تصريح"}
                      </p>
                    </div>
                    
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.mp3,.mp4,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                      className="mb-3"
                    />
                    
                    {uploadingFiles && (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{isHebrew ? "מעלה קבצים..." : "تحميل الملفات..."}</span>
                      </div>
                    )}

                    {formData.uploaded_documents.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm font-semibold text-gray-700">
                          {isHebrew ? `${formData.uploaded_documents.length} קבצים הועלו:` : `${formData.uploaded_documents.length} ملف تم تحميله:`}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {formData.uploaded_documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded border shadow-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <span className="text-sm truncate">{doc.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(index)}
                                className="ml-2 flex-shrink-0"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning before signatures */}
                <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-400">
                  <p className="text-lg font-bold text-yellow-900 mb-2">
                    {isHebrew 
                      ? "⚠️ וודא שכל המידע נכון!" 
                      : "⚠️ تأكد من صحة جميع المعلومات!"}
                  </p>
                  <p className="text-yellow-800">
                    {isHebrew 
                      ? "אתה עומד לעבור לחתימה על מסמכים משפטיים. לא ניתן לשנות את המידע אחרי החתימה." 
                      : "أنت على وشك التوقيع على مستندات قانونية. لا يمكن تغيير المعلوميات بعد التوقيع."}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    onClick={() => {
                      if (!isFormValid()) {
                        alert(isHebrew ? "נא למלא את כל השדות החובה (21 שאלות) ולהעלות מסמכים" : "يرجى ملء جميع الحقول المطلوبة (21 سؤال) وتحميل المستندات");
                        return;
                      }
                      setStep(3);
                    }}
                    disabled={!isFormValid()}
                    size="lg"
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-xl py-6 font-bold"
                  >
                    {isHebrew ? "כן, המידע נכון - המשך לחתימה" : "نعم، المعلومات صحيحة - المتابعة للتوقيع"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 3: Signatures
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4" dir={isHebrew ? "rtl" : "ltr"}>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={toggleLanguage} variant="outline" size="lg" className="bg-white shadow-lg border-2 border-blue-500">
            <Globe className="w-5 h-5 ml-2 text-blue-600" />
            {isHebrew ? "العربية" : "עברית"}
          </Button>
        </div>

        <div className="container mx-auto max-w-3xl mt-20">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isHebrew ? "חתימה על מסמכים משפטיים" : "التوقيع على الوثائق القانونية"}
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              {isHebrew 
                ? `מסמך ${currentDocument + 1} מתוך ${documents.length}`
                : `وثيقة ${currentDocument + 1} من ${documents.length}`}
            </p>
            
            {/* Progress indicators */}
            <div className="flex justify-center gap-4 mt-6">
              <div className={`px-6 py-3 rounded-full transition-all transform ${
                currentDocument === 0 ? 'bg-blue-600 text-white scale-110 shadow-lg' : 
                signatures.fee_agreement ? 'bg-green-600 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                <div className="flex items-center gap-2">
                  {signatures.fee_agreement ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">1</span>}
                  <span className="font-semibold">{isHebrew ? 'הסכם שכר טרחה' : 'اتفاقية الأتعاب'}</span>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-full transition-all transform ${
                currentDocument === 1 ? 'bg-purple-600 text-white scale-110 shadow-lg' : 
                signatures.power_of_attorney ? 'bg-green-600 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                <div className="flex items-center gap-2">
                  {signatures.power_of_attorney ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">2</span>}
                  <span className="font-semibold">{isHebrew ? 'ייפוי כח' : 'التوكيل'}</span>
                </div>
              </div>
            </div>
          </div>

          <DocumentSignature
            documentTitle={documents[currentDocument].title}
            documentType={documents[currentDocument].type}
            clientName={formData.full_name}
            clientId={formData.id_number}
            language={language}
            onSignatureComplete={handleSignatureComplete}
          />
        </div>
      </div>
    );
  }

  // Step 4: Final Warning
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4 flex items-center justify-center" dir={isHebrew ? "rtl" : "ltr"}>
        <div className="container mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="shadow-2xl border-4 border-red-500">
              <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                <CardTitle className="text-3xl text-center font-bold">
                  {isHebrew ? "⚠️ אזהרה אחרונה!" : "⚠️ تحذير أخير!"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-8 space-y-6">
                <div className="text-center text-lg space-y-4">
                  {isHebrew ? (
                    <>
                      <p className="font-bold text-red-900 text-2xl">מסירת מידע כוזב תגרום:</p>
                      <ul className="list-disc list-inside space-y-2 text-right text-red-800 text-xl">
                        <li>קנס כספי משמעותי</li>
                        <li>חיוב בהוצאות משפט גבוהות</li>
                        <li>שכר טרחה מוגדל לעורך הדין</li>
                        <li>דחיית התביעה</li>
                      </ul>
                      <p className="font-bold text-3xl text-red-900 mt-6">
                        האם כל המידע שמילאת הוא אמת?
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-red-900 text-2xl">معلومات كاذبة ستسبب:</p>
                      <ul className="list-disc list-inside space-y-2 text-right text-red-800 text-xl">
                        <li>غرامة مالية كبيرة</li>
                        <li>نفقات قضائية عالية</li>
                        <li>أتعاب محاماة إضافية</li>
                        <li>رفض الدعوى</li>
                      </ul>
                      <p className="font-bold text-3xl text-red-900 mt-6">
                        هل جميع المعلومات التي قدمتها صحيحة؟
                      </p>
                    </>
                  )}
                </div>

                <div className="p-6 bg-yellow-50 rounded-lg border-4 border-yellow-500">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="final-confirm"
                      checked={finalConfirmation}
                      onCheckedChange={setFinalConfirmation}
                      className="mt-1 w-6 h-6"
                    />
                    <label htmlFor="final-confirm" className="text-lg font-bold text-yellow-900 cursor-pointer">
                      {isHebrew 
                        ? "אני מאשר באחריות מלאה שכל המידע אמת"
                        : "أؤكد بمسؤولية كاملة أن جميع المعلومات صحيحة"}
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!finalConfirmation || submitting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-2xl py-8 font-bold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 ml-2 animate-spin" />
                      {isHebrew ? "שולח..." : "إرسال..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 ml-2" />
                      {isHebrew ? "שלח טופס סופית ✓" : "إرسال النموذج ✓"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 8: Submission Result (Success or Error)
  if (step === 8) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 flex items-center justify-center" dir={isHebrew ? "rtl" : "ltr"}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="shadow-2xl border-none max-w-2xl">
            <CardContent className="p-12 text-center">
              {submissionResult?.success ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-20 h-20 text-green-600" />
                  </motion.div>
                  
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {isHebrew ? "תודה! הטופס נשלח בהצלחה ✓" : "شكراً! تم إرسال النموذج بنجاح ✓"}
                  </h2>
                  
                  <Card className="my-6 bg-blue-50 border-2 border-blue-300">
                    <CardContent className="p-6">
                      <div className="space-y-3 text-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{isHebrew ? "מספר תיק:" : "رقم القضية:"}</span>
                          <span className="font-bold text-2xl text-blue-600">{submissionResult?.caseNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{isHebrew ? "שם:" : "الاسم:"}</span>
                          <span className="font-bold text-xl">{submissionResult?.clientName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{isHebrew ? "תאריך פתיחה:" : "تاريخ الفتح:"}</span>
                          <span className="font-bold">{new Date().toLocaleDateString(isHebrew ? 'he-IL' : 'ar')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3 text-lg text-gray-700 mb-6">
                    <p className="font-semibold text-xl">
                      {isHebrew ? "✓ קיבלנו את כל המידע, המסמכים והחתימות" : "✓ تلقينا جميع المعلومات والمستندات والتوقيعات"}
                    </p>
                    <p className="font-semibold text-xl">
                      {isHebrew ? "✓ התיק נפתח במערכת" : "✓ تم فتح القضية في النظام"}
                    </p>
                    <p className="font-semibold text-xl">
                      {isHebrew ? "✓ עורך הדין יתחיל לטפל בהקדם" : "✓ سيبدأ المحامي في معالجتها قريباً"}
                    </p>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                    <p className="text-xl font-bold text-blue-900 mb-2">
                      {isHebrew ? "נצור איתך קשר בקרוב 📞" : "سنتصل بك قريباً 📞"}
                    </p>
                    <p className="text-gray-700">
                      {isHebrew 
                        ? "עורך הדין יבחן את התיק ויצור קשר תוך מספר ימים" 
                        : "سيقوم المحامي بفحص القضية والاتصال بك في غضون أيام قليلة"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <XCircle className="w-20 h-20 text-red-600" />
                  </motion.div>
                  
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {isHebrew ? "שגיאה בשליחת הטופס" : "خطأ في إرسال النموذج"}
                  </h2>
                  <p className="text-lg text-red-700 mb-6">
                    {submissionResult?.error || (isHebrew ? "אירעה שגיאה בלתי צפויה. אנא נסה שוב או צור קשר." : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو الاتصال بنا.")}
                  </p>
                  <Button 
                    onClick={() => {
                      setSubmissionResult(null); // Clear result
                      setStep(1); // Go back to the start or a previous step
                    }}
                    size="lg"
                    className="mt-6 w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-xl py-6"
                  >
                    {isHebrew ? "נסה שוב" : "حاول مرة أخرى"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Fallback, should not happen
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
    </div>
  );
}
