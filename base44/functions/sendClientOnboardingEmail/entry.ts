import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { clientId, clientName, clientEmail, caseName, caseType } = await req.json();

        if (!clientEmail || !clientName) {
            return Response.json({ error: 'Missing client email or name' }, { status: 400 });
        }

        // Get Gmail access token via OAuth connector
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

        // Build the onboarding email HTML
        const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚖️ משרד עו"ד טבת</h1>
            <p style="color: #b8d4e8; margin: 10px 0 0 0; font-size: 14px;">מומחים בדיני עבודה</p>
        </div>
        
        <!-- Welcome Message -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">שלום ${clientName},</h2>
            
            <p style="color: #333333; line-height: 1.8; font-size: 16px; margin: 0 0 20px 0;">
                ברוכים הבאים למשרד עו"ד טבת! אנו שמחים שבחרת בנו ללוות אותך.
            </p>
            
            ${caseName ? `
            <div style="background-color: #f0f7ff; border-right: 4px solid #2d5a87; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 10px 0; color: #1e3a5f; font-weight: bold;">פרטי התיק שלך:</p>
                <p style="margin: 0; color: #333333;">
                    <strong>שם התיק:</strong> ${caseName}<br>
                    ${caseType ? `<strong>סוג:</strong> ${caseType}` : ''}
                </p>
            </div>
            ` : ''}
            
            <h3 style="color: #1e3a5f; margin: 30px 0 15px 0; font-size: 18px;">📋 מה הצעדים הבאים?</h3>
            
            <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
                <ol style="margin: 0; padding: 0 20px; color: #333333; line-height: 2;">
                    <li>נציג מהמשרד ייצור איתך קשר תוך 24-48 שעות</li>
                    <li>נבקש ממך מסמכים רלוונטיים (תלושי שכר, חוזה עבודה וכו')</li>
                    <li>נבצע בדיקה מקיפה של המקרה שלך</li>
                    <li>נעדכן אותך בממצאים ובאפשרויות הפעולה</li>
                </ol>
            </div>
            
            <h3 style="color: #1e3a5f; margin: 30px 0 15px 0; font-size: 18px;">📎 מסמכים שכדאי להכין:</h3>
            
            <ul style="color: #333333; line-height: 2; padding: 0 20px;">
                <li>תלושי שכר (ככל שיש יותר - עדיף)</li>
                <li>חוזה עבודה / הסכם העסקה</li>
                <li>מכתב פיטורין / התפטרות (אם רלוונטי)</li>
                <li>דוחות נוכחות / שעון נוכחות</li>
                <li>כל מסמך רלוונטי אחר</li>
            </ul>
            
            <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <p style="margin: 0; color: #155724; font-size: 16px;">
                    <strong>💡 טיפ:</strong> ככל שתספק יותר מידע ומסמכים, כך נוכל לבצע בדיקה מקיפה ומדויקת יותר.
                </p>
            </div>
        </div>
        
        <!-- Contact Info -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 15px 0; color: #1e3a5f; font-weight: bold; font-size: 16px;">צריך לדבר איתנו?</p>
            <p style="margin: 0 0 5px 0; color: #333333;">
                📞 טלפון: <a href="tel:054-2274497" style="color: #2d5a87; text-decoration: none;">054-2274497</a>
            </p>
            <p style="margin: 0; color: #333333;">
                📧 מייל: <a href="mailto:info@tevet-law.com" style="color: #2d5a87; text-decoration: none;">info@tevet-law.com</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1e3a5f; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #b8d4e8; font-size: 12px;">
                © משרד עו"ד טבת | כל הזכויות שמורות
            </p>
        </div>
    </div>
</body>
</html>`;

        const subject = caseName 
            ? `ברוך הבא למשרד עו"ד טבת - תיק: ${caseName}`
            : `ברוך הבא למשרד עו"ד טבת`;

        // Build raw email for Gmail API
        const emailLines = [
            `To: ${clientEmail}`,
            `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            emailHtml
        ];
        
        const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Send via Gmail API
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: rawEmail })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gmail API error:", errorText);
            return Response.json({ error: 'Failed to send email', details: errorText }, { status: 500 });
        }

        const result = await response.json();
        console.log("Email sent successfully, message ID:", result.id);

        return Response.json({ 
            success: true, 
            messageId: result.id,
            message: `מייל onboarding נשלח ל-${clientEmail}`
        });

    } catch (error) {
        console.error("Error sending onboarding email:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});