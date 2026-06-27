import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp, Clock, Layers } from "lucide-react";

export default function BusinessKnowledge() {
  const departments = [
    {
      name: "עובדים זרים",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "👥",
      data: {
        avgFee: "4,095 ₪",
        cost: "300 ₪",
        netProfit: "4,065 ₪",
        closingTime: "7-8 חודשים",
        capacity: "20-30 תיקים",
        profitPerMonth: "~580 ₪"
      }
    },
    {
      name: "חדלות פירעון",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: "🏢",
      data: {
        avgFee: "60,000 ₪",
        range: "30,000-150,000 ₪",
        closingTime: "12-18 חודשים",
        capacity: "3-5 תיקים",
        profitPerMonth: "~4,000 ₪"
      }
    },
    {
      name: "דיני עבודה - תביעה",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "⚖️",
      data: {
        avgFee: "25,000 ₪",
        range: "10,000-80,000 ₪",
        closingTime: "6-12 חודשים",
        capacity: "10-15 תיקים",
        profitPerMonth: "~2,800 ₪"
      }
    }
  ];

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          מאגר ידע עסקי
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {departments.map((dept, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${dept.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{dept.icon}</span>
                <h3 className="font-bold text-lg">{dept.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">שכ"ט ממוצע</p>
                  <p className="font-bold">{dept.data.avgFee}</p>
                </div>
                
                {dept.data.range && (
                  <div>
                    <p className="text-gray-600 text-xs">טווח</p>
                    <p className="font-semibold text-xs">{dept.data.range}</p>
                  </div>
                )}
                
                {dept.data.cost && (
                  <div>
                    <p className="text-gray-600 text-xs">עלות תיק</p>
                    <p className="font-bold">{dept.data.cost}</p>
                  </div>
                )}
                
                {dept.data.netProfit && (
                  <div>
                    <p className="text-gray-600 text-xs">רווח נקי</p>
                    <p className="font-bold text-green-700">{dept.data.netProfit}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-600 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    זמן סגירה
                  </p>
                  <p className="font-semibold">{dept.data.closingTime}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-xs flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    נפח מקסימלי
                  </p>
                  <p className="font-semibold">{dept.data.capacity}</p>
                </div>
                
                {dept.data.profitPerMonth && (
                  <div className="col-span-2">
                    <p className="text-gray-600 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      רווח חודשי ממוצע לתיק
                    </p>
                    <p className="font-bold text-green-600">{dept.data.profitPerMonth}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-gray-700 font-medium mb-2">💡 עצה:</p>
          <p className="text-xs text-gray-600">
            תמהיל מאוזן: 15 תיקי עובדים זרים (~60K/חודש) + 3 תיקי חדלות פירעון (~180K/חודש) + 8 תיקי דיני עבודה (~185K/חודש) = ~425K/חודש
          </p>
        </div>
      </CardContent>
    </Card>
  );
}