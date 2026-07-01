/**
 * POST /api/googleCalendar
 * Google Calendar operations: list_events, sync_hearing, create_event
 */
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getAccessToken(supabase) {
  const { data } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "google_oauth_tokens")
    .maybeSingle();

  if (!data?.setting_value) return null;

  const tokens = typeof data.setting_value === "string" ? JSON.parse(data.setting_value) : data.setting_value;

  if (Date.now() < tokens.expiry_date - 60000) {
    return tokens.access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const newTokens = await res.json();
  if (newTokens.error) return null;

  const updated = {
    access_token: newTokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: Date.now() + newTokens.expires_in * 1000,
  };

  await supabase
    .from("system_settings")
    .update({ setting_value: JSON.stringify(updated), updated_at: new Date().toISOString() })
    .eq("setting_key", "google_oauth_tokens");

  return newTokens.access_token;
}

async function calendarApi(accessToken, path, options = {}) {
  const base = "https://www.googleapis.com/calendar/v3";
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  return res.json();
}

async function listEvents(supabase, timeMin, timeMax) {
  const token = await getAccessToken(supabase);
  if (!token) return { events: [], error: "Not connected" };

  const params = new URLSearchParams({
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const data = await calendarApi(token, `/calendars/primary/events?${params}`);
  return { events: data.items || [] };
}

async function syncHearing(supabase, hearing, caseName, caseNumber) {
  const token = await getAccessToken(supabase);
  if (!token) return { error: "Not connected" };

  const event = {
    summary: `דיון: ${caseName} (${caseNumber})`,
    description: [
      hearing.court ? `בית משפט: ${hearing.court}` : "",
      hearing.judge ? `שופט/ת: ${hearing.judge}` : "",
      hearing.notes || "",
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: hearing.date_time || `${hearing.date}T09:00:00`,
      timeZone: "Asia/Jerusalem",
    },
    end: {
      dateTime: hearing.end_time || `${hearing.date}T10:00:00`,
      timeZone: "Asia/Jerusalem",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 1440 },
      ],
    },
  };

  const data = await calendarApi(token, "/calendars/primary/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  return { eventId: data.id, htmlLink: data.htmlLink };
}

async function createEvent(supabase, eventData) {
  const token = await getAccessToken(supabase);
  if (!token) return { error: "Not connected" };

  const data = await calendarApi(token, "/calendars/primary/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });

  return { eventId: data.id, htmlLink: data.htmlLink };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, timeMin, timeMax, hearing, caseName, caseNumber, eventData } = req.body || {};
  const supabase = supabaseAdmin();

  try {
    let result;
    switch (action) {
      case "list_events":
        result = await listEvents(supabase, timeMin, timeMax);
        break;
      case "sync_hearing":
        result = await syncHearing(supabase, hearing, caseName, caseNumber);
        break;
      case "create_event":
        result = await createEvent(supabase, eventData);
        break;
      default:
        return res.status(400).json({ data: { error: `Unknown action: ${action}` } });
    }
    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("[googleCalendar]", err);
    return res.status(200).json({ data: { error: err.message } });
  }
}
