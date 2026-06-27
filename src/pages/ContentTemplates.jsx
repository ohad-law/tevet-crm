import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Sparkles, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ContentTemplates() {
  const navigate = useNavigate();
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userData = await base44.auth.me().catch(() => null);
    if (!userData || userData.role !== 'admin') {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const templates = [
    {
      id: 1,
      name: "טיפ מהיר",
      category: "טיפ",
      platforms: ["Instagram", "TikTok"],
      hook: 'רגע! אם אתה עובד זר, תקשיב טוב 👇',
      body: `1. [טיפ ראשון - משפט אחד]
2. [טיפ שני - משפט אחד]
3. [טיפ שלישי - משפט אחד]`,
      cta: 'שמור את הפוסט! שלח לחבר! 💪',
      hashtags: ['דיני_עבודה', 'עובדים_זרים', 'זכויות_עובדים', 'טיפים_משפטיים']
    },
    {
      id: 2,
      name: "סיפור תיק",
      category: "סיפור תיק",
      platforms: ["Instagram", "TikTok", "Facebook"],
      hook: 'התיק הזה שינה לי את הדעה על... 😱',
      body: `הבעיה:
"עובד בן 45 עבד 12 שנים ללא חוזה..."

הסיבוך:
"המעסיק טען שהוא קבלן עצמאי..."

הפתרון:
"הוכחנו יחסי עובד-מעביד והוא קיבל..."

התוצאה:
"80,000₪ פיצויים! 💰"`,
      cta: 'יש לך מצב דומה? שלח DM 📩',
      hashtags: ['סיפור_הצלחה', 'דיני_עבודה', 'עורך_דין', 'פיצויים']
    },
    {
      id: 3,
      name: "שאלה ותשובה",
      category: "שאלה ותשובה",
      platforms: ["Instagram", "TikTok", "LinkedIn"],
      hook: 'השאלה הכי נפוצה שמקבל: 🤔',
      body: `השאלה:
"[שאלה של לקוח אמיתי]"

התשובה:
"התשובה הקצרה: [כן/לא/תלוי]

התשובה הארוכה:
1. [נקודה ראשונה]
2. [נקודה שנייה]
3. [נקודה שלישית]"`,
      cta: 'יש עוד שאלות? כתבו בתגובות 👇',
      hashtags: ['שאלות_ותשובות', 'דיני_עבודה', 'ייעוץ_משפטי']
    },
    {
      id: 4,
      name: "מיתוס vs מציאות",
      category: "מיתוס vs מציאות",
      platforms: ["Instagram", "TikTok"],
      hook: 'חושבים ש... אבל המציאות שונה! 🚨',
      body: `מיתוס ❌:
"[אמונה שגויה נפוצה]"

מציאות ✅:
"[האמת המשפטית]"

למה זה חשוב:
"[הסבר קצר על ההשלכות]"

דוגמה:
"[מקרה ממחיש]"`,
      cta: 'שמור את הפוסט! אל תיפול למיתוסים 💡',
      hashtags: ['עובדות', 'מיתוסים', 'דיני_עבודה', 'חינוך_משפטי']
    },
    {
      id: 5,
      name: "רשימת צ'קליסט",
      category: "רשימה",
      platforms: ["Instagram", "LinkedIn", "Facebook"],
      hook: 'פוטרת מהעבודה? בדוק את זה קודם! ✅',
      body: `☐ [פריט ראשון בצ'קליסט]
☐ [פריט שני]
☐ [פריט שלישי]
☐ [פריט רביעי]
☐ [פריט חמישי]

טיפ פרו:
"[טיפ מקצועי נוסף]"`,
      cta: 'שמור את הפוסט לעתיד! 📌',
      hashtags: ['checklist', 'זכויות_עובדים', 'פיטורים', 'חובה_לדעת']
    },
    {
      id: 6,
      name: "תוכן חינוכי",
      category: "חינוכי",
      platforms: ["LinkedIn", "Facebook", "Instagram"],
      hook: 'מה אומר החוק על...? 📚',
      body: `הרקע המשפטי:
"[הסבר על החוק הרלוונטי]"

במילים פשוטות:
"[הסבר מובן לכולם]"

מה זה אומר בפועל:
1. [השלכה ראשונה]
2. [השלכה שנייה]
3. [השלכה שלישית]

דוגמה:
"[תרחיש מעשי]"`,
      cta: 'עקוב לעוד תוכן משפטי 🎓',
      hashtags: ['חינוך_משפטי', 'דיני_עבודה', 'ידע_הוא_כוח']
    },
    {
      id: 7,
      name: "תוכן אישי",
      category: "אישי",
      platforms: ["Instagram", "Facebook", "LinkedIn"],
      hook: 'למה בחרתי להיות עורך דין...? 💭',
      body: `[הסיפור האישי שלך]
- איך התחלת
- מה מניע אותך
- מה אתה אוהב בעבודה
- למה אתה פה

הרגע שגרם לי להבין...
"[רגע מפנה בקריירה]"`,
      cta: 'מה הסיפור שלכם? שתפו בתגובות 💬',
      hashtags: ['סיפור_אישי', 'עורך_דין', 'השראה', 'קריירה']
    },
    {
      id: 8,
      name: "מגמות וחדשות",
      category: "חינוכי",
      platforms: ["LinkedIn", "Facebook"],
      hook: 'חוק חדש שכל מעסיק חייב לדעת! 🆕',
      body: `מה השתנה:
"[תיאור השינוי המשפטי]"

מתי זה נכנס לתוקף:
"[תאריך]"

על מי זה חל:
"[קבוצות מושפעות]"

מה צריך לעשות עכשיו:
1. [פעולה ראשונה]
2. [פעולה שנייה]
3. [פעולה שלישית]`,
      cta: 'שתף עם מעסיקים שאתה מכיר 🔔',
      hashtags: ['חוק_חדש', 'עדכון_משפטי', 'חובה_לדעת', 'חדשות']
    }
  ];

  const copyTemplate = (template) => {
    const fullTemplate = `${template.hook}

${template.body}

${template.cta}

${template.hashtags.map(tag => `#${tag}`).join(' ')}`;

    navigator.clipboard.writeText(fullTemplate);
    setCopiedTemplate(template.id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handleUseTemplate = (template) => {
    navigate(createPageUrl("PostComposer"));
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">📋 בנק תבניות</h1>
          <p className="text-gray-600">תבניות מוכנות לשימוש מיידי - Copy & Paste</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-xl border-none hover:shadow-2xl transition-all h-full">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
                      <Badge className="mt-2">{template.category}</Badge>
                    </div>
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">פלטפורמות:</p>
                      <div className="flex flex-wrap gap-2">
                        {template.platforms.map(platform => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <p className="font-bold text-purple-700 mb-2">🎣 Hook:</p>
                      <p className="mb-3">{template.hook}</p>

                      <p className="font-bold text-blue-700 mb-2">📝 גוף:</p>
                      <p className="text-xs text-gray-600 whitespace-pre-line mb-3">
                        {template.body.slice(0, 100)}...
                      </p>

                      <p className="font-bold text-green-700 mb-2">✅ CTA:</p>
                      <p className="text-xs">{template.cta}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        🏷️ {template.hashtags.length} hashtags
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.hashtags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs text-blue-600">
                            #{tag}
                          </span>
                        ))}
                        {template.hashtags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{template.hashtags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => copyTemplate(template)}
                      >
                        {copiedTemplate === template.id ? (
                          <>✅ הועתק!</>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 ml-2" />
                            העתק
                          </>
                        )}
                      </Button>
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Sparkles className="w-4 h-4 ml-2" />
                        השתמש
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}