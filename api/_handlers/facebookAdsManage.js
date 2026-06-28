const META_TOKEN = process.env.META_ACCESS_TOKEN;
const META_BASE = "https://graph.facebook.com/v21.0";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, type, id, status } = req.body;

    if (action === "update_status") {
      if (!id || !status) return res.status(400).json({ error: "id and status are required" });

      const r = await fetch(`${META_BASE}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ access_token: META_TOKEN, status }),
      });
      const data = await r.json();

      if (data.error) return res.status(400).json({ error: data.error.message });
      return res.status(200).json({ data: { success: true } });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("facebookAdsManage error:", err);
    return res.status(500).json({ error: err.message });
  }
}
