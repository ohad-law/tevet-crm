import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function askClaude(system, prompt, schema) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: system + `\n\nRespond ONLY with valid JSON matching this schema: ${JSON.stringify(schema)}`,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content[0]?.text || "{}";
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, data } = req.body;

    if (action === "analyze_video") {
      const ad = data?.ad || {};
      const insights = ad.insights?.data?.[0] || {};
      const result = await askClaude(
        "You are a Facebook Ads video performance analyst for an Israeli law firm.",
        `Analyze this ad's video performance:\nAd: ${ad.name}\nSpend: ${insights.spend}\nImpressions: ${insights.impressions}\nClicks: ${insights.clicks}\nVideo watch data: ${JSON.stringify(insights.video_avg_time_watched_actions || [])}`,
        {
          type: "object",
          properties: {
            metrics: { type: "object", properties: { thumb_stop_rate: { type: "number" }, hold_rate: { type: "number" }, avg_watch_seconds: { type: "number" }, drop_off_point: { type: "string" } } },
            ai: { type: "object", properties: { severity: { type: "string" }, diagnosis: { type: "string" }, recommendations: { type: "array", items: { type: "string" } } } },
          },
        }
      );
      return res.status(200).json({ data: result });
    }

    if (action === "copy_variations") {
      const winningAds = data?.winning_ads || [];
      const result = await askClaude(
        "You are an Israeli law firm ad copywriter. Write in Hebrew.",
        `Based on these winning ads, generate copy variations:\n${JSON.stringify(winningAds.slice(0, 5))}`,
        {
          type: "object",
          properties: {
            patterns_identified: { type: "array", items: { type: "string" } },
            variations: { type: "array", items: { type: "object", properties: { angle: { type: "string" }, title: { type: "string" }, body: { type: "string" }, cta: { type: "string" } } } },
          },
        }
      );
      return res.status(200).json({ data: result });
    }

    if (action === "schedule_optimization") {
      const hourly = data?.hourly || [];
      const result = await askClaude(
        "You are a Facebook Ads scheduling optimizer for an Israeli law firm.",
        `Analyze hourly ad performance and recommend optimal schedule:\n${JSON.stringify(hourly)}`,
        {
          type: "object",
          properties: {
            hours_data: { type: "array", items: { type: "object", properties: { hour: { type: "string" }, cpl: { type: "number" } } } },
            ai: { type: "object", properties: { best_windows: { type: "array", items: { type: "string" } }, avoid_windows: { type: "array", items: { type: "string" } }, recommendation: { type: "string" } } },
          },
        }
      );
      return res.status(200).json({ data: result });
    }

    if (action === "fatigue_detection") {
      const ads = data?.ads || [];
      const result = await askClaude(
        "You are a Facebook Ads creative fatigue analyst.",
        `Detect creative fatigue in these ads:\n${JSON.stringify(ads.slice(0, 10))}`,
        {
          type: "object",
          properties: {
            alerts: { type: "array", items: { type: "object", properties: { ad_name: { type: "string" }, severity: { type: "string" }, reason: { type: "string" }, recommendation: { type: "string" } } } },
          },
        }
      );
      return res.status(200).json({ data: result });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("facebookAdsAI error:", err);
    return res.status(500).json({ error: err.message });
  }
}
