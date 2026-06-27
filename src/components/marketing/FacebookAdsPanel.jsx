import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { facebookAdsFetch } from "@/functions/facebookAdsFetch";
import { facebookAdsManage } from "@/functions/facebookAdsManage";
import { facebookAdsAI } from "@/functions/facebookAdsAI";
import AdsOverviewCards from "@/components/ads/AdsOverviewCards";
import CampaignsTable from "@/components/ads/CampaignsTable";
import AdsList from "@/components/ads/AdsList";
import SmartAlerts from "@/components/ads/SmartAlerts";
import ScheduleAnalysis from "@/components/ads/ScheduleAnalysis";
import CopyOptimizer from "@/components/ads/CopyOptimizer";

export default function FacebookAdsPanel() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [datePreset, setDatePreset] = useState("last_7d");
    const [accountData, setAccountData] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [ads, setAds] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => { loadData(); }, [datePreset]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [accRes, campRes, adsRes] = await Promise.all([
                facebookAdsFetch({ action: 'overview', date_preset: datePreset }),
                facebookAdsFetch({ action: 'campaigns', date_preset: datePreset }),
                facebookAdsFetch({ action: 'ads', date_preset: datePreset })
            ]);
            setAccountData(accRes.data.account_insights);
            setCampaigns(campRes.data.campaigns || []);
            setAds(adsRes.data.ads || []);
            if (adsRes.data.ads?.length) {
                try {
                    const fatigue = await facebookAdsAI({ action: 'fatigue_detection', data: { ads: adsRes.data.ads } });
                    setAlerts(fatigue.data.alerts || []);
                } catch (e) { console.error("Fatigue failed:", e); }
            }
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || e.message);
        }
        setLoading(false);
    };

    const toggleCampaignStatus = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            await facebookAdsManage({ action: 'update_status', type: 'campaign', id, status: newStatus });
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        } catch (e) { alert("שגיאה: " + e.message); }
        setUpdatingId(null);
    };

    return (
        <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    מנהל מודעות Facebook / Instagram
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Select value={datePreset} onValueChange={setDatePreset}>
                        <SelectTrigger className="w-36 h-9 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">היום</SelectItem>
                            <SelectItem value="yesterday">אתמול</SelectItem>
                            <SelectItem value="last_7d">7 ימים</SelectItem>
                            <SelectItem value="last_14d">14 ימים</SelectItem>
                            <SelectItem value="last_30d">30 ימים</SelectItem>
                            <SelectItem value="this_month">החודש</SelectItem>
                            <SelectItem value="last_month">חודש שעבר</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div className="text-sm text-red-800">
                            <p className="font-semibold">שגיאה בטעינת נתוני פייסבוק</p>
                            <p className="text-xs mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {loading && !accountData && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                {accountData && (
                    <>
                        <div className="mb-6">
                            <AdsOverviewCards insights={accountData} />
                        </div>

                        <Tabs defaultValue="campaigns" className="w-full">
                            <TabsList className="grid grid-cols-5 w-full">
                                <TabsTrigger value="campaigns">קמפיינים</TabsTrigger>
                                <TabsTrigger value="ads">מודעות</TabsTrigger>
                                <TabsTrigger value="alerts">
                                    התראות {alerts.length > 0 && <span className="mr-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">{alerts.length}</span>}
                                </TabsTrigger>
                                <TabsTrigger value="schedule">שעות</TabsTrigger>
                                <TabsTrigger value="copy">קופי AI</TabsTrigger>
                            </TabsList>
                            <TabsContent value="campaigns" className="mt-4">
                                <CampaignsTable campaigns={campaigns} onToggleStatus={toggleCampaignStatus} updatingId={updatingId} />
                            </TabsContent>
                            <TabsContent value="ads" className="mt-4">
                                <AdsList ads={ads} />
                            </TabsContent>
                            <TabsContent value="alerts" className="mt-4">
                                <SmartAlerts alerts={alerts} />
                            </TabsContent>
                            <TabsContent value="schedule" className="mt-4">
                                <ScheduleAnalysis datePreset={datePreset} />
                            </TabsContent>
                            <TabsContent value="copy" className="mt-4">
                                <CopyOptimizer ads={ads} />
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </CardContent>
        </Card>
    );
}