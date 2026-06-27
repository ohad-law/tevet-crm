import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, file_url } = body;

        // Scan invoice/receipt with AI
        if (action === 'scan') {
            if (!file_url) {
                return Response.json({ error: 'Missing file_url' }, { status: 400 });
            }

            // Use LLM with vision to extract data
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `אתה מומחה בניתוח חשבוניות וקבלות בעברית.
נתח את המסמך הזה וחלץ את המידע הבא:
1. שם הספק/עסק
2. מספר חשבונית/קבלה
3. תאריך המסמך
4. סכום כולל (כולל מע"מ)
5. סכום לפני מע"מ (אם מצוין)
6. סכום מע"מ (אם מצוין)
7. תיאור קצר של מה נרכש/השירות

בנוסף, סווג את ההוצאה לאחת מהקטגוריות הבאות:
- עבודות חוץ וקבלני משנה
- משרדיות וחומרי עבודה
- טלפון סלולרי
- שליחות והובלות
- דואר
- אגרות
- שירותים מקצועיים
- נסיעות ציבוריות
- פרסום שיווק וקידום מכירות
- שכירות
- הוצאות רכב
- חשמל בית 25%
- השתלמות מקצועית
- השכרת רכב
- מחשוב ותוכנות
- חניות
- שכר
- תרומות
- אחר

החזר JSON בפורמט הבא בלבד.`,
                file_urls: [file_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        vendor_name: { type: "string", description: "שם הספק" },
                        invoice_number: { type: "string", description: "מספר חשבונית" },
                        date: { type: "string", description: "תאריך בפורמט YYYY-MM-DD" },
                        amount: { type: "number", description: "סכום כולל מע\"מ" },
                        amount_before_vat: { type: "number", description: "סכום לפני מע\"מ" },
                        vat_amount: { type: "number", description: "סכום המע\"מ" },
                        description: { type: "string", description: "תיאור קצר" },
                        category: { type: "string", description: "קטגוריה מהרשימה" },
                        has_invoice: { type: "boolean", description: "האם זו חשבונית מס" },
                        confidence: { type: "number", description: "רמת ביטחון 0-100" }
                    },
                    required: ["vendor_name", "amount", "category"]
                }
            });

            return Response.json({ 
                success: true, 
                extracted: result,
                file_url 
            });
        }

        // Get expense statistics by category
        if (action === 'get-stats') {
            const { year, month } = body;
            const expenses = await base44.entities.Expense.list('-date', 1000);
            
            // Filter by year/month if provided
            let filtered = expenses;
            if (year) {
                filtered = filtered.filter(e => e.date?.startsWith(year));
            }
            if (month) {
                const monthStr = String(month).padStart(2, '0');
                filtered = filtered.filter(e => e.date?.substring(5, 7) === monthStr);
            }

            // Group by category
            const byCategory = {};
            filtered.forEach(e => {
                const cat = e.category || 'אחר';
                if (!byCategory[cat]) {
                    byCategory[cat] = { total: 0, count: 0, vat: 0 };
                }
                byCategory[cat].total += e.amount || 0;
                byCategory[cat].vat += e.vat_amount || 0;
                byCategory[cat].count += 1;
            });

            // Group by month
            const byMonth = {};
            filtered.forEach(e => {
                if (!e.date) return;
                const month = e.date.substring(0, 7);
                if (!byMonth[month]) {
                    byMonth[month] = { total: 0, count: 0 };
                }
                byMonth[month].total += e.amount || 0;
                byMonth[month].count += 1;
            });

            return Response.json({ 
                byCategory, 
                byMonth,
                totalExpenses: filtered.reduce((sum, e) => sum + (e.amount || 0), 0),
                totalVat: filtered.reduce((sum, e) => sum + (e.vat_amount || 0), 0),
                count: filtered.length
            });
        }

        // Analyze missing expenses based on accountant report categories
        if (action === 'analyze-missing') {
            const { year } = body;
            const expenses = await base44.entities.Expense.list('-date', 1000);
            
            // Filter by year
            const yearExpenses = expenses.filter(e => e.date?.startsWith(year || '2025'));
            
            // Expected categories from accountant report
            const expectedCategories = [
                { name: 'עבודות חוץ וקבלני משנה', typical: true },
                { name: 'משרדיות וחומרי עבודה', typical: true },
                { name: 'טלפון סלולרי', typical: true },
                { name: 'שליחות והובלות', typical: false },
                { name: 'דואר', typical: false },
                { name: 'אגרות', typical: true },
                { name: 'שירותים מקצועיים', typical: true },
                { name: 'נסיעות ציבוריות', typical: true },
                { name: 'פרסום שיווק וקידום מכירות', typical: true },
                { name: 'שכירות', typical: true },
                { name: 'הוצאות רכב', typical: true },
                { name: 'חשמל בית 25%', typical: true },
                { name: 'השתלמות מקצועית', typical: false },
                { name: 'השכרת רכב', typical: false },
                { name: 'מחשוב ותוכנות', typical: true },
                { name: 'חניות', typical: true },
                { name: 'שכר', typical: false },
                { name: 'תרומות', typical: false }
            ];

            // Check which categories have expenses
            const existingCategories = {};
            yearExpenses.forEach(e => {
                existingCategories[e.category] = (existingCategories[e.category] || 0) + 1;
            });

            // Find missing typical categories
            const missingCategories = expectedCategories
                .filter(c => c.typical && !existingCategories[c.name])
                .map(c => c.name);

            // Find categories with suspiciously low amounts
            const lowCategories = expectedCategories
                .filter(c => {
                    const count = existingCategories[c.name] || 0;
                    return c.typical && count > 0 && count < 3;
                })
                .map(c => ({ name: c.name, count: existingCategories[c.name] }));

            return Response.json({
                missingCategories,
                lowCategories,
                existingCategories,
                suggestions: [
                    missingCategories.length > 0 ? `חסרות הוצאות בקטגוריות: ${missingCategories.join(', ')}` : null,
                    'וודא שהעלת את כל חשבוניות הסלולר החודשיות',
                    'בדוק אם יש הוצאות דלק/רכב שלא הועלו',
                    'אל תשכח להעלות קבלות על אגרות בית משפט'
                ].filter(Boolean)
            });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error) {
        console.error("Scan expense error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});