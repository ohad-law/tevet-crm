
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/utils/formatters";

export default function InteractiveMixCalculator() {
  const [mix, setMix] = useState({
    foreign: 0,
    bankruptcy: 0,
    labor: 0
  });

  const profiles = {
    foreign: { profit: 4065, time: 7.5, capacity: 30, monthlyProfit: 542 },
    bankruptcy: { profit: 60000, time: 15, capacity: 5, monthlyProfit: 4000 },
    labor: { profit: 25000, time: 9, capacity: 15, monthlyProfit: 2778 }
  };

  const calculateResults = () => {
    const monthlyRevenue = 
      (mix.foreign * profiles.foreign.monthlyProfit) +
      (mix.bankruptcy * profiles.bankruptcy.monthlyProfit) +
      (mix.labor * profiles.labor.monthlyProfit);

    const totalCases = mix.foreign + mix.bankruptcy + mix.labor;
    
    const capacityUsage = 
      (mix.foreign / profiles.foreign.capacity) +
      (mix.bankruptcy / profiles.bankruptcy.capacity) +
      (mix.labor / profiles.labor.capacity);

    const isRealistic = capacityUsage <= 1;
    
    const avgClosingTime = totalCases > 0 
      ? ((mix.foreign * profiles.foreign.time) + 
         (mix.bankruptcy * profiles.bankruptcy.time) + 
         (mix.labor * profiles.labor.time)) / totalCases
      : 0;

    return {
      monthlyRevenue,
      totalCases,
      capacityUsage: capacityUsage * 100,
      isRealistic,
      avgClosingTime: avgClosingTime.toFixed(1),
      gapToTarget: 1000000 - monthlyRevenue
    };
  };

  const results = calculateResults();

  const getSmartAlert = () => {
    if (results.totalCases === 0) {
      return {
        type: "info",
        message: "התחל בבניית התמהיל שלך - הכנס מספר תיקים מכל סוג"
      };
    }

    if (results.capacityUsage > 100) {
      return {
        type: "error",
        message: `הנפח שלך ${results.capacityUsage.toFixed(0)}% מהמקסימום - תצטרך לשכור עובד נוסף או להפחית תיקים`
      };
    }

    if (mix.foreign > 20 && mix.bankruptcy < 2) {
      return {
        type: "warning",
        message: "אתה מתמקד יותר מדי בתיקים קטנים - שקול 2-3 תיקי חדלות פירעון לשיפור הרווחיות"
      };
    }

    if (results.capacityUsage < 60) {
      const canAddForeign = Math.floor((profiles.foreign.capacity - mix.foreign) * 0.3);
      if (canAddForeign > 0) {
        return {
          type: "success",
          message: `יש לך מקום לעוד ${canAddForeign} תיקי עובדים זרים - זה יוסיף ${formatCurrency(canAddForeign * profiles.foreign.monthlyProfit)} לחודש`
        };
      }
    }

    if (results.monthlyRevenue >= 1000000) {
      return {
        type: "success",
        message: "מעולה! השגת את יעד המיליון! 🎉"
      };
    }

    if (results.monthlyRevenue >= 500000) {
      return {
        type: "success",
        message: "אתה באמצע הדרך ליעד! המשך כך 💪"
      };
    }

    return {
      type: "info",
      message: `חסרים לך ${formatCurrency(results.gapToTarget)} להשגת יעד המיליון`
    };
  };

  const alert = getSmartAlert();

  const getAlertIcon = (type) => {
    switch(type) {
      case "error": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default: return <TrendingUp className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case "error": return "bg-red-50 border-red-200 text-red-900";
      case "warning": return "bg-amber-50 border-amber-200 text-amber-900";
      case "success": return "bg-green-50 border-green-200 text-green-900";
      default: return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-600" />
          בנה את התמהיל שלך
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="foreign" className="flex items-center justify-between">
                <span>👥 תיקי עובדים זרים</span>
                <span className="text-xs text-gray-500">מקס: 30 | רווח: 542 ₪/חודש</span>
              </Label>
              <Input
                id="foreign"
                type="number"
                min="0"
                max="30"
                value={mix.foreign}
                onChange={(e) => setMix({...mix, foreign: parseInt(e.target.value) || 0})}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankruptcy" className="flex items-center justify-between">
                <span>🏢 תיקי חדלות פירעון</span>
                <span className="text-xs text-gray-500">מקס: 5 | רווח: 4,000 ₪/חודש</span>
              </Label>
              <Input
                id="bankruptcy"
                type="number"
                min="0"
                max="5"
                value={mix.bankruptcy}
                onChange={(e) => setMix({...mix, bankruptcy: parseInt(e.target.value) || 0})}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor" className="flex items-center justify-between">
                <span>⚖️ תיקי דיני עבודה</span>
                <span className="text-xs text-gray-500">מקס: 15 | רווח: 2,778 ₪/חודש</span>
              </Label>
              <Input
                id="labor"
                type="number"
                min="0"
                max="15"
                value={mix.labor}
                onChange={(e) => setMix({...mix, labor: parseInt(e.target.value) || 0})}
                className="text-lg"
              />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
            <h3 className="font-bold text-indigo-900 mb-3">תוצאות החישוב</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 text-xs">הכנסה חודשית</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(results.monthlyRevenue)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">סה"כ תיקים</p>
                <p className="text-xl font-bold text-indigo-600">{results.totalCases}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">ניצול קיבולת</p>
                <Badge className={results.capacityUsage > 100 ? "bg-red-100 text-red-800" : results.capacityUsage > 80 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>
                  {results.capacityUsage.toFixed(0)}%
                </Badge>
              </div>
              <div>
                <p className="text-gray-600 text-xs">זמן סגירה ממוצע</p>
                <p className="font-bold text-gray-700">{results.avgClosingTime} חודשים</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${getAlertColor(alert.type)}`}>
            <div className="flex items-start gap-2">
              {getAlertIcon(alert.type)}
              <p className="text-sm font-medium flex-1">{alert.message}</p>
            </div>
          </div>

          {results.monthlyRevenue > 0 && results.monthlyRevenue < 1000000 && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">💡 דרכים להגיע למיליון:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                {results.gapToTarget / profiles.foreign.monthlyProfit > 0 && (
                  <li>• הוסף עוד {Math.ceil(results.gapToTarget / profiles.foreign.monthlyProfit)} תיקי עובדים זרים</li>
                )}
                {results.gapToTarget / profiles.bankruptcy.monthlyProfit > 0 && (
                  <li>• הוסף עוד {Math.ceil(results.gapToTarget / profiles.bankruptcy.monthlyProfit)} תיקי חדלות פירעון</li>
                )}
                {results.gapToTarget / profiles.labor.monthlyProfit > 0 && (
                  <li>• הוסף עוד {Math.ceil(results.gapToTarget / profiles.labor.monthlyProfit)} תיקי דיני עבודה</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
