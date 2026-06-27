import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function WorkloadStatus({ cases, tasks }) {
  const activeCases = cases.filter(c => c.status !== 'פסק דין' && c.status !== 'ארכיון');
  const openTasks = tasks.filter(t => t.status !== 'הושלמה');

  // Calculate workload status
  const caseCount = activeCases.length;
  let workloadStatus = 'נמוך';
  let statusColor = 'bg-green-100 text-green-800';
  let statusIcon = CheckCircle;
  
  if (caseCount >= 30) {
    workloadStatus = 'קריטי';
    statusColor = 'bg-red-100 text-red-800';
    statusIcon = AlertTriangle;
  } else if (caseCount >= 20) {
    workloadStatus = 'גבוה';
    statusColor = 'bg-orange-100 text-orange-800';
    statusIcon = TrendingUp;
  } else if (caseCount >= 10) {
    workloadStatus = 'בינוני';
    statusColor = 'bg-yellow-100 text-yellow-800';
    statusIcon = TrendingUp;
  }

  const workloadPercent = Math.min((caseCount / 30) * 100, 100);

  // Get oldest cases that are still in initial status
  const oldestCases = activeCases
    .filter(c => c.status === 'תיק נכנס')
    .map(c => {
      const daysSinceOpen = Math.floor((Date.now() - new Date(c.open_date).getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, daysSinceOpen };
    })
    .sort((a, b) => b.daysSinceOpen - a.daysSinceOpen)
    .slice(0, 5);

  const StatusIcon = statusIcon;

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          מצב עומס נוכחי
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Workload Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">תיקים פעילים</p>
            <p className="text-3xl font-bold text-gray-900">{caseCount}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">משימות פתוחות</p>
            <p className="text-3xl font-bold text-gray-900">{openTasks.length}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Badge className={`${statusColor} text-lg px-4 py-2`}>
              <StatusIcon className="w-4 h-4 ml-2" />
              {workloadStatus}
            </Badge>
          </div>
        </div>

        {/* Workload Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">רמת עומס</span>
            <span className="font-semibold">{workloadPercent.toFixed(0)}%</span>
          </div>
          <Progress value={workloadPercent} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 תיקים (נמוך)</span>
            <span>10 (בינוני)</span>
            <span>20 (גבוה)</span>
            <span>30+ (קריטי)</span>
          </div>
        </div>

        {/* Alerts */}
        {caseCount >= 25 && (
          <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900">⚠️ עומס גבוה!</p>
                <p className="text-sm text-orange-800">שקול העסקת עובד נוסף או העברת תיקים</p>
              </div>
            </div>
          </div>
        )}

        {/* Oldest Cases */}
        {oldestCases.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              תיקים הכי ישנים שטרם טופלו
            </h3>
            <div className="space-y-2">
              {oldestCases.map((caseItem) => {
                let urgencyColor = 'bg-green-50 border-green-300 text-green-800';
                let urgencyIcon = '🟢';
                
                if (caseItem.daysSinceOpen > 10) {
                  urgencyColor = 'bg-red-50 border-red-300 text-red-800';
                  urgencyIcon = '🔴';
                } else if (caseItem.daysSinceOpen > 5) {
                  urgencyColor = 'bg-orange-50 border-orange-300 text-orange-800';
                  urgencyIcon = '🟠';
                } else if (caseItem.daysSinceOpen > 3) {
                  urgencyColor = 'bg-yellow-50 border-yellow-300 text-yellow-800';
                  urgencyIcon = '🟡';
                }

                return (
                  <div key={caseItem.id} className={`p-3 rounded-lg border-2 ${urgencyColor}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{caseItem.case_name}</p>
                        <p className="text-xs mt-1">תיק #{caseItem.case_number}</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>{urgencyIcon}</span>
                        <span>לפני {caseItem.daysSinceOpen} ימים</span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deadline Info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Deadlines אוטומטיים:</strong> משימות חדשות מקבלות deadline של{' '}
            {caseCount < 10 && '3 ימים'}
            {caseCount >= 10 && caseCount < 20 && '5 ימים'}
            {caseCount >= 20 && caseCount < 30 && '7 ימים'}
            {caseCount >= 30 && '10 ימים'}
            {' '}בהתאם לעומס הנוכחי.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}