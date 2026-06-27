import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MissingExpensesAlert({ year = "2025" }) {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadAnalysis = async () => {
        setIsLoading(true);
        try {
            const res = await base44.functions.invoke("scanExpense", {
                action: "analyze-missing",
                year
            });
            if (res.data) {
                setAnalysis(res.data);
            }
        } catch (error) {
            console.error("Failed to analyze:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadAnalysis();
    }, [year]);

    if (isLoading) {
        return (
            <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-6 text-center text-amber-700">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    מנתח הוצאות...
                </CardContent>
            </Card>
        );
    }

    if (!analysis) return null;

    const hasMissing = analysis.missingCategories?.length > 0;
    const hasLow = analysis.lowCategories?.length > 0;

    if (!hasMissing && !hasLow && !analysis.suggestions?.length) {
        return (
            <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">✓</span>
                    </div>
                    <div>
                        <p className="font-medium text-green-800">מצוין!</p>
                        <p className="text-sm text-green-600">כל הקטגוריות הנפוצות מכילות הוצאות</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                    <AlertTriangle className="w-5 h-5" />
                    התראות הוצאות חסרות
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Missing Categories */}
                {hasMissing && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            קטגוריות ללא הוצאות השנה:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {analysis.missingCategories.map(cat => (
                                <Badge key={cat} variant="outline" className="bg-white text-amber-700 border-amber-300">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Low Categories */}
                {hasLow && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-orange-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            קטגוריות עם מעט הוצאות:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {analysis.lowCategories.map(item => (
                                <Badge key={item.name} variant="outline" className="bg-white text-orange-700 border-orange-300">
                                    {item.name} ({item.count} בלבד)
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions?.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            המלצות:
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1">
                            {analysis.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-500">•</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAnalysis}
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    רענן ניתוח
                </Button>
            </CardContent>
        </Card>
    );
}