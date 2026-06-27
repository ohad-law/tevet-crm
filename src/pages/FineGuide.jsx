import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, FileText, Phone, CheckCircle, AlertTriangle, Scale } from "lucide-react";
import { motion } from "framer-motion";

export default function FineGuide() {
  const tips = [
    {
      icon: Clock,
      title: "אל תתעלם מהקנס - יש לך זמן מוגבל",
      description: "ברגע שמקבלים קנס ממשרד העבודה, יש חלון זמן של 30-45 יום להגיש ערר או לשלם. התעלמות מהקנס יכולה להוביל להכפלת הסכום, ריביות, ואפילו הליכי גבייה מנהליים. חשוב לפעול מהר!",
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50",
      iconColor: "#ef4444"
    },
    {
      icon: FileText,
      title: "לא כל קנס הוא סופי - אפשר לערער",
      description: "רוב בעלי העסקים לא יודעים שאפשר להגיש ערר על קנסות ממשרד העבודה. במקרים רבים, עם ייצוג מקצועי וטיעונים נכונים, ניתן להפחית משמעותית את גובה הקנס או אפילו לבטל אותו לחלוטין.",
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      iconColor: "#3b82f6"
    },
    {
      icon: Shield,
      title: "עורך דין מומחה יכול לחסוך לך אלפי שקלים",
      description: "קנסות ממשרד העבודה יכולים להגיע לעשרות אלפי שקלים. עורך דין שמתמחה בדיני עבודה מכיר את הפרצות, יודע אילו טענות עובדות, ויכול לחסוך לך הרבה יותר מעלות הייצוג. זו השקעה שמחזירה את עצמה.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "#22c55e"
    }
  ];

  const handleContact = () => {
    window.open("https://wa.me/972XXXXXXXXX?text=היי, קיבלתי קנס ממשרד העבודה ואשמח לייעוץ", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" />
              מדריך חינמי לבעלי עסקים
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              קיבלת קנס ממשרד העבודה?
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                3 דברים שחייבים לדעת
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              לפני שאתה משלם או מתעלם - קרא את המדריך הקצר הזה שיכול לחסוך לך אלפי שקלים
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 -mt-8">
        <div className="space-y-6">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className={`w-full md:w-2 bg-gradient-to-b ${tip.color}`}></div>
                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${tip.bgColor} shrink-0`}>
                          <tip.icon className="w-6 h-6" style={{color: tip.iconColor}} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${tip.color} text-white`}>
                              טיפ #{index + 1}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-3">
                            {tip.title}
                          </h3>
                          <p className="text-slate-600 leading-relaxed">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="max-w-4xl mx-auto px-6 py-12"
      >
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scale className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              רוצה לבדוק אם אפשר להפחית או לבטל את הקנס?
            </h2>
            
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              השאר פרטים ונחזור אליך תוך 24 שעות עם הערכה ראשונית - ללא עלות וללא התחייבות
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleContact}
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 rounded-xl shadow-lg"
              >
                <Phone className="w-5 h-5 ml-2" />
                דברו איתי בווטסאפ
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ייעוץ ראשוני חינם
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                מענה תוך 24 שעות
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                בלי התחייבות
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-8 text-slate-500 text-sm">
        <p>© כל הזכויות שמורות | המידע במדריך זה הוא כללי ואינו מהווה ייעוץ משפטי</p>
      </div>
    </div>
  );
}