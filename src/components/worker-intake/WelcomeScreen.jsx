import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

export default function WelcomeScreen({ language, onNext }) {
  const [agreed, setAgreed] = useState(false);

  const isHebrew = language === "עברית";

  const content = {
    title: isHebrew 
      ? "טופס איסוף מידע לתביעת זכויות עובדים"
      : "نموذج جمع معلومات لدعوى حقوق العمال",
    warningTitle: isHebrew
      ? "⚠️ חשוב מאוד - קרא לפני המשך!"
      : "⚠️ مهم جداً - اقرأ قبل المتابعة!",
    warningText: isHebrew
      ? `לתשומת ליבך: מילוי פרטים כוזבים או מטעים עלול לגרור:

• קנס כספי משמעותי מבית הדין לעבודה
• חיוב בהוצאות משפט גבוהות מאוד
• חיוב בשכר טרחה מוגדל לעורך הדין בגין עבודה לשווא
• פגיעה חמורה בסיכויי התיק שלך
• דחיית התביעה על ידי בית הדין

חובה מוחלטת למסור מידע אמת, מלא ומדויק בלבד!
אי מסירת אמת תיחשב כהטעיה של בית המשפט ועלולה להוביל לתוצאות משפטיות חמורות.`
      : `لعلمך: تقديم معلומات كاذבة أو مضللة قد يؤدי إلى:

• غرامة مالية كبيرة من محكمة العمل
• دفع نفقات قضائية عالية جداً
• دفع أتعاب محاماة إضافية للمحامي عن العمل الضائع
• الإضرار الخطير بفرص قضيتك
• رفض الدعوى من قبل المحكمة

يجب تقديم معلومات صحيحة وكاملة ودقيقة فقط!
عدم تقديم الحقيقة يعتبر تضليلاً للمحكمة وقد يؤدي إلى عواقب قانونية خطيرة.`,
    checkboxLabel: isHebrew
      ? "הבנתי והנני מתחייב למסור מידע אמת בלבד"
      : "فهمت وأتعهد بتقديم معلومات صحيحة فقط",
    continueButton: isHebrew
      ? "המשך למילוי הטופס"
      : "متابعة لملء النموذج"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-2xl border-none">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-2xl md:text-3xl text-center font-bold">
            {content.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Warning Box */}
          <div className="p-6 bg-red-50 rounded-lg border-4 border-red-500">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-red-900 mb-4">
                  {content.warningTitle}
                </h3>
                <div className="text-red-800 whitespace-pre-line leading-relaxed text-lg">
                  {content.warningText}
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox Agreement */}
          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-400">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={setAgreed}
                className="mt-1"
              />
              <label
                htmlFor="agree"
                className="text-lg font-semibold text-amber-900 cursor-pointer"
              >
                {content.checkboxLabel}
              </label>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={onNext}
            disabled={!agreed}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl py-6"
          >
            {content.continueButton}
            <ChevronRight className="w-6 h-6 mr-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}