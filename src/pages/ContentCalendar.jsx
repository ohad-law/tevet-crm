
import { useState, useEffect } from "react";
import { SocialMediaPost, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, ChevronRight, Plus, Calendar, Instagram, 
  Linkedin, Youtube, Play, Eye, Heart, MessageCircle, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ContentCalendar() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // Added from outline
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // Added from outline
  const [showPostForm, setShowPostForm] = useState(false); // Added from outline
  const [selectedPost, setSelectedPost] = useState(null); // Preserved from original
  const [showPostDialog, setShowPostDialog] = useState(false); // Preserved from original

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

    const postsData = await SocialMediaPost.list("-scheduled_date");
    // Removed ContentIdea.list() and ideas state as per outline
    
    setPosts(postsData);
    setCurrentUser(userData); // Added from outline
    setIsLoading(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getPostsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter(post => {
      const postDate = post.scheduled_date || post.published_date;
      if (!postDate) return false;
      return new Date(postDate).toISOString().split('T')[0] === dateStr;
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const platformIcons = {
    Instagram: Instagram,
    TikTok: Play,
    LinkedIn: Linkedin,
    YouTube: Youtube
  };

  const platformColors = {
    Instagram: 'bg-pink-500',
    TikTok: 'bg-black',
    LinkedIn: 'bg-blue-600',
    YouTube: 'bg-red-600'
  };

  const statusColors = {
    'רעיון': 'bg-gray-100 text-gray-800',
    'בהכנה': 'bg-yellow-100 text-yellow-800',
    'מוכן': 'bg-blue-100 text-blue-800',
    'מתוזמן': 'bg-purple-100 text-purple-800',
    'פורסם': 'bg-green-100 text-green-800'
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  // Stats
  const thisMonthPosts = posts.filter(p => {
    const postDate = new Date(p.scheduled_date || p.published_date || p.created_date);
    return postDate.getMonth() === currentDate.getMonth() && 
           postDate.getFullYear() === currentDate.getFullYear();
  });

  const scheduledCount = thisMonthPosts.filter(p => p.status === 'מתוזמן').length;
  const publishedCount = thisMonthPosts.filter(p => p.status === 'פורסם').length;
  const draftCount = thisMonthPosts.filter(p => p.status === 'בהכנה' || p.status === 'מוכן').length;

  if (isLoading) return <div className="p-8">טוען...</div>;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">לוח תוכן חודשי</h1>
            <p className="text-gray-600">תכנון ותזמון פוסטים</p>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl("PostComposer"))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-5 h-5 ml-2" />
            פוסט חדש
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-lg border-none">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">פוסטים החודש</p>
              <p className="text-3xl font-bold text-gray-900">{thisMonthPosts.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">מתוזמנים</p>
              <p className="text-3xl font-bold text-purple-600">{scheduledCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">פורסמו</p>
              <p className="text-3xl font-bold text-green-600">{publishedCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">טיוטות</p>
              <p className="text-3xl font-bold text-amber-600">{draftCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Navigation */}
        <Card className="shadow-2xl border-none mb-8">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={handlePreviousMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-2xl font-bold">{monthName}</CardTitle>
                <Button variant="link" onClick={handleToday} className="text-sm">
                  חזור להיום
                </Button>
              </div>
              <Button variant="ghost" onClick={handleNextMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, index) => (
                <div key={index} className="text-center font-bold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayPosts = getPostsForDate(day.date);
                const isCurrentDay = isToday(day.date);
                const isPastDay = isPast(day.date);

                return (
                  <motion.div
                    key={index}
                    className={`
                      min-h-[120px] p-2 rounded-lg border-2 transition-all
                      ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${isCurrentDay ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}
                      ${isPastDay && day.isCurrentMonth ? 'opacity-60' : ''}
                      hover:shadow-lg cursor-pointer
                    `}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Date Number */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`
                        text-sm font-semibold
                        ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                        ${isCurrentDay ? 'bg-purple-600 text-white px-2 py-1 rounded-full' : ''}
                      `}>
                        {day.date.getDate()}
                      </span>
                      {dayPosts.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayPosts.length}
                        </Badge>
                      )}
                    </div>

                    {/* Posts for this day */}
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((post) => {
                        const Icon = platformIcons[post.platform];
                        const colorClass = platformColors[post.platform];
                        
                        return (
                          <motion.div
                            key={post.id}
                            className={`
                              ${colorClass} text-white p-2 rounded text-xs
                              hover:opacity-80 transition-opacity cursor-pointer
                            `}
                            onClick={() => {
                              setSelectedPost(post);
                              setShowPostDialog(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              <span className="truncate font-medium">{post.title}</span>
                            </div>
                            <Badge className={`${statusColors[post.status]} text-[10px] mt-1`}>
                              {post.status}
                            </Badge>
                          </motion.div>
                        );
                      })}
                      
                      {dayPosts.length > 3 && (
                        <div className="text-xs text-gray-500 text-center mt-1">
                          +{dayPosts.length - 3} נוספים
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-bold">מקרא</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <span className="text-sm">Instagram</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded"></div>
                <span className="text-sm">TikTok</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm">LinkedIn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-sm">YouTube</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-500 rounded"></div>
                <span className="text-sm">היום</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post Details Dialog */}
      <AnimatePresence>
        {showPostDialog && selectedPost && (
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const Icon = platformIcons[selectedPost.platform];
                    return <Icon className="w-6 h-6" />;
                  })()}
                  {selectedPost.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status & Platform */}
                <div className="flex gap-2">
                  <Badge className={statusColors[selectedPost.status]}>
                    {selectedPost.status}
                  </Badge>
                  <Badge variant="outline">{selectedPost.platform}</Badge>
                  {selectedPost.category && (
                    <Badge variant="outline">{selectedPost.category}</Badge>
                  )}
                </div>

                {/* Scheduled/Published Date */}
                {(selectedPost.scheduled_date || selectedPost.published_date) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {selectedPost.status === 'פורסם' ? 'פורסם ב: ' : 'מתוזמן ל: '}
                    {new Date(selectedPost.scheduled_date || selectedPost.published_date).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}

                {/* Caption */}
                {selectedPost.caption && (
                  <div>
                    <h4 className="font-semibold mb-2">תוכן הפוסט:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {selectedPost.caption}
                    </p>
                  </div>
                )}

                {/* Hook */}
                {selectedPost.hook && (
                  <div>
                    <h4 className="font-semibold mb-2">Hook (פתיחה):</h4>
                    <p className="text-sm text-purple-700 bg-purple-50 p-3 rounded-lg">
                      "{selectedPost.hook}"
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Hashtags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance (if published) */}
                {selectedPost.status === 'פורסם' && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <Eye className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                      <p className="text-lg font-bold">{selectedPost.views || 0}</p>
                      <p className="text-xs text-gray-500">צפיות</p>
                    </div>
                    <div className="text-center">
                      <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                      <p className="text-lg font-bold">{selectedPost.likes || 0}</p>
                      <p className="text-xs text-gray-500">לייקים</p>
                    </div>
                    <div className="text-center">
                      <MessageCircle className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-bold">{selectedPost.comments || 0}</p>
                      <p className="text-xs text-gray-500">תגובות</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-bold">
                        {selectedPost.engagement_rate ? `${selectedPost.engagement_rate}%` : '0%'}
                      </p>
                      <p className="text-xs text-gray-500">מעורבות</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(createPageUrl(`PostComposer?id=${selectedPost.id}`))}
                  >
                    ערוך פוסט
                  </Button>
                  {selectedPost.post_url && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(selectedPost.post_url, '_blank')}
                    >
                      צפה בפוסט
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
