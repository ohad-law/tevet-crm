import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        // Get lead data from automation payload
        const leadData = body.data;
        const leadId = body.event?.entity_id;
        
        if (!leadData || !leadData.phone) {
            console.log("No lead data or phone number provided");
            return Response.json({ error: 'No phone number' }, { status: 400 });
        }

        // Format phone number for WhatsApp
        let phone = leadData.phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) {
            phone = '972' + phone.substring(1);
        }

        const greenApiToken = Deno.env.get("GREEN_API_TOKEN");
        const greenApiInstance = Deno.env.get("GREEN_API_ID_INSTANCE");

        if (!greenApiToken || !greenApiInstance) {
            console.error("Green API credentials not configured");
            return Response.json({ error: 'WhatsApp not configured' }, { status: 500 });
        }

        // Prepare the greeting message (same as agent's whatsapp_greeting but personalized)
        const greetingMessage = `שלום ${leadData.full_name || ''}! 👋

תודה שפנית למשרד *עו"ד טבת* - מומחים לדיני עבודה בישראל.

אנו, צוות משרד עו"ד טבת, מתמחים באופן בלעדי ומוביל בדיני עבודה, ומייצגים עובדים ומעסיקים בישראל.
ייחודנו טמון בשילוב ידע מעמיק ופרקטי: עורך הדין טבת הוא גם *בודק שכר מוסמך מטעם משרד העבודה*.

*אתה כעת בידיים המקצועיות והטובות ביותר!* ✅

כדי שנוכל להעניק לך את הטיפול המהיר והאפקטיבי ביותר, אשמח לאסוף ממך כעת מספר פרטים קצרים.

קודם כל, מה שמך המלא?`;

        // Send the greeting via WhatsApp
        const whatsappResponse = await fetch(
            `https://api.green-api.com/waInstance${greenApiInstance}/sendMessage/${greenApiToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: `${phone}@c.us`,
                    message: greetingMessage
                })
            }
        );

        const whatsappResult = await whatsappResponse.json();
        console.log("WhatsApp greeting sent:", whatsappResult);

        // Update lead status
        if (leadId) {
            await base44.asServiceRole.entities.LeadTalush.update(leadId, {
                bot_status: 'בשיחה פעילה',
                last_bot_interaction: new Date().toISOString()
            });
        }

        return Response.json({ 
            success: true, 
            whatsapp_result: whatsappResult
        });

    } catch (error) {
        console.error("Error initiating bot conversation:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});