import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { differenceInDays, parseISO, startOfDay, addDays } from 'npm:date-fns@3.6.0';

const GREEN_API_URL = "https://7105.api.greenapi.com";
const ID_INSTANCE = Deno.env.get("GREEN_API_ID_INSTANCE");
const API_TOKEN = Deno.env.get("GREEN_API_TOKEN");

async function sendWhatsApp(phone, message) {
    if (!ID_INSTANCE || !API_TOKEN) {
        console.error("Missing Green API credentials");
        return { error: "Missing credentials" };
    }
    const chatId = phone.startsWith('972') ? `${phone}@c.us` : `972${phone.replace(/^0/, '')}@c.us`;
    
    try {
        const url = `${GREEN_API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, message })
        });
        return await response.json();
    } catch (error) {
        console.error("Green API Error:", error);
        return { error: error.message };
    }
}

Deno.serve(async (req) => {
    try {
        // Handle CORS
        if (req.method === 'OPTIONS') {
             return new Response(null, {
                 headers: {
                     'Access-Control-Allow-Origin': '*',
                     'Access-Control-Allow-Methods': 'POST, OPTIONS',
                     'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                 }
             });
        }

        // Initialize Client (Admin/Service Role context usually required for cron jobs, 
        // but here we might be called by an authenticated admin or a scheduler)
        // For scheduler, we might need a service role key if no user token is present.
        // For now, assuming called via Dashboard or authorized request.
        
        // Use service role if available (for CRON), otherwise request auth
        let base44;
        try {
            base44 = createClientFromRequest(req);
            await base44.auth.me(); // Verify user if possible
        } catch (e) {
             // Fallback to service role if configured (best for Cron)
             /* 
             base44 = createClient({ serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY") });
             */
             // Re-throw for now as we expect manual trigger or authenticated call
             return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get Settings
        const allSettings = await base44.entities.SystemSettings.list();
        
        const adminPhone = allSettings.find(s => s.setting_key === 'admin_notification_phone')?.setting_value || '0542274497';
        const alertDaysSetting = allSettings.find(s => s.setting_key === 'hearing_alert_days')?.setting_value;
        
        // Default to 1 day before if not set
        const alertDays = alertDaysSetting 
            ? alertDaysSetting.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
            : [1];

        if (alertDays.length === 0) {
            return Response.json({ message: "No alert days configured" });
        }

        // 2. Fetch Active Cases with Hearings
        const cases = await base44.entities.Case.list(); // Ideally filter by status if possible
        const activeCases = cases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין' && c.hearings && c.hearings.length > 0);
        
        // 3. Fetch Notification Logs (to prevent duplicates)
        // Optimization: In a real large app, we'd query logs for specific dates, 
        // but here we fetch all or filter by range if API supports it.
        const logs = await base44.entities.NotificationLog.list();
        
        const today = startOfDay(new Date());
        let sentCount = 0;
        let errors = [];

        for (const caseItem of activeCases) {
            for (const hearing of caseItem.hearings) {
                if (!hearing.date) continue;
                
                const hearingDate = parseISO(hearing.date);
                const hearingStartOfDay = startOfDay(hearingDate);
                
                // Check if hearing is in the future
                if (hearingStartOfDay < today) continue;

                const daysUntilHearing = differenceInDays(hearingStartOfDay, today);

                // Check if today matches one of the alert intervals
                if (alertDays.includes(daysUntilHearing)) {
                    const alertType = `${daysUntilHearing}_days_before`;
                    
                    // Check if already sent
                    const alreadySent = logs.some(log => 
                        log.case_id === caseItem.id && 
                        log.hearing_date === hearing.date && 
                        log.alert_type === alertType
                    );

                    if (!alreadySent) {
                        // SEND ALERT
                        const message = `*תזכורת לדיון קרוב* ⚖️\n\n` +
                            `*תיק:* ${caseItem.case_name} (${caseItem.case_number})\n` +
                            `*תאריך:* ${new Date(hearing.date).toLocaleDateString('he-IL')}\n` +
                            `*תיאור:* ${hearing.description || 'ללא תיאור'}\n` +
                            `*מועד:* בעוד ${daysUntilHearing === 0 ? 'היום' : daysUntilHearing + ' ימים'}\n\n` +
                            `נשלח אוטומטית ממערכת CRM`;

                        const res = await sendWhatsApp(adminPhone, message);
                        
                        if (!res.error) {
                            // Log the notification
                            await base44.entities.NotificationLog.create({
                                case_id: caseItem.id,
                                hearing_date: hearing.date,
                                alert_type: alertType,
                                sent_at: new Date().toISOString(),
                                recipient: adminPhone
                            });
                            sentCount++;
                        } else {
                            errors.push({ case: caseItem.case_number, error: res.error });
                        }
                    }
                }
            }
        }

        return Response.json({ 
            success: true, 
            sent_count: sentCount, 
            checked_cases: activeCases.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});