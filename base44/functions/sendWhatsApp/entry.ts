import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GREEN_API_URL = "https://7105.api.greenapi.com";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, message } = body;

    if (!phone) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    const ID_INSTANCE = Deno.env.get("GREEN_API_ID_INSTANCE");
    const API_TOKEN = Deno.env.get("GREEN_API_TOKEN");

    if (!ID_INSTANCE || !API_TOKEN) {
      return Response.json({ error: 'Green API not configured' }, { status: 500 });
    }

    // Format phone number to international format
    let chatId = phone;
    if (phone.startsWith('0')) {
      chatId = `972${phone.substring(1)}@c.us`;
    } else if (phone.startsWith('972')) {
      chatId = `${phone}@c.us`;
    } else if (phone.startsWith('+')) {
      chatId = `${phone.substring(1)}@c.us`;
    } else if (phone.match(/^\d{9,10}$/)) {
      chatId = `972${phone}@c.us`;
    } else {
      chatId = `${phone}@c.us`;
    }

    const response = await fetch(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId,
          message: message || "היי, קיבלתי את הפנייה שלך ואשמח לעזור! אחזור אליך בהקדם."
        })
      }
    );

    const data = await response.json();
    
    if (data.idMessage) {
      return Response.json({ success: true, messageId: data.idMessage });
    } else {
      return Response.json({ success: false, error: data }, { status: 500 });
    }

  } catch (error) {
    console.error('sendWhatsApp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});