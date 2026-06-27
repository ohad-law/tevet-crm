
import { useState, useEffect } from "react";
import { SocialMediaPost, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Calendar, Send, Save, Instagram, Play, Facebook, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InvokeLLM, UploadFile } from "@/integrations/Core";

export default function PostComposer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    platform: "Instagram",
    content_type: "Reel/Short",
    title: "",
    caption: "",
    hook: "",
    hashtags: [],
    category: "טיפ",
    status: "בהכנה",
    scheduled_date: "",
    media_urls: [],
    notes: ""
  });

  const [newHashtag, setNewHashtag] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // ⚠️ הגנה: רק אדמין!
    const userData = await User.me().catch(() => null);
    if (!userData || userData.role !== 'admin') {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const handleGenerateCaption = async () => {
    if (!formData.title) {
      alert('הזן כותרת קודם');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await InvokeLLM({
        prompt: `צור caption מושלם לפוסט ברשתות חברתיות (${formData.platform}) של עורך דין.
        
        נושא: ${formData.title}
        קטגוריה: ${formData.category}
        
        הcaption צריך:
        - להתחיל עם hook חזק שתופס תשומת לב ב-3 שניות הראשונות
        - להיות ברור, תמציתי, ובשפה פשוטה
        - לכלול call-to-action ברור
        - להיות מתאים ל${formData.platform}
        - אורך: 80-150 מילים
        
        החזר JSON:
        {
          "hook": "משפט פותח מושך (8-12 מילים)",
          "caption": "הטקסט המלא",
          "hashtags": ["hashtag1", "hashtag2", ...] (10-15 hashtags רלוונטיים)
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            hook: { type: "string" },
            caption: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        hook: response.hook,
        caption: response.caption,
        hashtags: response.hashtags,
        ai_generated: true
      }));
    } catch (error) {
      alert('שגיאה ביצירת תוכן');
      console.error(error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, file_url]
      }));
    } catch (error) {
      alert('שגיאה בהעלאת קובץ');
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddHashtag = () => {
    if (newHashtag.trim()) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, newHashtag.trim().replace('#', '')]
      }));
      setNewHashtag("");
    }
  };

  const handleRemoveHashtag = (index) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (status) => {
    const postData = {
      ...formData,
      status
    };

    await SocialMediaPost.create(postData);
    alert(status === 'מתוזמן' ? 'הפוסט תוזמן בהצלחה!' : 'הפוסט נשמר כטיוטה');
    navigate(createPageUrl("PersonalBranding"));
  };

  const platformIcons = {
    Instagram: Instagram,
    TikTok: Play,
    Facebook: Facebook,
    YouTube: Youtube
  };

  const PlatformIcon = platformIcons[formData.platform];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">יוצר פוסטים</h1>
          <p className="text-gray-600">Post Composer with AI</p>
        </div>

        <Card className="shadow-2xl border-none">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <PlatformIcon className="w-6 h-6" />
              פוסט חדש
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Platform & Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>פלטפורמה *</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>סוג תוכן *</Label>
                  <Select value={formData.content_type} onValueChange={(value) => setFormData({...formData, content_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="רגיל">פוסט רגיל</SelectItem>
                      <SelectItem value="Reel/Short">Reel/Short</SelectItem>
                      <SelectItem value="Story">Story</SelectItem>
                      <SelectItem value="Carousel">Carousel</SelectItem>
                      <SelectItem value="Live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>כותרת *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="למשל: 3 זכויות שכל עובד חייב לדעת"
                  />
                </div>

                <div>
                  <Label>קטגוריה</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="טיפ">טיפ</SelectItem>
                      <SelectItem value="סיפור תיק">סיפור תיק</SelectItem>
                      <SelectItem value="שאלה ותשובה">שאלה ותשובה</SelectItem>
                      <SelectItem value="מיתוס vs מציאות">מיתוס vs מציאות</SelectItem>
                      <SelectItem value="רשימה">רשימה</SelectItem>
                      <SelectItem value="חינוכי">חינוכי</SelectItem>
                      <SelectItem value="אישי">אישי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Generate Button */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-purple-900">✨ יצירה אוטומטית עם AI</p>
                    <p className="text-sm text-purple-700">צור caption מושלם עם hook, תוכן והאשטגים</p>
                  </div>
                  <Button
                    onClick={handleGenerateCaption}
                    disabled={generatingAI || !formData.title}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {generatingAI ? (
                      <>
                        <Sparkles className="w-4 h-4 ml-2 animate-spin" />
                        יוצר...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 ml-2" />
                        צור עם AI
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Hook */}
              <div>
                <Label>Hook (המשפט הפותח) 🎣</Label>
                <Input
                  value={formData.hook}
                  onChange={(e) => setFormData({...formData, hook: e.target.value})}
                  placeholder="המשפט שתופס תשומת לב ב-3 שניות הראשונות"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  טיפ: התחל בשאלה, עובדה מפתיעה, או הבטחה ברורה
                </p>
              </div>

              {/* Caption */}
              <div>
                <Label>Caption (התוכן המלא) 📝</Label>
                <Textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({...formData, caption: e.target.value})}
                  placeholder="התוכן המלא של הפוסט..."
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.caption.length} תווים | אורך מומלץ: 80-150 מילים
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <Label>Hashtags 🏷️</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                    placeholder="הוסף hashtag"
                  />
                  <Button type="button" onClick={handleAddHashtag} variant="outline">
                    הוסף
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => handleRemoveHashtag(index)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <Label>תמונה/סרטון 📸</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">
                      {uploadingFile ? 'מעלה...' : 'לחץ להעלאת קובץ'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">תמונה או סרטון</p>
                  </label>
                </div>
                {formData.media_urls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {formData.media_urls.map((url, index) => (
                      <img key={index} src={url} alt="" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div>
                <Label>תזמון פרסום 📅</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                />
              </div>

              {/* Notes */}
              <div>
                <Label>הערות פנימיות</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="הערות לעצמך (לא יפורסמו)"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSave('בהכנה')}
                >
                  <Save className="w-4 h-4 ml-2" />
                  שמור כטיוטה
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleSave('מוכן')}
                >
                  <Send className="w-4 h-4 ml-2" />
                  סמן כמוכן
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => handleSave('מתוזמן')}
                  disabled={!formData.scheduled_date}
                >
                  <Calendar className="w-4 h-4 ml-2" />
                  תזמן לפרסום
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
