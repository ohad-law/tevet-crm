import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function ArticleForm({ article, onSubmit, onCancel, onGenerateWithAI }) {
  const [formData, setFormData] = useState(article || {
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "דיני עבודה",
    keywords: [],
    meta_description: "",
    featured_image: "",
    author: "",
    status: "טיוטה",
    publish_date: "",
    views: 0,
    leads_from_article: 0,
    seo_score: 0,
    word_count: 0,
    reading_time: 0
  });

  const [newKeyword, setNewKeyword] = useState("");

  const handleChange = (field, value) => {
    let updates = { [field]: value };
    
    // Auto-generate slug from title
    if (field === 'title' && !article) {
      const slug = value
        .toLowerCase()
        .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      updates.slug = slug;
    }
    
    // Calculate word count and reading time from content
    if (field === 'content') {
      const words = value.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
      updates.word_count = words;
      updates.reading_time = Math.ceil(words / 200); // 200 words per minute
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-2xl border-none mb-8">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              {article ? 'עריכת מאמר' : 'מאמר חדש'}
            </CardTitle>
            <div className="flex gap-2">
              {!article && onGenerateWithAI && (
                <Button
                  type="button"
                  onClick={onGenerateWithAI}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  כתוב עם AI
                </Button>
              )}
              <Button variant="ghost" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>כותרת המאמר *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  placeholder="למשל: זכויות עובדים זרים בישראל - מדריך מקיף"
                />
              </div>
              <div>
                <Label>URL (Slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="workers-rights-guide"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <Label>תוכן המאמר *</Label>
              <div className="mt-2 bg-white rounded-lg border">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => handleChange('content', value)}
                  modules={quillModules}
                  className="h-64"
                />
              </div>
              <div className="flex gap-4 mt-16 text-sm text-gray-500">
                <span>📝 {formData.word_count || 0} מילים</span>
                <span>⏱️ {formData.reading_time || 0} דקות קריאה</span>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <Label>תקציר קצר</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="תקציר קצר למאמר (2-3 שורות)"
                rows={3}
              />
            </div>

            {/* SEO & Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>קטגוריה *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="דיני עבודה">דיני עבודה</SelectItem>
                    <SelectItem value="עובדים זרים">עובדים זרים</SelectItem>
                    <SelectItem value="תביעות">תביעות</SelectItem>
                    <SelectItem value="זכויות עובדים">זכויות עובדים</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>סטטוס *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="טיוטה">טיוטה</SelectItem>
                    <SelectItem value="פורסם">פורסם</SelectItem>
                    <SelectItem value="ארכיון">ארכיון</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <Label>מילות מפתח (SEO)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  placeholder="הוסף מילת מפתח"
                />
                <Button type="button" onClick={handleAddKeyword}>
                  הוסף
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.keywords || []).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-red-100" onClick={() => handleRemoveKeyword(index)}>
                    {keyword} <X className="w-3 h-3 mr-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={formData.meta_description}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                placeholder="תיאור קצר למנועי חיפוש (150-160 תווים)"
                rows={2}
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.meta_description?.length || 0}/160 תווים
              </p>
            </div>

            {/* Additional Fields */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>שם המחבר</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="שם המחבר"
                />
              </div>
              
              <div>
                <Label>תאריך פרסום</Label>
                <Input
                  type="datetime-local"
                  value={formData.publish_date}
                  onChange={(e) => handleChange('publish_date', e.target.value)}
                />
              </div>
              
              <div>
                <Label>ציון SEO (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.seo_score}
                  onChange={(e) => handleChange('seo_score', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <Label>תמונה ראשית (URL)</Label>
              <Input
                value={formData.featured_image}
                onChange={(e) => handleChange('featured_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                ביטול
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {article ? 'עדכן מאמר' : 'פרסם מאמר'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}