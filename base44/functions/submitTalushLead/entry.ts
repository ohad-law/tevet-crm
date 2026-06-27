import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const data = await req.json();
        
        const { 
            full_name, 
            phone, 
            email,
            work_duration,
            workplace,
            job_role,
            employment_status,
            days_per_week,
            hours_per_day,
            salary_type,
            main_concern,
            uploaded_files,
            source
        } = data;

        // Validate required fields
        if (!full_name || !phone) {
            return Response.json({ success: false, error: "שם וטלפון הם שדות חובה" }, { status: 400 });
        }

        // Create lead using service role (no auth required)
        const leadData = {
            full_name,
            phone,
            email: email || null,
            work_duration: work_duration || null,
            workplace: workplace || null,
            job_role: job_role || null,
            employment_status: employment_status || null,
            days_per_week: days_per_week ? Number(days_per_week) : null,
            hours_per_day: hours_per_day ? Number(hours_per_day) : null,
            salary_type: salary_type || null,
            main_concern: main_concern || null,
            uploaded_files: uploaded_files && uploaded_files.length > 0 ? uploaded_files : [],
            source: source || "landing_page",
            status: "חדש"
        };

        const lead = await base44.asServiceRole.entities.LeadTalush.create(leadData);
        
        // Send WhatsApp notification
        try {
            const GREEN_API_ID = Deno.env.get("GREEN_API_ID_INSTANCE");
            const GREEN_API_TOKEN = Deno.env.get("GREEN_API_TOKEN");
            const ADMIN_PHONE = "972542274497";

            if (GREEN_API_ID && GREEN_API_TOKEN) {
                // Build file list if exists
                const filesInfo = uploaded_files && uploaded_files.length > 0 
                    ? `\n📎 *קבצים מצורפים (${uploaded_files.length}):*\n${uploaded_files.map(f => `   • ${f.name}\n     ${f.url}`).join('\n')}`
                    : '';

                const message = `🔔 *ליד חדש - בדיקת תלוש שכר*

👤 *שם:* ${full_name}
📱 *טלפון:* ${phone}
${email ? `📧 *אימייל:* ${email}` : ''}

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
                
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: `${ADMIN_PHONE}@c.us`,
                        message: message
                    })
                });
            }
        } catch (whatsappError) {
            console.error("WhatsApp notification failed:", whatsappError);
            // Don't fail the request if WhatsApp fails
        }

        return Response.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error("Error creating lead:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});