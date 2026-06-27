import React, { useState, useEffect } from "react";
import { Lead, MarketingCampaign, Client, User } from "@/entities/all"; // Keep existing entities import for type hinting or other uses if base44 is not globally typed
import { base44 } from "@/api/base44Client";
import UnauthorizedAccess from "../components/common/UnauthorizedAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, DollarSign, Phone, Mail, Edit, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { motion } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FacebookAdsPanel from "@/components/marketing/FacebookAdsPanel";
import TikTokStatsPanel from "@/components/marketing/TikTokStatsPanel";
import BusinessInsights from "@/components/marketing/BusinessInsights";
import CampaignInsights from "@/components/marketing/CampaignInsights";
import { facebookAdsFetch } from "@/functions/facebookAdsFetch";

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fbSpend, setFbSpend] = useState(0);
  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener("lead-value-updated", handleRefresh);
    return () => window.removeEventListener("lead-value-updated", handleRefresh);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      
      // Only allow admin access or users with permission
      const hasPermission = userData?.specific_permissions?.includes('view_marketing');
      if (userData.role !== 'admin' && !hasPermission) {
        setIsLoading(false);
        return; // Stop execution if not admin or authorized
      }

      const [leadsData, campaignsData, clientsData] = await Promise.all([
        base44.entities.Lead.list("-created_date"),
        base44.entities.MarketingCampaign.list("-start_date"),
        base44.entities.Client.list()
      ]);

      // Fetch actual Facebook ad spend
      let fbAdSpend = 0;
      try {
        const fbRes = await facebookAdsFetch({ action: 'overview', date_preset: 'last_90d' });
        fbAdSpend = parseFloat(fbRes.data?.account_insights?.spend || 0);
      } catch (e) { console.error("Facebook spend fetch failed:", e); }

      setLeads(leadsData);
      setCampaigns(campaignsData);
      setClients(clientsData);
      setFbSpend(fbAdSpend);
      
      // Mark unviewed leads as viewed
      const unviewedLeads = leadsData.filter(l => !l.is_viewed);
      for (const lead of unviewedLeads) {
        await base44.entities.Lead.update(lead.id, { is_viewed: true });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading marketing data:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  const isAdmin = currentUser?.role === 'admin';
  const hasPermission = currentUser?.specific_permissions?.includes('view_marketing');

  if (!isAdmin && !hasPermission) {
    return <UnauthorizedAccess />;
  }

  // Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthLeads = leads.filter(l => {
    const date = new Date(l.created_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const lastMonthLeads = leads.filter(l => {
    const date = new Date(l.created_date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === lastMonth && date.getFullYear() === year;
  });

  const convertedLeads = leads.filter(l => l.converted_to_client);
  const conversionRate = leads.length > 0 ? (convertedLeads.length / leads.length * 100).toFixed(1) : 0;

  const entitySpend = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalSpent = entitySpend + fbSpend; // Combine DB campaign spend + Facebook actual spend
  const totalRevenueNet = leads.reduce((sum, l) => sum + (l.closed_deal_value || 0), 0);
  const totalRevenue = Math.round(totalRevenueNet * 1.18); // Gross including 18% VAT
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent * 100).toFixed(0) : 0;
  
  const costPerLead = totalSpent > 0 && leads.length > 0 ? Math.round(totalSpent / leads.length) : 0;

  const leadsGrowth = lastMonthLeads.length > 0 
    ? (((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100).toFixed(0)
    : thisMonthLeads.length > 0 ? 100 : 0;

  // Leads by source
  const leadsBySource = {};
  leads.forEach(lead => {
    leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
  });

  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({ name, value }));

  // Conversion funnel
  const funnelData = [
    { name: 'לידים', value: leads.length },
    { name: 'יצר קשר', value: leads.filter(l => ['יצר קשר', 'פגישה נקבעה', 'הפך ללקוח'].includes(l.status)).length },
    { name: 'פגישה', value: leads.filter(l => ['פגישה נקבעה', 'הפך ללקוח'].includes(l.status)).length },
    { name: 'לקוחות', value: convertedLeads.length }
  ];

  // Leads over time by channel
  const leadsOverTime = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleDateString('he-IL', { month: 'short' });
    
    const monthLeads = leads.filter(l => {
      const leadDate = new Date(l.created_date);
      return leadDate.getMonth() === date.getMonth() && leadDate.getFullYear() === date.getFullYear();
    });

    leadsOverTime.push({
      month: monthStr,
      'Google Ads': monthLeads.filter(l => l.source === 'Google Ads').length,
      'Facebook': monthLeads.filter(l => l.source === 'Facebook').length,
      'אתר': monthLeads.filter(l => l.source === 'אתר').length,
      'המלצות': monthLeads.filter(l => l.source === 'המלצה').length
    });
  }

  // Best performers
  const bestChannel = Object.entries(leadsBySource).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
  const bestCampaign = campaigns.sort((a, b) => (b.revenue_generated || 0) - (a.revenue_generated || 0))[0];

  // Hot leads (score > 75 and status = חדש)
  const hotLeads = leads.filter(l => l.lead_score > 75 && l.status === 'חדש').slice(0, 5);

  const COLORS = ['#4A90E2', '#7B68EE', '#50C878', '#FF6B6B', '#FFB347'];

  const statusColors = {
    'חדש': 'bg-blue-100 text-blue-800',
    'יצר קשר': 'bg-purple-100 text-purple-800',
    'פגישה נקבעה': 'bg-amber-100 text-amber-800',
    'הפך ללקוח': 'bg-green-100 text-green-800',
    'לא רלוונטי': 'bg-gray-100 text-gray-800'
  };

  const handleStatusChange = async (leadId, newStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const updates = { status: newStatus };
      
      // If converting to client
      if (newStatus === "הפך ללקוח" && !lead.converted_to_client) {
        updates.converted_to_client = true;
        updates.conversion_date = new Date().toISOString().split('T')[0];
      }
      
      await base44.entities.Lead.update(leadId, updates); // Use base44.entities.Lead
      loadData(); // Reload data to reflect changes
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">שיווק ולידים</h1>
            <p className="text-gray-600">Marketing & Leads Dashboard</p>
          </div>
          <Link to={createPageUrl("LeadManagement")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              📊 ניהול לידים מלא
            </Button>
          </Link>
        </div>

        {/* Business KPIs - Focus on Profit, not Vanity Metrics */}
        <BusinessInsights leads={leads} campaigns={campaigns} totalSpent={totalSpent} />

        {/* Funnel + Distribution */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">משפך המרות</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#4A90E2" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  שיעור המרה כללי: {conversionRate}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">לידים לפי מקור</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {sourceData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm">{item.name}: <strong>{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Over Time */}
        <Card className="shadow-lg border-none mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">לידים לאורך זמן לפי ערוץ</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={leadsOverTime}>
                <defs>
                  <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B68EE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7B68EE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWebsite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#50C878" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#50C878" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReferral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB347" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFB347" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="Google Ads" stroke="#4A90E2" fillOpacity={1} fill="url(#colorGoogle)" />
                <Area type="monotone" dataKey="Facebook" stroke="#7B68EE" fillOpacity={1} fill="url(#colorFacebook)" />
                <Area type="monotone" dataKey="אתר" stroke="#50C878" fillOpacity={1} fill="url(#colorWebsite)" />
                <Area type="monotone" dataKey="המלצות" stroke="#FFB347" fillOpacity={1} fill="url(#colorReferral)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Best Performers */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                🥇 ערוץ הטוב ביותר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-3xl font-bold text-blue-600 mb-2">{bestChannel[0]}</p>
              <p className="text-sm text-gray-600">{bestChannel[1]} לידים</p>
              <p className="text-sm text-gray-600 mt-1">
                {leads.length > 0 ? ((bestChannel[1] / leads.length) * 100).toFixed(0) : 0}% מכלל הלידים
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                🎯 קמפיין מוביל
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {bestCampaign ? (
                <>
                  <p className="text-xl font-bold text-purple-600 mb-2">{bestCampaign.campaign_name}</p>
                  <p className="text-sm text-gray-600">ROI: {bestCampaign.revenue_generated && bestCampaign.spent ? (((bestCampaign.revenue_generated - bestCampaign.spent) / bestCampaign.spent) * 100).toFixed(0) : 0}%</p>
                  <p className="text-sm text-gray-600 mt-1">{bestCampaign.leads_generated || 0} לידים</p>
                </>
              ) : (
                <p className="text-gray-500">אין קמפיינים</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                🌐 דף נחיתה מוביל
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-bold text-green-600 mb-2">/worker-form</p>
              <p className="text-sm text-gray-600">שיעור המרה גבוה</p>
              <p className="text-sm text-gray-600 mt-1">{leads.filter(l => l.landing_page?.includes('worker')).length} לידים</p>
            </CardContent>
          </Card>
        </div>

        {/* TikTok Stats Panel */}
        <div className="mb-8">
          <TikTokStatsPanel />
        </div>

        {/* Facebook Ads Panel */}
        <div className="mb-8">
          <FacebookAdsPanel />
        </div>

        {/* Campaign Insights - Deep Business Analysis */}
        <div className="mb-8">
          <CampaignInsights leads={leads} campaigns={campaigns} totalSpent={totalSpent} totalRevenue={totalRevenue} />
        </div>

        {/* Hot Leads Table */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-100">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              🔥 לידים חמים (דורשים טיפול מיידי)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hotLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">שם</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">טלפון</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">מקור</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">תאריך</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">ציון</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">סטטוס</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotLeads.map((lead) => {
                      const daysAgo = Math.floor((Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={lead.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold">{lead.full_name}</td>
                          <td className="p-3 text-sm">{lead.phone}</td>
                          <td className="p-3">
                            <Badge variant="outline">{lead.source}</Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {daysAgo === 0 ? 'היום 🔥' : `לפני ${daysAgo} ימים`}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-red-600">{lead.lead_score}</span>
                          </td>
                          <td className="p-3">
                            <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="hover:bg-blue-50">
                                <Phone className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="hover:bg-purple-50">
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Select value={lead.status} onValueChange={(value) => handleStatusChange(lead.id, value)}>
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="חדש">חדש</SelectItem>
                                  <SelectItem value="יצר קשר">יצר קשר</SelectItem>
                                  <SelectItem value="פגישה נקבעה">פגישה נקבעה</SelectItem>
                                  <SelectItem value="הפך ללקוח">הפך ללקוח</SelectItem>
                                  <SelectItem value="לא רלוונטי">לא רלוונטי</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">אין לידים חמים כרגע</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}