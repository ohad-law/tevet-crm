import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        const { net_hamishpat_id, file_url, doc_type, document_name } = body;

        // Validate required fields
        if (!net_hamishpat_id || !file_url) {
            return Response.json({ 
                error: 'Missing required fields', 
                required: ['net_hamishpat_id', 'file_url'] 
            }, { status: 400 });
        }

        // Find the case by net_hamishpat_number
        const cases = await base44.asServiceRole.entities.Case.filter({
            net_hamishpat_number: net_hamishpat_id
        });

        if (!cases || cases.length === 0) {
            return Response.json({ 
                error: 'Case not found',
                net_hamishpat_id: net_hamishpat_id
            }, { status: 404 });
        }

        const targetCase = cases[0];

        // Map doc_type to Hebrew enum values
        const docTypeMap = {
            'court_decision': 'החלטת בית משפט',
            'protocol': 'פרוטוקול',
            'evidence': 'ראיה',
            'client_email': 'מייל לקוח',
            'pleading': 'כתב טענות',
            'affidavit': 'תצהיר',
            'other': 'אחר'
        };

        const hebrewDocType = docTypeMap[doc_type] || doc_type || 'אחר';

        // Create the document record
        const newDocument = await base44.asServiceRole.entities.CaseDocument.create({
            document_name: document_name || `מסמך מנט המשפט - ${new Date().toLocaleDateString('he-IL')}`,
            file_url: file_url,
            document_type: hebrewDocType,
            case_id: targetCase.id,
            net_hamishpat_id: net_hamishpat_id,
            upload_date: new Date().toISOString(),
            source: 'API'
        });

        return Response.json({
            success: true,
            message: 'Document created successfully',
            document_id: newDocument.id,
            case_id: targetCase.id,
            case_name: targetCase.case_name
        }, {
            status: 201,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Document webhook error:', error);
        return Response.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
});