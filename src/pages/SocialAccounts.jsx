
import { useState, useEffect } from "react";
import { SocialMediaAccount, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Play, Facebook, Youtube, Plus, Edit, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SocialAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // ⚠️ הגנה: רק אדמין!
    const userData = await User.me().catch(() => null);
    if (!userData || userData.role !== 'admin') {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const accountsData = await SocialMediaAccount.list();
    setAccounts(accountsData);
    setIsLoading(false);
  };

  const handleSubmit = async (accountData) => {
    if (editingAccount) {
      await SocialMediaAccount.update(editingAccount.id, accountData);
    } else {
      await SocialMediaAccount.create(accountData);
    }
    setShowForm(false);
    setEditingAccount(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm('האם אתה בטוח שברצונך למחוק חשבון זה?')) {
      await SocialMediaAccount.delete(id);
      loadData();
    }
  };

  const platformIcons = {
    Instagram: Instagram,
    TikTok: Play,
    Facebook: Facebook,
    YouTube: Youtube
  };

  const platformColors = {
    Instagram: 'from-pink-500 to-purple-500',
    TikTok: 'from-black to-gray-800',
    Facebook: 'from-blue-600 to-blue-700',
    YouTube: 'from-red-600 to-red-700'
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">חשבונות רשתות חברתיות</h1>
            <p className="text-gray-600">Social Media Accounts Management</p>
          </div>
          <Button 
            onClick={() => {
              setEditingAccount(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-5 h-5 ml-2" />
            חשבון חדש
          </Button>
        </div>

        {/* Accounts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatePresence>
            {accounts.map((account) => {
              const Icon = platformIcons[account.platform];
              const colorClass = platformColors[account.platform];
              
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="shadow-xl border-none overflow-hidden hover:shadow-2xl transition-shadow">
                    <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{account.platform}</h3>
                            <p className="text-sm text-gray-600">@{account.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingAccount(account);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{account.followers_count?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">עוקבים</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{account.posts_count || 0}</p>
                          <p className="text-xs text-gray-500">פוסטים</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{account.avg_engagement_rate?.toFixed(1) || 0}%</p>
                          <p className="text-xs text-gray-500">מעורבות</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <Badge className={account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {account.is_active ? (
                            <><CheckCircle className="w-3 h-3 ml-1" /> פעיל</>
                          ) : (
                            <><AlertCircle className="w-3 h-3 ml-1" /> לא פעיל</>
                          )}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4 ml-2" />
                          עדכן נתונים
                        </Button>
                      </div>

                      {account.profile_url && (
                        <a 
                          href={account.profile_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block mt-4 text-sm text-purple-600 hover:text-purple-700 text-center"
                        >
                          צפה בפרופיל →
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {accounts.length === 0 && (
          <Card className="shadow-lg border-none">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-4">לא הוספת עדיין חשבונות</p>
              <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-5 h-5 ml-2" />
                הוסף חשבון ראשון
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <AccountFormDialog
            account={editingAccount}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAccount(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountFormDialog({ account, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(account || {
    platform: "Instagram",
    username: "",
    profile_url: "",
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    avg_engagement_rate: 0,
    is_active: true,
    bio: "",
    profile_image_url: "",
    monthly_goal_followers: 0,
    monthly_goal_posts: 0,
    monthly_goal_leads: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {account ? 'עריכת חשבון' : 'חשבון חדש'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>פלטפורמה *</Label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                className="w-full mt-1 p-2 border rounded-lg"
                required
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Facebook">Facebook (דף עסקי)</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            <div>
              <Label>שם משתמש *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="username"
                required
              />
            </div>
          </div>

          <div>
            <Label>קישור לפרופיל</Label>
            <Input
              value={formData.profile_url}
              onChange={(e) => setFormData({...formData, profile_url: e.target.value})}
              placeholder="https://instagram.com/username"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>עוקבים</Label>
              <Input
                type="number"
                value={formData.followers_count}
                onChange={(e) => setFormData({...formData, followers_count: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>עוקב אחרי</Label>
              <Input
                type="number"
                value={formData.following_count}
                onChange={(e) => setFormData({...formData, following_count: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>פוסטים</Label>
              <Input
                type="number"
                value={formData.posts_count}
                onChange={(e) => setFormData({...formData, posts_count: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full mt-1 p-2 border rounded-lg"
              rows={3}
              placeholder="תיאור הפרופיל..."
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold mb-3">יעדים חודשיים</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>עוקבים חדשים</Label>
                <Input
                  type="number"
                  value={formData.monthly_goal_followers}
                  onChange={(e) => setFormData({...formData, monthly_goal_followers: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>פוסטים</Label>
                <Input
                  type="number"
                  value={formData.monthly_goal_posts}
                  onChange={(e) => setFormData({...formData, monthly_goal_posts: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>לידים</Label>
                <Input
                  type="number"
                  value={formData.monthly_goal_leads}
                  onChange={(e) => setFormData({...formData, monthly_goal_leads: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              שמור
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
