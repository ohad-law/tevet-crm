import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    CheckCircle2, Loader2, Shield, Phone, AlertTriangle, Clock, ArrowDown, Star, 
    BadgeCheck, Zap, TrendingUp, FileSearch, Scale, DollarSign, ChevronDown, 
    Award, Target, Sparkles, Upload, FileText, X, Eye, EyeOff, Lock, Unlock,
    ArrowRight, FileQuestion, Calculator, ShieldCheck, Gift, Banknote, Search,
    FileWarning, FileScan, FileCheck, Crosshair, Languages, Receipt, BadgeDollarSign
} from "lucide-react";

export default function TalushCheck() {
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        email: "",
        work_duration: "",
        workplace: "",
        job_role: "",
        employment_status: "",
        days_per_week: "",
        hours_per_day: "",
        salary_type: "",
        main_concern: "",
        source: "tiktok"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState(null);
    const [showCaseStudy, setShowCaseStudy] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.full_name || !formData.phone) {
            setError("אנא מלא שם מלא וטלפון");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Use backend function to create lead (works without auth)
            const response = await base44.functions.invoke("submitTalushLead", {
                ...formData,
                uploaded_files: uploadedFiles.length > 0 ? uploadedFiles : undefined
            });
            
            if (response.data?.success) {
                setIsComplete(true);
            } else {
                throw new Error(response.data?.error || "שגיאה בשליחה");
            }
        } catch (err) {
            console.error("Error submitting lead:", err);
            setError("אירעה שגיאה בשליחה. אנא נסה שוב.");
        }
        
        setIsSubmitting(false);
    };

    if (isComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
                <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">מעולה! קיבלנו את הפרטים</h1>
                    </div>
                    <CardContent className="p-8 text-center">
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
                            <h3 className="font-bold text-blue-900 mb-2">מה קורה עכשיו?</h3>
                            <p className="text-blue-700 text-sm">
                                הצוות שלנו יבצע <strong>בדיקה ראשונית חינמית</strong> של המקרה שלך.
                                אם נמצא שיש לך כסף לקבל - ניצור איתך קשר תוך 24 שעות.
                            </p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                            <p className="text-slate-800 font-medium mb-2">💡 שמור את המספר שלנו:</p>
                            <p className="text-slate-900 font-bold text-2xl">
                                <Phone className="w-5 h-5 inline ml-2" />
                                054-2274497
                            </p>
                            <p className="text-slate-500 text-xs mt-2">כדי שנוכל ליצור איתך קשר בוואטסאפ</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Case study data
    const caseStudyItems = [
        { label: "פיצויי פיטורין", amount: "230,951", color: "bg-blue-500" },
        { label: "אי מסירת תלושי שכר", amount: "145,000", color: "bg-red-500" },
        { label: "שעות נוספות 125%", amount: "71,293", color: "bg-orange-500" },
        { label: "תוספת ותק", amount: "47,121", color: "bg-purple-500" },
        { label: "פיטורין שלא כדין", amount: "30,000", color: "bg-pink-500" },
        { label: "שעות נוספות 150%", amount: "17,110", color: "bg-amber-500" },
        { label: "דמי הבראה", amount: "9,135", color: "bg-green-500" },
        { label: "הודעה מוקדמת", amount: "7,041", color: "bg-teal-500" },
        { label: "דמי חגים", amount: "6,806", color: "bg-cyan-500" },
    ];

    return (
        <div className="min-h-screen bg-slate-900" dir="rtl">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
                <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
                    {/* Law Firm Badge */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Scale className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-right">
                            <h2 className="text-white font-bold text-lg">משרד עורכי דין אוהד טבת</h2>
                            <p className="text-amber-400 text-sm font-medium">בודק שכר מוסמך מטעם משרד העבודה</p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                        <div className="bg-slate-800/60 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span className="text-slate-300 text-xs">+15 שנות ניסיון</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-slate-300 text-xs">ייצגנו מאות עובדים</span>
                        </div>
                    </div>

                    {/* Risk-Free Banner */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 text-center mb-8 max-w-lg mx-auto">
                        <span className="text-green-300 text-sm font-bold flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            🎁 בדיקה ראשונית 100% חינם - אנחנו לוקחים את כל הסיכון
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-center leading-tight mb-6">
                        <span className="text-white">התלוש שלך כתוב</span>
                        <span className="text-red-400"> בשפה שאתה לא מבין</span>
                        <br />
                        <span className="text-yellow-400">אנחנו נתרגם אותו לכסף.</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-slate-300 text-center max-w-2xl mx-auto mb-8">
                        המעסיק יודע בדיוק מה הוא עושה. <strong className="text-white">עכשיו גם אתה תדע.</strong>
                        <br />
                        <span className="text-green-400">בדיקה חינמית → אם מגיע לך כסף, נוציא אותו.</span>
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
                        <div className="text-center bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                            <div className="text-3xl font-black text-yellow-400">₪47K</div>
                            <div className="text-xs text-slate-400">ממוצע פיצויים</div>
                        </div>
                        <div className="text-center bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                            <div className="text-3xl font-black text-green-400">94%</div>
                            <div className="text-xs text-slate-400">אחוז הצלחה</div>
                        </div>
                        <div className="text-center bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                            <div className="text-3xl font-black text-blue-400">+500</div>
                            <div className="text-xs text-slate-400">לקוחות מרוצים</div>
                        </div>
                    </div>

                    {/* Professional Credentials */}
                    <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 rounded-xl p-4 max-w-2xl mx-auto mb-8">
                        <p className="text-slate-300 text-sm text-center leading-relaxed">
                            <strong className="text-white">משרד עורכי דין אוהד טבת</strong> מתמחה בייצוג עובדים בתביעות נגד מעסיקים. 
                            המשרד ייצג <strong className="text-green-400">מאות עובדים</strong> והצליח להשיג עבורם פיצויים בסכום כולל של 
                            <strong className="text-yellow-400"> מיליוני שקלים</strong>. 
                            עו״ד טבת הינו <strong className="text-amber-400">בודק שכר מוסמך</strong> מטעם משרד העבודה והרווחה.
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="text-center animate-bounce">
                        <ArrowDown className="w-8 h-8 text-yellow-400 mx-auto" />
                    </div>
                </div>
            </div>

            {/* Section 1: The "Black Box" Mechanism */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 rounded-full px-4 py-2 text-sm font-bold mb-4">
                            <FileScan className="w-4 h-4" />
                            איך זה עובד?
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            איך אנחנו <span className="text-red-400">מגלים אם חייבים לך כסף</span>
                        </h2>
                        <p className="text-slate-400 text-lg">
                            אנחנו לא רק "מסתכלים" על התלוש. אנחנו <strong className="text-white">בודקים כל שורה לעומק</strong> ומשווים אותה לחוק.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Input */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                                <FileQuestion className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">📥 שלב 1: שולחים לנו מסמכים</h3>
                            <p className="text-slate-400 text-sm mb-4">אנחנו לוקחים את <strong className="text-white">כל</strong> המסמכים שלך:</p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    תלושי שכר
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    דוחות נוכחות (101/106)
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    דוחות פנסיה וותק
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    הסכמים קיבוציים וצווי הרחבה
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    חוזה אישי
                                </li>
                            </ul>
                        </div>

                        {/* Process */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
                            <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                                <Crosshair className="w-7 h-7 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">⚙️ שלב 2: אנחנו בודקים</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                אנחנו <strong className="text-yellow-400">משווים</strong> כל מספר בתלוש למה שהחוק אומר:
                            </p>
                            <div className="space-y-3">
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">בדיקה #1</p>
                                    <p className="text-sm text-white">שעות בדוח נוכחות <span className="text-yellow-400">⇄</span> שעות בתלוש</p>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">בדיקה #2</p>
                                    <p className="text-sm text-white">תנאי התלוש <span className="text-yellow-400">⇄</span> החוק/צו הרחבה</p>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">בדיקה #3</p>
                                    <p className="text-sm text-white">זכויות בחוזה <span className="text-yellow-400">⇄</span> מה ששולם בפועל</p>
                                </div>
                            </div>
                        </div>

                        {/* Output */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition-all">
                            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                                <FileCheck className="w-7 h-7 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">📤 שלב 3: התוצאה</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                אנחנו מגלים את <strong className="text-red-400">הפער</strong> - ההפרש בין:
                            </p>
                            <div className="bg-gradient-to-r from-red-500/20 to-green-500/20 rounded-xl p-4 border border-slate-600">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-red-400 text-sm">מה ששולם</span>
                                    <span className="text-slate-400">VS</span>
                                    <span className="text-green-400 text-sm">מה שמגיע</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 mb-1">הפער הממוצע:</p>
                                    <p className="text-3xl font-black text-yellow-400">₪47,000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: The Translation Metaphor */}
            <div className="bg-gradient-to-b from-slate-800 to-blue-900 py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 rounded-full px-4 py-2 text-sm font-bold mb-4">
                            <Languages className="w-4 h-4" />
                            מה אנחנו עושים
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            תפסיק לנסות להבין את <span className="text-purple-400">התלוש</span>.
                            <br />
                            תתחיל לדעת <span className="text-green-400">כמה מגיע לך</span>.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Before - The Problem */}
                        <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <EyeOff className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-red-400">😵 לפני: סינית</h3>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-4 font-mono text-xs text-slate-400 mb-4 overflow-x-auto">
                                <p>שכר יסוד: 5,300 | גילום מס: 127.5</p>
                                <p>ש.נ 125%: 3.5 | ש.נ 150%: 0</p>
                                <p>ניכוי פנסיה עובד: 318 | הפרשה מעסיק: ???</p>
                                <p>דמי הבראה: 0 | ימי חופש: ???</p>
                            </div>
                            <p className="text-slate-400 text-sm">
                                בואו נהיה כנים - <strong className="text-red-400">אתה לא מבין מילה מהתלוש</strong>. 
                                ורוב האנשים גם לא. המעסיק מבין - ואתה לא.
                            </p>
                        </div>

                        {/* After - The Solution */}
                        <div className="bg-green-950/30 border border-green-500/30 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-green-400">✨ אחרי: שורה תחתונה</h3>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                                <p className="text-slate-400 text-sm mb-3">הדוח שלנו אומר בפשטות:</p>
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-center">
                                    <p className="text-green-100 text-sm mb-1">המעסיק חייב לך:</p>
                                    <p className="text-4xl font-black text-white">₪38,750</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">
                                אנחנו נותנים לך את <strong className="text-green-400">אותו הידע שיש לרואה החשבון של המעסיק</strong> - 
                                רק בשפה פשוטה שכל אחד מבין.
                            </p>
                        </div>
                    </div>

                    {/* Empowerment Message */}
                    <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">💪 עכשיו גם אתה תדע</h3>
                        <p className="text-slate-300">
                            עד היום, רק למעסיק היה את הידע. עכשיו <strong className="text-yellow-400">גם אתה תדע בדיוק מה מגיע לך</strong>.
                            <br />
                            ותוכל לדרוש את זה.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section: Who Is This For */}
            <div className="bg-gradient-to-b from-blue-900 to-slate-900 py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            🎯 למי זה <span className="text-yellow-400">מתאים</span>?
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column - Who it's for (Green) */}
                        <div className="bg-green-950/30 border-2 border-green-500/40 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-green-400">למי זה מתאים ועשוי להחזיר כסף?</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">לעובדים עם <strong className="text-white">ותק של שנה ומעלה</strong> לפחות (אפשר לבדוק כמה עבודות במקביל!)</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שמרגיש שהבוס <strong className="text-white">"עיגל פינות"</strong> בשעות נוספות, ובשאר הזכויות שלו</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שמוכן <strong className="text-white">להשקיע זמן וכסף</strong> כדי לגלות את האמת ולקבל את הזכויות שלו</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שמקבל תלוש ב-10 לחודש ו<strong className="text-white">מרגיש שמשהו בו לא תקין</strong></p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שמסתכל <strong className="text-white">רק על שורת הנטו</strong> כי אכפת לו רק מה שנכנס לחשבון הבנק</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Who it's NOT for (Red) */}
                        <div className="bg-red-950/30 border-2 border-red-500/40 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <X className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-red-400">למי אנחנו לא יכולים לעזור?</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שמחפש <strong className="text-white">"כסף קל"</strong> בלי תלושי שכר או הוכחות</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שלא מוכן להשקיע זמן וכסף, ולא מבין שבדיקה מקצועית <strong className="text-white">דורשת עבודה רצינית</strong></p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי ש<strong className="text-white">מפחד לקחת</strong> את מה שמגיע לו כחוק</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי ש<strong className="text-white">עבד פחות משנה</strong> ואין לו מספיק ותק לתביעה משמעותית</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-slate-200">למי שמעדיף <strong className="text-white">להמשיך לשתוק</strong> ולתת למעסיק להמשיך לנצל אותו</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Grand Slam Offer */}
            <div className="bg-gradient-to-b from-blue-900 to-slate-900 py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 rounded-full px-4 py-2 text-sm font-bold mb-4">
                            <Gift className="w-4 h-4" />
                            ההצעה שלנו
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            🛡️ אנחנו לוקחים <span className="text-yellow-400">100% מהסיכון</span>
                        </h2>
                        <p className="text-slate-300 text-lg">
                            אתה לא משלם שקל אחד עד שנוכיח שיש לך כסף לקבל.
                        </p>
                    </div>

                    {/* Two Scenarios */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Scenario A */}
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                תרחיש א׳
                            </div>
                            <div className="pt-4">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white text-center mb-3">הכל תקין? 👍</h3>
                                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                    <p className="text-slate-400 mb-2">אתה מקבל:</p>
                                    <p className="text-2xl font-bold text-green-400">שקט נפשי</p>
                                    <p className="text-green-300 text-lg font-bold mt-2">בחינם לגמרי</p>
                                </div>
                                <p className="text-slate-400 text-sm text-center mt-4">
                                    אם לא מצאנו שום הפרה - לא משלמים כלום. אפס. נאדה.
                                </p>
                            </div>
                        </div>

                        {/* Scenario B */}
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-br-lg">
                                תרחיש ב׳
                            </div>
                            <div className="pt-4">
                                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Banknote className="w-8 h-8 text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white text-center mb-3">מצאנו כסף? 💰</h3>
                                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                    <p className="text-slate-400 mb-2">רק אז משלמים:</p>
                                    <p className="text-2xl font-bold text-yellow-400">750₪ לשנת מס</p>
                                    <p className="text-slate-400 text-sm mt-2">עבור הדוח המפורט</p>
                                </div>
                                <p className="text-slate-400 text-sm text-center mt-4">
                                    הדוח יעזור לך לתבוע ולקבל את מה שמגיע לך (בממוצע ₪47,000).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-8 text-center">
                        <h3 className="text-2xl font-black text-white mb-4">
                            🎯 השורה התחתונה:
                        </h3>
                        <p className="text-xl text-slate-300 mb-6">
                            <strong className="text-yellow-400">אין לך מה להפסיד</strong> - רק עשרות אלפי שקלים להרוויח.
                        </p>
                        <div className="inline-flex items-center gap-4 bg-green-500/20 border border-green-500/30 rounded-xl px-6 py-3">
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                            <span className="text-green-300 font-bold">בדיקה ראשונית = 100% חינם</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Case Study Section */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div 
                        className="cursor-pointer"
                        onClick={() => setShowCaseStudy(!showCaseStudy)}
                    >
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Award className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-yellow-400 text-sm font-bold mb-1">📊 דוגמא אמיתית</div>
                                        <h3 className="text-2xl font-black text-white">עובד מוסך - 32 שנות עבודה</h3>
                                        <p className="text-slate-300 text-sm">לחץ לראות כמה כסף קיבל</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                                        ₪1,271,394
                                    </div>
                                    <div className="text-yellow-400/80 text-sm">סה״כ פיצויים</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center mt-4 text-yellow-400">
                                <ChevronDown className={`w-6 h-6 transition-transform ${showCaseStudy ? 'rotate-180' : ''}`} />
                                <span className="text-sm mr-2">{showCaseStudy ? 'הסתר פירוט' : 'הצג פירוט מלא'}</span>
                            </div>
                        </div>
                    </div>

                    {showCaseStudy && (
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
                            {/* Worker Profile */}
                            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <div className="text-slate-400 text-xs mb-1">תקופת העסקה</div>
                                        <div className="text-white font-bold">32.8 שנים</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs mb-1">שכר חודשי</div>
                                        <div className="text-white font-bold">₪7,316</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs mb-1">תחילת עבודה</div>
                                        <div className="text-white font-bold">01.01.1988</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs mb-1">סיום עבודה</div>
                                        <div className="text-white font-bold">30.11.2020</div>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                פירוט הפיצויים שנתבעו:
                            </h4>
                            <div className="grid gap-3">
                                {caseStudyItems.map((item, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                            <span className="text-slate-200">{item.label}</span>
                                        </div>
                                        <span className="text-white font-bold">₪{item.amount}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-center">
                                <div className="text-green-100 text-sm mb-1">סה״כ פיצויים שהתקבלו</div>
                                <div className="text-4xl font-black text-white">₪1,271,394</div>
                            </div>

                            <p className="text-center text-slate-400 text-sm mt-4">
                                * זהו מקרה אמיתי. הסכום תלוי בנסיבות האישיות של כל מקרה.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Section */}
            <div className="bg-gradient-to-b from-slate-100 to-white py-12 px-4">
                <div className="max-w-xl mx-auto">
                    {/* Form Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            בדיקה ראשונית 100% חינם
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            השאר פרטים - נגלה אם גנבו לך
                        </h2>
                        <p className="text-slate-600 text-sm">
                            אם הכל תקין = לא משלמים. אם מגיע לך כסף = נעזור לך לקבל אותו.
                        </p>
                    </div>

                    {/* The Form */}
                    <Card className="shadow-2xl border-0 overflow-hidden">
                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            שם מלא <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => handleChange("full_name", e.target.value)}
                                            placeholder="איך קוראים לך?"
                                            className="h-12 text-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            טלפון <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="050-0000000"
                                            className="h-12 text-lg"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Quick Question */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        מה המצב שלך?
                                    </label>
                                    <Select value={formData.employment_status} onValueChange={(v) => handleChange("employment_status", v)}>
                                        <SelectTrigger className="h-12 text-lg">
                                            <SelectValue placeholder="בחר את המצב שלך..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="פוטרתי">🔴 פוטרתי</SelectItem>
                                            <SelectItem value="התפטרתי">🟠 התפטרתי</SelectItem>
                                            <SelectItem value="שוקל להתפטר">🟡 שוקל להתפטר</SelectItem>
                                            <SelectItem value="עדיין עובד">🟢 עדיין עובד</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Work Duration */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        כמה זמן עבדת במקום?
                                    </label>
                                    <Input
                                        value={formData.work_duration}
                                        onChange={(e) => handleChange("work_duration", e.target.value)}
                                        placeholder="לדוגמה: שנתיים, 8 חודשים..."
                                        className="h-12"
                                    />
                                </div>

                                {/* Days & Hours */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            כמה ימים בשבוע עבדת?
                                        </label>
                                        <Select value={formData.days_per_week} onValueChange={(v) => handleChange("days_per_week", v)}>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="בחר..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 ימים</SelectItem>
                                                <SelectItem value="6">6 ימים</SelectItem>
                                                <SelectItem value="4">4 ימים</SelectItem>
                                                <SelectItem value="3">3 ימים או פחות</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            כמה שעות ביום עבדת?
                                        </label>
                                        <Select value={formData.hours_per_day} onValueChange={(v) => handleChange("hours_per_day", v)}>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="בחר..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="8">עד 8 שעות</SelectItem>
                                                <SelectItem value="9">9 שעות</SelectItem>
                                                <SelectItem value="10">10 שעות</SelectItem>
                                                <SelectItem value="11">11 שעות</SelectItem>
                                                <SelectItem value="12">12+ שעות</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Main Concern */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <label className="block text-sm font-bold text-yellow-800 mb-2">
                                        💰 מה הכי מטריד אותך?
                                    </label>
                                    <Textarea
                                        value={formData.main_concern}
                                        onChange={(e) => handleChange("main_concern", e.target.value)}
                                        placeholder="לא קיבלתי פיצויים... לא שילמו לי שעות נוספות... התלוש לא תואם למה שקיבלתי..."
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                {/* File Upload */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <label className="block text-sm font-bold text-blue-800 mb-2">
                                        📄 העלה תלושי שכר (אופציונלי - יזרז את הבדיקה)
                                    </label>
                                    <p className="text-blue-600 text-xs mb-3">העלה את התלושים האחרונים שלך ונוכל לבדוק מהר יותר</p>
                                    
                                    <div className="space-y-3">
                                        {uploadedFiles.length > 0 && (
                                            <div className="space-y-2">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-blue-100">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <label className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf,application/pdf"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    if (files.length === 0) return;
                                                    
                                                    setIsUploading(true);
                                                    try {
                                                        for (const file of files) {
                                                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                                            setUploadedFiles(prev => [...prev, { name: file.name, url: file_url }]);
                                                        }
                                                    } catch (err) {
                                                        console.error("Upload error:", err);
                                                    }
                                                    setIsUploading(false);
                                                    e.target.value = '';
                                                }}
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-blue-500" />
                                            )}
                                            <span className="text-blue-600 font-medium text-sm">
                                                {isUploading ? 'מעלה...' : 'לחץ להעלאת קבצים'}
                                            </span>
                                        </label>
                                        <p className="text-xs text-blue-500 text-center">PDF, JPG, PNG - עד 10MB לקובץ</p>
                                    </div>
                                </div>

                                {/* Optional fields */}
                                <details className="group">
                                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium list-none flex items-center gap-2">
                                        <span>+ הוסף פרטים נוספים (לא חובה)</span>
                                    </summary>
                                    <div className="mt-4 space-y-4 pt-4 border-t">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1">שם המעסיק</label>
                                                <Input
                                                    value={formData.workplace}
                                                    onChange={(e) => handleChange("workplace", e.target.value)}
                                                    placeholder="שם החברה"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1">תפקיד</label>
                                                <Input
                                                    value={formData.job_role}
                                                    onChange={(e) => handleChange("job_role", e.target.value)}
                                                    placeholder="מה עשית?"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">אימייל</label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                    </div>
                                </details>

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        {error}
                                    </div>
                                )}

                                {/* CTA Button */}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl shadow-green-200 rounded-xl"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-6 h-6 ml-2 animate-spin" />
                                            שולח...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5 ml-2" />
                                            בדקו בחינם אם גנבו לי כסף
                                        </>
                                    )}
                                </Button>

                                {/* Trust badges */}
                                <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        100% חינם
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        ללא התחייבות
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        סודיות מוחלטת
                                    </span>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Social Proof */}
                    <div className="mt-8 space-y-4">
                        <p className="text-center text-sm text-slate-500 font-medium">מה אומרים הלקוחות שלנו:</p>
                        
                        <div className="grid gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                                <div className="flex gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                                </div>
                                <p className="text-slate-700 text-sm mb-2">
                                    "חשבתי שהכל בסדר בתלוש שלי. הבדיקה הראשונית גילתה שמגיע לי <strong>38,000 ש״ח</strong> על שעות נוספות שלא שולמו!"
                                </p>
                                <p className="text-slate-500 text-xs">— מיכל ת., חיפה</p>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                                <div className="flex gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                                </div>
                                <p className="text-slate-700 text-sm mb-2">
                                    "פוטרתי אחרי 4 שנים. הם הצליבו את התלושים עם החוק ומצאו הפרות שלא ידעתי עליהן. קיבלתי הרבה יותר ממה שציפיתי."
                                </p>
                                <p className="text-slate-500 text-xs">— אמיר כ., תל אביב</p>
                            </div>
                        </div>
                    </div>

                    {/* Final urgency */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>
                                <strong>זכור:</strong> יש התיישנות על תביעות עבודה (עד 7 שנים). ככל שתפנה מוקדם יותר, תקבל יותר.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-sm">
                <p>© משרד עו״ד טבת | מומחים לדיני עבודה</p>
                <p className="mt-1">כל הזכויות שמורות</p>
            </div>
        </div>
    );
}