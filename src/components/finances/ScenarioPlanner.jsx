
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/utils/formatters";

export default function ScenarioPlanner() {
  const scenarios = [
    {
      name: "שמרני - נפח גבוה",
      icon: "🐢",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-900",
      mix: {
        foreign: 25,
        bankruptcy: 1,
        labor: 5
      },
      results: {
        monthly: 101625,
        workload: "גבוה",
        risk: "נמוך",
        time: "8-9 חודשים"
      }
    },
    {
      name: "מאוזן - תמהיל מגוון",
      icon: "⚖️",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-900",
      mix: {
        foreign: 15,
        bankruptcy: 3,
        labor: 8
      },
      results: {
        monthly: 440975,
        workload: "בינוני",
        risk: "בינוני",
        time: "9-12 חודשים"
      }
    },
    {
      name: "אגרסיבי - רווחיות גבוהה",
      icon: "🚀",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-900",
      mix: {
        foreign: 10,
        bankruptcy: 5,
        labor: 5
      },
      results: {
        monthly: 465625,
        workload: "בינוני-נמוך",
        risk: "גבוה",
        time: "12-15 חודשים"
      }
    }
  ];

  const getWorkloadColor = (workload) => {
    if (workload === "גבוה") return "bg-red-100 text-red-800";
    if (workload === "בינוני") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getRiskColor = (risk) => {
    if (risk === "גבוה") return "bg-red-100 text-red-800";
    if (risk === "בינוני") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          תרחישי עבודה - השוואה
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4">
          {scenarios.map((scenario, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${scenario.color}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{scenario.icon}</span>
                  <h3 className={`font-bold ${scenario.textColor}`}>{scenario.name}</h3>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(scenario.results.monthly)}
                  </p>
                  <p className="text-xs text-gray-600">חודשי</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div className="bg-white/50 p-2 rounded">
                  <p className="text-xs text-gray-600">עובדים זרים</p>
                  <p className="font-bold">{scenario.mix.foreign} תיקים</p>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <p className="text-xs text-gray-600">חדלות פירעון</p>
                  <p className="font-bold">{scenario.mix.bankruptcy} תיקים</p>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <p className="text-xs text-gray-600">דיני עבודה</p>
                  <p className="font-bold">{scenario.mix.labor} תיקים</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getWorkloadColor(scenario.results.workload)}>
                  עומס: {scenario.results.workload}
                </Badge>
                <Badge className={getRiskColor(scenario.results.risk)}>
                  סיכון: {scenario.results.risk}
                </Badge>
                <Badge variant="outline">
                  זמן: {scenario.results.time}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            המלצת המערכת
          </p>
          <p className="text-xs text-blue-800">
            התחל בתרחיש המאוזן, צבור ניסיון ב-6 חודשים הראשונים, ולאחר מכן התאם את התמהיל לפי הביקוש והיכולות.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
