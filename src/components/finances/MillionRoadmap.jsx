import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/components/utils/formatters";

export default function MillionRoadmap({ cases, currentMonthly }) {
  const TARGET = 1000000;
  const activeCases = cases.filter(c => c.status !== 'פסק דין' && c.status !== 'ארכיון');
  
  const avgCaseValue = activeCases.length > 0 
    ? activeCases.reduce((sum, c) => sum + (c.value || 0), 0) / activeCases.length 
    : 50000;

  const casesNeeded = Math.ceil(TARGET / avgCaseValue);
  const currentProgress = (currentMonthly / TARGET) * 100;

  const quarterlyMilestones = [
    { quarter: 'רבעון 1', target: 250000 },
    { quarter: 'רבעון 2', target: 500000 },
    { quarter: 'רבעון 3', target: 750000 },
    { quarter: 'רבעון 4', target: 1000000 }
  ];

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          מסלול למיליון
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">התקדמות חודשית</span>
                <span className="text-sm font-bold text-amber-700">{currentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={currentProgress} className="h-3 bg-amber-200" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600 mb-1">מחזור נוכחי</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(currentMonthly)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">יעד</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(TARGET)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              מה נדרש?
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">תיקים נדרשים לחודש:</span>
                <span className="font-bold text-blue-700">{casesNeeded} תיקים</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">ערך תיק ממוצע:</span>
                <span className="font-bold text-blue-700">{formatCurrency(avgCaseValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">פער נוכחי:</span>
                <span className="font-bold text-red-600">{formatCurrency(TARGET - currentMonthly)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">אבני דרך רבעוניות</h3>
            <div className="space-y-2">
              {quarterlyMilestones.map((milestone, index) => {
                const achieved = currentMonthly >= milestone.target;
                return (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      achieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`font-medium ${achieved ? 'text-green-900' : 'text-gray-700'}`}>
                      {milestone.quarter}
                    </span>
                    <span className={`font-bold ${achieved ? 'text-green-600' : 'text-gray-600'}`}>
                      {formatCurrency(milestone.target)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}