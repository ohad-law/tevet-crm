import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINBOT_API_BASE = 'https://api.finbotai.co.il';

async function finbotRequest(endpoint, method = 'GET', body = null) {
    const secret = Deno.env.get('FINBOT_API_SECRET');
    if (!secret) {
        throw new Error('FINBOT_API_SECRET is not configured');
    }

    const options = {
        method,
        headers: {
            'secret': secret,
            'Content-Type': 'application/json'
        }
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${FINBOT_API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Finbot API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        // פעולה: משיכת נתוני דשבורד לחודש הנוכחי
        if (action === 'getDashboardData') {
            const data = await finbotRequest('/reports/app-dashboard-data-current-month');
            return Response.json({ success: true, data });
        }

        // פעולה: משיכת רשימת חשבונות
        if (action === 'getAccounts') {
            const data = await finbotRequest('/accounts');
            return Response.json({ success: true, data });
        }

        // פעולה: משיכת היסטוריית חשבונות
        if (action === 'getAccountHistory') {
            const data = await finbotRequest('/account-history');
            return Response.json({ success: true, data });
        }

        // פעולה: בדיקת חיבור
        if (action === 'testConnection') {
            try {
                const data = await finbotRequest('/accounts');
                return Response.json({ success: true, message: 'החיבור ל-Finbot תקין!', accountsCount: data?.length || 0 });
            } catch (error) {
                return Response.json({ success: false, message: `שגיאת חיבור: ${error.message}` });
            }
        }

        return Response.json({ error: 'Unknown action. Use: getDashboardData, getAccounts, getAccountHistory, testConnection' }, { status: 400 });

    } catch (error) {
        console.error('Finbot sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});