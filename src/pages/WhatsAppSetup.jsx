import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, XCircle, RefreshCw, Send, Settings, Link, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppSetup() {
  const [state, setState] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Get webhook URL (you'll need to replace with your actual function URL)
  const webhookUrl = `${window.location.origin.replace('app.', 'api.')}/functions/whatsappWebhook`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stateRes, settingsRes] = await Promise.all([
        base44.functions.invoke('greenApiSetup', { action: 'getState' }),
        base44.functions.invoke('greenApiSetup', { action: 'getSettings' })
      ]);
      setState(stateRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const setupWebhook = async () => {
    setIsSaving(true);
    try {
      const { data } = await base44.functions.invoke('greenApiSetup', {
        action: 'setWebhook',
        webhookUrl: webhookUrl
      });
      setResult({ type: 'success', message: 'Webhook הוגדר בהצלחה!' });
      loadData();
    } catch (error) {
      setResult({ type: 'error', message: 'שגיאה: ' + error.message });
    }
    setIsSaving(false);
    setTimeout(() => setResult(null), 3000);
  };

  const sendTestMessage = async () => {
    if (!testPhone) return;
    setIsSaving(true);
    try {
      const { data } = await base44.functions.invoke('greenApiSetup', {
        action: 'sendTest',
        phone: testPhone,
        message: testMessage || undefined
      });
      setResult({ type: 'success', message: 'הודעת בדיקה נשלחה!' });
    } catch (error) {
      setResult({ type: 'error', message: 'שגיאה: ' + error.message });
    }
    setIsSaving(false);
    setTimeout(() => setResult(null), 3000);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-slate-500">טוען הגדרות WhatsApp...</p>
        </div>
      </div>
    );
  }

  const isConnected = state?.stateInstance === 'authorized';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-600" />
            הגדרת WhatsApp Bot
          </h1>
          <p className="text-slate-500 mt-1">חיבור הסוכן ל-WhatsApp דרך Green API</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 ml-2" />
          רענן
        </Button>
      </div>

      {/* Result Toast */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${
            result.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.message}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              סטטוס חיבור
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="font-medium">מצב Instance</span>
              <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isConnected ? (
                  <><CheckCircle2 className="w-3 h-3 ml-1" /> מחובר</>
                ) : (
                  <><XCircle className="w-3 h-3 ml-1" /> לא מחובר</>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="font-medium">מספר טלפון</span>
              <span className="font-mono text-slate-600">972542274497</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="font-medium">Instance ID</span>
              <span className="font-mono text-slate-600">7105435035</span>
            </div>

            {settings?.webhookUrl && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="font-medium block mb-2">Webhook URL נוכחי</span>
                <span className="font-mono text-xs text-slate-600 break-all">{settings.webhookUrl}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Setup */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600" />
              הגדרת Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800 mb-3">
                כתובת ה-Webhook שתחבר את WhatsApp לסוכן:
              </p>
              <div className="flex gap-2">
                <Input 
                  value={webhookUrl} 
                  readOnly 
                  className="font-mono text-xs bg-white"
                />
                <Button variant="outline" onClick={copyWebhookUrl}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button 
              onClick={setupWebhook} 
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 ml-2" />
              )}
              הגדר Webhook אוטומטית
            </Button>

            <div className="text-xs text-slate-500 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <strong>שים לב:</strong> אם זה לא עובד, עבור ל-
              <a 
                href="https://console.green-api.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mx-1"
              >
                Green API Console
              </a>
              והגדר את ה-Webhook URL ידנית.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Message */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            שליחת הודעת בדיקה
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="מספר טלפון (לדוגמא: 0501234567)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Input
              placeholder="הודעה (אופציונלי)"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
            <Button 
              onClick={sendTestMessage} 
              disabled={!testPhone || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 ml-2" />
              שלח בדיקה
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-slate-200 shadow-sm bg-slate-50">
        <CardHeader>
          <CardTitle>איך זה עובד?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>1. ודא שה-WhatsApp מחובר (סטטוס ירוק למעלה)</p>
          <p>2. לחץ על "הגדר Webhook אוטומטית" לחיבור הסוכן</p>
          <p>3. שלח הודעת בדיקה לוודא שהכל עובד</p>
          <p>4. כעת כל הודעה שתגיע ל-WhatsApp תטופל על ידי הסוכן "office_manager"</p>
          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-800 mb-2">הסוכן יכול:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>לנהל לקוחות ותיקים</li>
              <li>ליצור ולעדכן משימות</li>
              <li>לרשום הכנסות והוצאות</li>
              <li>לנהל לידים</li>
              <li>ועוד...</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}