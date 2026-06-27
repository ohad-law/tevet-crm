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
    // Note: We don't block on auth here because this might be called from 
    // contexts where the user is logged in but we just want to fire-and-forget,
    // or triggered by internal processes. 
    // However, for security, we should ensure there's a user.
    const user = await base44.auth.me().catch(() => null);
    
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, action, details } = await req.json();

    // 1. Get Admin Phone from System Settings (with fallback to default number)
    const allSettings = await base44.entities.SystemSettings.list();
    const adminPhoneSetting = allSettings.find(s => s.setting_key === 'admin_notification_phone');
    
    // Default to the provided admin number if no setting is found
    const targetPhone = (adminPhoneSetting && adminPhoneSetting.setting_value) 
        ? adminPhoneSetting.setting_value 
        : '0542274497'; // Updated default admin number
    const chatId = targetPhone.startsWith('972') ? `${targetPhone}@c.us` : `972${targetPhone.replace(/^0/, '')}@c.us`;

    // 2. Format Message
    const emojiMap = {
        'create': '✨',
        'update': '📝',
        'delete': '🗑️',
        'archive': '📦',
        'status_change': '🔄'
    };

    const emoji = emojiMap[action] || '📢';
    
    let messageText = `*התראה מערכת CRM* ${emoji}\n\n`;
    messageText += `*פעולה:* ${action}\n`;
    messageText += `*ישות:* ${entity}\n`;
    messageText += `*משתמש:* ${user.full_name}\n`;
    messageText += `-------------------\n`;
    messageText += `${details}\n`;
    messageText += `-------------------\n`;
    messageText += `⏰ ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    // 3. Send via Green API
    const response = await fetch(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId,
          message: messageText
        })
      }
    );

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Notify Admin Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});