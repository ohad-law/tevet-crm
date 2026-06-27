import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FB_API_VERSION = 'v19.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { campaign_ids } = await req.json().catch(() => ({}));
        const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");

        if (campaign_ids && Array.isArray(campaign_ids)) {
            // Get daily spend breakdown for specific campaigns
            const results = [];
            for (const cid of campaign_ids) {
                const url = new URL(`https://graph.facebook.com/${FB_API_VERSION}/${cid}/insights`);
                url.searchParams.set('access_token', accessToken);
                url.searchParams.set('fields', 'spend,date_start,date_stop');
                url.searchParams.set('time_increment', '1');
                url.searchParams.set('date_preset', 'maximum');
                url.searchParams.set('limit', '500');

                const res = await fetch(url.toString());
                const data = await res.json();
                if (data.error) {
                    results.push({ id: cid, error: data.error.message });
                    continue;
                }
                const days = (data.data || []).filter(d => parseFloat(d.spend) > 0);
                const lastSpendDay = days[days.length - 1];
                results.push({
                    id: cid,
                    last_spend_date: lastSpendDay?.date_start || null,
                    last_spend_amount: lastSpendDay?.spend || null,
                    total_spending_days: days.length,
                    last_5_days_with_spend: days.slice(-5)
                });
            }
            return Response.json({ success: true, campaigns: results });
        }

        // Default: list active campaigns
        let accountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
        if (!accountId.startsWith('act_')) accountId = `act_${accountId}`;

        const url = new URL(`https://graph.facebook.com/${FB_API_VERSION}/${accountId}/campaigns`);
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('fields', 'id,name,status,objective,insights.date_preset(maximum){spend,impressions,clicks}');
        url.searchParams.set('limit', '100');
        url.searchParams.set('effective_status', JSON.stringify(['ACTIVE']));

        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const simplified = (data.data || []).map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            spend_lifetime: c.insights?.data?.[0]?.spend || "0",
            impressions: c.insights?.data?.[0]?.impressions || "0",
            clicks: c.insights?.data?.[0]?.clicks || "0"
        }));

        return Response.json({ success: true, active_campaigns: simplified });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});