import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Webhook לקבלת לידים מ-Google Sheets (קמפיין שתפ יניב)
Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        // הנתונים שמגיעים מהגיליון
        const {
            facebook_lead_id,
            created_date,
            full_name,
            phone,
            work_duration,
            salary_cash,
            overtime,
            termination_reason,
            drive_link,
            status
        } = body;

        // וידוא שדות חובה
        if (!full_name || !phone) {
            return Response.json({ 
                success: false, 
                error: 'חסרים שדות חובה: שם מלא וטלפון' 
            }, { status: 400 });
        }

        // המרת טלפון ל-string (במקרה שמגיע כמספר)
        const phoneStr = String(phone).trim();

        // בדיקה אם הליד כבר קיים לפי טלפון
        const existingLeads = await base44.asServiceRole.entities.LeadShatafYaniv.filter({ phone: phoneStr });
        
        if (existingLeads && existingLeads.length > 0) {
            // עדכון ליד קיים
            const existingLead = existingLeads[0];
            await base44.asServiceRole.entities.LeadShatafYaniv.update(existingLead.id, {
                full_name: String(full_name).trim(),
                work_duration: work_duration || existingLead.work_duration,
                salary_cash: salary_cash || existingLead.salary_cash,
                overtime: overtime || existingLead.overtime,
                termination_reason: termination_reason || existingLead.termination_reason,
                drive_link: drive_link || existingLead.drive_link,
                facebook_lead_id: facebook_lead_id || existingLead.facebook_lead_id
            });

            return Response.json({ 
                success: true, 
                message: 'ליד עודכן בהצלחה',
                lead_id: existingLead.id,
                action: 'updated'
            }, {
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // יצירת ליד חדש
        const newLead = await base44.asServiceRole.entities.LeadShatafYaniv.create({
            full_name: String(full_name).trim(),
            phone: phoneStr,
            work_duration: work_duration || '',
            salary_cash: salary_cash || '',
            overtime: overtime || '',
            termination_reason: termination_reason || '',
            drive_link: drive_link || '',
            facebook_lead_id: facebook_lead_id || '',
            status: 'חדש',
            is_viewed: false
        });

        return Response.json({ 
            success: true, 
            message: 'ליד נוצר בהצלחה',
            lead_id: newLead.id,
            action: 'created'
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Error processing lead:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { 
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
});