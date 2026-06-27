export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: "phone and message are required" });

    const instance = process.env.GREEN_API_INSTANCE;
    const token = process.env.GREEN_API_TOKEN;

    const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "972");
    const chatId = `${cleanPhone}@c.us`;

    const response = await fetch(
      `https://api.green-api.com/waInstance${instance}/sendMessage/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, idMessage: data.idMessage });
  } catch (err) {
    console.error("sendWhatsApp error:", err);
    return res.status(500).json({ error: err.message });
  }
}
