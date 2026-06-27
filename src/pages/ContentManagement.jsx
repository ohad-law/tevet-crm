
import { useState, useEffect } from "react";
import { ContentArticle, Lead, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Eye, TrendingUp, Edit, Trash2, Search, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { InvokeLLM } from "@/integrations/Core";

import ArticleForm from "../components/content/ArticleForm";

export default function ContentManagement() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await User.me().catch(() => null);
    if (!userData || userData.role !== 'admin') {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const [articlesData, leadsData] = await Promise.all([
      ContentArticle.list("-created_date"),
      Lead.list()
    ]);

    setArticles(articlesData);
    setLeads(leadsData);
    setIsLoading(false);
  };

  const handleSubmit = async (articleData) => {
    if (editingArticle && editingArticle.id) { // Check for existing ID
      await ContentArticle.update(editingArticle.id, articleData);
    } else {
      await ContentArticle.create(articleData);
    }
    setShowForm(false);
    setEditingArticle(null);
    loadData();
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מאמר זה?')) {
      await ContentArticle.delete(id);
      loadData();
    }
  };

  const handleGenerateWithAI = async () => {
    setGeneratingAI(true);
    try {
      const response = await InvokeLLM({
        prompt: `כתוב מאמר מקצועי בעברית בנושא דיני עבודה או עובדים זרים בישראל.
        
        המאמר צריך להיות:
        - באורך של 800-1200 מילים
        - מקצועי ומועיל לקוראים
        - עם מבנה ברור: כותרת, הקדמה, 3-4 פרקים, סיכום
        - כולל עצות מעשיות
        - מותאם ל-SEO עם שימוש במילות מפתח
        
        החזר JSON בפורמט הבא:
        {
          "title": "כותרת המאמר",
          "content": "תוכן מלא ב-HTML עם <h2>, <p>, <ul>, <li>",
          "excerpt": "תקציר של 2-3 שורות",
          "category": "קטגוריה (דיני עבודה/עובדים זרים/תביעות/זכויות עובדים)",
          "keywords": ["מילה1", "מילה2", "מילה3"],
          "meta_description": "תיאור קצר של 150 תווים"
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            excerpt: { type: "string" },
            category: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            meta_description: { type: "string" }
          }
        }
      });

      // Calculate stats
      const words = response.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
      
      const aiArticle = {
        ...response,
        slug: response.title.toLowerCase().replace(/[^\u0590-\u05FFa-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        author: "AI Content Generator",
        status: "טיוטה",
        word_count: words,
        reading_time: Math.ceil(words / 200),
        seo_score: 75,
        views: 0,
        leads_from_article: 0
      };

      setEditingArticle(aiArticle);
      setShowForm(true);
    } catch (error) {
      alert('שגיאה ביצירת מאמר עם AI');
      console.error(error);
    } finally {
      setGeneratingAI(false);
    }
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || article.status === filterStatus;
    const matchesCategory = filterCategory === "all" || article.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const publishedArticles = articles.filter(a => a.status === 'פורסם');
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalLeadsFromContent = articles.reduce((sum, a) => sum + (a.leads_from_article || 0), 0);
  const avgSeoScore = articles.length > 0 
    ? (articles.reduce((sum, a) => sum + (a.seo_score || 0), 0) / articles.length).toFixed(0)
    : 0;

  // Articles by category
  const categoryData = [
    { name: 'דיני עבודה', value: articles.filter(a => a.category === 'דיני עבודה').length },
    { name: 'עובדים זרים', value: articles.filter(a => a.category === 'עובדים זרים').length },
    { name: 'תביעות', value: articles.filter(a => a.category === 'תביעות').length },
    { name: 'זכויות עובדים', value: articles.filter(a => a.category === 'זכויות עובדים').length },
    { name: 'אחר', value: articles.filter(a => a.category === 'אחר').length }
  ].filter(item => item.value > 0);

  // Top performing articles
  const topArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // Articles performance over time
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleDateString('he-IL', { month: 'short' });
    
    const monthArticles = articles.filter(a => {
      if (!a.publish_date) return false;
      const pubDate = new Date(a.publish_date);
      return pubDate.getMonth() === date.getMonth() && pubDate.getFullYear() === date.getFullYear();
    });

    last6Months.push({
      month: monthStr,
      articles: monthArticles.length,
      views: monthArticles.reduce((sum, a) => sum + (a.views || 0), 0),
      leads: monthArticles.reduce((sum, a) => sum + (a.leads_from_article || 0), 0)
    });
  }

  const statusColors = {
    'טיוטה': 'bg-gray-100 text-gray-800',
    'פורסם': 'bg-green-100 text-green-800',
    'ארכיון': 'bg-red-100 text-red-800'
  };

  const COLORS = ['#4A90E2', '#7B68EE', '#50C878', '#FF6B6B', '#FFB347'];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">ניהול תוכן אורגני</h1>
            <p className="text-gray-600">Content & SEO Management</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateWithAI}
              disabled={generatingAI}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generatingAI ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  יוצר מאמר...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  כתוב עם AI
                </>
              )}
            </Button>
            <Button 
              onClick={() => {
                setEditingArticle(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 ml-2" />
              מאמר חדש
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <ArticleForm
                article={editingArticle}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingArticle(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">מאמרים פורסמו</p>
                    <p className="text-3xl font-bold text-gray-900">{publishedArticles.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">סה"כ צפיות</p>
                    <p className="text-3xl font-bold text-purple-600">{totalViews.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">לידים מתוכן</p>
                    <p className="text-3xl font-bold text-green-600">{totalLeadsFromContent}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ציון SEO ממוצע</p>
                    <p className="text-3xl font-bold text-amber-600">{avgSeoScore}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">ביצועים לאורך זמן</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="views" stroke="#7B68EE" strokeWidth={2} name="צפיות" />
                  <Line type="monotone" dataKey="leads" stroke="#50C878" strokeWidth={2} name="לידים" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">מאמרים לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Articles */}
        <Card className="shadow-lg border-none mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">🔥 המאמרים המובילים</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{article.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{article.category}</Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          {article.views || 0} צפיות
                        </Badge>
                        {(article.leads_from_article || 0) > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            {article.leads_from_article} לידים
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">SEO Score</p>
                    <p className="text-2xl font-bold text-amber-600">{article.seo_score || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-lg border-none mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="חיפוש מאמר..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="סינון לפי סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="טיוטה">טיוטה</SelectItem>
                  <SelectItem value="פורסם">פורסם</SelectItem>
                  <SelectItem value="ארכיון">ארכיון</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="סינון לפי קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  <SelectItem value="דיני עבודה">דיני עבודה</SelectItem>
                  <SelectItem value="עובדים זרים">עובדים זרים</SelectItem>
                  <SelectItem value="תביעות">תביעות</SelectItem>
                  <SelectItem value="זכויות עובדים">זכויות עובדים</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredArticles.map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="hover:shadow-xl transition-shadow border-none">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{article.excerpt}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={statusColors[article.status]}>{article.status}</Badge>
                              <Badge variant="outline">{article.category}</Badge>
                              {article.seo_score && (
                                <Badge className="bg-amber-100 text-amber-800">
                                  SEO: {article.seo_score}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-500">צפיות</p>
                            <p className="text-lg font-bold text-purple-600">{article.views || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">לידים</p>
                            <p className="text-lg font-bold text-green-600">{article.leads_from_article || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">מילים</p>
                            <p className="text-lg font-bold text-blue-600">{article.word_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">זמן קריאה</p>
                            <p className="text-lg font-bold text-gray-600">{article.reading_time || 0} דק'</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mr-4">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:bg-blue-50"
                          onClick={() => handleEdit(article)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:bg-red-50 text-red-600"
                          onClick={() => handleDelete(article.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredArticles.length === 0 && (
          <Card className="shadow-lg border-none">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">לא נמצאו מאמרים</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
