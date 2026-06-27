import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import SignaturePad from "./SignaturePad";

export default function DocumentSignature({ 
  documentTitle, 
  documentType,
  clientName, 
  clientId, 
  language,
  onSignatureComplete 
}) {
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [documentRead, setDocumentRead] = useState(false);
  const [signature, setSignature] = useState(null);

  const isHebrew = language === "עברית";
  const today = new Date().toLocaleDateString('he-IL', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });

  const canSign = detailsConfirmed && documentRead && signature;

  const handleComplete = () => {
    if (canSign) {
      onSignatureComplete({
        type: documentType,
        signature: signature,
        date: new Date().toISOString(),
        clientName,
        clientId
      });
    }
  };

  // Document content based on type - EXACT ORIGINAL TEXT
  const getDocumentContent = () => {
    if (documentType === 'fee_agreement') {
      return {
        titleHe: "הסכם שכר טרחה",
        titleAr: "اتفاقية الأتعاب",
        content: `הסכם שכר טרחה

שנערך ונחתם ביום ${today}

לבין: ${clientName} ת.ז: ${clientId} (להלן: "הלקוח")
מצד אחד;

לבין: משרד עו"ד טבת
מרחוב: מצדה 9, בני ברק מגדל ב.ס.ר 3 (להלן: "עוה"ד")
מצד שני;

הואיל: והלקוח מעוניין לשכור את שירותי עורך הדין לצורך מיצוי זכויותיו בבית הדין לעבודה (להלן: "התביעה").
(להלן: "עניינו");

לפיכך הוצהר, הותנה והוסכם בין הצדדים כדלקמן:

1. מהות העסקה
1.1 הלקוח מוסר בזה לעו"ד לטפל בשמו ובעבורו בעניינו בתמורה לתשלום שכ"ט שישלם הלקוח לעו"ד כפי הקבוע בהסכם זה והעו"ד מתחייב בתמורה לקבלת שכ"ט הקבוע בהסכם זה לספק ללקוח את השירות המקצועי.

2. השירות המקצועי
2.1 "שירות מקצועי" יכלול, טיפול מקצועי בעניינו של הלקוח בהתאם להסכם זה ובכלל זה עריכת תחשיבים, הגשת תביעה, ניהול מו"מ עם גורמים שונים ובכלל זה עורכי דין, פקידי המוסד לביטוח הלאומי ו/או כל ערכאה שיפוטית וייצוגו של הלקוח בבית הדין האזורי לעבודה ו/או כל ערכאה שיפוטית עד מתן פסק דין או לחילופין הסכם פשרה.

2.2 הלקוח מצהיר ומסכים כי ביצוע כל התחייבויות מהתחייבויות העו"ד מותנה בכך שהלקוח יקיים תחילה את התחייבויותיו הוא והעו"ד זכאי מבלי לפגוע בכל זכות עפ"י דין ו/או עפ"י הסכם זה, לעכב ביצוע כל התחייבויותיו אשר מועד ביצוען חל עד למועד ביצוע התחייבויות הלקוח כאמור.

3. שכ"ט:
3.1 בתמורה לשירות המקצועי יקבל עו"ד, שכ"ט באחוזים מתוך הסכום הכולל שיפסק לטובת הלקוח במסגרת פסק דין ו/או פשרה בצירוף מע"מ כדלקמן:

3.1.1 30% בתוספת מע"מ מכל סכום הברוטו שיתקבל כתוצאה מהתביעה.

3.1.2 יודגש כי שכ"ט אינו כולל הוצאות משפטיות, אגרות, שליחויות, תמלולים וכיוצ"ב.

3.1.3 במידה והלקוח יחליט באופן עצמאי להפסיק את ייצוגו של עורך הדין בתיק, מכל סיבה שהיא, יהיה זכאי עוה"ד ל-30% בתוספת מע"מ מסכום התביעה בהתאם להסכם זה, או ל-15,000 ₪ הגבוה מביניהם.

3.1.4 שכר הטרחה אינו כולל הוצאות משפטיות ו\או אחרות, לרבות אגרות, שליחויות, תשלומים למומחים, חוות דעת מקצועית, צילומים, נסיעות מחוץ לאזור המרכז, וכל הוצאה אחרת הדרושה לצורך ניהול ההליך. הלקוח מתחייב לשאת בהוצאות אלו לפי דרישה, כנגד קבלה.

4. שונות
4.1 כל שינוי ו/או תוספת להסכם זה יהיו ברי תוקף אך ורק אם יעשו בכתב ובחתימת הצדדים.

4.2 הסכם זה מבטא ומשקף את כל המוסכם בין הצדדים ומטבל את כל הסכמות ו/או הבנות אחרות ביניהם.

4.3 עוה"ד זכאי לקזז את שכ"ט מתשלום פסק הדין ו/או הסכם הפשרה ובהתאם להעביר את יתרת הסכום ללקוח.

ולראיה באנו על החתום

תאריך: ${today}`
      };
    } else {
      return {
        titleHe: "ייפוי כח",
        titleAr: "توكيل قانوني",
        content: `ייפוי כח / توكيل قانوني

אני הח"מ ${clientName} ת.ז/.ח.פ. ${clientId}
أنا الموقع أدناه ${clientName} رقم الهوية/رقم الشركة ${clientId}

ממנה בזאת את עו"ד אוהד טבת מ.ר 97625 ממשרד עו"ד טבת להיות בא כוחי למיצויי זכויותיי.
أوكل بموجب هذا المحامي أوهاد طابات رقم ترخيص 97625 من مكتب المحاماة طابات ليكون وكيلي القانوني في اإلجراء.

מבלי לפגוע בזכויות בכלליות המינוי הנ"ל יהיו בא כחי רשאי לפעול בשמי ובמקומי בכל הפעולות הבאות, כולן ומקצתן, בקשר עם בירור הזכויות ו/או ניהול מו"מ ו/או הגשת תביעת חוב למוסד המל"ל ו/או לבית הדין לעבודה ו/או דרישה ו/או תביעה ו/או הוצאה לפועל בעניין הזכויות המגיעות לי בגין תקופת העבודה וסיומה (להלן: "השירות המקצועי") ולחתום על ולהגיש כל תביעה או תביעה שכנגד, ו/או כל בקשה, הגנה, התנגדות, בקשה למתן רשות לערער, ערעור הודעה, טענה, תובענה או כל הליך אחר הנוגע או הנובע לשירות המקצועי לרבות הופעה וייצוג בפני כל בתי המשפט, בתי דין למיניהם או מוסדות אחרים הן ממשלתיים והן אחרים עד לדרגה האחרונה לרבות המוסד לביטוח הלאומי. כמו כן לשלוח הודעות לצד שלישי ולקבל הודעות שכאלה, להשביע ולהתפשר ולהודות, להזמין עדים, למנות מומחים ולעשות את כל הפעולות לפי חוק בתי המשפט ותקנות סדרי הדין האזרחי והפלילי והתקנות שקיימות כיום ושתהיינה קיימות בעתיד, לנהל את פעולות ההוצאה לפועל ולקבל את הכספים המגיעים שיגיעו לי/לנו בקשר עם התביעה או המשפ"ט הנ"ל ובכלל לעשות את כל יתר הפעולות הדרושות בקשר עם התביעה או המשפט הנ"ל עד גמירתו, לרבות קיום קשר עם התקשורת, העיתונות והיוצא באלה, הכל כפי שימצאו לנכון.

دون المساس بالحقوق بصورة عامة، فإن التعيين المذكور أعاله سيخول وكيلي القانوني التصرف باسمي ونيابة عني في جميع اإلجراءات التالية، كلها أو بعضها، فيما يتعلق بتوضيح الحقوق و/أو إدارة المفاوضات و/أو تقديم دعوى دين لمؤسسة التأمين الوطني و/أو لمحكمة العمل و/أو مطالبة و/أو دعوى و/أو تنفيذ فيما يتعلق بالحقوق المستحقة لي عن فترة العمل وانتهائها (يشار إليها فيما يلي بـ "الخدمة المهنية") والتوقيع على وتقديم أي دعوى أو دعوى مضادة، و/أو أي طلب، دفاع، اعتراض، طلب إذن لالستئناف، استئناف إشعار، ادعاء، دعوى أو أي إجراء آخر يتعلق أو ينشأ عن الخدمة المهنية بما في ذلك المثول والتمثيل أمام جميع المحاكم، المحاكم بأنواعها أو المؤسسات األخرى سواء الحكومية أو غيرها حتى الدرجة األخيرة بما في ذلك مؤسسة التأمين الوطني. وكذلك إرسال إشعارات لطرف ثالث وتلقي مثل هذه اإلشعارات، وحلف اليمين والتصالح واإلقرار، واستدعاء الشهود، وتعيين الخبراء والقيام بجميع اإلجراءات وفقا لقانون المحاكم ولوائح اإلجراءات المدنية والجنائية واللوائح القائمة اليوم والتي ستكون قائمة في المستقبل، وإدارة إجراءات التنفيذ وتلقي األموال المستحقة التي ستصل إلي/إلينا فيما يتعلق بالدعوى أو المحاكمة المذكورة أعاله وبشكل عام القيام بجميع اإلجراءات األخرى الالزمة فيما يتعلق بالدعوى أو المحاكمة المذكورة أعاله حتى اكتمالها، بما في ذلك الحفاظ على عالقة مع وسائل اإلعالم والصحافة وما شابه ذلك، كل ذلك حسبما يرونه مناسبا.

אני מאשר לב"כ למשוך את כספי התגמולים הפנסיונים מהגופים השונים.
أؤكد للوكيل سحب أموال المكافآت التقاعدية من الجهات المختلفة.

כמו כן, אני מאשר שכספי התביעה יעברו לחשבון הבנק של בא כוחי עורך דין אוהד טבת. בנק – 18 סניף – 001, ח-ן 0207965646
كما أنني أؤكد أن أموال الدعوى ستنتقل إلى حساب البنك الخاص بوكيلي المحامي أوهاد طبت. البنك - 18 الفرع - 001، ح-ن 0207965646

ולראיה לאות הסכמתי למתן ייפוי הכוח ולהתחייבותי לתשלום שכר הטרחה באתי על החתום,
وإثباتا لموافقتي على منح التوكيل والتزامי بدفع أتعاب المحاماة أوقع أدناه،

היום, ${today}
اليوم، ${today}`
      };
    }
  };

  const docContent = getDocumentContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-xl border-none">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            {isHebrew ? docContent.titleHe : docContent.titleAr}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Document Preview */}
          <div className="p-6 bg-white rounded-lg border-2 border-gray-300 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-center mb-4">
                {isHebrew ? docContent.titleHe : docContent.titleAr}
              </h3>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="space-y-3 text-right whitespace-pre-line text-sm leading-relaxed">
                  {docContent.content}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmations */}
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="details-confirm"
                  checked={detailsConfirmed}
                  onCheckedChange={setDetailsConfirmed}
                  className="mt-1"
                />
                <label htmlFor="details-confirm" className="text-sm font-medium text-blue-900 cursor-pointer">
                  {isHebrew 
                    ? `הפרטים במסמך נכונים - שם: ${clientName}, ת.ז: ${clientId}`
                    : `المعلومات صحيحة - الاسم: ${clientName}، الهوية: ${clientId}`}
                </label>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="read-confirm"
                  checked={documentRead}
                  onCheckedChange={setDocumentRead}
                  className="mt-1"
                />
                <label htmlFor="read-confirm" className="text-sm font-medium text-green-900 cursor-pointer">
                  {isHebrew 
                    ? "קראתי והבנתי את תוכן המסמך"
                    : "قرأت وفهمت محتوى الوثيقة"}
                </label>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="space-y-3">
            <Label className="text-lg font-bold">
              {isHebrew ? "חתום כאן:" : "وقع هنا:"}
            </Label>
            <SignaturePad 
              onSignatureChange={setSignature}
              language={language}
            />
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={!canSign}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5 ml-2" />
            {isHebrew ? "אישור חתימה והמשך" : "تأكيد التوقيع والمتابعة"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}