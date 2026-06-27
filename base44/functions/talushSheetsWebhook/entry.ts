import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Webhook לקבלת לידים מ-Google Sheets (קמפיין בדיקת תלושים)
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
            full_name,
            phone,
            email,
            work_duration,      // שנות ותק (עמודה E)
            salary_cash,        // שכר במזומן? (עמודה F)
            overtime,           // שעות נוספות? (עמודה G)
            drive_link,         // לינק לדרייב (עמודה H)
            status              // סטטוס (עמודה I)
        } = body;

        // וידוא שדות חובה
        if (!full_name || !phone) {
            return Response.json({ 
                success: false, 
                error: 'חסרים שדות חובה: שם מלא וטלפון' 
            }, { status: 400 });
        }

        // בדיקה אם הליד כבר קיים לפי טלפון
        const existingLeads = await base44.asServiceRole.entities.LeadTalush.filter({ phone: phone });
        
        if (existingLeads && existingLeads.length > 0) {
            // עדכון ליד קיים
            const existingLead = existingLeads[0];
            await base44.asServiceRole.entities.LeadTalush.update(existingLead.id, {
                full_name,
                email: email || existingLead.email,
                work_duration: work_duration || existingLead.work_duration,
                notes: buildNotes(salary_cash, overtime, drive_link, existingLead.notes),
                source: 'google_sheets_talush'
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
        const newLead = await base44.asServiceRole.entities.LeadTalush.create({
            full_name,
            phone,
            email: email || '',
            work_duration: work_duration || '',
            status: 'חדש',
            source: 'google_sheets_talush',
            notes: buildNotes(salary_cash, overtime, drive_link, ''),
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
        console.error('Error processing lead from sheets:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { 
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
});

// פונקציה לבניית הערות מהשדות הנוספים
function buildNotes(salaryCash, overtime, driveLink, existingNotes) {
    const parts = [];
    
    if (existingNotes) parts.push(existingNotes);
    if (salaryCash) parts.push(`שכר במזומן: ${salaryCash}`);
    if (overtime) parts.push(`שעות נוספות: ${overtime}`);
    if (driveLink) parts.push(`לינק לדרייב: ${driveLink}`);
    
    return parts.join('\n');
}