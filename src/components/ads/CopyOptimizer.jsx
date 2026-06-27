import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PenLine, Sparkles, Copy, CheckCheck } from "lucide-react";
import { facebookAdsAI } from "@/functions/facebookAdsAI";

export default function CopyOptimizer({ ads }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(null);

    const generateVariations = async () => {
        // Pick top 3 ads by CTR
        const topAds = [...ads]
            .filter(a => a.creative?.body && a.insights?.data?.[0]?.ctr)
            .sort((a, b) => parseFloat(b.insights.data[0].ctr) - parseFloat(a.insights.data[0].ctr))
            .slice(0, 3);

        if (topAds.length === 0) {
            alert("אין מספיק נתונים - צריך לפחות מודעה אחת עם קופי ונתוני CTR");
            return;
        }

        setLoading(true);
        try {
            const res = await facebookAdsAI({ 
                action: 'copy_variations', 
                data: { winning_ads: topAds } 
            });
            setResult(res.data);
        } catch (e) {
            console.error(e);
            alert("שגיאה: " + e.message);
        }
        setLoading(false);
    };

    const copyToClipboard = (text, i) => {
        navigator.clipboard.writeText(text);
        setCopied(i);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-purple-600" />
                    AI Copywriting & A/B Test
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!result && (
                    <>
                        <p className="text-sm text-slate-600">
                            ה-AI ינתח את המודעות עם ה-CTR הגבוה ביותר, יזהה את התבניות הפסיכולוגיות שעובדות,
                            ויציע 3 גרסאות חדשות לבדיקת A/B.
                        </p>
                        <Button onClick={generateVariations} disabled={loading} className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            צור 3 גרסאות חדשות
                        </Button>
                    </>
                )}

                {result && (
                    <>
                        {result.patterns_identified?.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="font-semibold text-sm text-purple-900 mb-2">תבניות פסיכולוגיות שזוהו:</p>
                                <div className="flex flex-wrap gap-1">
                                    {result.patterns_identified.map((p, i) => (
                                        <Badge key={i} className="bg-white text-purple-700 border border-purple-300">{p}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {result.variations?.map((v, i) => (
                                <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-blue-100 text-blue-800 border-0">גרסה {i+1}: {v.angle}</Badge>
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => copyToClipboard(`${v.title}\n\n${v.body}\n\n${v.cta}`, i)}
                                        >
                                            {copied === i ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">כותרת:</p>
                                        <p className="font-semibold text-sm">{v.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">גוף:</p>
                                        <p className="text-sm whitespace-pre-wrap">{v.body}</p>
                                    </div>
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-slate-500 mb-1">CTA:</p>
                                        <p className="font-semibold text-sm text-blue-600">{v.cta}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={generateVariations} variant="outline" size="sm" className="w-full">
                            צור גרסאות נוספות
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}