
import { useState, useEffect } from "react";
import { SocialMediaPost, SocialMediaAccount, User } from "@/entities/all"; // Removed Lead import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, MessageCircle, Share2, Users } from "lucide-react"; // Removed Target icon
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from "framer-motion";

export default function SocialAnalytics() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  // const [leads, setLeads] = useState([]); // Removed leads state
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

    const [postsData, accountsData] = await Promise.all([ // Removed leadsData from destructuring
      SocialMediaPost.list("-published_date"),
      SocialMediaAccount.list(),
      // Lead.list() // Removed Lead.list() call
    ]);

    setPosts(postsData.filter(p => p.status === 'פורסם')); // Preserving existing filter
    setAccounts(accountsData);
    // setLeads(leadsData); // Removed setLeads call
    setIsLoading(false);
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  // Calculate stats
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers_count || 0), 0);
  // const socialLeads = leads.filter(l => ['Instagram', 'TikTok', 'Facebook', 'LinkedIn'].includes(l.source)).length; // Removed socialLeads calculation

  const avgEngagement = posts.length > 0 
    ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2)
    : 0;

  // Performance by platform
  const platformStats = ['Instagram', 'TikTok', 'Facebook', 'YouTube'].map(platform => {
    const platformPosts = posts.filter(p => p.platform === platform);
    const views = platformPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const engagement = platformPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0);
    return {
      name: platform,
      posts: platformPosts.length,
      views,
      engagement,
      avgEngagement: views > 0 ? ((engagement / views) * 100).toFixed(1) : 0
    };
  });

  // Posts over time (last 6 weeks)
  const weeklyData = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekPosts = posts.filter(p => {
      const date = new Date(p.published_date);
      return date >= weekStart && date < weekEnd;
    });

    weeklyData.push({
      week: `שבוע ${6 - i}`,
      posts: weekPosts.length,
      views: weekPosts.reduce((sum, p) => sum + (p.views || 0), 0),
      engagement: weekPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0),
      // leads: leads.filter(l => { // Removed leads from weeklyData
      //   const date = new Date(l.created_date);
      //   return date >= weekStart && date < weekEnd;
      // }).length
    });
  }

  // Content performance by category
  const categoryStats = ['טיפ', 'סיפור תיק', 'שאלה ותשובה', 'מיתוס vs מציאות', 'רשימה'].map(category => {
    const catPosts = posts.filter(p => p.category === category);
    const avgViews = catPosts.length > 0 
      ? Math.round(catPosts.reduce((sum, p) => sum + (p.views || 0), 0) / catPosts.length)
      : 0;
    return {
      name: category,
      posts: catPosts.length,
      avgViews
    };
  }).filter(item => item.posts > 0);

  // Top performing posts
  const topPosts = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const COLORS = ['#E1306C', '#000000', '#0A66C2', '#FF0000'];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">ניתוח ביצועים</h1>
          <p className="text-gray-600">Social Media Analytics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-600">צפיות</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalLikes.toLocaleString()}</p>
                <p className="text-xs text-gray-600">לייקים</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalComments.toLocaleString()}</p>
                <p className="text-xs text-gray-600">תגובות</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Share2 className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalShares.toLocaleString()}</p>
                <p className="text-xs text-gray-600">שיתופים</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalFollowers.toLocaleString()}</p>
                <p className="text-xs text-gray-600">עוקבים</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Removed Leads KPI Card */}
          {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{socialLeads}</p>
                <p className="text-xs text-gray-600">לידים</p>
              </CardContent>
            </Card>
          </motion.div> */}
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Performance */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">ביצועים שבועיים</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#4A90E2" strokeWidth={2} name="צפיות" />
                  <Line type="monotone" dataKey="engagement" stroke="#E1306C" strokeWidth={2} name="מעורבות" />
                  {/* Removed Leads Line */}
                  {/* <Line type="monotone" dataKey="leads" stroke="#50C878" strokeWidth={2} name="לידים" /> */}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Performance */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">ביצועים לפי פלטפורמה</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="views" fill="#4A90E2" name="צפיות" />
                  <Bar dataKey="engagement" fill="#E1306C" name="מעורבות" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Category Performance */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">ביצועים לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="avgViews" fill="#7B68EE" name="צפיות ממוצעות" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">התפלגות פוסטים</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="posts"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {platformStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Posts */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">🔥 הפוסטים המובילים</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
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
                  <div className="text-left">
                    <Badge className="bg-purple-100 text-purple-800">
                      {post.platform}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.engagement_rate ? `${post.engagement_rate}% engagement` : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
