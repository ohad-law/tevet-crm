import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FB_API_VERSION = 'v19.0';

async function fbPost(path, body = {}) {
    const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
    const formData = new URLSearchParams();
    Object.entries({ ...body, access_token: accessToken }).forEach(([k, v]) => {
        formData.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
    });
    
    const res = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${path}`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    if (data.error) {
        throw new Error(`FB API Error: ${data.error.message} (code: ${data.error.code})`);
    }
    return data;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const { action, entity_id, updates } = await req.json();

        // PAUSE / ACTIVATE campaign, adset or ad
        if (action === 'update_status' && entity_id && updates?.status) {
            const result = await fbPost(entity_id, { status: updates.status });
            return Response.json({ success: true, result });
        }

        // UPDATE budget
        if (action === 'update_budget' && entity_id && updates) {
            const body = {};
            if (updates.daily_budget) body.daily_budget = updates.daily_budget;
            if (updates.lifetime_budget) body.lifetime_budget = updates.lifetime_budget;
            const result = await fbPost(entity_id, body);
            return Response.json({ success: true, result });
        }

        // UPDATE ad creative (rename, etc.)
        if (action === 'update_ad' && entity_id && updates) {
            const result = await fbPost(entity_id, updates);
            return Response.json({ success: true, result });
        }

        // CREATE new campaign
        if (action === 'create_campaign' && updates) {
            let accountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
            if (!accountId.startsWith('act_')) accountId = `act_${accountId}`;
            const result = await fbPost(`${accountId}/campaigns`, {
                name: updates.name,
                objective: updates.objective || 'OUTCOME_LEADS',
                status: updates.status || 'PAUSED',
                special_ad_categories: updates.special_ad_categories || '[]'
            });
            return Response.json({ success: true, result });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('FB Ads Manage Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});