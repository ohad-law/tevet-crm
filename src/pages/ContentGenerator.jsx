
import { useState, useEffect } from "react";
import { ContentIdea, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Wand2, Zap, Rocket, TrendingUp, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InvokeLLM } from "@/integrations/Core";
import { Badge } from "@/components/ui/badge";

export default function ContentGenerator() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("טיפ"); // Renamed from contentType
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("מקצועי");
  const [isGenerating, setIsGenerating] = useState(false); // Renamed from generating
  const [generatedContent, setGeneratedContent] = useState(null);
  const [generating90Days, setGenerating90Days] = useState(false); // Renamed from batchGenerating

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // ⚠️ הגנה: רק אדמין!
    const userData = await User.me().catch(() => null);
    if (!userData || userData.role !== 'admin') {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const generateSingleContent = async () => {
    if (!topic) {
      alert('הזן נושא קודם');
      return;
    }

    setIsGenerating(true); // Updated
    try {
      const response = await InvokeLLM({
        prompt: `תפקידך: מנהל תוכן מקצועי לעורך דין בתחום דיני עבודה.
        
נושא: ${topic}
סוג תוכן: ${category}
פלטפורמה: ${platform}
טון: ${tone}

צור תוכן ויראלי מושלם ל-${platform} שיגרום לאנשים לעצור את הגלילה!

הנחיות:
1. Hook (משפט ראשון): חייב להיות פותח שתופס תשומת לב תוך 2 שניות
2. Body: תוכן ערכי, מעניין, וקל לעיכול
3. CTA: קריאה לפעולה ברורה
4. Hashtags: 10-15 hashtags מגוונים (פופולריים + נישה)

פורמט: ${category}
- טיפ: 3 טיפים מעשיים
- סיפור תיק: בעיה → סיבוך → פתרון → תוצאה
- שאלה ותשובה: שאלה נפוצה + תשובה מקיפה
- מיתוס vs מציאות: הפרכת אמונה שגויה
- רשימה: X דברים שצריך לדעת

החזר JSON:`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            body: { type: "string" },
            cta: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            viral_score: { type: "number" }
          }
        }
      });

      setGeneratedContent(response);
    } catch (error) {
      alert('שגיאה ביצירת תוכן');
      console.error(error);
    } finally {
      setIsGenerating(false); // Updated
    }
  };

  const generate90DaysPlan = async () => {
    setGenerating90Days(true); // Updated
    try {
      const response = await InvokeLLM({
        prompt: `צור תוכנית תוכן מלאה ל-90 יום לעורך דין בדיני עבודה.

🎯 יעד: 10,000 עוקבים תוך 3 חודשים

תוכנית צריכה לכלול:
- 180 רעיונות תוכן (2 ביום)
- מגוון של: טיפים (40%), סיפורי תיקים (25%), שאלות ותשובות (20%), מיתוסים (10%), אישי (5%)
- התפלגות פלטפורמות: Instagram 50%, TikTok 30%, Facebook 20%
- אסטרטגיית האשטגים מדויקת
- שעות פרסום אופטימליות

כל רעיון צריך:
1. כותרת מושכת
2. Hook חזק
3. תוכן ראשי
4. CTA
5. 10-15 hashtags
6. פלטפורמה מומלצת
7. ציון פוטנציאל ויראלי (1-5)
8. תאריך מומלץ לפרסום

החזר JSON עם 180 רעיונות:`,
        response_json_schema: {
          type: "object",
          properties: {
            strategy_overview: { type: "string" },
            content_ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  date: { type: "string" },
                  title: { type: "string" },
                  category: { type: "string" },
                  platform: { type: "string" },
                  hook: { type: "string" },
                  body: { type: "string" },
                  cta: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  viral_score: { type: "number" },
                  post_time: { type: "string" }
                }
              }
            },
            weekly_goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "number" },
                  focus: { type: "string" },
                  target_followers: { type: "number" },
                  target_engagement: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Save all ideas to database
      for (const idea of response.content_ideas) {
        await ContentIdea.create({
          title: idea.title,
          description: `${idea.hook}\n\n${idea.body}\n\n${idea.cta}`,
          category: idea.category,
          platforms: [idea.platform],
          potential_score: idea.viral_score,
          status: 'רעיון',
          source: 'AI',
          priority: idea.viral_score >= 4 ? 'גבוהה' : 'בינונית',
          tags: idea.hashtags
        });
      }

      alert('🎉 תוכנית 90 יום נוצרה בהצלחה! 180 רעיונות נשמרו לבנק הרעיונות');
      navigate(createPageUrl("ContentIdeas"));
    } catch (error) {
      alert('שגיאה ביצירת תוכנית');
      console.error(error);
    } finally {
      setGenerating90Days(false); // Updated
    }
  };

  const saveAsIdea = async () => {
    if (!generatedContent) return;

    await ContentIdea.create({
      title: generatedContent.title,
      description: `${generatedContent.hook}\n\n${generatedContent.body}\n\n${generatedContent.cta}`,
      category: category, // Updated
      platforms: [platform],
      potential_score: generatedContent.viral_score,
      status: 'רעיון',
      source: 'AI',
      priority: generatedContent.viral_score >= 4 ? 'גבוהה' : 'בינונית',
      tags: generatedContent.hashtags
    });

    alert('נשמר לבנק הרעיונות!');
    setGeneratedContent(null);
    setTopic("");
  };

  const createPost = () => {
    navigate(createPageUrl("PostComposer"));
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">🪄 מחולל תוכן AI</h1>
          <p className="text-gray-600">צור תוכן ויראלי תוך שניות</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-none sticky top-8">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-xl font-bold">הגדרות</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>נושא / רעיון</Label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="למשל: זכויות עובד שפוטר בחודש ניסיון"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>סוג תוכן</Label>
                  <Select value={category} onValueChange={setCategory}> {/* Updated */}
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="טיפ">💡 טיפ מהיר</SelectItem>
                      <SelectItem value="סיפור תיק">📖 סיפור תיק</SelectItem>
                      <SelectItem value="שאלה ותשובה">❓ שאלה ותשובה</SelectItem>
                      <SelectItem value="מיתוס vs מציאות">❌✅ מיתוס vs מציאות</SelectItem>
                      <SelectItem value="רשימה">📝 רשימה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>פלטפורמה</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>טון דיבור</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="מקצועי">מקצועי</SelectItem>
                      <SelectItem value="ידידותי">ידידותי</SelectItem>
                      <SelectItem value="נחוש">נחוש</SelectItem>
                      <SelectItem value="מעורר מחשבה">מעורר מחשבה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateSingleContent}
                  disabled={isGenerating} // Updated
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isGenerating ? ( // Updated
                    <>
                      <Sparkles className="w-5 h-5 ml-2 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 ml-2" />
                      צור תוכן
                    </>
                  )}
                </Button>

                <div className="border-t pt-4">
                  <Button
                    onClick={generate90DaysPlan}
                    disabled={generating90Days} // Updated
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    size="lg"
                  >
                    {generating90Days ? ( // Updated
                      <>
                        <Rocket className="w-5 h-5 ml-2 animate-bounce" />
                        יוצר תוכנית...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 ml-2" />
                        תוכנית 90 יום מלאה
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    180 רעיונות מוכנים → 10K עוקבים 🚀
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!generatedContent ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="shadow-xl border-none h-full flex items-center justify-center min-h-[500px]">
                    <CardContent className="text-center p-12">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-2xl font-bold text-gray-400 mb-2">מוכן ליצור קסם? ✨</h3>
                      <p className="text-gray-500">הזן נושא והקלק על "צור תוכן"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="shadow-2xl border-none">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-bold">{generatedContent.title}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge className="bg-purple-100 text-purple-800">{category}</Badge> {/* Updated */}
                            <Badge className="bg-blue-100 text-blue-800">{platform}</Badge>
                            <Badge className="bg-amber-100 text-amber-800">
                              <TrendingUp className="w-3 h-3 ml-1" />
                              {generatedContent.viral_score}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Hook */}
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Hook (פתיחה)
                        </h4>
                        <p className="text-lg font-semibold text-gray-800">{generatedContent.hook}</p>
                      </div>

                      {/* Body */}
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                        <h4 className="font-bold text-gray-900 mb-2">תוכן ראשי</h4>
                        <p className="whitespace-pre-wrap text-gray-700">{generatedContent.body}</p>
                      </div>

                      {/* CTA */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Call To Action
                        </h4>
                        <p className="text-gray-800 font-medium">{generatedContent.cta}</p>
                      </div>

                      {/* Hashtags */}
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                        <h4 className="font-bold text-gray-900 mb-3">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.hashtags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const fullText = `${generatedContent.hook}\n\n${generatedContent.body}\n\n${generatedContent.cta}\n\n${generatedContent.hashtags.map(t => `#${t}`).join(' ')}`;
                            navigator.clipboard.writeText(fullText);
                            alert('הועתק!');
                          }}
                        >
                          📋 העתק הכל
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={saveAsIdea}
                        >
                          💾 שמור לרעיונות
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={createPost}
                        >
                          🚀 צור פוסט
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
