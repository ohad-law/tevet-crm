import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SmartAlerts({ alerts }) {
    if (!alerts || alerts.length === 0) {
        return (
            <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-6 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-green-900">כל המודעות פועלות תקין ✨</p>
                    <p className="text-sm text-green-700 mt-1">לא זוהו בעיות של שחיקה או תדירות גבוהה</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="bg-gradient-to-r from-red-50 to-amber-50 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    התראות חכמות ({alerts.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {alerts.map((alert, i) => (
                    <div 
                        key={i}
                        className={`border rounded-lg p-3 ${
                            alert.severity === 'critical' 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-amber-50 border-amber-200'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="font-semibold text-sm flex-1">{alert.ad_name}</p>
                            <Badge className={
                                alert.severity === 'critical' 
                                    ? 'bg-red-600 text-white border-0' 
                                    : 'bg-amber-500 text-white border-0'
                            }>
                                {alert.severity === 'critical' ? 'קריטי' : 'אזהרה'}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{alert.reason}</p>
                        <div className="bg-white/60 rounded p-2 text-xs">
                            <span className="font-semibold">המלצה:</span> {alert.action_recommended}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}