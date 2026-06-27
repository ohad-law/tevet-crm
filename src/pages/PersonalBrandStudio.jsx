import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Video, TrendingUp, Zap, Plus, Eye, Edit2 } from "lucide-react";
import ScriptGenerator from "@/components/brand/ScriptGenerator";
import ScriptCard from "@/components/brand/ScriptCard";

export default function PersonalBrandStudio() {
    const [showGenerator, setShowGenerator] = useState(false);
    const [editingScript, setEditingScript] = useState(null);
    const queryClient = useQueryClient();

    const { data: scripts = [], isLoading } = useQuery({
        queryKey: ['video-scripts'],
        queryFn: () => base44.entities.VideoScript.list('-created_date', 100),
    });

    const stats = {
        total: scripts.length,
        ready: scripts.filter(s => s.status === 'סקריפט מוכן').length,
        published: scripts.filter(s => s.status === 'פורסם').length,
        ideas: scripts.filter(s => s.status === 'רעיון').length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-12" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Hero Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold">Personal Brand Studio</h1>
                                    <p className="text-purple-100 mt-1">מכונת יצירת תוכן ויראלי מבוססת AI</p>
                                </div>
                            </div>
                            <p className="text-white/90 text-lg max-w-2xl">
                                המערכת המתקדמת בעולם להפיכת רעיונות לסקריפטים ויראליים שמייצרים מיליוני צפיות
                            </p>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => {
                                setEditingScript(null);
                                setShowGenerator(true);
                            }}
                            className="bg-white text-purple-600 hover:bg-purple-50 shadow-xl h-14 px-8"
                        >
                            <Plus className="w-5 h-5 ml-2" />
                            רעיון חדש
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                            <div className="text-3xl font-bold">{stats.total}</div>
                            <div className="text-white/80 text-sm">סה"כ סקריפטים</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                            <div className="text-3xl font-bold">{stats.ready}</div>
                            <div className="text-white/80 text-sm">מוכנים לצילום</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                            <div className="text-3xl font-bold">{stats.published}</div>
                            <div className="text-white/80 text-sm">פורסמו</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                            <div className="text-3xl font-bold">{stats.ideas}</div>
                            <div className="text-white/80 text-sm">רעיונות</div>
                        </div>
                    </div>
                </div>

                {/* Script Generator Modal */}
                {showGenerator && (
                    <ScriptGenerator
                        script={editingScript}
                        onClose={() => {
                            setShowGenerator(false);
                            setEditingScript(null);
                        }}
                        onSuccess={() => {
                            queryClient.invalidateQueries(['video-scripts']);
                            setShowGenerator(false);
                            setEditingScript(null);
                        }}
                    />
                )}

                {/* Scripts Tabs */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="bg-white shadow-lg h-14">
                        <TabsTrigger value="all" className="text-base">
                            הכל ({stats.total})
                        </TabsTrigger>
                        <TabsTrigger value="ideas" className="text-base">
                            רעיונות ({stats.ideas})
                        </TabsTrigger>
                        <TabsTrigger value="ready" className="text-base">
                            מוכנים ({stats.ready})
                        </TabsTrigger>
                        <TabsTrigger value="published" className="text-base">
                            פורסם ({stats.published})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-6">
                        <ScriptsList 
                            scripts={scripts} 
                            onEdit={(script) => {
                                setEditingScript(script);
                                setShowGenerator(true);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="ideas" className="mt-6">
                        <ScriptsList 
                            scripts={scripts.filter(s => s.status === 'רעיון')}
                            onEdit={(script) => {
                                setEditingScript(script);
                                setShowGenerator(true);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="ready" className="mt-6">
                        <ScriptsList 
                            scripts={scripts.filter(s => s.status === 'סקריפט מוכן')}
                            onEdit={(script) => {
                                setEditingScript(script);
                                setShowGenerator(true);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="published" className="mt-6">
                        <ScriptsList 
                            scripts={scripts.filter(s => s.status === 'פורסם')}
                            onEdit={(script) => {
                                setEditingScript(script);
                                setShowGenerator(true);
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ScriptsList({ scripts, onEdit }) {
    if (scripts.length === 0) {
        return (
            <Card className="bg-white/50 backdrop-blur-xl border-dashed border-2">
                <CardContent className="p-12 text-center">
                    <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">אין סקריפטים עדיין</p>
                    <p className="text-gray-400 text-sm">התחל עם רעיון חדש</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {scripts.map(script => (
                <ScriptCard 
                    key={script.id} 
                    script={script}
                    onEdit={() => onEdit(script)}
                />
            ))}
        </div>
    );
}