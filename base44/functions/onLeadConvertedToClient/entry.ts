import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const leadData = body.data;
    const leadId = body.event?.entity_id;

    if (!leadData || !leadId) {
      return Response.json({ error: 'Missing lead data' }, { status: 400 });
    }

    // Only proceed if the lead was just converted to client
    if (leadData.status !== 'הפך ללקוח') {
      return Response.json({ skipped: true, reason: 'Not converted to client' });
    }

    // Check if a client was already created for this lead (by looking at converted_client_id)
    if (leadData.converted_client_id) {
      return Response.json({ skipped: true, reason: 'Client already created', clientId: leadData.converted_client_id });
    }

    // 1. Create a Client record
    const newClient = await base44.asServiceRole.entities.Client.create({
      full_name: leadData.full_name,
      phone: leadData.phone || '',
      email: leadData.email || '',
      classification: leadData.source || 'ליד',
      status: 'פעיל',
      join_date: new Date().toISOString().split('T')[0],
    });

    // 2. Generate case number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const allCases = await base44.asServiceRole.entities.Case.list();
    const thisMonthCases = allCases.filter(c => {
      const created = new Date(c.created_date);
      return created.getFullYear() === year && (created.getMonth() + 1) === (now.getMonth() + 1);
    });
    const caseCount = thisMonthCases.length + 1;
    const caseNumber = `${year}${month}-${String(caseCount).padStart(3, '0')}`;

    // 3. Create a Case
    const newCase = await base44.asServiceRole.entities.Case.create({
      case_number: caseNumber,
      case_name: leadData.full_name || 'לקוח חדש',
      client_id: newClient.id,
      case_type: 'דיני עבודה - תביעה',
      case_description: `ליד שהומר מלקוח. מקור: ${leadData.source || 'לא ידוע'}. ${leadData.notes ? 'הערות: ' + leadData.notes : ''}`,
      status: 'תיק נכנס',
      open_date: new Date().toISOString().split('T')[0],
      assigned_to: leadData.assigned_to || user.full_name,
    });

    // 4. Create a Task
    await base44.asServiceRole.entities.Task.create({
      description: `טיפול ראשוני בתיק ${caseNumber} – ${leadData.full_name}`,
      case_id: newCase.id,
      status: 'לביצוע',
      priority: 'רגיל',
      assigned_to: leadData.assigned_to || user.full_name,
      task_type: 'פתיחת תיק',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    // 5. Update the lead with the new client ID
    await base44.asServiceRole.entities.Lead.update(leadId, {
      converted_client_id: newClient.id,
    });

    return Response.json({
      success: true,
      clientId: newClient.id,
      caseId: newCase.id,
      caseNumber: caseNumber,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});