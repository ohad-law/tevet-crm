import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Shield, Search, Edit2, Check, X, UserCog, AlertTriangle, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      const hasPermission = userData?.specific_permissions?.includes('manage_users');
      if (!userData || (userData.role !== 'admin' && !hasPermission)) {
        navigate(createPageUrl("Dashboard"));
        return;
      }

      const usersData = await base44.entities.User.list();
      setUsers(usersData);
      setCurrentUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading users:", error);
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await base44.entities.User.update(editingUser.id, {
        role: editingUser.role,
        department: editingUser.department,
        job_title: editingUser.job_title,
        phone: editingUser.phone,
        specific_permissions: editingUser.specific_permissions
      });
      
      await loadData();
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("שגיאה בעדכון המשתמש");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permission) => {
    if (!editingUser) return;
    const currentPermissions = editingUser.specific_permissions || [];
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];
    
    setEditingUser({ ...editingUser, specific_permissions: newPermissions });
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const permissionsList = [
    { id: 'view_finance', label: 'צפייה בפיננסים' },
    { id: 'view_marketing', label: 'שיווק ולידים' },
    { id: 'view_analytics', label: 'אנליטיקה' },
    { id: 'manage_automations', label: 'ניהול אוטומציות' },
    { id: 'manage_users', label: 'ניהול משתמשים' },
    { id: 'delete_cases', label: 'מחיקת תיקים' },
    { id: 'export_data', label: 'ייצוא נתונים' }
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-blue-600" />
            ניהול משתמשים והרשאות
          </h1>
          <p className="text-slate-500 mt-1">ניהול צוות המשרד, הגדרת תפקידים והרשאות גישה</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-2 flex flex-col items-center border-l border-slate-100">
            <span className="text-xs text-slate-500 font-medium uppercase">סה"כ</span>
            <span className="text-xl font-bold text-slate-900">{users.length}</span>
          </div>
          <div className="px-4 py-2 flex flex-col items-center border-l border-slate-100">
            <span className="text-xs text-slate-500 font-medium uppercase">אדמין</span>
            <span className="text-xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</span>
          </div>
          <div className="px-4 py-2 flex flex-col items-center">
            <span className="text-xs text-slate-500 font-medium uppercase">עובדים</span>
            <span className="text-xl font-bold text-blue-600">{users.filter(u => u.role === 'user').length}</span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="חיפוש לפי שם, אימייל או תפקיד..." 
                className="pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
                <tr>
                  <th className="p-4 w-16"></th>
                  <th className="p-4">שם מלא</th>
                  <th className="p-4">תפקיד</th>
                  <th className="p-4">הרשאות מיוחדות</th>
                  <th className="p-4">הרשאת מערכת</th>
                  <th className="p-4">טלפון</th>
                  <th className="p-4">הצטרף ב-</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className={`${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} font-bold`}>
                          {user.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{user.full_name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-700">{user.job_title || '-'}</div>
                      <div className="text-xs text-slate-400">{user.department}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.role === 'admin' ? (
                          <span className="text-xs text-purple-600 font-medium">כל ההרשאות (אדמין)</span>
                        ) : user.specific_permissions?.length > 0 ? (
                          user.specific_permissions.map(perm => {
                            const label = permissionsList.find(p => p.id === perm)?.label || perm;
                            return (
                              <span key={perm} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">
                                {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400">אין הרשאות מיוחדות</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${user.role === 'admin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} border-0`}>
                        {user.role === 'admin' ? 'מנהל מערכת' : 'משתמש רגיל'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {user.phone || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(user.created_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="p-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingUser({ ...user, specific_permissions: user.specific_permissions || [] })}
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Edit2 className="w-4 h-4 ml-2" />
                        ערוך
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              לא נמצאו משתמשים התואמים את החיפוש
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="w-6 h-6 text-blue-600" />
              עריכת משתמש: {editingUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תפקיד (Role)</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(val) => setEditingUser({ ...editingUser, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">משתמש רגיל</SelectItem>
                      <SelectItem value="admin">מנהל מערכת</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    * מנהל מערכת מקבל גישה מלאה לכל חלקי המערכת
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>מחלקה</Label>
                  <Select 
                    value={editingUser.department || ""} 
                    onValueChange={(val) => setEditingUser({ ...editingUser, department: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מחלקה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legal">משפטי</SelectItem>
                      <SelectItem value="admin">אדמיניסטרציה</SelectItem>
                      <SelectItem value="finance">כספים</SelectItem>
                      <SelectItem value="marketing">שיווק</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>הגדרת תפקיד (Job Title)</Label>
                  <Input 
                    value={editingUser.job_title || ""} 
                    onChange={(e) => setEditingUser({ ...editingUser, job_title: e.target.value })}
                    placeholder="לדוגמה: עורך דין בכיר"
                  />
                </div>

                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input 
                    value={editingUser.phone || ""} 
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="050-0000000"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  הרשאות ספציפיות
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {permissionsList.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2 space-x-reverse bg-white p-2 rounded border border-slate-200">
                      <Checkbox 
                        id={perm.id} 
                        checked={(editingUser.specific_permissions || []).includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Label htmlFor={perm.id} className="cursor-pointer text-sm font-medium text-slate-700">
                        {perm.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {editingUser.role === 'admin' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    שים לב: משתמש שמוגדר כ"מנהל מערכת" מקבל אוטומטית את כל ההרשאות, ללא תלות בסימונים למעלה.
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  ביטול
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                  {isSaving ? "שומר..." : "שמור שינויים"}
                  <Save className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}