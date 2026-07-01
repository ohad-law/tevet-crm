/**
 * GET /api/auth/google/callback
 * Google redirects here after user approves.
 * Exchanges code for tokens, stores refresh_token in Supabase.
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Google OAuth error: ${error}`);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      return res.status(400).send(`Token error: ${tokens.error_description || tokens.error}`);
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase.from("system_settings").upsert(
      {
        setting_key: "google_oauth_tokens",
        setting_value: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: Date.now() + tokens.expires_in * 1000,
        }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" }
    );

    res.send(`
      <html dir="rtl">
        <head><meta charset="utf-8"><title>חיבור הצליח</title></head>
        <body style="font-family:Assistant,sans-serif;text-align:center;padding:60px;">
          <h1 style="color:#16a34a;">החיבור לגוגל הצליח!</h1>
          <p>Google Drive ו-Google Calendar מחוברים למערכת.</p>
          <p>אפשר לסגור את הדף הזה.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("[google-callback]", err);
    res.status(500).send(`Server error: ${err.message}`);
  }
}
