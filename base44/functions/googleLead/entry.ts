import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    console.log("googleLead - Request received, method:", req.method, "URL:", req.url);
    
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Handle GET requests (for testing)
    if (req.method === 'GET') {
        return Response.json(
            { status: 'ok', message: 'googleLead endpoint is working! Use POST to submit leads.' },
            { headers: corsHeaders }
        );
    }

    try {
        const base44 = createClientFromRequest(req);
        const leadData = await req.json();

        console.log("Received lead data:", JSON.stringify(leadData));

        // Verify webhook secret
        const expectedSecret = "FB1EAdWbHo0kSeCr3T!";
        if (leadData.webhookSecret !== expectedSecret) {
            console.log("Secret mismatch! Got:", leadData.webhookSecret);
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const fullName = leadData.fullName || leadData.full_name || '';
        const phone = leadData.phone || '';
        const email = leadData.email || '';

        if (!fullName || !phone) {
            return Response.json({ error: 'Missing name or phone' }, { status: 400 });
        }

        // Check for duplicate
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone: String(phone) });
        if (existingLeads && existingLeads.length > 0) {
            return Response.json({ success: true, message: 'Lead already exists', leadId: existingLeads[0].id });
        }

        // Create lead
        const newLead = await base44.asServiceRole.entities.Lead.create({
            full_name: fullName,
            email: email,
            phone: String(phone),
            source: 'Google Ads',
            status: 'חדש',
            first_contact_date: new Date().toISOString().split('T')[0],
            notes: `קיבל קנס: ${leadData.receivedFine || 'לא צוין'}\nגובה: ${leadData.fineAmount || 'לא צוין'}\nשילם: ${leadData.alreadyPaid || 'לא צוין'}`
        });

        console.log("Lead created:", newLead.id);
        return Response.json({ success: true, leadId: newLead.id });

    } catch (error) {
        console.error("Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});