import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Video, Image as ImageIcon, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const getLeadCount = (actions) => {
    if (!actions) return 0;
    const lead = actions.find(a => 
        a.action_type === 'lead' || 
        a.action_type === 'offsite_conversion.fb_pixel_lead' ||
        a.action_type === 'onsite_conversion.lead_grouped'
    );
    return lead ? parseInt(lead.value) : 0;
};

const SeverityBadge = ({ severity }) => {
    const map = {
        critical: { cls: "bg-red-100 text-red-800", icon: AlertTriangle, label: "קריטי" },
        warning: { cls: "bg-amber-100 text-amber-800", icon: AlertTriangle, label: "אזהרה" },
        good: { cls: "bg-green-100 text-green-800", icon: CheckCircle2, label: "טוב" }
    };
    const m = map[severity] || map.good;
    const Icon = m.icon;
    return (
        <Badge className={`${m.cls} border-0 gap-1`}>
            <Icon className="w-3 h-3" />
            {m.label}
        </Badge>
    );
};

export default function AdsList({ ads }) {
    const [analyzing, setAnalyzing] = useState(null);
    const [analysis, setAnalysis] = useState({});

    const analyzeVideo = async (ad) => {
        setAnalyzing(ad.id);
        try {
            const { facebookAdsAI } = await import("@/functions/facebookAdsAI");
            const res = await facebookAdsAI({ action: 'analyze_video', data: { ad } });
            setAnalysis(prev => ({ ...prev, [ad.id]: res.data }));
        } catch (e) {
            console.error(e);
            alert("שגיאה בניתוח: " + e.message);
        }
        setAnalyzing(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ads.length === 0 && (
                <Card className="lg:col-span-2">
                    <CardContent className="p-8 text-center text-slate-500">
                        אין מודעות להצגה
                    </CardContent>
                </Card>
            )}
            {ads.map(ad => {
                const ins = ad.insights?.data?.[0] || {};
                const spend = parseFloat(ins.spend || 0);
                const leads = getLeadCount(ins.actions);
                const ctr = parseFloat(ins.ctr || 0);
                const frequency = parseFloat(ins.frequency || 0);
                const hasVideo = !!ad.creative?.video_id;
                const analysisData = analysis[ad.id];

                return (
                    <Card key={ad.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                {ad.creative?.thumbnail_url && (
                                    <img 
                                        src={ad.creative.thumbnail_url} 
                                        alt="" 
                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-semibold truncate">{ad.name}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs gap-1">
                                            {hasVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                            {hasVideo ? 'וידאו' : 'תמונה'}
                                        </Badge>
                                        {frequency > 3 && (
                                            <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
                                                תדירות {frequency.toFixed(1)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ad.creative?.body && (
                                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2 line-clamp-3">
                                    {ad.creative.body}
                                </p>
                            )}

                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-slate-50 rounded p-2">
                                    <p className="text-[10px] text-slate-500">הוצאה</p>
                                    <p className="text-sm font-bold">₪{spend.toFixed(0)}</p>
                                </div>
                                <div className="bg-slate-50 rounded p-2">
                                    <p className="text-[10px] text-slate-500">CTR</p>
                                    <p className="text-sm font-bold">{ctr.toFixed(2)}%</p>
                                </div>
                                <div className="bg-slate-50 rounded p-2">
                                    <p className="text-[10px] text-slate-500">קליקים</p>
                                    <p className="text-sm font-bold">{ins.clicks || 0}</p>
                                </div>
                                <div className="bg-green-50 rounded p-2">
                                    <p className="text-[10px] text-slate-500">לידים</p>
                                    <p className="text-sm font-bold text-green-700">{leads}</p>
                                </div>
                            </div>

                            {hasVideo && !analysisData && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full gap-2"
                                    onClick={() => analyzeVideo(ad)}
                                    disabled={analyzing === ad.id}
                                >
                                    {analyzing === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    נתח ביצועי וידאו עם AI
                                </Button>
                            )}

                            {analysisData && (
                                <div className="border-t pt-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-700">ניתוח וידאו AI</span>
                                        <SeverityBadge severity={analysisData.ai?.severity || 'good'} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-blue-50 rounded p-2">
                                            <p className="text-slate-500">Thumb-stop</p>
                                            <p className="font-bold text-blue-700">{analysisData.metrics.thumb_stop_rate.toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-purple-50 rounded p-2">
                                            <p className="text-slate-500">Hold rate</p>
                                            <p className="font-bold text-purple-700">{analysisData.metrics.hold_rate.toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-amber-50 rounded p-2">
                                            <p className="text-slate-500">צפייה ממוצעת</p>
                                            <p className="font-bold text-amber-700">{analysisData.metrics.avg_watch_seconds}s</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                                        <p className="font-semibold text-red-900">נקודת נטישה:</p>
                                        <p className="text-red-700">{analysisData.metrics.drop_off_point}</p>
                                    </div>
                                    {analysisData.ai?.diagnosis && (
                                        <div className="bg-slate-50 rounded-lg p-2 text-xs">
                                            <p className="font-semibold text-slate-700 mb-1">אבחנה:</p>
                                            <p className="text-slate-600">{analysisData.ai.diagnosis}</p>
                                        </div>
                                    )}
                                    {analysisData.ai?.recommendations?.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="font-semibold text-xs text-slate-700">המלצות:</p>
                                            {analysisData.ai.recommendations.map((r, i) => (
                                                <div key={i} className="flex gap-2 text-xs">
                                                    <span className="text-blue-600 font-bold">{i+1}.</span>
                                                    <span className="text-slate-600">{r}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}