import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, TrendingUp, Lock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeeWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    paid: 0,
    refunded: 0,
    balance: 0,
    frozen: 0,
    frozenCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const cases = await base44.entities.Case.list();
      const foreignWorkerCases = cases.filter(c => c.case_type === 'דיני עבודה - עובדים זרים');

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const paid = foreignWorkerCases.filter(c => {
        if (!c.fee_paid_date || c.fee_status !== 'שולמה') return false;
        const paidDate = new Date(c.fee_paid_date);
        return paidDate >= monthStart && paidDate <= monthEnd;
      }).reduce((sum, c) => sum + (c.fee_amount || 0), 0);

      const refunded = foreignWorkerCases.filter(c => {
        if (!c.fee_refund_date || c.fee_status !== 'הוחזרה') return false;
        const refundDate = new Date(c.fee_refund_date);
        return refundDate >= monthStart && refundDate <= monthEnd;
      }).reduce((sum, c) => sum + (c.fee_refund_amount || 0), 0);

      const frozenCases = foreignWorkerCases.filter(c => c.fee_status === 'שולמה');
      const frozen = frozenCases.reduce((sum, c) => sum + (c.fee_amount || 0), 0);

      setStats({
        paid,
        refunded,
        balance: refunded - paid,
        frozen,
        frozenCount: frozenCases.length
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading fee stats:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">טוען...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            💰 אגרות החודש
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("FeeManagement"))}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">שולם:</span>
          </div>
          <span className="text-lg font-bold text-red-600">₪{stats.paid.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">הוחזר:</span>
          </div>
          <span className="text-lg font-bold text-green-600">₪{stats.refunded.toLocaleString()}</span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">מאזן:</span>
            <span className={`text-xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.balance >= 0 ? '+' : ''}₪{Math.abs(stats.balance).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600">מוקפא:</span>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-orange-600">₪{stats.frozen.toLocaleString()}</p>
              <p className="text-xs text-gray-500">({stats.frozenCount} תיקים)</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={() => navigate(createPageUrl("FeeManagement"))}
          >
            📊 דוח מלא
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}