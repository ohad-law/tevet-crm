import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        // 1. Only allow POST requests
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const base44 = createClientFromRequest(req);
        
        // 2. Parse incoming data from ManyChat
        // ManyChat should send a JSON body with keys matching these or mapped in the External Request
        const data = await req.json();

        // 3. Validate basic requirements
        if (!data.phone && !data.email) {
            return Response.json({ error: 'Missing phone or email' }, { status: 400 });
        }

        // 4. Create the Lead in Base44
        // We use asServiceRole because ManyChat is an external system calling us
        const newLead = await base44.asServiceRole.entities.Lead.create({
            full_name: data.full_name || data.name || data.first_name + ' ' + data.last_name || 'ליד מ-ManyChat',
            phone: data.phone || data.phone_number || '',
            email: data.email || '',
            source: 'Facebook', // As requested (Facebook campaign via ManyChat)
            source_other: 'ManyChat Integration',
            campaign_name: data.campaign_name || 'ManyChat Auto',
            status: 'חדש',
            notes: data.notes || '',
            lead_score: 50,
            first_contact_date: new Date().toISOString().split('T')[0]
        });

        return Response.json({ success: true, lead_id: newLead.id });

    } catch (error) {
        console.error('ManyChat Webhook Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});