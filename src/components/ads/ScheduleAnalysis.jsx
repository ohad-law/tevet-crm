import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { facebookAdsFetch } from "@/functions/facebookAdsFetch";
import { facebookAdsAI } from "@/functions/facebookAdsAI";

export default function ScheduleAnalysis({ datePreset }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const fetchRes = await facebookAdsFetch({ action: 'hourly_breakdown', date_preset: datePreset });
            const aiRes = await facebookAdsAI({ 
                action: 'schedule_optimization', 
                data: { hourly: fetchRes.data.hourly } 
            });
            setResult(aiRes.data);
        } catch (e) {
            console.error(e);
            alert("שגיאה: " + e.message);
        }
        setLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    אופטימיזציית זמן (Ad Scheduling)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!result && (
                    <Button onClick={runAnalysis} disabled={loading} className="w-full gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        הרץ ניתוח שעות פעילות
                    </Button>
                )}

                {result && (
                    <div className="space-y-4">
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={result.hours_data.sort((a,b) => parseInt(a.hour) - parseInt(b.hour))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="cpl" fill="#3b82f6" name="עלות לליד" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <p className="font-semibold text-sm text-green-900">שעות הטובות ביותר</p>
                                </div>
                                {result.ai?.best_windows?.map((w, i) => (
                                    <p key={i} className="text-xs text-green-800">• {w}</p>
                                ))}
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                    <p className="font-semibold text-sm text-red-900">שעות להימנע</p>
                                </div>
                                {result.ai?.avoid_windows?.map((w, i) => (
                                    <p key={i} className="text-xs text-red-800">• {w}</p>
                                ))}
                            </div>
                        </div>

                        {result.ai?.recommendation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="font-semibold text-sm text-blue-900 mb-1">המלצה כללית:</p>
                                <p className="text-sm text-blue-800">{result.ai.recommendation}</p>
                            </div>
                        )}

                        <Button onClick={runAnalysis} variant="outline" size="sm" className="w-full">
                            רענן ניתוח
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}