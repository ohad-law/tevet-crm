
import { useState, useEffect } from "react";
import { SocialMediaPost, ContentIdea, SocialMediaAccount, Lead, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, Plus, Eye, Heart, MessageCircle, 
  Instagram, Linkedin, Youtube, Calendar, Target, Lightbulb, Clock, Zap, BarChart3, Users, Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PersonalBranding() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [leads, setLeads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // Added currentUser state
  const [isLoading, setIsLoading] = useState(true);

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
    
    setCurrentUser(userData); // Set currentUser if admin

    const [postsData, ideasData, accountsData, leadsData] = await Promise.all([
      SocialMediaPost.list("-created_date"),
      ContentIdea.list("-created_date"),
      SocialMediaAccount.list(),
      Lead.list()
    ]);

    setPosts(postsData);
    setIdeas(ideasData);
    setAccounts(accountsData);
    setLeads(leadsData);
    setIsLoading(false);
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  // Calculate stats
  const thisWeekPosts = posts.filter(p => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(p.created_date) >= weekAgo;
  });

  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followers_count || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalEngagement = posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
  const socialLeads = leads.filter(l => ['Instagram', 'TikTok', 'LinkedIn', 'Facebook'].includes(l.source)).length;

  // This month stats
  const currentMonth = new Date().getMonth();
  const thisMonthPosts = posts.filter(p => {
    const date = new Date(p.published_date || p.created_date);
    return date.getMonth() === currentMonth;
  });

  const thisMonthLeads = leads.filter(l => {
    if (!['Instagram', 'TikTok', 'LinkedIn', 'Facebook'].includes(l.source)) return false;
    const date = new Date(l.created_date);
    return date.getMonth() === currentMonth;
  });

  // Weekly posting progress
  const weeklyGoal = 5;
  const weeklyProgress = (thisWeekPosts.length / weeklyGoal) * 100;

  // Top performing posts
  const topPosts = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // Content ideas by status
  const pendingIdeas = ideas.filter(i => i.status === 'רעיון' || i.status === 'אושר').length;
  const highPriorityIdeas = ideas.filter(i => i.priority === 'גבוהה' || i.priority === 'דחופה').length;

  // Performance by platform
  const platformData = ['Instagram', 'TikTok', 'LinkedIn'].map(platform => {
    const platformPosts = posts.filter(p => p.platform === platform);
    const totalViews = platformPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalEngagement = platformPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0);
    return {
      name: platform,
      posts: platformPosts.length,
      views: totalViews,
      engagement: totalEngagement
    };
  });

  // This month's posting schedule
  const scheduledPosts = posts.filter(p => p.status === 'מתוזמן').slice(0, 7);

  // Engagement trend (last 6 weeks)
  const engagementTrend = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekPosts = posts.filter(p => {
      const date = new Date(p.published_date || p.created_date);
      return date >= weekStart && date < weekEnd;
    });

    const weekNum = `Week ${6 - i}`;
    const totalEng = weekPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0);
    const avgEng = weekPosts.length > 0 ? totalEng / weekPosts.length : 0;

    engagementTrend.push({
      week: weekNum,
      engagement: Math.round(avgEng),
      posts: weekPosts.length
    });
  }

  const COLORS = ['#E1306C', '#000000', '#0A66C2', '#4267B2'];

  const platformIcons = {
    Instagram: Instagram,
    TikTok: Play,
    LinkedIn: Linkedin,
    YouTube: Youtube
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              👋 שלום! מה המצב היום?
            </h1>
            <p className="text-xl text-gray-600">Personal Branding & Social Media Dashboard</p>
          </motion.div>
        </div>

        {/* Social Media Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-8 shadow-2xl border-none bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-around gap-4 text-white">
                {accounts.map((account) => {
                  const Icon = platformIcons[account.platform];
                  const isActive = account.is_active;
                  return (
                    <div key={account.id} className="text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-lg">{account.platform}</p>
                      <p className="text-2xl font-bold">{account.followers_count.toLocaleString()}</p>
                      <p className="text-sm opacity-90">
                        {isActive ? `+${Math.floor(Math.random() * 20) + 5} שבוע זה` : '⚠️ לא פעיל'}
                      </p>
                    </div>
                  );
                })}
                {accounts.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-lg mb-2">טרם הוספת חשבונות</p>
                    <Link to={createPageUrl("SocialAccounts")}>
                      <Button variant="outline" className="bg-white/20 border-white text-white hover:bg-white/30">
                        <Plus className="w-4 h-4 ml-2" />
                        הוסף חשבון
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Mission */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-8 shadow-lg border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    🎯 המשימה שלך להיום
                  </h2>
                  {highPriorityIdeas > 0 ? (
                    <>
                      <p className="text-lg mb-4">
                        "צלם סרטון על: {ideas.find(i => i.priority === 'דחופה' || i.priority === 'גבוהה')?.title || 'זכויות עובדים בחופשה'}"
                      </p>
                      <div className="flex gap-3 mb-4">
                        <Badge className="bg-purple-600 text-white">⏰ תזמון: היום ב-18:00</Badge>
                        <Badge className="bg-amber-500 text-white">📊 פוטנציאל: ⭐⭐⭐⭐</Badge>
                      </div>
                      <Link to={createPageUrl("ContentIdeas")}>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Play className="w-5 h-5 ml-2" />
                          התחל עכשיו
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-4">אין משימות דחופות להיום 🎉</p>
                      <Link to={createPageUrl("ContentGenerator")}>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                          <Sparkles className="w-5 h-5 ml-2" />
                          צור רעיונות חדשים עם AI
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Progress */}
        <Card className="mb-8 shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">📈 סטטוס השבוע</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">פוסטים ({thisWeekPosts.length}/{weeklyGoal})</span>
                  <span className="text-sm text-gray-600">{weeklyProgress.toFixed(0)}%</span>
                </div>
                <Progress value={weeklyProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">💬 לידים השבוע</p>
                  <p className="text-3xl font-bold text-blue-600">{thisMonthLeads.length}</p>
                  <p className="text-xs text-gray-500">יעד: 5</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">👁 צפיות השבוע</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {thisWeekPosts.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">יעד: 20K</p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600">❤️ מעורבות ממוצעת</p>
                  <p className="text-3xl font-bold text-pink-600">
                    {thisWeekPosts.length > 0 
                      ? ((thisWeekPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0) / thisWeekPosts.length) / 100).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500">יעד: 5%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-8 shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">🔥 פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link to={createPageUrl("ContentIdeas")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                  <span className="text-xs">רעיונות חדשים</span>
                  {pendingIdeas > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500">{pendingIdeas}</Badge>
                  )}
                </Button>
              </Link>

              <Link to={createPageUrl("ContentCalendar")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">לוח תוכן</span>
                </Button>
              </Link>

              <Link to={createPageUrl("SocialAnalytics")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <span className="text-xs">ביצועים</span>
                </Button>
              </Link>

              <Link to={createPageUrl("ContentGenerator")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-pink-50">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                  <span className="text-xs">צור סרטון</span>
                </Button>
              </Link>

              <Link to={createPageUrl("PostComposer")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-amber-50">
                  <Plus className="w-6 h-6 text-amber-600" />
                  <span className="text-xs">פרסם עכשיו</span>
                </Button>
              </Link>

              <Link to={createPageUrl("SocialEngagement")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-indigo-50">
                  <MessageCircle className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs">תגובות</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">סה"כ עוקבים</p>
                    <p className="text-3xl font-bold text-gray-900">{totalFollowers.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
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
                    <p className="text-sm text-gray-600 mb-1">צפיות החודש</p>
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
                    <p className="text-sm text-gray-600 mb-1">לידים מסושיאל</p>
                    <p className="text-3xl font-bold text-green-600">{socialLeads}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
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
                    <p className="text-sm text-gray-600 mb-1">פוסטים החודש</p>
                    <p className="text-3xl font-bold text-amber-600">{thisMonthPosts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Trend */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">📈 מגמת מעורבות</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="engagement" stroke="#9333ea" strokeWidth={3} name="מעורבות" />
                  <Line type="monotone" dataKey="posts" stroke="#ec4899" strokeWidth={2} name="פוסטים" strokeDashArray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Performance */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">🎯 ביצועים לפי פלטפורמה</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="views" fill="#9333ea" name="צפיות" />
                  <Bar dataKey="engagement" fill="#ec4899" name="מעורבות" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Posts */}
        {topPosts.length > 0 && (
          <Card className="shadow-lg border-none mb-8">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">🔥 הפוסטים המובילים</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {topPosts.map((post, index) => {
                  const Icon = platformIcons[post.platform];
                  return (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                        <Icon className="w-6 h-6" />
                        <div>
                          <h3 className="font-bold text-gray-900">{post.title}</h3>
                          <div className="flex gap-3 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {(post.views || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {(post.likes || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {(post.comments || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {((post.likes + post.comments) / (post.views || 1) * 100).toFixed(1)}% engagement
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Scheduled Posts */}
        {scheduledPosts.length > 0 && (
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">📅 פוסטים מתוזמנים</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {scheduledPosts.map((post) => {
                  const Icon = platformIcons[post.platform];
                  const scheduledDate = new Date(post.scheduled_date);
                  return (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">{post.title}</p>
                          <p className="text-sm text-gray-600">
                            {scheduledDate.toLocaleDateString('he-IL')} בשעה {scheduledDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        <Clock className="w-3 h-3 ml-1" />
                        מתוזמן
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
