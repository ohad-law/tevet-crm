import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { caseId, documents } = await req.json();

    if (!caseId || !documents || !Array.isArray(documents)) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Use service role to update case without requiring user authentication
    const cases = await base44.asServiceRole.entities.Case.list();
    const targetCase = cases.find(c => c.id === caseId);

    if (!targetCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    const existingDocs = targetCase.documents || [];
    const updatedDocuments = [...existingDocs, ...documents];

    await base44.asServiceRole.entities.Case.update(caseId, {
      ...targetCase,
      documents: updatedDocuments
    });

    return Response.json({ 
      success: true, 
      message: 'Documents uploaded successfully',
      case_name: targetCase.case_name 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});