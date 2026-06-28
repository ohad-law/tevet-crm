const META_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || "act_386151888726882";
const META_BASE = "https://graph.facebook.com/v21.0";

async function metaGet(path, params = {}) {
  const qs = new URLSearchParams({ access_token: META_TOKEN, ...params });
  const r = await fetch(`${META_BASE}${path}?${qs}`);
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, date_preset } = req.body;
    const preset = date_preset || "last_7d";

    if (action === "overview") {
      const data = await metaGet(`/${AD_ACCOUNT}/insights`, {
        date_preset: preset,
        fields: "spend,impressions,clicks,cpc,cpm,ctr,actions,cost_per_action_type,reach,frequency",
      });
      return res.status(200).json({ data: { account_insights: data.data?.[0] || {} } });
    }

    if (action === "campaigns") {
      const data = await metaGet(`/${AD_ACCOUNT}/campaigns`, {
        fields: "id,name,status,objective,daily_budget,lifetime_budget,insights.date_preset(" + preset + "){spend,impressions,clicks,cpc,ctr,actions,cost_per_action_type,reach}",
        limit: "50",
      });
      return res.status(200).json({ data: { campaigns: data.data || [] } });
    }

    if (action === "ads") {
      const data = await metaGet(`/${AD_ACCOUNT}/ads`, {
        fields: "id,name,status,creative{title,body,image_url,thumbnail_url,video_id},insights.date_preset(" + preset + "){spend,impressions,clicks,cpc,ctr,actions,cost_per_action_type,video_avg_time_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions}",
        limit: "50",
      });
      return res.status(200).json({ data: { ads: data.data || [] } });
    }

    if (action === "hourly_breakdown") {
      const data = await metaGet(`/${AD_ACCOUNT}/insights`, {
        date_preset: preset,
        fields: "spend,impressions,clicks,actions,cost_per_action_type",
        breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
        limit: "24",
      });
      return res.status(200).json({ data: { hourly: data.data || [] } });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("facebookAdsFetch error:", err);
    return res.status(500).json({ error: err.message });
  }
}
