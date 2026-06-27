import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// This function handles incoming webhooks from Facebook Lead Ads
// You need to set up the webhook in your Meta Developer App
// URL: https://<your-app-url>/functions/facebookWebhook
// Verify Token: you-choose-a-token (e.g. "base44_leads")

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        
        // 1. Verification Request (GET)
        if (req.method === 'GET') {
            const mode = url.searchParams.get('hub.mode');
            const token = url.searchParams.get('hub.verify_token');
            const challenge = url.searchParams.get('hub.challenge');
            
            // Change 'base44_leads' to whatever verify token you configure in Facebook
            if (mode === 'subscribe' && token === 'base44_leads') {
                return new Response(challenge, { status: 200 });
            } else {
                return new Response('Forbidden', { status: 403 });
            }
        }

        // 2. Event Notification (POST)
        if (req.method === 'POST') {
            const body = await req.json();
            const base44 = createClientFromRequest(req);
            
            // Use service role because webhook is unauthenticated user
            const adminClient = base44.asServiceRole;

            if (body.object === 'page') {
                for (const entry of body.entry) {
                    for (const change of entry.changes) {
                        if (change.field === 'leadgen') {
                            const leadId = change.value.leadgen_id;
                            const formId = change.value.form_id;
                            
                            // In a real implementation, we need to fetch the lead details using Graph API
                            // This requires a Page Access Token
                            const PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
                            
                            if (PAGE_ACCESS_TOKEN) {
                                try {
                                    const fbRes = await fetch(`https://graph.facebook.com/v18.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`);
                                    const leadData = await fbRes.json();
                                    
                                    if (leadData && leadData.field_data) {
                                        // Parse fields (Facebook returns array of name/values)
                                        const fields = {};
                                        leadData.field_data.forEach(f => fields[f.name] = f.values[0]);
                                        
                                        // Create Lead in Base44
                                        await adminClient.entities.Lead.create({
                                            full_name: fields.full_name || fields.name || "New Lead",
                                            email: fields.email || "",
                                            phone: fields.phone_number || "",
                                            source: "Facebook",
                                            status: "חדש",
                                            campaign_name: formId, // storing form ID as campaign for now
                                            notes: `Lead ID: ${leadId}`
                                        });
                                    }
                                } catch (e) {
                                    console.error("Failed to fetch lead from FB:", e);
                                }
                            } else {
                                console.log("Missing FACEBOOK_PAGE_ACCESS_TOKEN, skipping lead fetch");
                                // We can still log it or create a placeholder lead
                                await adminClient.entities.Lead.create({
                                    full_name: "New Facebook Lead (Pending Details)",
                                    phone: "0000000000",
                                    source: "Facebook",
                                    status: "חדש",
                                    notes: `Lead ID: ${leadId}. Configure FACEBOOK_PAGE_ACCESS_TOKEN to fetch details.`
                                });
                            }
                        }
                    }
                }
                return new Response('EVENT_RECEIVED', { status: 200 });
            }
            return new Response('Not a page event', { status: 404 });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});