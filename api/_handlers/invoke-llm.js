import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, response_json_schema } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const messages = [{ role: "user", content: prompt }];
    const params = {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages,
    };

    if (response_json_schema) {
      params.system = `You MUST respond with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no extra text, only the JSON object.`;
    }

    const response = await client.messages.create(params);
    const text = response.content[0]?.text || "";

    if (response_json_schema) {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error("invoke-llm error:", err);
    return res.status(500).json({ error: err.message });
  }
}
