import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Eye, MousePointerClick, Target, TrendingUp, Users } from "lucide-react";

const MetricCard = ({ icon: Icon, label, value, subtitle, color = "blue" }) => {
    const colorMap = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
        indigo: "bg-indigo-50 text-indigo-600"
    };
    return (
        <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </CardContent>
        </Card>
    );
};

export default function AdsOverviewCards({ insights }) {
    const spend = parseFloat(insights.spend || 0);
    const impressions = parseInt(insights.impressions || 0);
    const clicks = parseInt(insights.clicks || 0);
    const ctr = parseFloat(insights.ctr || 0);
    const cpc = parseFloat(insights.cpc || 0);
    const cpm = parseFloat(insights.cpm || 0);
    const reach = parseInt(insights.reach || 0);
    const frequency = parseFloat(insights.frequency || 0);

    const leadAction = insights.actions?.find(a => 
        a.action_type === 'lead' || 
        a.action_type === 'offsite_conversion.fb_pixel_lead' ||
        a.action_type === 'onsite_conversion.lead_grouped'
    );
    const leads = leadAction ? parseInt(leadAction.value) : 0;
    const cpl = leads > 0 ? spend / leads : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard icon={DollarSign} label="הוצאה" value={`₪${spend.toFixed(0)}`} color="amber" />
            <MetricCard icon={Target} label="לידים" value={leads} subtitle={cpl > 0 ? `₪${cpl.toFixed(0)} / ליד` : null} color="green" />
            <MetricCard icon={Eye} label="חשיפות" value={impressions.toLocaleString()} subtitle={`תדירות ${frequency.toFixed(1)}`} color="blue" />
            <MetricCard icon={MousePointerClick} label="קליקים" value={clicks} subtitle={`CTR ${ctr.toFixed(2)}%`} color="purple" />
            <MetricCard icon={TrendingUp} label="CPC" value={`₪${cpc.toFixed(2)}`} subtitle={`CPM ₪${cpm.toFixed(0)}`} color="indigo" />
            <MetricCard icon={Users} label="טווח הגעה" value={reach.toLocaleString()} color="red" />
        </div>
    );
}