import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // This is called from an entity automation - payload has event + data
    const leadData = body.data;
    if (!leadData) {
      return Response.json({ error: 'No lead data' }, { status: 400 });
    }

    const GREEN_API_ID = Deno.env.get("GREEN_API_ID_INSTANCE");
    const GREEN_API_TOKEN = Deno.env.get("GREEN_API_TOKEN");
    const ADMIN_PHONE = "972542274497";

    if (!GREEN_API_ID || !GREEN_API_TOKEN) {
      console.log("Green API credentials not configured");
      return Response.json({ success: false, error: "WhatsApp not configured" });
    }

    const {
      full_name, phone, email, work_duration, workplace, job_role,
      employment_status, days_per_week, hours_per_day, salary_type,
      main_concern, uploaded_files, source
    } = leadData;

    const filesInfo = uploaded_files && uploaded_files.length > 0
      ? `\n📎 *קבצים (${uploaded_files.length}):*\n${uploaded_files.map(f => `   • ${f.name}`).join('\n')}`
      : '';

    const message = `🔔 *ליד חדש - בדיקת תלוש שכר*

👤 *שם:* ${full_name || 'לא צוין'}
📱 *טלפון:* ${phone || 'לא צוין'}
${email ? `📧 *אימייל:* ${email}` : ''}
${source ? `📍 *מקור:* ${source}` : ''}

📋 *פרטי העסקה:*
${employment_status ? `• מצב: ${employment_status}` : ''}
${work_duration ? `• ותק: ${work_duration}` : ''}
${workplace ? `• מקום עבודה: ${workplace}` : ''}
${job_role ? `• תפקיד: ${job_role}` : ''}
${days_per_week ? `• ימים בשבוע: ${days_per_week}` : ''}
${hours_per_day ? `• שעות ביום: ${hours_per_day}` : ''}
${salary_type ? `• סוג שכר: ${salary_type}` : ''}

${main_concern ? `💬 *בעיה עיקרית:*\n${main_concern}` : ''}
${filesInfo}

⏰ ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const url = `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${ADMIN_PHONE}@c.us`,
        message: message
      })
    });

    const result = await response.json();
    console.log("WhatsApp admin notification sent:", result);

    return Response.json({ success: true, messageId: result.idMessage });
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});