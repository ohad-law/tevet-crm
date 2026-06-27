import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/utils/formatters";

export default function FinancialProjections({ cases, incomes }) {
  const activeCases = cases.filter(c => c.status !== 'פסק דין' && c.status !== 'ארכיון');
  const avgClosingMonths = 7;
  const successRate = 1.0;

  const calculateProjectedRevenue = () => {
    const projections = [];
    const today = new Date();

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 1);
      
      let projectedRevenue = 0;
      activeCases.forEach(caseItem => {
        if (caseItem.value) {
          const openDate = new Date(caseItem.open_date);
          const monthsSinceOpen = (today - openDate) / (1000 * 60 * 60 * 24 * 30);
          const expectedCloseDate = new Date(openDate);
          expectedCloseDate.setMonth(expectedCloseDate.getMonth() + avgClosingMonths);
          
          if (expectedCloseDate.getMonth() === targetMonth.getMonth() && 
              expectedCloseDate.getFullYear() === targetMonth.getFullYear()) {
            projectedRevenue += caseItem.value * successRate;
          }
        }
      });

      projections.push({
        month: targetMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
        amount: projectedRevenue
      });
    }

    return projections;
  };

  const projections = calculateProjectedRevenue();
  const totalActiveValue = activeCases.reduce((sum, c) => sum + (c.value || 0), 0) * successRate;
  const TARGET_MONTHLY = 1000000;

  const nextMonthProjection = projections[0];
  const gap = TARGET_MONTHLY - nextMonthProjection.amount;
  const gapPercentage = (gap / TARGET_MONTHLY * 100).toFixed(0);

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          תחזיות פיננסיות
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600 mb-1">רווח צפוי מתיקים פעילים</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalActiveValue)}</p>
              </div>
              <Badge className="bg-blue-600 text-white">
                {activeCases.length} תיקים
              </Badge>
            </div>
            <p className="text-xs text-gray-600">ממוצע 7 חודשים לסגירה • שיעור הצלחה 100%</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              תחזית 3 חודשים
            </h3>
            <div className="space-y-3">
              {projections.map((proj, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{proj.month}</span>
                  <span className="font-bold text-blue-600">{formatCurrency(proj.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {gap > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 mb-1">פער ליעד חודש הבא</p>
                  <p className="text-sm text-amber-800">
                    חסרים {formatCurrency(gap)} ({gapPercentage}%) להשגת יעד המיליון
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}