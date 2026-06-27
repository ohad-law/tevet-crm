import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function QuestionnaireForm({ language, formData, onUpdate, onNext, onBack }) {
  const isHebrew = language === "עברית";

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const isValid = () => {
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
      formData.accommodation_details
    );
  };

  const content = {
    title: isHebrew ? "שאלון מפורט" : "استبيان مفصل",
    section1: isHebrew ? "פרטים אישיים" : "معلومات شخصية",
    section2: isHebrew ? "פרטי המעסיק והעבודה" : "تفاصيل صاحب العمل والعمل",
    section3: isHebrew ? "תנאי שכר ותשלום" : "شروط الراتب والدفع",
    section4: isHebrew ? "תקופת העבודה ושעות" : "فترة العمل والساعات",
    section5: isHebrew ? "סיום העבודה" : "إنهاء العمل",
    section6: isHebrew ? "תנאי מגורים ואישורים" : "شروط السكن والتصاريح",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <Card className="shadow-2xl border-none">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-2xl">{content.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 pb-2">
              {content.section1}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  {isHebrew ? "שם מלא *" : "الاسم الكامل *"}
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder={isHebrew ? "שם מלא" : "الاسم الكامل"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">
                  {isHebrew ? "תעודת זהות *" : "رقم الهوية *"}
                </Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => handleChange('id_number', e.target.value)}
                  placeholder={isHebrew ? "מספר ת.ז" : "رقم الهوية"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {isHebrew ? "טלפון נייד *" : "رقم الهاتف المحمول *"}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder={isHebrew ? "050-1234567" : "050-1234567"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  {isHebrew ? "כתובת מגורים *" : "العنوان الكامل *"}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder={isHebrew ? "רחוב, מספר, עיר" : "شارع، رقم، مدينة"}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Employer Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-purple-500 pb-2">
              {content.section2}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employer_name">
                  {isHebrew ? "באיזה חברה עבדת? *" : "في أي شركة عملت؟ *"}
                </Label>
                <Input
                  id="employer_name"
                  value={formData.employer_name}
                  onChange={(e) => handleChange('employer_name', e.target.value)}
                  placeholder={isHebrew ? "שם החברה" : "اسم الشركة"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_business">
                  {isHebrew ? "מה החברה עושה? *" : "ماذا تفعل الشركة؟ *"}
                </Label>
                <Textarea
                  id="employer_business"
                  value={formData.employer_business}
                  onChange={(e) => handleChange('employer_business', e.target.value)}
                  placeholder={isHebrew ? "תאר את תחום העיסוק" : "صف مجال العمل"}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_phone">
                  {isHebrew ? "טלפון המעסיק *" : "هاتف صاحب العمل *"}
                </Label>
                <Input
                  id="employer_phone"
                  type="tel"
                  value={formData.employer_phone}
                  onChange={(e) => handleChange('employer_phone', e.target.value)}
                  placeholder={isHebrew ? "טלפון של הבעלים/מנהל" : "هاتف المالك/المدير"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_description">
                  {isHebrew ? "תפקידך בעבודה? *" : "دورك في العمل؟ *"}
                </Label>
                <Textarea
                  id="job_description"
                  value={formData.job_description}
                  onChange={(e) => handleChange('job_description', e.target.value)}
                  placeholder={isHebrew ? "תאר בפירוט מה עשית" : "صف بالتفصيل ماذا فعلت"}
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Terms */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-green-500 pb-2">
              {content.section3}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_type">
                  {isHebrew ? "סוג תשלום *" : "نوع الدفع *"}
                </Label>
                <Select value={formData.payment_type} onValueChange={(value) => handleChange('payment_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="שעתי">{isHebrew ? "שעתי" : "بالساعة"}</SelectItem>
                    <SelectItem value="חודשי">{isHebrew ? "חודשי" : "بالشهר"}</SelectItem>
                    <SelectItem value="יומי">{isHebrew ? "יומי" : "باليوم"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_amount">
                  {isHebrew ? "גובה השכר (₪) *" : "مبلغ الراتب (₪) *"}
                </Label>
                <Input
                  id="salary_amount"
                  type="number"
                  value={formData.salary_amount}
                  onChange={(e) => handleChange('salary_amount', parseFloat(e.target.value))}
                  placeholder="4000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  {isHebrew ? "אופן התשלום *" : "طريقة الدفع *"}
                </Label>
                <Select value={formData.payment_method} onValueChange={(value) => handleChange('payment_method', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isHebrew ? "בחר" : "اختر"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="במזומן">{isHebrew ? "במזומן" : "نقداً"}</SelectItem>
                    <SelectItem value="העברה בנקאית">{isHebrew ? "העברה בנקאית" : "تحويل بنكي"}</SelectItem>
                    <SelectItem value="חלק במזומן וחלק העברה בנקאית">{isHebrew ? "חלק במזומן וחלק העברה" : "جزء نقداً وجزء تحويל"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_payslips">
                  {isHebrew ? "תלושי שכר *" : "قسائم الرواتب *"}
                </Label>
                <Select 
                  value={formData.received_payslips ? "yes" : "no"} 
                  onValueChange={(value) => handleChange('received_payslips', value === "yes")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isHebrew ? "בחר" : "اختר"} />
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
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
              {content.section4}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work_start_date">
                  {isHebrew ? "תאריך התחלה *" : "تاريخ البداية *"}
                </Label>
                <Input
                  id="work_start_date"
                  type="date"
                  value={formData.work_start_date}
                  onChange={(e) => handleChange('work_start_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_end_date">
                  {isHebrew ? "תאריך סיום *" : "تاريخ الانتهاء *"}
                </Label>
                <Input
                  id="work_end_date"
                  type="date"
                  value={formData.work_end_date}
                  onChange={(e) => handleChange('work_end_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="daily_hours_details">
                  {isHebrew ? "שעות עבודה ביום *" : "ساعات العمل اليومية *"}
                </Label>
                <Textarea
                  id="daily_hours_details"
                  value={formData.daily_hours_details}
                  onChange={(e) => handleChange('daily_hours_details', e.target.value)}
                  placeholder={isHebrew ? 'דוגמה: "עבדתי מ-7:00 עד 18:00 עם הפסקת צהריים של 30 דקות"' : 'مثال: "عملت من 7:00 حتى 18:00 مع استراحة غداء 30 دقيقة"'}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="weekly_days_details">
                  {isHebrew ? "ימי עבודה בשבוע *" : "أيام العمل في الأسبوع *"}
                </Label>
                <Input
                  id="weekly_days_details"
                  value={formData.weekly_days_details}
                  onChange={(e) => handleChange('weekly_days_details', e.target.value)}
                  placeholder={isHebrew ? 'דוגמה: "6 ימים - ראשון עד שישי"' : 'مثال: "6 أيام - من الأحد إلى الجمعة"'}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 5: Termination */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-red-500 pb-2">
              {content.section5}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termination_reason">
                  {isHebrew ? "סיבת סיום העבודה *" : "سبب إنهاء العمل *"}
                </Label>
                <Textarea
                  id="termination_reason"
                  value={formData.termination_reason}
                  onChange={(e) => handleChange('termination_reason', e.target.value)}
                  placeholder={isHebrew ? "הסבר מפורט" : "شرح تفصيلي"}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termination_type">
                  {isHebrew ? "סוג הפסקה *" : "نوع الإنهاء *"}
                </Label>
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
                  <Label htmlFor="termination_explanation">
                    {isHebrew ? "הסבר מפורט *" : "شرح تفصيلي *"}
                  </Label>
                  <Textarea
                    id="termination_explanation"
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

          {/* Section 6: Accommodation & Permits */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-500 pb-2">
              {content.section6}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accommodation_details">
                  {isHebrew ? "איפה ישנת? *" : "أين كنت تنام؟ *"}
                </Label>
                <Textarea
                  id="accommodation_details"
                  value={formData.accommodation_details}
                  onChange={(e) => handleChange('accommodation_details', e.target.value)}
                  placeholder={isHebrew ? 'דוגמה: "בדירה שהמעסיק השכיר" או "בקרוואן באתר"' : 'مثال: "في شقة استأجرها صاحب العمل" أو "في كرفان في الموقع"'}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="had_work_permit">
                  {isHebrew ? "אישור עבודה *" : "تصريح العمل *"}
                </Label>
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
                  <Label htmlFor="work_permit_payment">
                    {isHebrew ? "מי שילם על האישור וכמה?" : "من دفع ثمن التصريح وكم؟"}
                  </Label>
                  <Input
                    id="work_permit_payment"
                    value={formData.work_permit_payment}
                    onChange={(e) => handleChange('work_permit_payment', e.target.value)}
                    placeholder={isHebrew ? "פירוט התשלום" : "تفاصيل الدفع"}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 pt-6">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <ChevronLeft className="w-5 h-5 ml-2" />
              {isHebrew ? "חזרה" : "رجوع"}
            </Button>
            <Button
              onClick={onNext}
              disabled={!isValid()}
              size="lg"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isHebrew ? "המשך" : "متابعة"}
              <ChevronRight className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}