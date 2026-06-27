import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// מיפוי: סטטוס תיק -> משימות אוטומטיות ליצירה
const STATUS_TASK_TEMPLATES = {
  'עריכת כתב תביעה': [
    { description: 'עריכת כתב תביעה מלא', priority: 'גבוה', days_until_due: 14, task_type: 'מסמך משפטי' },
    { description: 'בדיקת חישוב סכום התביעה', priority: 'גבוה', days_until_due: 7, task_type: 'חישוב' }
  ],
  'מעקב מספר הליך בנט': [
    { description: 'הגשת כתב תביעה לבית המשפט ומעקב אחר מספר הליך', priority: 'דחוף', days_until_due: 3, task_type: 'הגשה' }
  ],
  'מסירה אישית/דואר ישראל': [
    { description: 'ביצוע המצאה לנתבע - אישי/דואר ישראל', priority: 'דחוף', days_until_due: 7, task_type: 'המצאה' },
    { description: 'תיעוד אישור מסירה בתיק', priority: 'רגיל', days_until_due: 14, task_type: 'תיעוד' }
  ],
  'הודעה על המצאה': [
    { description: 'הגשת הודעה על ביצוע המצאה לבית המשפט', priority: 'דחוף', days_until_due: 5, task_type: 'הגשה' }
  ],
  'תצהיר גילוי מסמכים': [
    { description: 'הכנת תצהיר גילוי מסמכים - איסוף כל המסמכים הרלוונטיים', priority: 'גבוה', days_until_due: 21, task_type: 'מסמך משפטי' },
    { description: 'שליחת תצהיר גילוי מסמכים לצד שכנגד', priority: 'גבוה', days_until_due: 30, task_type: 'שליחה' }
  ],
  'תצהיר עדות ראשית': [
    { description: 'פגישה עם לקוח לצורך הכנת תצהיר עדות ראשית', priority: 'גבוה', days_until_due: 14, task_type: 'פגישה' },
    { description: 'עריכת תצהיר עדות ראשית', priority: 'גבוה', days_until_due: 21, task_type: 'מסמך משפטי' }
  ],
  'הוכחות': [
    { description: 'הכנה לדיון הוכחות - ריענון עדים וחומר', priority: 'דחוף', days_until_due: 7, task_type: 'הכנה' },
    { description: 'בדיקת כל המסמכים והראיות לדיון', priority: 'גבוה', days_until_due: 3, task_type: 'בדיקה' }
  ],
  'סיכומים': [
    { description: 'עריכת סיכומי טיעון בכתב', priority: 'דחוף', days_until_due: 21, task_type: 'מסמך משפטי' }
  ],
  'פסק דין': [
    { description: 'קריאת פסק הדין וסיכום לעו"ד', priority: 'דחוף', days_until_due: 2, task_type: 'עיון' },
    { description: 'עדכון לקוח על תוצאת פסק הדין', priority: 'דחוף', days_until_due: 2, task_type: 'תקשורת' }
  ]
};

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

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
    const payload = await req.json();

    // Support both direct call and entity automation trigger
    const { event, data, old_data } = payload;

    let caseData = data;
    let oldCaseData = old_data;

    // If called directly (manual trigger), data is in payload.case_id / payload.new_status
    if (!caseData && payload.case_id) {
      caseData = await base44.asServiceRole.entities.Case.list().then(cases =>
        cases.find(c => c.id === payload.case_id)
      );
      oldCaseData = { status: payload.old_status };
    }

    if (!caseData) {
      return Response.json({ error: 'No case data provided' }, { status: 400 });
    }

    const newStatus = caseData.status;
    const oldStatus = oldCaseData?.status;

    // Only act if status actually changed
    if (newStatus === oldStatus) {
      return Response.json({ message: 'Status unchanged, no tasks created' });
    }

    const templates = STATUS_TASK_TEMPLATES[newStatus];
    if (!templates || templates.length === 0) {
      return Response.json({ message: `No templates for status: ${newStatus}` });
    }

    // Create tasks from templates
    const createdTasks = [];
    for (const template of templates) {
      const task = await base44.asServiceRole.entities.Task.create({
        description: template.description,
        case_id: caseData.id,
        priority: template.priority,
        due_date: addDays(template.days_until_due),
        status: 'לביצוע',
        assigned_to: caseData.assigned_to || '',
        task_type: template.task_type,
        auto_deadline_info: `נוצר אוטומטית בעקבות מעבר לסטטוס "${newStatus}"`
      });
      createdTasks.push(task);
    }

    // Send WhatsApp notification
    const GREEN_API_URL = "https://7105.api.greenapi.com";
    const ID_INSTANCE = Deno.env.get("GREEN_API_ID_INSTANCE");
    const API_TOKEN = Deno.env.get("GREEN_API_TOKEN");

    const allSettings = await base44.asServiceRole.entities.SystemSettings.list();
    const adminPhoneSetting = allSettings.find(s => s.setting_key === 'admin_notification_phone');
    const targetPhone = adminPhoneSetting?.setting_value || '0542274497';
    const chatId = `972${targetPhone.replace(/^0/, '')}@c.us`;

    const message = `🤖 *אוטומציה - משימות חדשות*\n\n` +
      `📁 תיק: *${caseData.case_name}* (#${caseData.case_number})\n` +
      `🔄 סטטוס חדש: *${newStatus}*\n\n` +
      `✅ נוצרו ${createdTasks.length} משימות אוטומטיות:\n` +
      createdTasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n') +
      `\n\n⏰ ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    await fetch(
      `${GREEN_API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message })
      }
    );

    return Response.json({
      success: true,
      status: newStatus,
      tasks_created: createdTasks.length,
      tasks: createdTasks.map(t => ({ id: t.id, description: t.description }))
    });

  } catch (error) {
    console.error('Case Automation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});