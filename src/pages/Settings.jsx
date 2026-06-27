import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import UnauthorizedAccess from "../components/common/UnauthorizedAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Settings as SettingsIcon, Bell, Users, HardDrive, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driveStatus, setDriveStatus] = useState({ checking: true, connected: false, user: null });

  useEffect(() => {
    loadSettings();
  }, []);

  const checkDriveStatus = async () => {
    try {
        const res = await base44.functions.invoke('googleDrive', { action: 'status' });
        if (res.data && res.data.connected) {
            setDriveStatus({ checking: false, connected: true, user: res.data.user });
        } else {
            setDriveStatus({ checking: false, connected: false, user: null });
        }
    } catch (err) {
        console.error("Drive check failed", err);
        setDriveStatus({ checking: false, connected: false, error: err.message });
    }
  };

  const loadSettings = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      if (userData.role !== 'admin') {
        setIsLoading(false);
        return;
      }

      const allSettings = await base44.entities.SystemSettings.list();
      const settingsMap = {};
      allSettings.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value;
      });

      setSettings({
      default_task_assignee: settingsMap.default_task_assignee || '',
      admin_notification_phone: settingsMap.admin_notification_phone || '',
      hearing_alert_days: settingsMap.hearing_alert_days || '1',
      enable_email_notifications: settingsMap.enable_email_notifications === 'true',
      enable_sms_notifications: settingsMap.enable_sms_notifications === 'true',
      auto_assign_priority: settingsMap.auto_assign_priority === 'true',
      });

      checkDriveStatus();
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const allSettings = await base44.entities.SystemSettings.list();
      
      const settingsToSave = [
        { key: 'default_task_assignee', value: settings.default_task_assignee, description: 'עובד אחראי ברירת מחדל למשימות חדשות' },
        { key: 'admin_notification_phone', value: settings.admin_notification_phone, description: 'טלפון מנהל להתראות WhatsApp' },
        { key: 'hearing_alert_days', value: settings.hearing_alert_days, description: 'ימים לפני דיון לשליחת התראה' },
        { key: 'enable_email_notifications', value: String(settings.enable_email_notifications), description: 'הפעלת התראות דוא"ל' },
        { key: 'enable_sms_notifications', value: String(settings.enable_sms_notifications), description: 'הפעלת התראות SMS' },
        { key: 'auto_assign_priority', value: String(settings.auto_assign_priority), description: 'הקצאת עדיפות אוטומטית למשימות' },
      ];

      for (const setting of settingsToSave) {
        const existing = allSettings.find(s => s.setting_key === setting.key);
        if (existing) {
          await base44.entities.SystemSettings.update(existing.id, {
            setting_key: setting.key,
            setting_value: setting.value,
            description: setting.description
          });
        } else {
          await base44.entities.SystemSettings.create({
            setting_key: setting.key,
            setting_value: setting.value,
            description: setting.description
          });
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("שגיאה בשמירת ההגדרות");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  if (currentUser?.role !== 'admin') {
    return <UnauthorizedAccess />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 md:w-8 md:h-8" />
            הגדרות מערכת
          </h1>
          <p className="text-slate-500 text-sm md:text-lg">ניהול הגדרות משימות והתראות</p>
        </div>
      </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
            <p className="text-green-900 font-semibold flex items-center gap-2">
              ✓ ההגדרות נשמרו בהצלחה!
            </p>
          </div>
        )}

        {/* Integrations Settings */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyan-600" />
              אינטגרציות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 87.3 78" className="w-6 h-6">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 16-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 16 13.75 23.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-11.5-20-15.4-26.65c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#ffba00"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Google Drive</h3>
                        <p className="text-sm text-slate-500">סנכרון מסמכים וקבצים</p>
                    </div>
                </div>
                <div>
                    {driveStatus.checking ? (
                        <span className="text-slate-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                            בודק חיבור...
                        </span>
                    ) : driveStatus.connected ? (
                        <div className="text-right">
                             <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                מחובר
                             </div>
                             {driveStatus.user && (
                                 <p className="text-xs text-slate-500">{driveStatus.user.displayName} ({driveStatus.user.emailAddress})</p>
                             )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-amber-600 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            לא מחובר
                            {/* Note: Authorization is handled via chat interface currently */}
                        </div>
                    )}
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Task Settings */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              הגדרות משימות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default_task_assignee">עובד אחראי ברירת מחדל למשימות חדשות *</Label>
              <Input
                id="default_task_assignee"
                value={settings.default_task_assignee}
                onChange={(e) => setSettings(prev => ({ ...prev, default_task_assignee: e.target.value }))}
                placeholder="שם העובד"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500">משימות חדשות שייווצרו במערכת יוקצו אוטומטית לעובד זה.</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              הגדרות התראות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 p-3 bg-green-50/50 rounded-lg border border-green-100">
                <Label htmlFor="admin_notification_phone" className="flex items-center gap-2">
                   <span className="text-green-600">📱</span>
                   טלפון מנהל להתראות WhatsApp
                </Label>
                <Input
                  id="admin_notification_phone"
                  value={settings.admin_notification_phone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, admin_notification_phone: e.target.value }))}
                  placeholder="לדוגמא: 0501234567"
                  className="max-w-md bg-white"
                />
                <p className="text-xs text-gray-500">מספר זה יקבל עדכונים שוטפים על פעילות במערכת.</p>
              </div>

              <div className="space-y-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <Label htmlFor="hearing_alert_days" className="flex items-center gap-2">
                   <span className="text-blue-600">⏰</span>
                   תזכורות לדיונים (ימים לפני)
                </Label>
                <Input
                  id="hearing_alert_days"
                  value={settings.hearing_alert_days || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, hearing_alert_days: e.target.value }))}
                  placeholder="לדוגמא: 1, 3, 7 (מופרד בפסיקים)"
                  className="max-w-md bg-white"
                />
                <p className="text-xs text-gray-500">הכנס מספר ימים לפני הדיון לקבלת התראה (למשל: 1, 3 לקבלת התראה יום לפני ו-3 ימים לפני).</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="enable_email_notifications"
                  checked={settings.enable_email_notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_email_notifications: checked }))}
                />
                <label htmlFor="enable_email_notifications" className="text-sm font-medium cursor-pointer flex-1">
                  הפעל התראות דוא"ל
                  <span className="block text-xs text-gray-500 mt-1">
                    המערכת תשלח התראות בנוגע לאירועים חשובים באמצעות דוא"ל.
                  </span>
                </label>
                <Badge variant={settings.enable_email_notifications ? "default" : "secondary"}>
                  {settings.enable_email_notifications ? "פעיל" : "כבוי"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="enable_sms_notifications"
                  checked={settings.enable_sms_notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_sms_notifications: checked }))}
                />
                <label htmlFor="enable_sms_notifications" className="text-sm font-medium cursor-pointer flex-1">
                  הפעל התראות SMS
                  <span className="block text-xs text-gray-500 mt-1">
                    המערכת תשלח התראות קצרות ודחופות באמצעות SMS (למספרים רשומים).
                  </span>
                </label>
                <Badge variant={settings.enable_sms_notifications ? "default" : "secondary"}>
                  {settings.enable_sms_notifications ? "פעיל" : "כבוי"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="auto_assign_priority"
                  checked={settings.auto_assign_priority}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_assign_priority: checked }))}
                />
                <label htmlFor="auto_assign_priority" className="text-sm font-medium cursor-pointer flex-1">
                  הקצאת עדיפות אוטומטית למשימות
                  <span className="block text-xs text-gray-500 mt-1">
                    המערכת תקצה עדיפות למשימות חדשות באופן אוטומטי לפי כללים מוגדרים.
                  </span>
                </label>
                <Badge variant={settings.auto_assign_priority ? "default" : "secondary"}>
                  {settings.auto_assign_priority ? "פעיל" : "כבוי"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Logic */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50">
            <CardTitle className="text-xl font-bold">
              🎯 לוגיקת עדיפויות אוטומטית (כאשר מופעל)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-2xl">🔴</span>
                <div>
                  <p className="font-bold text-red-900">דחוף</p>
                  <p className="text-red-700">תיקים שנפתחו לפני יותר מ-5 ימים</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-2xl">🟠</span>
                <div>
                  <p className="font-bold text-orange-900">גבוה</p>
                  <p className="text-orange-700">תיקים שנפתחו לפני 3-5 ימים</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl">🟢</span>
                <div>
                  <p className="font-bold text-green-900">רגיל</p>
                  <p className="text-green-700">תיקים חדשים (עד 3 ימים)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="w-full md:w-auto bg-blue-900 hover:bg-blue-800 text-base md:text-lg px-6 md:px-8"
          >
            {saving ? (
              <>
                <span className="animate-spin ml-2">⏳</span>
                שומר...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                שמור הגדרות
              </>
            )}
          </Button>
        </div>
    </div>
  );
}