import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateViralScript } from "@/functions/generateViralScript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, X, Copy, Save } from "lucide-react";
import { toast } from "sonner";

export default function ScriptGenerator({ script, onClose, onSuccess }) {
    const [idea, setIdea] = useState(script?.initial_idea || "");
    const [platform, setPlatform] = useState(script?.platform || "TikTok");
    const [targetAudience, setTargetAudience] = useState(script?.target_audience || "");
    const [contentType, setContentType] = useState(script?.content_category || "חינוכי");
    const [duration, setDuration] = useState(script?.estimated_duration || 60);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedScript, setGeneratedScript] = useState(script || null);

    const handleGenerate = async () => {
        if (!idea.trim()) {
            toast.error("יש להזין רעיון");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await generateViralScript({
                idea,
                platform,
                targetAudience,
                contentType,
                duration
            });

            setGeneratedScript(response.data.script);
            toast.success("הסקריפט נוצר בהצלחה! ✨");
        } catch (error) {
            toast.error("שגיאה ביצירת הסקריפט");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            const scriptData = {
                title: generatedScript.hook.substring(0, 100),
                initial_idea: idea,
                platform,
                target_audience: targetAudience,
                content_category: contentType,
                hook: generatedScript.hook,
                cta: generatedScript.cta,
                full_script: generatedScript.full_script,
                visual_notes: generatedScript.visual_notes,
                estimated_duration: duration,
                status: 'סקריפט מוכן',
                ai_generated: true,
                hook_template_used: generatedScript.hook_template
            };

            if (script?.id) {
                await base44.entities.VideoScript.update(script.id, scriptData);
                toast.success("הסקריפט עודכן!");
            } else {
                await base44.entities.VideoScript.create(scriptData);
                toast.success("הסקריפט נשמר!");
            }
            
            onSuccess();
        } catch (error) {
            toast.error("שגיאה בשמירה");
            console.error(error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("הועתק!");
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-white" />
                        <h2 className="text-2xl font-bold text-white">יוצר סקריפטים ויראליים</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Input Section */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">הרעיון שלך</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>מה הרעיון לסרטון?</Label>
                                        <Textarea
                                            value={idea}
                                            onChange={(e) => setIdea(e.target.value)}
                                            placeholder="למשל: אני רוצה להסביר איך לבדוק אם יש לך זכויות לפיצויי פיטורין..."
                                            className="h-32 mt-2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>פלטפורמה</Label>
                                            <Select value={platform} onValueChange={setPlatform}>
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                                    <SelectItem value="Instagram Reel">Instagram Reel</SelectItem>
                                                    <SelectItem value="Instagram Story">Instagram Story</SelectItem>
                                                    <SelectItem value="YouTube Short">YouTube Short</SelectItem>
                                                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>אורך (שניות)</Label>
                                            <Input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>סוג תוכן</Label>
                                        <Select value={contentType} onValueChange={setContentType}>
                                            <SelectTrigger className="mt-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="חינוכי">חינוכי</SelectItem>
                                                <SelectItem value="סיפור אישי">סיפור אישי</SelectItem>
                                                <SelectItem value="טיפ מקצועי">טיפ מקצועי</SelectItem>
                                                <SelectItem value="השוואה">השוואה</SelectItem>
                                                <SelectItem value="שבירת מיתוס">שבירת מיתוס</SelectItem>
                                                <SelectItem value="יום בחיים">יום בחיים</SelectItem>
                                                <SelectItem value="אוטוריטה">אוטוריטה</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>קהל יעד (אופציונלי)</Label>
                                        <Input
                                            value={targetAudience}
                                            onChange={(e) => setTargetAudience(e.target.value)}
                                            placeholder="למשל: עובדים שפוטרו לאחרונה"
                                            className="mt-2"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !idea.trim()}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                                יוצר קסם...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 ml-2" />
                                                צור סקריפט ויראלי
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Generated Script Section */}
                        <div>
                            {generatedScript ? (
                                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl">הסקריפט שלך 🎬</CardTitle>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(generatedScript.full_script)}
                                                >
                                                    <Copy className="w-4 h-4 ml-2" />
                                                    העתק
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleSave}
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Save className="w-4 h-4 ml-2" />
                                                    שמור
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                            <ScriptSection
                                            title="🎯 HOOK - פתיחה"
                                            content={generatedScript.hook}
                                            color="red"
                                        />
                                        {generatedScript.main_points && (
                                            <ScriptSection
                                                title="📝 נקודות עיקריות"
                                                content={generatedScript.main_points}
                                                color="blue"
                                            />
                                        )}
                                        <ScriptSection
                                            title="📣 CTA - סיום"
                                            content={generatedScript.cta}
                                            color="green"
                                        />

                                        {generatedScript.visual_notes && (
                                            <div className="bg-slate-100 rounded-xl p-4 mt-4">
                                                <h4 className="font-bold text-sm text-slate-700 mb-2">🎥 הנחיות צילום:</h4>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{generatedScript.visual_notes}</p>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                                            <h4 className="font-bold mb-3">📜 הסקריפט המלא:</h4>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{generatedScript.full_script}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-dashed border-2 bg-gray-50">
                                    <CardContent className="p-12 text-center">
                                        <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500">הזן רעיון ולחץ על "צור סקריפט"</p>
                                        <p className="text-gray-400 text-sm mt-2">ה-AI ייצור עבורך סקריפט ויראלי מושלם</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScriptSection({ title, content, color }) {
    const colorClasses = {
        red: "bg-red-50 border-red-200",
        orange: "bg-orange-50 border-orange-200",
        yellow: "bg-yellow-50 border-yellow-200",
        blue: "bg-blue-50 border-blue-200",
        green: "bg-green-50 border-green-200",
        purple: "bg-purple-50 border-purple-200",
        pink: "bg-pink-50 border-pink-200"
    };

    return (
        <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
            <h4 className="font-bold text-sm mb-1">{title}</h4>
            <p className="text-sm leading-relaxed">{content}</p>
        </div>
    );
}