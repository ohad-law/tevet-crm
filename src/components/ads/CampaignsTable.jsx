import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, Loader2 } from "lucide-react";

const getLeadCount = (actions) => {
    if (!actions) return 0;
    const lead = actions.find(a => 
        a.action_type === 'lead' || 
        a.action_type === 'offsite_conversion.fb_pixel_lead' ||
        a.action_type === 'onsite_conversion.lead_grouped'
    );
    return lead ? parseInt(lead.value) : 0;
};

export default function CampaignsTable({ campaigns, onToggleStatus, updatingId }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">קמפיינים</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="text-right">שם הקמפיין</TableHead>
                            <TableHead className="text-right">סטטוס</TableHead>
                            <TableHead className="text-right">מטרה</TableHead>
                            <TableHead className="text-right">הוצאה</TableHead>
                            <TableHead className="text-right">חשיפות</TableHead>
                            <TableHead className="text-right">CTR</TableHead>
                            <TableHead className="text-right">CPC</TableHead>
                            <TableHead className="text-right">לידים</TableHead>
                            <TableHead className="text-right">CPL</TableHead>
                            <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                                    אין קמפיינים להצגה
                                </TableCell>
                            </TableRow>
                        ) : campaigns.map(c => {
                            const ins = c.insights?.data?.[0] || {};
                            const spend = parseFloat(ins.spend || 0);
                            const leads = getLeadCount(ins.actions);
                            const cpl = leads > 0 ? spend / leads : 0;
                            const isActive = c.status === 'ACTIVE';
                            
                            return (
                                <TableRow key={c.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium max-w-[200px] truncate" title={c.name}>{c.name}</TableCell>
                                    <TableCell>
                                        <Badge className={isActive ? "bg-green-100 text-green-800 border-0" : "bg-slate-100 text-slate-600 border-0"}>
                                            {isActive ? 'פעיל' : c.status === 'PAUSED' ? 'מושהה' : c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">{c.objective?.replace('OUTCOME_', '') || '-'}</TableCell>
                                    <TableCell className="font-semibold">₪{spend.toFixed(0)}</TableCell>
                                    <TableCell>{parseInt(ins.impressions || 0).toLocaleString()}</TableCell>
                                    <TableCell>{parseFloat(ins.ctr || 0).toFixed(2)}%</TableCell>
                                    <TableCell>₪{parseFloat(ins.cpc || 0).toFixed(2)}</TableCell>
                                    <TableCell className="font-semibold text-green-700">{leads}</TableCell>
                                    <TableCell>{cpl > 0 ? `₪${cpl.toFixed(0)}` : '-'}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onToggleStatus(c.id, isActive ? 'PAUSED' : 'ACTIVE')}
                                            disabled={updatingId === c.id}
                                            title={isActive ? 'השהה' : 'הפעל'}
                                        >
                                            {updatingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                                             isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}