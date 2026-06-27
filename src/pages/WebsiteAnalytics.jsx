
import { useState, useEffect } from "react";
import { WebsiteAnalytics, Lead, ContentArticle, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Clock, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function WebsiteAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState([]);
  const [leads, setLeads] = useState([]);
  const [articles, setArticles] = useState([]);
  const [timeRange, setTimeRange] = useState("30days");
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

    const [analyticsData, leadsData, articlesData] = await Promise.all([
      WebsiteAnalytics.list("-date"),
      Lead.list(),
      ContentArticle.list()
    ]);

    setAnalytics(analyticsData);
    setLeads(leadsData);
    setArticles(articlesData);
    setIsLoading(false);
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  // Calculate date range
  const days = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const filteredAnalytics = analytics.filter(a => new Date(a.date) >= startDate);

  // Calculate totals
  const totalPageViews = filteredAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0);
  const totalVisitors = filteredAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);
  const avgBounceRate = filteredAnalytics.length > 0
    ? (filteredAnalytics.reduce((sum, a) => sum + (a.bounce_rate || 0), 0) / filteredAnalytics.length).toFixed(1)
    : 0;
  const avgSessionDuration = filteredAnalytics.length > 0
    ? Math.floor(filteredAnalytics.reduce((sum, a) => sum + (a.avg_session_duration || 0), 0) / filteredAnalytics.length)
    : 0;

  // Traffic sources
  const trafficSourcesData = filteredAnalytics.reduce((acc, a) => {
    if (a.traffic_sources) {
      acc.organic = (acc.organic || 0) + (a.traffic_sources.organic || 0);
      acc.direct = (acc.direct || 0) + (a.traffic_sources.direct || 0);
      acc.social = (acc.social || 0) + (a.traffic_sources.social || 0);
      acc.referral = (acc.referral || 0) + (a.traffic_sources.referral || 0);
      acc.paid = (acc.paid || 0) + (a.traffic_sources.paid || 0);
    }
    return acc;
  }, {});

  const trafficPieData = Object.entries(trafficSourcesData).map(([name, value]) => ({
    name: name === 'organic' ? 'אורגני' :
          name === 'direct' ? 'ישיר' :
          name === 'social' ? 'רשתות חברתיות' :
          name === 'referral' ? 'הפניות' : 'ממומן',
    value
  }));

  // Daily data for charts
  const dailyData = filteredAnalytics.map(a => ({
    date: new Date(a.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
    pageViews: a.page_views || 0,
    visitors: a.unique_visitors || 0,
    bounceRate: a.bounce_rate || 0,
    avgSession: Math.floor((a.avg_session_duration || 0) / 60) // Convert to minutes
  }));

  // Top pages
  const allTopPages = [];
  filteredAnalytics.forEach(a => {
    if (a.top_pages && Array.isArray(a.top_pages)) {
      a.top_pages.forEach(page => {
        const existing = allTopPages.find(p => p.url === page.url);
        if (existing) {
          existing.views += page.views;
        } else {
          allTopPages.push({ ...page });
        }
      });
    }
  });
  allTopPages.sort((a, b) => b.views - a.views);
  const topPages = allTopPages.slice(0, 10);

  // Conversion metrics
  const websiteLeads = leads.filter(l => l.source === 'אתר' || l.landing_page);
  const conversionRate = totalVisitors > 0 
    ? ((websiteLeads.length / totalVisitors) * 100).toFixed(2)
    : 0;

  // Content performance
  const publishedArticles = articles.filter(a => a.status === 'פורסם');
  const totalArticleViews = publishedArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const avgViewsPerArticle = publishedArticles.length > 0
    ? Math.floor(totalArticleViews / publishedArticles.length)
    : 0;

  const COLORS = ['#4A90E2', '#7B68EE', '#50C878', '#FF6B6B', '#FFB347'];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Website Analytics</h1>
            <p className="text-gray-600">ניתוח תעבורה ושימוש באתר</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ימים אחרונים</SelectItem>
              <SelectItem value="30days">30 ימים אחרונים</SelectItem>
              <SelectItem value="90days">90 ימים אחרונים</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">צפיות בדף</p>
                    <p className="text-3xl font-bold text-gray-900">{totalPageViews.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-600" />
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
                    <p className="text-sm text-gray-600 mb-1">מבקרים ייחודיים</p>
                    <p className="text-3xl font-bold text-purple-600">{totalVisitors.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
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
                    <p className="text-sm text-gray-600 mb-1">אחוז נטישה</p>
                    <p className="text-3xl font-bold text-red-600">{avgBounceRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
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
                    <p className="text-sm text-gray-600 mb-1">זמן ממוצע</p>
                    <p className="text-3xl font-bold text-green-600">{Math.floor(avgSessionDuration / 60)}:{String(avgSessionDuration % 60).padStart(2, '0')}</p>
                    <p className="text-xs text-gray-500">דקות</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Conversion Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">שיעור המרה</p>
                  <p className="text-3xl font-bold text-indigo-600">{conversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{websiteLeads.length} לידים מהאתר</p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">מאמרים פורסמו</p>
                  <p className="text-3xl font-bold text-blue-600">{publishedArticles.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{totalArticleViews.toLocaleString()} צפיות</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ממוצע לכתבה</p>
                  <p className="text-3xl font-bold text-purple-600">{avgViewsPerArticle}</p>
                  <p className="text-xs text-gray-500 mt-1">צפיות למאמר</p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Over Time */}
        <Card className="shadow-lg border-none mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">תעבורה לאורך זמן</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B68EE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7B68EE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="pageViews" stroke="#4A90E2" fillOpacity={1} fill="url(#colorPageViews)" name="צפיות בדף" />
                <Area type="monotone" dataKey="visitors" stroke="#7B68EE" fillOpacity={1} fill="url(#colorVisitors)" name="מבקרים" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources + Engagement */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">מקורות תעבורה</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {trafficPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {trafficPieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm">{item.name}: <strong>{item.value.toLocaleString()}</strong></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">Engagement לאורך זמן</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="bounceRate" stroke="#FF6B6B" strokeWidth={2} name="אחוז נטישה %" />
                  <Line type="monotone" dataKey="avgSession" stroke="#50C878" strokeWidth={2} name="זמן ממוצע (דק')" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">דפים פופולריים</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{page.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-blue-600">{page.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">אין נתונים</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
