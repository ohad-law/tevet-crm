import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { idea, platform, targetAudience, contentType, duration } = req.body;
    if (!idea) return res.status(400).json({ error: "idea is required" });

    const prompt = `אתה יוצר תוכן ויראלי לעורך דין ישראלי בדיני עבודה (אוהד טבת). כתוב סקריפט לסרטון.

פלטפורמה: ${platform || "TikTok"}
רעיון: ${idea}
סוג תוכן: ${contentType || "טיפ מקצועי"}
קהל יעד: ${targetAudience || "עובדים שכירים בישראל"}
אורך: ${duration || 60} שניות

כתוב סקריפט שכולל:
1. hook חזק שעוצר את הגלילה (2-3 שניות ראשונות)
2. תוכן ערכי עם נקודות מפתח
3. CTA ברור
4. הערות צילום/עריכה

תחזיר JSON:
{
  "hook": "משפט הפתיחה",
  "main_points": "הנקודות העיקריות",
  "cta": "קריאה לפעולה",
  "full_script": "הסקריפט המלא מילה במילה",
  "visual_notes": "הערות צילום ועריכה",
  "hook_template": "תבנית ה-hook שנמצאה יעילה"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: "You are a viral content creator for Israeli social media. Respond ONLY with valid JSON, no markdown fences. Write in Hebrew.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    return res.status(200).json({ data: { script: parsed } });
  } catch (err) {
    console.error("generateViralScript error:", err);
    return res.status(500).json({ error: err.message });
  }
}
