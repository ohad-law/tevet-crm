import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GREEN_API_URL = "https://7105.api.greenapi.com";
const ID_INSTANCE = Deno.env.get("GREEN_API_ID_INSTANCE");
const API_TOKEN = Deno.env.get("GREEN_API_TOKEN");

async function sendWhatsAppMessage(chatId, message) {
  const url = `${GREEN_API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: chatId,
      message: message
    })
  });
  
  return await response.json();
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    const body = await req.json();
    
    // Green API webhook structure
    const { typeWebhook, senderData, messageData } = body;
    
    // AUTHENTICATION: Check for API Key (Webhook) OR Base44 Admin (Dashboard Test)
    const targetKey = 'a68fe27812194283b5c153f17aace541';
    let isAuthorized = false;

    // 1. Check API Key (for Green API)
    const possibleKeys = [
      req.headers.get('api_key'),
      req.headers.get('api-key'),
      req.headers.get('x-api-key')
    ];
    const authHeader = req.headers.get('Authorization');

    if (possibleKeys.some(k => k && k.trim() === targetKey)) {
      isAuthorized = true;
    } else if (authHeader && authHeader.includes(targetKey)) {
      isAuthorized = true;
    }

    // 2. If not API Key, check for Base44 Admin Session (for Dashboard testing)
    if (!isAuthorized) {
        try {
            // Attempt to create client from request to validate user session
            const authClient = createClientFromRequest(req);
            const user = await authClient.auth.me();
            if (user && user.role === 'admin') {
                isAuthorized = true;
                console.log('Authenticated via Base44 Admin Session');
            }
        } catch (e) {
            // Ignore errors here (e.g. invalid headers from Green API)
        }
    }

    if (!isAuthorized) {
      return Response.json({ 
        error: 'Unauthorized', 
        message: 'Could not find the expected API key or valid Admin session'
      }, { status: 401 });
    }

    // Only process incoming messages
    if (typeWebhook !== 'incomingMessageReceived') {
      return Response.json({ status: 'ignored', reason: 'not an incoming message' });
    }

    const chatId = senderData?.chatId;
    const senderName = senderData?.senderName || 'משתמש';
    const messageText = messageData?.textMessageData?.textMessage || 
                        messageData?.extendedTextMessageData?.text || '';

    if (!chatId || !messageText) {
      return Response.json({ status: 'ignored', reason: 'no chat or message' });
    }

    // Skip group messages (optional)
    if (chatId.includes('@g.us')) {
      return Response.json({ status: 'ignored', reason: 'group message' });
    }

    console.log(`Received message from ${senderName} (${chatId}): ${messageText}`);

    // Initialize Base44 client with clean headers to avoid Auth conflict
    const cleanHeaders = new Headers(req.headers);
    cleanHeaders.delete('authorization');
    
    // We create a new request object to initialize the SDK
    // Note: We don't pass the body here as createClientFromRequest mainly uses headers/env
    const cleanReq = new Request(req.url, {
        method: req.method,
        headers: cleanHeaders,
    });
    
    const base44 = createClientFromRequest(cleanReq);

    // Get or create conversation for this chat
    let conversations = [];
    try {
      conversations = await base44.asServiceRole.agents.listConversations({
        agent_name: "office_manager"
      });
    } catch (e) {
      console.log("Error listing conversations:", e);
    }

    // Find existing conversation by WhatsApp chatId (stored in metadata)
    let conversation = conversations.find(c => c.metadata?.whatsapp_chat_id === chatId);

    if (!conversation) {
      // Create new conversation
      conversation = await base44.asServiceRole.agents.createConversation({
        agent_name: "office_manager",
        metadata: {
          name: senderName,
          whatsapp_chat_id: chatId,
          phone: chatId.replace('@c.us', ''),
          source: 'whatsapp'
        }
      });
      console.log("Created new conversation:", conversation.id);
    }

    // Add user message to conversation
    const updatedConversation = await base44.asServiceRole.agents.addMessage(conversation, {
      role: "user",
      content: messageText
    });

    // Wait for agent response (poll for completion)
    let agentResponse = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentConv = await base44.asServiceRole.agents.getConversation(conversation.id);
      const messages = currentConv.messages || [];
      
      // Find the last assistant message
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
        // Check if message is complete (not streaming)
        if (!lastMessage.is_streaming) {
          agentResponse = lastMessage.content;
          break;
        }
      }
      
      attempts++;
    }

    if (agentResponse) {
      // Send response back via WhatsApp
      await sendWhatsAppMessage(chatId, agentResponse);
      console.log(`Sent response to ${chatId}`);
      
      return Response.json({ 
        status: 'success', 
        message_sent: true,
        conversation_id: conversation.id
      });
    } else {
      // Timeout - send error message
      await sendWhatsAppMessage(chatId, "מצטער, נתקלתי בבעיה. אנא נסה שוב.");
      
      return Response.json({ 
        status: 'timeout', 
        message: 'Agent did not respond in time'
      });
    }

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});