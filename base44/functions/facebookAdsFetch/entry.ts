import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FB_API_VERSION = 'v19.0';

async function fbGet(path, params = {}) {
    const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
    const url = new URL(`https://graph.facebook.com/${FB_API_VERSION}/${path}`);
    url.searchParams.set('access_token', accessToken);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
    });
    
    const res = await fetch(url.toString());
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
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { action = 'overview', date_preset = 'last_30d', campaign_id, ad_id } = await req.json().catch(() => ({}));
        
        let accountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
        if (!accountId.startsWith('act_')) accountId = `act_${accountId}`;

        // OVERVIEW - account-level summary
        if (action === 'overview') {
            const insights = await fbGet(`${accountId}/insights`, {
                date_preset,
                fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,cost_per_action_type'
            });
            
            const campaigns = await fbGet(`${accountId}/campaigns`, {
                fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time',
                limit: 50
            });

            return Response.json({ 
                success: true,
                account_insights: insights.data?.[0] || {},
                campaigns: campaigns.data || []
            });
        }

        // CAMPAIGNS with insights
        if (action === 'campaigns') {
            const campaigns = await fbGet(`${accountId}/campaigns`, {
                fields: `id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time,insights.date_preset(${date_preset}){spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type}`,
                limit: 100
            });
            return Response.json({ success: true, campaigns: campaigns.data || [] });
        }

        // ADSETS for a campaign
        if (action === 'adsets' && campaign_id) {
            const adsets = await fbGet(`${campaign_id}/adsets`, {
                fields: `id,name,status,daily_budget,lifetime_budget,targeting,optimization_goal,insights.date_preset(${date_preset}){spend,impressions,clicks,ctr,cpc,cpm,actions}`,
                limit: 100
            });
            return Response.json({ success: true, adsets: adsets.data || [] });
        }

        // ADS for a campaign (with creative details)
        if (action === 'ads') {
            const endpoint = campaign_id ? `${campaign_id}/ads` : `${accountId}/ads`;
            const ads = await fbGet(endpoint, {
                fields: `id,name,status,creative{id,name,title,body,image_url,video_id,thumbnail_url,object_story_spec},insights.date_preset(${date_preset}){spend,impressions,clicks,ctr,cpc,cpm,frequency,reach,actions,video_play_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_avg_time_watched_actions}`,
                limit: 100
            });
            return Response.json({ success: true, ads: ads.data || [] });
        }

        // HOURLY breakdown for Ad Scheduling analysis
        if (action === 'hourly_breakdown') {
            const insights = await fbGet(`${accountId}/insights`, {
                date_preset,
                breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
                fields: 'spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type'
            });
            return Response.json({ success: true, hourly: insights.data || [] });
        }

        // DAILY breakdown
        if (action === 'daily_breakdown') {
            const insights = await fbGet(`${accountId}/insights`, {
                date_preset,
                time_increment: 1,
                fields: 'spend,impressions,clicks,ctr,cpc,reach,frequency,actions,cost_per_action_type,date_start'
            });
            return Response.json({ success: true, daily: insights.data || [] });
        }

        // VIDEO METRICS for a specific ad (thumb-stop, hold rate)
        if (action === 'video_metrics' && ad_id) {
            const insights = await fbGet(`${ad_id}/insights`, {
                date_preset,
                fields: 'impressions,video_play_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_avg_time_watched_actions,video_thruplay_watched_actions,actions'
            });
            return Response.json({ success: true, metrics: insights.data?.[0] || {} });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('FB Ads Fetch Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});