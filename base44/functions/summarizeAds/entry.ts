import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FB_API_VERSION = 'v19.0';

const getLeadCount = (actions) => {
    if (!actions) return 0;
    const lead = actions.find(a =>
        a.action_type === 'lead' ||
        a.action_type === 'offsite_conversion.fb_pixel_lead' ||
        a.action_type === 'onsite_conversion.lead_grouped' ||
        a.action_type === 'offsite_complete_registration_add_meta_leads'
    );
    return lead ? parseInt(lead.value) : 0;
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
        let accountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
        if (!accountId.startsWith('act_')) accountId = `act_${accountId}`;

        const url = new URL(`https://graph.facebook.com/${FB_API_VERSION}/${accountId}/ads`);
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('fields', 'id,name,status,campaign{name},creative{title,body},insights.date_preset(maximum){spend,impressions,clicks,ctr,cpc,actions,reach,frequency}');
        url.searchParams.set('limit', '200');

        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const summary = (data.data || []).map(ad => {
            const ins = ad.insights?.data?.[0] || {};
            const spend = parseFloat(ins.spend || 0);
            const leads = getLeadCount(ins.actions);
            const clicks = parseInt(ins.clicks || 0);
            const impressions = parseInt(ins.impressions || 0);
            return {
                id: ad.id,
                name: ad.name,
                status: ad.status,
                campaign: ad.campaign?.name || '-',
                title: ad.creative?.title?.substring(0, 80) || '-',
                spend: spend.toFixed(2),
                impressions,
                clicks,
                ctr: parseFloat(ins.ctr || 0).toFixed(2),
                cpc: parseFloat(ins.cpc || 0).toFixed(2),
                reach: parseInt(ins.reach || 0),
                frequency: parseFloat(ins.frequency || 0).toFixed(2),
                leads,
                cost_per_lead: leads > 0 ? (spend / leads).toFixed(2) : null
            };
        }).filter(ad => parseFloat(ad.spend) > 0); // only ads that actually spent money

        // Sort by leads (best first), then by CTR
        summary.sort((a, b) => {
            if (b.leads !== a.leads) return b.leads - a.leads;
            return parseFloat(b.ctr) - parseFloat(a.ctr);
        });

        const totalSpend = summary.reduce((s, a) => s + parseFloat(a.spend), 0);
        const totalLeads = summary.reduce((s, a) => s + a.leads, 0);

        return Response.json({
            success: true,
            total_ads: summary.length,
            total_spend: totalSpend.toFixed(2),
            total_leads: totalLeads,
            avg_cpl: totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : null,
            top_by_leads: summary.slice(0, 10),
            best_cpl: [...summary].filter(a => a.leads >= 5).sort((a, b) => parseFloat(a.cost_per_lead) - parseFloat(b.cost_per_lead)).slice(0, 5),
            best_ctr: [...summary].filter(a => parseInt(a.impressions) > 1000).sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr)).slice(0, 5)
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});