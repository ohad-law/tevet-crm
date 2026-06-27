import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REDIRECT_URI = "https://app.base44.com/oauth/callback";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, code } = await req.json();
        
        const clientId = Deno.env.get("GMAIL_CLIENT_ID");
        const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
            return Response.json({ 
                error: "Missing Gmail OAuth credentials" 
            }, { status: 400 });
        }

        if (action === "getAuthUrl") {
            // Generate OAuth URL
            const scopes = [
                "https://www.googleapis.com/auth/gmail.readonly"
            ].join(" ");
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent(scopes)}` +
                `&access_type=offline` +
                `&prompt=consent`;
            
            return Response.json({ authUrl });
        }

        if (action === "exchangeCode") {
            // Exchange code for tokens
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    grant_type: "authorization_code",
                    redirect_uri: REDIRECT_URI
                })
            });

            const tokens = await tokenResponse.json();
            
            if (tokens.error) {
                return Response.json({ error: tokens.error_description || tokens.error }, { status: 400 });
            }

            // Save tokens to user settings or system settings
            const user = await base44.auth.me();
            
            // Store refresh token in SystemSettings
            const settings = await base44.entities.SystemSettings.list();
            const existingToken = settings.find(s => s.setting_key === "gmail_refresh_token");
            
            if (existingToken) {
                await base44.entities.SystemSettings.update(existingToken.id, {
                    setting_value: tokens.refresh_token || existingToken.setting_value
                });
            } else {
                await base44.entities.SystemSettings.create({
                    setting_key: "gmail_refresh_token",
                    setting_value: tokens.refresh_token,
                    description: "Gmail OAuth Refresh Token"
                });
            }

            return Response.json({ 
                success: true, 
                message: "Gmail connected successfully",
                email: user.email
            });
        }

        return Response.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Gmail Auth Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});