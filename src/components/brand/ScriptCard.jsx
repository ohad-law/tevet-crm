import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit2, Trash2, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function ScriptCard({ script, onEdit }) {
    const statusColors = {
        'רעיון': 'bg-gray-100 text-gray-800',
        'סקריפט מוכן': 'bg-green-100 text-green-800',
        'בצילום': 'bg-blue-100 text-blue-800',
        'בעריכה': 'bg-yellow-100 text-yellow-800',
        'פורסם': 'bg-purple-100 text-purple-800'
    };

    const platformColors = {
        'TikTok': 'bg-black text-white',
        'Instagram Reel': 'bg-pink-500 text-white',
        'Instagram Story': 'bg-orange-500 text-white',
        'YouTube Short': 'bg-red-500 text-white',
        'LinkedIn': 'bg-blue-700 text-white'
    };

    const handleDelete = async () => {
        if (confirm('למחוק סקריפט זה?')) {
            try {
                await base44.entities.VideoScript.delete(script.id);
                toast.success("נמחק");
            } catch (error) {
                toast.error("שגיאה במחיקה");
            }
        }
    };

    return (
        <Card className="hover:shadow-xl transition-all duration-300 bg-white border-l-4 border-purple-500">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={platformColors[script.platform]}>
                                {script.platform}
                            </Badge>
                            <Badge className={statusColors[script.status]}>
                                {script.status}
                            </Badge>
                            {script.ai_generated && (
                                <Badge variant="outline" className="gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    AI
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg leading-tight">
                            {script.title || script.hook?.substring(0, 80) + '...'}
                        </CardTitle>
                        {script.initial_idea && (
                            <p className="text-sm text-gray-500 mt-2">
                                💡 {script.initial_idea.substring(0, 120)}...
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onEdit}
                            className="text-purple-600 hover:bg-purple-50"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleDelete}
                            className="text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {script.hook && (
                <CardContent>
                    <div className="space-y-3">
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-200">
                            <div className="text-xs font-bold text-red-700 mb-1">🎯 HOOK</div>
                            <div className="text-sm font-medium">{script.hook}</div>
                        </div>

                        {script.full_script && (
                            <details className="bg-gray-50 rounded-lg p-3">
                                <summary className="text-sm font-bold cursor-pointer text-gray-700">
                                    📜 צפה בסקריפט המלא
                                </summary>
                                <div className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">
                                    {script.full_script}
                                </div>
                            </details>
                        )}

                        {script.performance_metrics && (
                            <div className="flex gap-3 text-xs text-gray-600">
                                <span>👁️ {script.performance_metrics.views?.toLocaleString()} צפיות</span>
                                <span>❤️ {script.performance_metrics.likes?.toLocaleString()}</span>
                                <span>💬 {script.performance_metrics.comments?.toLocaleString()}</span>
                            </div>
                        )}

                        {script.published_url && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(script.published_url, '_blank')}
                                className="w-full"
                            >
                                <ExternalLink className="w-4 h-4 ml-2" />
                                צפה בסרטון שפורסם
                            </Button>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}