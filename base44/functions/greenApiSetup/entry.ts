import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const GREEN_API_URL = "https://7105.api.greenapi.com";
const ID_INSTANCE = Deno.env.get("GREEN_API_ID_INSTANCE");
const API_TOKEN = Deno.env.get("GREEN_API_TOKEN");

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
    const { action, webhookUrl } = body;

    // Get instance state
    if (action === 'getState') {
      const response = await fetch(
        `${GREEN_API_URL}/waInstance${ID_INSTANCE}/getStateInstance/${API_TOKEN}`
      );
      const data = await response.json();
      return Response.json(data);
    }

    // Get settings
    if (action === 'getSettings') {
      const response = await fetch(
        `${GREEN_API_URL}/waInstance${ID_INSTANCE}/getSettings/${API_TOKEN}`
      );
      const data = await response.json();
      return Response.json(data);
    }

    // Set webhook URL
    if (action === 'setWebhook') {
      const response = await fetch(
        `${GREEN_API_URL}/waInstance${ID_INSTANCE}/setSettings/${API_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: webhookUrl,
            // Set the API key as the authorization header
            webhookUrlToken: "a68fe27812194283b5c153f17aace541",
            delaySendMessagesMilliseconds: 0,
            markIncomingMessagesReaded: "yes",
            markIncomingMessagesReadedOnReply: "yes",
            outgoingWebhook: "no",
            outgoingMessageWebhook: "no",
            outgoingAPIMessageWebhook: "no",
            incomingWebhook: "yes",
            deviceWebhook: "no",
            statusInstanceWebhook: "no",
            stateWebhook: "no",
            enableMessagesHistory: "no",
            keepOnlineStatus: "yes"
          })
        }
      );
      const data = await response.json();
      return Response.json(data);
    }

    // Send test message
    if (action === 'sendTest') {
      const { phone, message } = body;
      const chatId = phone.startsWith('972') ? `${phone}@c.us` : `972${phone.replace(/^0/, '')}@c.us`;
      
      const response = await fetch(
        `${GREEN_API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: chatId,
            message: message || "🤖 בדיקת חיבור מהסוכן - הכל עובד!"
          })
        }
      );
      const data = await response.json();
      return Response.json(data);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Green API setup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});