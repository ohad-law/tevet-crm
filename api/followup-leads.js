/**
 * GET /api/followup-leads
 * Vercel Cron — daily followup bot.
 * Sends WhatsApp followups to leads that haven't replied.
 * Schedule configured in vercel.json.
 */
import { createClient } from "@supabase/supabase-js";

const DAILY_CAP = 30;
const PACE_MS = 4000;

const GREEN_INSTANCE = process.env.GREEN_API_INSTANCE;
const GREEN_TOKEN = process.env.GREEN_API_TOKEN;

const TIKTOK = "https://www.tiktok.com/@ohad.tevet6";
const INSTAGRAM = "https://www.instagram.com/ohad.tevet.adv/";

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
    `שלום ${name} 👋`, "", `קיבלתי את פנייתך.`, hooks[situation], "",
    `כאן אוהד טבת,`, `עו"ד לדיני עבודה ובודק שכר מוסמך מטעם משרד העבודה.`,
    `בדקנו כבר אלפי תלושים.`, "",
    `שאלה קצרה שתעזור לי להבין את המקרה שלך:`,
    `כמה שעות ביום וכמה ימים בשבוע עבדת?`, "",
    `ואם נוח לך, אפשר כבר לשלוח לי לכאן 2-4 תלושי שכר אחרונים`,
    `לבדיקה ראשונית ללא עלות.`, `הכל חסוי בינינו 🔒`, "",
    `מוזמן גם לצפות בעמוד שלי בינתיים 👇`,
    `📱 טיקטוק: ${TIKTOK}`, `📷 אינסטגרם: ${INSTAGRAM}`,
  ].join("\n");
}

function buildDay3(name) {
  return [
    `${name}, רק רציתי לוודא שראית 🙂`, "",
    `אני אוהד טבת,`, `עו"ד לדיני עבודה ובודק שכר מוסמך מטעם משרד העבודה.`,
    `בדקנו כבר אלפי תלושים.`, "",
    `בדיקה ראשונית של התיק שלך ללא עלות.`,
    `מה נוח לך יותר לשיחה קצרה של 10 דקות, מחר בבוקר או אחר הצהריים?`, "",
    `ואם בא לך, שלח לי לכאן 2-4 תלושי שכר ואחזור אליך עם בדיקה ראשונית. הכל חסוי 🔒`, "",
    `יש לי גם בעמוד הרבה סרטונים שמראים איך לזהות טעויות בתלוש 👇`,
    `📱 טיקטוק: ${TIKTOK}`, `📷 אינסטגרם: ${INSTAGRAM}`,
  ].join("\n");
}

function buildDay7(name) {
  return [
    `${name}, אולי עכשיו פשוט לא הזמן המתאים, וזה בסדר גמור 🙂`, "",
    `בתור עו"ד לדיני עבודה ובודק שכר מוסמך מטעם משרד העבודה, אני משתף בעמוד הרבה ידע וערך שיעזרו לך בעתיד. מוזמן לעקוב 👇`,
    `📱 טיקטוק: ${TIKTOK}`, `📷 אינסטגרם: ${INSTAGRAM}`, "",
    `מאחל לך הצלחה בכל מה שתעשה 🤝`, "",
    `_(אם לא רלוונטי, אפשר להשיב "הסר".)_`,
  ].join("\n");
}

function buildFollowupMessage(stage, fullName) {
  const name = (fullName || "").split(" ")[0] || "שלום";
  if (stage === 1) return buildDay3(name);
  if (stage === 2) return buildDay7(name);
  return null;
}

function daysUntilNextFollowup(stageJustSent) {
  if (stageJustSent === 1) return 4;
  return null;
}

async function sendWA(phone, message) {
  if (!GREEN_INSTANCE || !GREEN_TOKEN) return false;
  const chatId = `${phone}@c.us`;
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const nowIso = new Date().toISOString();
  const due = [];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, phone, followup_stage, notes")
    .eq("status", "חדש")
    .eq("followup_stopped", false)
    .eq("followup_opted_out", false)
    .lt("followup_stage", 3)
    .lte("followup_next_at", nowIso);

  for (const l of leads ?? []) {
    due.push({
      id: l.id, full_name: l.full_name, phone: l.phone,
      followup_stage: l.followup_stage ?? 0,
      situationText: l.notes ?? "", table: "leads",
    });
  }

  const { data: talush } = await supabase
    .from("leads_talush")
    .select("id, full_name, phone, followup_stage, issue_description")
    .eq("status", "חדש")
    .eq("followup_stopped", false)
    .eq("followup_opted_out", false)
    .lt("followup_stage", 3)
    .lte("followup_next_at", nowIso);

  for (const l of talush ?? []) {
    due.push({
      id: l.id, full_name: l.full_name, phone: l.phone,
      followup_stage: l.followup_stage ?? 0,
      situationText: l.issue_description || "שכר", table: "leads_talush",
    });
  }

  console.log(`[followup] Due leads: ${due.length}`);

  let sent = 0;
  let skipped = 0;

  for (const lead of due) {
    if (sent >= DAILY_CAP) break;

    const phoneNorm = (lead.phone ?? "").replace(/\D/g, "");
    if (phoneNorm.length < 10) { skipped++; continue; }

    let message, newStage, nextDays;
    if (lead.followup_stage === -1) {
      message = buildWarmMessage(lead.full_name, lead.situationText);
      newStage = 0;
      nextDays = 3;
    } else {
      const stageToSend = lead.followup_stage + 1;
      message = buildFollowupMessage(stageToSend, lead.full_name);
      newStage = stageToSend;
      nextDays = daysUntilNextFollowup(stageToSend);
    }
    if (!message) { skipped++; continue; }

    const ok = await sendWA(phoneNorm, message);
    if (!ok) { skipped++; continue; }

    const update = {
      followup_stage: newStage,
      last_followup_at: new Date().toISOString(),
    };
    if (nextDays === null) {
      update.followup_stopped = true;
      update.followup_next_at = null;
    } else {
      update.followup_next_at = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString();
    }

    await supabase.from(lead.table).update(update).eq("id", lead.id);
    sent++;

    if (sent < due.length && sent < DAILY_CAP) await sleep(PACE_MS);
  }

  console.log(`[followup] Done. sent=${sent}, skipped=${skipped}`);
  return res.status(200).json({ due: due.length, sent, skipped });
}
