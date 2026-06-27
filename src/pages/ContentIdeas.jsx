
import { useState, useEffect } from "react";
import { ContentIdea, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Star, Sparkles, Trash2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { InvokeLLM } from "@/integrations/Core";

export default function ContentIdeas() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // ⚠️ הגנה: רק אדמין!
    const userData = await User.me().catch(() => null);
    if (!userData || userData.role !== 'admin') {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const ideasData = await ContentIdea.list("-created_date");
    setIdeas(ideasData);
    setIsLoading(false);
  };

  const handleGenerateIdeas = async () => {
    setGeneratingAI(true);
    try {
      const response = await InvokeLLM({
        prompt: `צור 10 רעיונות תוכן ויראליים לעורך דין שמתמחה בדיני עבודה ועובדים זרים.
        
        כל רעיון צריך להיות:
        - מעניין ומושך תשומת לב
        - רלוונטי לקהל היעד (עובדים, מעסיקים, עובדים זרים)
        - בעל פוטנציאל ויראלי גבוה
        - מתאים לרילס/שורט של 15-60 שניות
        
        החזר JSON בפורמט הבא:
        [
          {
            "title": "כותרת קצרה ומושכת",
            "description": "תיאור מפורט של הרעיון",
            "category": "טיפ/סיפור תיק/שאלה ותשובה/מיתוס vs מציאות/רשימה/חינוכי",
            "platforms": ["Instagram", "TikTok"],
            "potential_score": 4,
            "tags": ["דיני_עבודה", "טיפ"]
          }
        ]`,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  platforms: { type: "array", items: { type: "string" } },
                  potential_score: { type: "number" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Insert all ideas
      for (const idea of response.ideas) {
        await ContentIdea.create({
          ...idea,
          source: "AI",
          status: "רעיון",
          priority: "בינונית"
        });
      }

      loadData();
    } catch (error) {
      alert('שגיאה ביצירת רעיונות');
      console.error(error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await ContentIdea.update(id, { status: newStatus });
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm('למחוק רעיון זה?')) {
      await ContentIdea.delete(id);
      loadData();
    }
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  const groupedIdeas = {
    'רעיון': ideas.filter(i => i.status === 'רעיון'),
    'אושר': ideas.filter(i => i.status === 'אושר'),
    'בביצוע': ideas.filter(i => i.status === 'בביצוע'),
    'הושלם': ideas.filter(i => i.status === 'הושלם'),
  };

  const categoryColors = {
    'טיפ': 'bg-blue-100 text-blue-800',
    'סיפור תיק': 'bg-purple-100 text-purple-800',
    'שאלה ותשובה': 'bg-green-100 text-green-800',
    'מיתוס vs מציאות': 'bg-red-100 text-red-800',
    'רשימה': 'bg-yellow-100 text-yellow-800',
    'חינוכי': 'bg-indigo-100 text-indigo-800',
    'אישי': 'bg-pink-100 text-pink-800'
  };

  const priorityColors = {
    'נמוכה': 'bg-gray-100 text-gray-700',
    'בינונית': 'bg-yellow-100 text-yellow-700',
    'גבוהה': 'bg-orange-100 text-orange-700',
    'דחופה': 'bg-red-100 text-red-700'
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">בנק רעיונות</h1>
            <p className="text-gray-600">Content Ideas Bank</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateIdeas}
              disabled={generatingAI}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generatingAI ? (
                <>
                  <Sparkles className="w-5 h-5 ml-2 animate-spin" />
                  יוצר רעיונות...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  10 רעיונות עם AI
                </>
              )}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 ml-2" />
              רעיון ידני
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Object.entries(groupedIdeas).map(([status, statusIdeas]) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">{status}</h3>
                <Badge variant="secondary">{statusIdeas.length}</Badge>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {statusIdeas.map((idea) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{idea.title}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{idea.description}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(idea.id)}>
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className={categoryColors[idea.category]}>
                              {idea.category}
                            </Badge>
                            <Badge className={priorityColors[idea.priority]}>
                              {idea.priority}
                            </Badge>
                            {idea.potential_score && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {idea.potential_score}/5
                              </Badge>
                            )}
                          </div>

                          {idea.platforms && idea.platforms.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {idea.platforms.map(platform => (
                                <span key={platform} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {platform}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            {status !== 'אושר' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => handleStatusChange(idea.id, 'אושר')}
                              >
                                <Check className="w-3 h-3 ml-1" />
                                אשר
                              </Button>
                            )}
                            {status === 'אושר' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs bg-purple-50"
                                onClick={() => navigate(createPageUrl("PostComposer"))}
                              >
                                <Sparkles className="w-3 h-3 ml-1" />
                                צור פוסט
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
