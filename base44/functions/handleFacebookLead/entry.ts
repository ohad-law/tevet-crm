import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    // Reject non-POST methods
    if (req.method !== 'POST') {
        return Response.json({ 
            error: 'Method Not Allowed', 
            message: 'Use POST method with JSON body',
            received_method: req.method 
        }, { 
            status: 405,
            headers: { 'Allow': 'POST, OPTIONS' }
        });
    }

    try {
        // Initialize Base44 client using service role
        const base44 = createClientFromRequest(req);
        
        const leadData = await req.json();

        console.log("Received lead data:", JSON.stringify(leadData));

        // Verify webhook secret - temporarily disabled for debugging
        const expectedSecret = Deno.env.get("FACEBOOK_LEAD_WEBHOOK_SECRET") || "FB1EAdWbHo0kSeCr3T!";
        console.log("Expected secret:", expectedSecret, "Got:", leadData.webhookSecret);
        if (!leadData.webhookSecret || leadData.webhookSecret !== expectedSecret) {
            // Fallback: if env var not set, accept the hardcoded secret
            if (leadData.webhookSecret !== "FB1EAdWbHo0kSeCr3T!") {
                console.log("Secret mismatch!");
                return Response.json({ error: 'Unauthorized - Invalid webhook secret' }, { status: 401 });
            }
        }
        console.log("Secret verified successfully");

        // Support multiple field name formats (English, Hebrew, camelCase, snake_case)
        const fullName = leadData.fullName || leadData.full_name || leadData.name || leadData['שם'] || '';
        const phone = leadData.phone || leadData.Phone || leadData['טלפון'] || '';
        const email = leadData.email || leadData.Email || leadData['אימייל'] || '';
        const receivedFine = leadData.receivedFine || leadData['קיבלת קנס ממשרד העבודה?'] || leadData.received_fine || '';
        const fineAmount = leadData.fineAmount || leadData['מה גובה הקנס?'] || leadData.fine_amount || '';
        const alreadyPaid = leadData.alreadyPaid || leadData['האם כבר שילמת את הקנס?'] || leadData.already_paid || '';

        // Basic validation
        if (!fullName || !phone) {
            console.log("Missing required fields. fullName:", fullName, "phone:", phone);
            return Response.json({ error: 'Missing required lead data (name or phone)' }, { status: 400 });
        }

        // Check for duplicate lead by phone number
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone: String(phone) });
        if (existingLeads && existingLeads.length > 0) {
            console.log("Lead already exists with phone:", phone);
            return Response.json({ success: true, message: 'Lead already exists', leadId: existingLeads[0].id }, { status: 200 });
        }

        // Create a new Lead entity in Base44
        const newLead = await base44.asServiceRole.entities.Lead.create({
            full_name: fullName,
            email: email,
            phone: String(phone),
            source: 'Facebook',
            status: 'חדש',
            first_contact_date: new Date().toISOString().split('T')[0],
            notes: `קיבל קנס ממשרד העבודה: ${receivedFine || 'לא צוין'}\nגובה הקנס: ${fineAmount || 'לא צוין'}\nהאם שילם: ${alreadyPaid || 'לא צוין'}`
        });

        console.log("Lead created successfully:", newLead.id, "Name:", fullName);

        // Send automatic WhatsApp welcome message with guide link
        const GREEN_API_ID = Deno.env.get("GREEN_API_ID_INSTANCE");
        const GREEN_API_TOKEN = Deno.env.get("GREEN_API_TOKEN");
        
        if (GREEN_API_ID && GREEN_API_TOKEN) {
            // Format phone number for WhatsApp (remove leading 0, add 972)
            let whatsappPhone = String(phone).replace(/\D/g, '');
            if (whatsappPhone.startsWith('0')) {
                whatsappPhone = '972' + whatsappPhone.substring(1);
            } else if (!whatsappPhone.startsWith('972')) {
                whatsappPhone = '972' + whatsappPhone;
            }

            const guideUrl = "https://legal-flow-crm-1d774f3f.base44.app/FineGuide";
            
            const welcomeMessage = `היי ${fullName} 👋

תודה שפנית אלינו בעניין הקנס ממשרד העבודה.

לפני שנדבר, הכנו לך מדריך קצר עם 3 דברים חשובים שכל בעל עסק חייב לדעת כשמקבל קנס:
${guideUrl}

📞 ניצור איתך קשר בהקדם לבדוק את המקרה שלך.

בברכה,
משרד עורכי דין`;

            try {
                const whatsappResponse = await fetch(
                    `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chatId: `${whatsappPhone}@c.us`,
                            message: welcomeMessage
                        })
                    }
                );
                
                const whatsappResult = await whatsappResponse.json();
                console.log("WhatsApp message sent:", whatsappResult);
            } catch (whatsappError) {
                console.error("Failed to send WhatsApp message:", whatsappError);
                // Don't fail the whole request if WhatsApp fails
            }
        }

        return Response.json({ success: true, leadId: newLead.id }, { status: 200 });

    } catch (error) {
        console.error("Error handling Facebook lead:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});