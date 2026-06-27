import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function UrgentCases({ cases, clients }) {
  const now = new Date();
  
  const urgentCases = cases
    .filter(c => {
      if (c.status === 'ארכיון' || c.status === 'פסק דין') return false;
      if (!c.target_close_date) return false;
      
      const targetDate = new Date(c.target_close_date);
      const daysUntil = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));
      
      return daysUntil <= 14 && daysUntil >= -7; // Show cases due in 14 days or overdue by up to 7 days
    })
    .map(c => {
      const targetDate = new Date(c.target_close_date);
      const daysUntil = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));
      return { ...c, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לא ידוע';
  };

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil < 0) return 'bg-red-100 text-red-800 border-red-300';
    if (daysUntil <= 3) return 'bg-red-100 text-red-800 border-red-300';
    if (daysUntil <= 7) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getUrgencyText = (daysUntil) => {
    if (daysUntil < 0) return `🔴 איחור של ${Math.abs(daysUntil)} ימים`;
    if (daysUntil === 0) return '🔴 היום!';
    if (daysUntil === 1) return '🟠 מחר';
    if (daysUntil <= 7) return `🟠 בעוד ${daysUntil} ימים`;
    return `🟡 בעוד ${daysUntil} ימים`;
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            תיקים דחופים
          </span>
          {urgentCases.length > 0 && (
            <Badge className="bg-red-600 text-white text-lg px-3 py-1">
              {urgentCases.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {urgentCases.length > 0 ? (
          <div className="space-y-3">
            {urgentCases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl(`CaseDetails?id=${caseItem.id}`)}>
                  <div className={`p-4 rounded-lg border-2 hover:shadow-lg transition-all ${getUrgencyColor(caseItem.daysUntil)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{caseItem.case_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            #{caseItem.case_number}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          👤 {getClientName(caseItem.client_id)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span className="font-semibold">{getUrgencyText(caseItem.daysUntil)}</span>
                          <span className="text-gray-500">
                            ({new Date(caseItem.target_close_date).toLocaleDateString('he-IL')})
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">אין תיקים דחופים</p>
            <p className="text-sm">כל התיקים במצב טוב 👍</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}