
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignedDocumentsViewer({ intakeForm }) {
  if (!intakeForm) return null;

  const downloadFeeAgreement = () => {
    const today = new Date(intakeForm.submission_date).toLocaleDateString('he-IL');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>הסכם שכר טרחה - ${intakeForm.full_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            line-height: 1.8;
          }
          h1 {
            text-align: center;
            color: #1e3a8a;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #fef3c7;
            padding: 2px 5px;
            font-weight: bold;
          }
          .section {
            margin: 30px 0;
          }
          .section-title {
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
            font-size: 18px;
          }
          .signature-box {
            margin-top: 60px;
            border-top: 2px solid #000;
            padding-top: 20px;
          }
          .signature {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .sig-image {
            border: 2px solid #3b82f6;
            padding: 10px;
            background: #f8fafc;
            max-width: 300px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>הסכם שכר טרחה</h1>
        
        <p><strong>שנערך ונחתם ביום ${today}</strong></p>

        <div class="section">
          <p>בין:</p>
          <p>שם: <span class="highlight">${intakeForm.full_name}</span></p>
          <p>תעודת זהות: <span class="highlight">${intakeForm.id_number}</span></p>
          <p>(להלן: "הלקוח")</p>
          <p>מצד אחד;</p>
        </div>

        <div class="section">
          <p>לבין: <strong>משרד עו"ד טבת</strong></p>
          <p>מרחוב: מצדה 9, בני ברק מגדל ב.ס.ר 3</p>
          <p>(להלן: "עוה"ד")</p>
          <p>מצד שני;</p>
        </div>

        <div class="section">
          <p><strong>הואיל:</strong> והלקוח מעוניין לשכור את שירותי עורך הדין לצורך מיצוי זכויותיו בבית הדין לעבודה.</p>
        </div>

        <div class="section">
          <p><strong>לפיכך הוצהר, הותנה והוסכם בין הצדדים כדלקמן:</strong></p>
        </div>

        <div class="section">
          <div class="section-title">1. מהות העסקה</div>
          <p>הלקוח מוסר בזה לעו"ד לטפל בשמו ובעבורו בעניינו בתמורה לתשלום שכ"ט שישלם הלקוח לעו"ד כפי הקבוע בהסכם זה.</p>
        </div>

        <div class="section">
          <div class="section-title">2. השירות המקצועי</div>
          <p>"שירות מקצועי" יכלול: טיפול מקצועי בעניינו של הלקוח בהתאם להסכם זה ובכלל זה עריכת תחשיבים, הגשת תביעה, ניהול מו"מ עם גורמים שונים, וייצוג הלקוח בבית הדין האזורי לעבודה עד מתן פסק דין או הסכם פשרה.</p>
        </div>

        <div class="section">
          <div class="section-title">3. שכר טרחה</div>
          <p>בתמורה לשירות המקצועי יקבל עו"ד, שכ"ט באחוזים מתוך הסכום הכולל שיפסק לטובת הלקוח:</p>
          <ul>
            <li><strong>30% בתוספת מע"מ</strong> מכל סכום הברוטו שיתקבל כתוצאה מהתביעה</li>
            <li>שכ"ט אינו כולל הוצאות משפטיות, אגרות, שליחויות, תמלולים וכיוצ"ב</li>
            <li>במידה והלקוח יחליט להפסיק את ייצוגו של עורך הדין בתיק, יהיה זכאי עוה"ד ל-30% בתוספת מע"מ או ל-15,000 ₪ - הגבוה מביניהם</li>
          </ul>
        </div>

        <div class="section">
          <div class="section-title">4. שונות</div>
          <ul>
            <li>כל שינוי להסכם זה יהיה בכתב בלבד</li>
            <li>עוה"ד זכאי לקזז את שכ"ט מתשלום פסק הדין ולהעביר את היתרה ללקוח</li>
          </ul>
        </div>

        <div class="signature-box">
          <p><strong>ולראיה באנו על החתום</strong></p>
          <p>תאריך: ${today}</p>

          <div class="signature">
            <p><strong>חתימת הלקוח:</strong></p>
            ${intakeForm.fee_agreement_signature ? `<img src="${intakeForm.fee_agreement_signature}" class="sig-image" />` : '<p>[לא נחתם]</p>'}
            <p>שם: ${intakeForm.full_name}</p>
            <p>ת.ז: ${intakeForm.id_number}</p>
          </div>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 12px;">
            מסמך זה נוצר אוטומטית ממערכת LegalFlow CRM<br>
            תאריך הדפסה: ${new Date().toLocaleString('he-IL')}
          </p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadPowerOfAttorney = () => {
    const today = new Date(intakeForm.submission_date).toLocaleDateString('he-IL');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>ייפוי כח / توكيل قانوني - ${intakeForm.full_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            line-height: 1.8;
          }
          h1 {
            text-align: center;
            color: #7c3aed;
            border-bottom: 3px solid #7c3aed;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #fef3c7;
            padding: 2px 5px;
            font-weight: bold;
          }
          .section {
            margin: 25px 0;
          }
          .arabic {
            direction: rtl;
            text-align: right;
            color: #374151;
            font-size: 14px;
            line-height: 2;
          }
          .signature-box {
            margin-top: 60px;
            border-top: 2px solid #000;
            padding-top: 20px;
          }
          .signature {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .sig-image {
            border: 2px solid #7c3aed;
            padding: 10px;
            background: #f8fafc;
            max-width: 300px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>ייפוי כח / توكيل قانوني</h1>

        <div class="section">
          <p>אני הח"מ <span class="highlight">${intakeForm.full_name}</span> ת.ז/.ח.פ. <span class="highlight">${intakeForm.id_number}</span></p>
          <p class="arabic">أنا الموقع أدناه <span class="highlight">${intakeForm.full_name}</span> رقم الهوية/رقم الشركة <span class="highlight">${intakeForm.id_number}</span></p>
        </div>

        <div class="section">
          <p>ממנה בזאת את עו"ד אוהד טבת מ.ר 97625 ממשרד עו"ד טבת להיות בא כוחי למיצויי זכויותיי.</p>
          <p class="arabic">أوكل بموجب هذا المحامي أوهاد طابات رقم ترخيص 97625 من مكتب المحاماة طابات ليكون وكيلي القانوني في اإلجراء.</p>
        </div>

        <div class="section">
          <p>מבלי לפגוע בזכויות בכלליות המינוי הנ"ל יהיו בא כחי רשאי לפעול בשמי ובמקומי בכל הפעולות הבאות, כולן ומקצתן, בקשר עם בירור הזכויות ו/או ניהול מו"מ ו/או הגשת תביעת חוב למוסד המל"ל ו/או לבית הדין לעבודה ו/או דרישה ו/או תביעה ו/או הוצאה לפועל בעניין הזכויות המגיעות לי בגין תקופת העבודה וסיומה (להלן: "השירות המקצועי") ולחתום על ולהגיש כל תביעה או תביעה שכנגד, ו/או כל בקשה, הגנה, התנגדות, בקשה למתן רשות לערער, ערעור הודעה, טענה, תובענה או כל הליך אחר הנוגע או הנובע לשירות המקצועי לרבות הופעה וייצוג בפני כל בתי המשפט, בתי דין למיניהם או מוסדות אחרים הן ממשלתיים והן אחרים עד לדרגה האחרונה לרבות המוסד לביטוח הלאומי. כמו כן לשלוח הודעות לצד שלישי ולקבל הודעות שכאלה, להשביע ולהתפשר ולהודות, להזמין עדים, למנות מומחים ולעשות את כל הפעולות לפי חוק בתי המשפט ותקנות סדרי הדין האזרחי והפלילי והתקנות שקיימות כיום ושתהיינה קיימות בעתיד, לנהל את פעולות ההוצאה לפועל ולקבל את הכספים המגיעים שיגיעו לי/לנו בקשר עם התביעה או המשפ"ט הנ"ל ובכלל לעשות את כל יתר הפעולות הדרושות בקשר עם התביעה או המשפט הנ"ל עד גמירתו, לרבות קיום קשר עם התקשורת, העיתונות והיוצא באלה, הכל כפי שימצאו לנכון.</p>
          
          <p class="arabic">دون المساس بالحقوق بصورة عامة، فإن التعيين المذكور أعاله سيخول وكيلي القانوني التصرف باسمي ونيابة عني في جميع اإلجراءات التالية، كلها أو بعضها، فيما يتعلق بتوضيح الحقوق و/أو إدارة المفاوضات و/أو تقديم دعوى دين لمؤسسة التأمين الوطني و/أو لمحكمة العمل و/أو مطالبة و/أو دعوى و/أو تنفيذ فيما يتعلق بالحقوق المستحقة لي عن فترة العمل وانتهائها (يشار إليها فيما يلي بـ "الخدمة المهنية") والتوقيع على وتقديم أي دعوى أو دعوى مضادة، و/أو أي طلب، دفاع، اعتراض، طلب إذن لالستئناف، استئناف إشعار، ادعاء، دعوى أو أي إجراء آخر يتعلق أو ينشأ عن الخدمة المهنية بما في ذلك المثول والتمثيل أمام جميع المحاكم، المحاكم بأنواعها أو المؤسسات األخرى سواء الحكومية أو غيرها حتى الدرجة األخيرة بما في ذلك مؤسسة التأمين الوطني. وكذلك إرسال إشعارات لطرف ثالث وتلقي مثل هذه اإلشعارات، وحلف اليمين والتصالح واإلقرار، واستدعاء الشهود، وتعيين الخبراء والقيام بجميع اإلجراءات وفقا لقانون المحاكم ولوائح اإلجراءات المدنية والجنائية واللوائح القائمة اليوم والتي ستكون قائمة في المستقبل، وإدارة إجراءات التنفيذ وتلقي األموال المستحقة التي ستصل إلي/إلينا فيما يتعلق بالدعوى أو المحاكمة المذكورة أعاله وبشكل عام القيام بجميع اإلجراءات األخرى الالزمة فيما يتعلق بالدعوى أو المحاكمة المذكورة أعاله حتى اكتمالها، بما في ذلك الحفاظ على عالقة مع وسائل اإلعالم والصحافة وما شابه ذلك، كل ذلك حسبما يرونه مناسبا.</p>
        </div>

        <div class="section">
          <p>אני מאשר לב"כ למשוך את כספי התגמולים הפנסיונים מהגופים השונים.</p>
          <p class="arabic">أؤكد للوكيل سحب أموال المكافآت التقاعدية من الجهات المختلفة.</p>
        </div>

        <div class="section">
          <p>כמו כן, אני מאשר שכספי התביעה יעברו לחשבון הבנק של בא כוחי עורך דין אוהד טבת. בנק – 18 סניף – 001, ח-ן 0207965646</p>
          <p class="arabic">كما أنني أؤكد أن أموال الدعوى ستنتقل إلى حساب البنك الخاص بوكيلي المحامي أوهاد طبت. البنك - 18 الفرع - 001، ح-ן 0207965646</p>
        </div>

        <div class="signature-box">
          <p><strong>ולראיה לאות הסכמתי למתן ייפוי הכוח ולהתחייבותי לתשלום שכר הטרחה באתי על החתום</strong></p>
          <p class="arabic"><strong>وإثباتا لموافقتي على منح التوکیل والتزامي بدفع أتعاب المحاماة أوقع أدناه</strong></p>
          
          <p style="margin-top: 20px;">היום, ${today}</p>
          <p class="arabic">اليوم، ${today}</p>

          <div class="signature">
            <p><strong>חתימת המרשה / التوقيع:</strong></p>
            ${intakeForm.power_of_attorney_signature ? `<img src="${intakeForm.power_of_attorney_signature}" class="sig-image" />` : '<p>[לא נחתם / غير موقع]</p>'}
            <p>שם: ${intakeForm.full_name}</p>
            <p>ת.ז: ${intakeForm.id_number}</p>
          </div>

          <div class="signature" style="margin-top: 60px;">
            <p><strong>אישור עורך הדין:</strong></p>
            <p>הנני מאשר את חתימת מרשי הנ"ל.</p>
            <p style="margin-top: 40px;">___________________</p>
            <p>עורך דין אוהד טבת מ.ר 97625</p>
            <p class="arabic" style="margin-top: 20px;">المحامي أوهاد طبت رقهم ترخيص 97625</p>
          </div>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 12px;">
            מסמך זה נוצר אוטומטית ממערכת LegalFlow CRM<br>
            تم إنشاء هذا المستند تلقائيًا من نظام LegalFlow CRM<br>
            תאריך הדפסה: ${new Date().toLocaleString('he-IL')}
          </p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          מסמכים חתומים דיגיטלית
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fee Agreement */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">הסכם שכר טרחה</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    נחתם דיגיטלית ב-{new Date(intakeForm.submission_date).toLocaleDateString('he-IL')}
                  </p>
                  {intakeForm.fee_agreement_signature ? (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">חתימת הלקוח:</p>
                      <img 
                        src={intakeForm.fee_agreement_signature} 
                        alt="חתימה"
                        className="border-2 border-blue-300 rounded bg-white p-2 max-w-[200px]"
                      />
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm mb-4">⚠️ לא נחתם</p>
                  )}
                  <Button 
                    onClick={downloadFeeAgreement}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    הדפס / שמור PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Power of Attorney */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">ייפוי כח</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    נחתם דיגיטלית ב-{new Date(intakeForm.submission_date).toLocaleDateString('he-IL')}
                  </p>
                  {intakeForm.power_of_attorney_signature ? (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">חתימת הלקוח:</p>
                      <img 
                        src={intakeForm.power_of_attorney_signature} 
                        alt="חתימה"
                        className="border-2 border-purple-300 rounded bg-white p-2 max-w-[200px]"
                      />
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm mb-4">⚠️ לא נחתם</p>
                  )}
                  <Button 
                    onClick={downloadPowerOfAttorney}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    הדפס / שמור PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {(!intakeForm.fee_agreement_signature || !intakeForm.power_of_attorney_signature) && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border-2 border-red-300">
            <p className="text-red-800 font-semibold">
              ⚠️ אזהרה: אחד או יותר מהמסמכים לא נחתמו דיגיטלית. נא לוודא שהלקוח חתם על כל המסמכים הנדרשים.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
