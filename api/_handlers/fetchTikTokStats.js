export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // TikTok doesn't have a public API for profile stats without OAuth app approval.
    // Return cached/manual data that can be updated periodically.
    // In production, this could scrape or use a third-party service.

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Try to get cached stats from a settings table
    const { data: cached } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "tiktok_stats")
      .single();

    if (cached?.value) {
      return res.status(200).json({ data: JSON.parse(cached.value) });
    }

    // Fallback: return placeholder data
    return res.status(200).json({
      data: {
        profile: {
          display_name: "אוהד טבת | עורך דין",
          follower_count: 3036,
          likes_count: 0,
          video_count: 0,
          following_count: 0,
          avatar_url: "",
          bio: "עורך דין דיני עבודה",
          is_verified: false,
          profile_url: "https://www.tiktok.com/@ohad.tevet",
        },
        videos: [],
      },
    });
  } catch (err) {
    console.error("fetchTikTokStats error:", err);
    return res.status(500).json({ error: err.message });
  }
}
