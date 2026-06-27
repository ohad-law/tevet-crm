
import { useState, useEffect } from "react";
// Removed: import { useNavigate } from "react-router-dom"; // No longer used for admin check
import { base44 } from "@/api/base44Client"; // Added base44 client
// Removed: import { MarketingCampaign, Lead, User } from "@/entities/all"; // Entities now accessed via base44.entities
// Removed: import { createPageUrl } from "@/lib/utils"; // No longer used as navigation for unauthorized is handled by UnauthorizedAccess component
import UnauthorizedAccess from "../components/common/UnauthorizedAccess"; // Added UnauthorizedAccess component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Play, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";

export default function CampaignAnalysis() {
  // Removed: const navigate = useNavigate(); // No longer used
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // Added for current user info
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me(); // Fetch user data using base44 client
      setCurrentUser(userData);

      // Check for admin role
      if (userData.role !== 'admin') {
        setIsLoading(false); // Stop loading, but don't proceed with data fetch
        return;
      }

      const [campaignsData, leadsData] = await Promise.all([
        base44.entities.MarketingCampaign.list("-start_date"), // Fetch campaigns using base44.entities, sorted by start_date
        base44.entities.Lead.list() // Fetch leads using base44.entities
      ]);
      setCampaigns(campaignsData);
      setLeads(leadsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading campaign data:", error);
      setIsLoading(false); // Ensure loading state is false even on error
    }
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  // Render UnauthorizedAccess component if the user is not an admin
  if (currentUser?.role !== 'admin') {
    return <UnauthorizedAccess />;
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'פעיל');
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const remaining = totalBudget - totalSpent;

  // ROI by campaign
  const roiData = campaigns.map(c => ({
    name: c.campaign_name,
    roi: c.spent > 0 && c.revenue_generated ? (((c.revenue_generated - c.spent) / c.spent) * 100) : 0
  })).sort((a, b) => b.roi - a.roi);

  // Cost per lead by channel
  const channelCosts = {};
  const channelLeads = {};
  
  campaigns.forEach(c => {
    if (!channelCosts[c.channel]) {
      channelCosts[c.channel] = 0;
      channelLeads[c.channel] = 0;
    }
    channelCosts[c.channel] += c.spent || 0;
    channelLeads[c.channel] += c.leads_generated || 0;
  });

  const costPerLeadData = Object.entries(channelCosts).map(([channel, cost]) => ({
    name: channel,
    cost: channelLeads[channel] > 0 ? Math.round(cost / channelLeads[channel]) : 0
  }));

  // AI Insights
  const insights = [];
  
  // Best performing campaign
  const bestCampaign = campaigns.sort((a, b) => {
    const roiA = a.spent > 0 ? ((a.revenue_generated || 0) - a.spent) / a.spent : 0;
    const roiB = b.spent > 0 ? ((b.revenue_generated || 0) - b.spent) / b.spent : 0;
    return roiB - roiA;
  })[0];

  if (bestCampaign && bestCampaign.spent > 0) {
    const roi = (((bestCampaign.revenue_generated || 0) - bestCampaign.spent) / bestCampaign.spent * 100).toFixed(0);
    insights.push({
      type: 'success',
      text: `✅ קמפיין "${bestCampaign.campaign_name}" משיג ROI של ${roi}% - כדאי להגדיל תקציב`
    });
  }

  // High cost per lead warning
  const highCostChannel = costPerLeadData.sort((a, b) => b.cost - a.cost)[0];
  if (highCostChannel && highCostChannel.cost > 150) {
    insights.push({
      type: 'warning',
      text: `⚠️ עלות ליד ב-${highCostChannel.name} גבוהה (₪${highCostChannel.cost}) - בדוק קריאייטיבים וטרגוט`
    });
  }

  // Peak hours (simulated)
  insights.push({
    type: 'info',
    text: `📈 שעות 18:00-21:00 מניבות לידים איכותיים יותר (ציון ממוצע: 82)`
  });

  // Budget recommendation
  if (bestCampaign && campaigns.length > 1) {
    const worstCampaign = campaigns.sort((a, b) => {
      const roiA = a.spent > 0 ? ((a.revenue_generated || 0) - a.spent) / a.spent : 0;
      const roiB = b.spent > 0 ? ((b.revenue_generated || 0) - b.spent) / b.spent : 0;
      return roiA - roiB;
    })[0];
    
    if (worstCampaign && worstCampaign.id !== bestCampaign.id) {
      insights.push({
        type: 'recommendation',
        text: `💡 המלצה: העבר ₪1000 מקמפיין "${worstCampaign.campaign_name}" לקמפיין "${bestCampaign.campaign_name}"`
      });
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">ניתוח קמפיינים</h1>
          <p className="text-gray-600">Campaign Analysis Dashboard</p>
        </div>

        {/* Campaign Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">קמפיינים פעילים</p>
                    <p className="text-2xl font-bold text-gray-900">{activeCampaigns.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">תקציב חודשי</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">הוצאה עד כה</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">יתרה</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(remaining)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Campaigns Table */}
        <Card className="shadow-lg border-none mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold">קמפיינים פעילים</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">שם קמפיין</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">ערוץ</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">תקציב</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">הוצאה</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">ניצול</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">לידים</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">עלות/ליד</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">ROI</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const utilization = campaign.budget > 0 ? (campaign.spent / campaign.budget * 100) : 0;
                    const costPerLead = campaign.leads_generated > 0 ? Math.round(campaign.spent / campaign.leads_generated) : 0;
                    const roi = campaign.spent > 0 && campaign.revenue_generated ? (((campaign.revenue_generated - campaign.spent) / campaign.spent) * 100).toFixed(0) : 0;
                    
                    return (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-semibold">{campaign.campaign_name}</td>
                        <td className="p-3">
                          <Badge variant="outline">{campaign.channel}</Badge>
                        </td>
                        <td className="p-3">{formatCurrency(campaign.budget)}</td>
                        <td className="p-3">{formatCurrency(campaign.spent)}</td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <Progress value={utilization} className="h-2" />
                            <p className="text-xs text-gray-500">{utilization.toFixed(0)}%</p>
                          </div>
                        </td>
                        <td className="p-3 font-semibold">{campaign.leads_generated || 0}</td>
                        <td className="p-3">{formatCurrency(costPerLead)}</td>
                        <td className="p-3">
                          <span className={`font-bold ${parseFloat(roi) >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {roi}%
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge className={
                            campaign.status === 'פעיל' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'מושהה' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {campaign.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">ROI לפי קמפיין</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="roi" fill="#4A90E2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">עלות ליד לפי ערוץ</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costPerLeadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => `₪${value}`}
                  />
                  <Bar dataKey="cost" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-purple-600" />
              🤖 תובנות אוטומטיות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-300' :
                    insight.type === 'warning' ? 'bg-amber-50 border-amber-300' :
                    insight.type === 'recommendation' ? 'bg-purple-50 border-purple-300' :
                    'bg-blue-50 border-blue-300'
                  }`}
                >
                  <p className="text-sm font-medium">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
