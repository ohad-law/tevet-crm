/**
 * POST /api/whatsapp-incoming
 * Receives incoming WhatsApp messages from Green API.
 * Filters: groups, old messages, unknown numbers, self-messages.
 * On lead reply: stops followup bot. On opt-out: marks opted_out + confirms.
 */
import { createClient } from "@supabase/supabase-js";

const GREEN_INSTANCE = process.env.GREEN_API_INSTANCE;
const GREEN_TOKEN = process.env.GREEN_API_TOKEN;
const OHAD_WA = process.env.OHAD_WHATSAPP_NUMBER || "972542326624";

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

function isOptOut(text) {
  const t = (text || "").trim().toLowerCase();
  return ["הסר", "הסרה", "הפסק", "הפסיקו", "stop", "תפסיק", "הורד אותי"].includes(t);
}

async function findLead(supabase, phone972) {
  const local = "0" + phone972.slice(3);
  for (const table of ["leads", "leads_talush"]) {
    const { data } = await supabase
      .from(table)
      .select("id, full_name, phone")
      .or(`phone.eq.${phone972},phone.eq.${local}`)
      .maybeSingle();
    if (data) return { ...data, table };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  const body = req.body || {};

  if (body.typeWebhook !== "incomingMessageReceived") {
    return res.status(200).json({ ok: true });
  }

  const senderData = body.senderData;
  const messageData = body.messageData;
  const timestamp = typeof body.timestamp === "number" ? body.timestamp : 0;

  if (!senderData?.chatId || !messageData) {
    return res.status(200).json({ ok: true });
  }

  const chatId = senderData.chatId;

  if (chatId.includes("@g.us") || chatId.includes("@broadcast")) {
    return res.status(200).json({ ok: true });
  }

  const thirtyMinutesAgo = Math.floor(Date.now() / 1000) - 30 * 60;
  if (timestamp > 0 && timestamp < thirtyMinutesAgo) {
    return res.status(200).json({ ok: true });
  }

  const senderPhone = normalizePhone(chatId.replace("@c.us", ""));
  const ohadPhone = normalizePhone(OHAD_WA);

  if (senderPhone === ohadPhone) {
    return res.status(200).json({ ok: true });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const lead = await findLead(supabase, senderPhone);

    if (!lead) {
      return res.status(200).json({ ok: true });
    }

    const textData = messageData.textMessageData;
    const msgText = textData?.textMessage || "[הודעה שאינה טקסט]";

    if (isOptOut(msgText)) {
      await supabase
        .from(lead.table)
        .update({ followup_opted_out: true, followup_stopped: true })
        .eq("id", lead.id);
      await sendWA(senderPhone, "הוסרת מרשימת ההודעות שלנו. תודה, ובהצלחה! 🙏");
      return res.status(200).json({ ok: true, opted_out: true });
    }

    await supabase
      .from(lead.table)
      .update({ followup_stopped: true })
      .eq("id", lead.id);
  } catch (e) {
    console.error("[whatsapp-incoming] Error:", e);
  }

  return res.status(200).json({ ok: true });
}
