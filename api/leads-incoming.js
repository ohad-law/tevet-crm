/**
 * POST /api/leads-incoming
 * Webhook for Make.com — receives new leads from Meta Lead Forms.
 *
 * Flow:
 *  1. Validate webhook secret
 *  2. Parse fields from Make.com / Meta field_data / Graph API fallback
 *  3. Filter: no phone = alert Ohad only
 *  4. Save to Supabase
 *  5. Create in BASE44 (still live as primary CRM)
 *  6. WhatsApp to Ohad
 *  7. Warm WhatsApp to lead
 */
import { createClient } from "@supabase/supabase-js";

const WEBHOOK_SECRET = process.env.LEADS_WEBHOOK_SECRET || "";
const META_TOKEN = process.env.META_ACCESS_TOKEN;
const GREEN_INSTANCE = process.env.GREEN_API_INSTANCE;
const GREEN_TOKEN = process.env.GREEN_API_TOKEN;
const OHAD_WA = process.env.OHAD_WHATSAPP_NUMBER || "972542326624";
const BASE44_TOKEN = process.env.BASE44_TOKEN || "";
const BASE44_APP = "68dafceada48410b1d774f3f";

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

async function sendWA(phone, message) {
  if (!GREEN_INSTANCE || !GREEN_TOKEN) return false;
  const chatId = phone.includes("@") ? phone : `${phone}@c.us`;
  try {
    const r = await fetch(
      `https://api.green-api.com/waInstance${GREEN_INSTANCE}/sendMessage/${GREEN_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      }
    );
    return r.ok;
  } catch {
    return false;
  }
}

function extractLeadgenId(body) {
  return (
    body.leadgen_id ||
    body.lead_id ||
    body["Lead ID"] ||
    body.id ||
    body.entry?.[0]?.changes?.[0]?.value?.leadgen_id ||
    body.value?.leadgen_id ||
    ""
  );
}

async function fetchLeadFromGraph(leadgenId) {
  if (!META_TOKEN || !leadgenId) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${leadgenId}?fields=id,field_data,ad_name,campaign_name,created_time&access_token=${META_TOKEN}`
    );
    const data = await res.json();
    if (data.error) return null;
    const map = {};
    for (const f of data.field_data ?? []) {
      map[f.name] = f.values?.[0] ?? "";
    }
    if (data.ad_name) map["ad_name"] = data.ad_name;
    if (data.campaign_name) map["campaign_name"] = data.campaign_name;
    return map;
  } catch {
    return null;
  }
}

function parseFieldData(fieldData) {
  const map = {};
  for (const f of fieldData) {
    const name = (f.name ?? "").toLowerCase().trim();
    const val = (f.values?.[0] ?? f.value ?? "").trim();
    if (name) map[name] = val;
  }
  return map;
}

function findByKeyword(map, ...keywords) {
  for (const key of Object.keys(map)) {
    if (keywords.some((k) => key.includes(k.toLowerCase()))) return map[key];
  }
  return "";
}

const FORM_MAP = {
  years_worked: {
    under_1: "פחות משנה",
    "1_to_3": "שנה עד 3 שנים",
    "3_to_7": "3 עד 7 שנים",
    over_7: "מעל 7 שנים",
  },
  work_sector: {
    security: "שמירה / אבטחה",
    cleaning: "ניקיון / תחזוקה",
    construction: "בניין / עבודות שטח",
    retail_food: "מסחר / מסעדנות / שירות",
    other: "אחר",
  },
  situation: {
    fired: "פוטרתי לאחרונה",
    resigned: "התפטרתי",
    current_issue: "עדיין עובד, חושד שמשהו לא בסדר בשכר",
    cash_salary: "עבדתי בשכר מזומן ללא תיעוד",
  },
};

function toHebrew(field, raw) {
  const m = FORM_MAP[field];
  if (!m || !raw) return raw;
  return m[raw.trim()] ?? raw;
}

function leadScoreFromYears(years) {
  const y = years || "";
  if (y.includes("מעל 7") || y.includes("over_7")) return 100;
  if (y.includes("3 עד 7") || y.includes("3_to_7")) return 85;
  if (y.includes("שנה עד 3") || y.includes("1_to_3")) return 70;
  if (y.includes("פחות משנה") || y.includes("under_1")) return 40;
  return 60;
}

function classifySituation(s) {
  const t = (s || "").toLowerCase();
  if (t.includes("פוטר") || t.includes("פיטור")) return "fired";
  if (t.includes("התפטר") || t.includes("התפטרות")) return "resigned";
  if (t.includes("שכר") || t.includes("מזומן") || t.includes("תלוש")) return "wage";
  return "general";
}

function buildWarmMessage(fullName, situationText) {
  const name = (fullName || "").split(" ")[0] || "שלום";
  const situation = classifySituation(situationText);
  const hooks = {
    fired: "ברוב מקרי הפיטורים מגיע יותר ממה שחושבים 💡",
    resigned: "גם מי שהתפטר עשוי להיות זכאי לזכויות 💡",
    wage: "בעיות שכר ותלושים הן בדיוק התחום שלנו 💡",
    general: "ייתכן שמגיע לך יותר ממה שחושבים 💡",
  };
  return [
    `שלום ${name} 👋`,
    ``,
    `קיבלתי את פנייתך.`,
    hooks[situation],
    ``,
    `כאן אוהד טבת,`,
    `עו"ד לדיני עבודה ובודק שכר מוסמך מטעם משרד העבודה.`,
    `בדקנו כבר אלפי תלושים.`,
    ``,
    `שאלה קצרה שתעזור לי להבין את המקרה שלך:`,
    `כמה שעות ביום וכמה ימים בשבוע עבדת?`,
    ``,
    `ואם נוח לך, אפשר כבר לשלוח לי לכאן 2-4 תלושי שכר אחרונים`,
    `לבדיקה ראשונית ללא עלות.`,
    `הכל חסוי בינינו 🔒`,
    ``,
    `מוזמן גם לצפות בעמוד שלי בינתיים 👇`,
    `📱 טיקטוק: https://www.tiktok.com/@ohad.tevet6`,
    `📷 אינסטגרם: https://www.instagram.com/ohad.tevet.adv/`,
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const secret = req.headers["x-webhook-secret"];
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body;
  console.log("[leads-incoming] Received:", JSON.stringify(body));

  // Parse fields
  let full_name = body.full_name || body["Full Name"] || body.name || "";
  let phone = body.phone || body["Phone Number"] || body.phone_number || "";
  let years_worked = body.years_worked || body.years || "";
  let work_sector = body.work_sector || body.sector || "";
  let work_sector_detail = body.work_sector_detail || "";
  let situation = body.situation || "";
  let ad_name = body.ad_name || body["Ad Name"] || "";
  let campaign_name = body.campaign_name || body["Campaign Name"] || "";
  let lead_id = body.lead_id || body["Lead ID"] || body.id || "";

  // field_data from Facebook
  if (Array.isArray(body.field_data) && body.field_data.length > 0) {
    const fd = parseFieldData(body.field_data);
    if (!full_name) full_name = fd["full_name"] || fd["name"] || findByKeyword(fd, "name", "שם");
    if (!phone) phone = fd["phone_number"] || fd["phone"] || findByKeyword(fd, "phone", "טלפון");
    if (!years_worked) years_worked = fd["years_worked"] || findByKeyword(fd, "year", "שנ", "ותק");
    if (!work_sector) work_sector = fd["work_sector"] || findByKeyword(fd, "sector", "תחום");
    if (!work_sector_detail) work_sector_detail = fd["work_sector_detail"] || findByKeyword(fd, "detail", "פירוט");
    if (!situation) situation = fd["situation"] || findByKeyword(fd, "situation", "מצב");
    if (!ad_name) ad_name = fd["ad_name"] || "";
    if (!campaign_name) campaign_name = fd["campaign_name"] || "";
  }

  // Graph API fallback
  if (!lead_id) lead_id = extractLeadgenId(body);
  if ((!phone || !full_name) && lead_id) {
    const fd = await fetchLeadFromGraph(lead_id);
    if (fd) {
      if (!full_name) full_name = fd["full_name"] || fd["name"] || findByKeyword(fd, "name", "שם");
      if (!phone) phone = fd["phone_number"] || fd["phone"] || findByKeyword(fd, "phone", "טלפון");
      if (!years_worked) years_worked = fd["years_worked"] || findByKeyword(fd, "year", "שנ");
      if (!work_sector) work_sector = fd["work_sector"] || findByKeyword(fd, "sector", "תחום");
      if (!situation) situation = fd["situation"] || findByKeyword(fd, "situation", "מצב");
      if (!ad_name) ad_name = fd["ad_name"] || "";
      if (!campaign_name) campaign_name = fd["campaign_name"] || "";
    }
  }

  if (!phone) {
    await sendWA(OHAD_WA, `⚠️ נכנס ליד אבל לא הצלחתי למשוך את הפרטים שלו (leadgen_id=${lead_id || "חסר"}). כדאי לבדוק ידנית במנהל המודעות.`);
    return res.status(200).json({ ok: true, warning: "no_phone_resolved" });
  }

  years_worked = toHebrew("years_worked", years_worked);
  work_sector = toHebrew("work_sector", work_sector);
  situation = toHebrew("situation", situation);

  if (!full_name) full_name = "—";
  if (!years_worked) years_worked = "—";
  if (!work_sector) work_sector = "—";
  if (!situation) situation = "—";

  const phoneNorm = normalizePhone(phone);
  const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
  const today = new Date().toISOString().split("T")[0];

  // 1. Save to Supabase
  const followupNextAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase.from("leads").insert({
      full_name,
      phone: phoneNorm,
      source: "facebook_lead_form",
      campaign_name: ad_name || campaign_name,
      notes: `שנות עבודה: ${years_worked} | תחום: ${work_sector}${work_sector_detail ? ` (${work_sector_detail})` : ""} | סיטואציה: ${situation}`,
      status: "חדש",
      is_viewed: false,
      followup_stage: 0,
      followup_next_at: followupNextAt,
    });
    if (error) console.error("[leads-incoming] Supabase error:", error);
    else console.log("[leads-incoming] Saved to Supabase:", full_name);
  } catch (e) {
    console.error("[leads-incoming] Supabase exception:", e);
  }

  // 2. Create in BASE44 (keep as long as it's still live)
  if (BASE44_TOKEN) {
    try {
      const notes = [
        `📋 ליד ממטא — ${now}`,
        `• שנות עבודה: ${years_worked}`,
        `• תחום: ${work_sector}${work_sector_detail ? ` — ${work_sector_detail}` : ""}`,
        `• סיטואציה: ${situation}`,
        `• מודעה: ${ad_name}`,
        `• קמפיין: ${campaign_name}`,
        lead_id ? `• Lead ID: ${lead_id}` : "",
      ].filter(Boolean).join("\n");

      await fetch(`https://app.base44.com/api/apps/${BASE44_APP}/entities/Lead`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BASE44_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name,
          phone: phoneNorm,
          source: "Facebook",
          source_other: ad_name,
          campaign_name,
          landing_page: ad_name,
          status: "חדש",
          notes,
          utm_source: "facebook",
          utm_medium: "paid_social",
          utm_campaign: campaign_name,
          first_contact_date: today,
          is_viewed: false,
          lead_score: leadScoreFromYears(years_worked),
        }),
      });
      console.log("[leads-incoming] Created in BASE44:", full_name);
    } catch (e) {
      console.error("[leads-incoming] BASE44 exception:", e);
    }
  }

  // 3. WhatsApp to Ohad
  try {
    const ohadMsg = [
      `🟢 *ליד חדש — דיני עבודה*`,
      ``,
      `👤 *שם:* ${full_name}`,
      `📞 *טלפון:* ${phone}`,
      ``,
      `📋 *פרטים:*`,
      `• שנות עבודה: ${years_worked}`,
      `• תחום: ${work_sector}${work_sector_detail ? ` — ${work_sector_detail}` : ""}`,
      `• סיטואציה: ${situation}`,
      ``,
      `📢 *מודעה:* ${ad_name || campaign_name || "—"}`,
      `🕐 ${now}`,
      phoneNorm ? `\n▶️ לחץ להשיב: https://wa.me/${phoneNorm}` : "",
    ].filter((l) => l !== undefined).join("\n");

    await sendWA(OHAD_WA, ohadMsg);
  } catch (e) {
    console.error("[leads-incoming] WhatsApp to Ohad error:", e);
  }

  // 4. Warm WhatsApp to lead
  if (phoneNorm && phoneNorm.length >= 10) {
    try {
      await sendWA(phoneNorm, buildWarmMessage(full_name, situation));
    } catch (e) {
      console.error("[leads-incoming] WhatsApp to lead error:", e);
    }
  }

  return res.status(200).json({ ok: true });
}
