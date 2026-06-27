
import { useState, useEffect } from "react";
import { SocialMediaPost, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Heart, Send, User as UserIcon, Instagram, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SocialEngagement() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState("");
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

    const postsData = await SocialMediaPost.list("-published_date");
    // Updated filtering: only by status 'פורסם', no longer requiring comments > 0
    const publishedPosts = postsData.filter(p => p.status === 'פורסם'); 
    setPosts(publishedPosts);
    
    // Set the first published post as selected, if any exist
    if (publishedPosts.length > 0) {
      setSelectedPost(publishedPosts[0]);
    } else {
      setSelectedPost(null); // Explicitly clear if no published posts
    }
    
    setIsLoading(false);
  };

  // Mock comments (in a real app, these would come from the social media APIs)
  const mockComments = [
    {
      id: 1,
      author: "Sarah Cohen",
      text: "תודה רבה על המידע! זה בדיוק מה שהייתי צריכה 🙏",
      timestamp: "לפני 2 שעות",
      replied: false,
      likes: 5
    },
    {
      id: 2,
      author: "David Levi",
      text: "יש לי שאלה - זה גם תקף לעובדים זרים?",
      timestamp: "לפני 3 שעות",
      replied: false,
      likes: 2
    },
    {
      id: 3,
      author: "Maya Israeli",
      text: "שמרתי את הפוסט! מאוד מועיל 💪",
      timestamp: "לפני 5 שעות",
      replied: true,
      likes: 8
    }
  ];

  const handleSendReply = () => {
    if (replyText.trim()) {
      alert(`תגובה נשלחה: ${replyText}`);
      setReplyText("");
      // In real app: send to API
    }
  };

  const handleCreateLead = (comment) => {
    // Create lead from engaged user
    navigate(createPageUrl("LeadManagement"));
  };

  if (isLoading) return <div className="p-8">טוען...</div>;

  // Display a message if there are no posts after filtering
  if (posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">אין עדיין פוסטים מפורסמים</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">ניהול תגובות</h1>
          <p className="text-gray-600">Social Media Engagement</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Posts List */}
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-bold">פוסטים</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedPost?.id === post.id
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {post.platform === 'Instagram' ? (
                        <Instagram className="w-5 h-5 text-pink-600" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{post.title}</h4>
                        <div className="flex gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments & Replies */}
          <Card className="lg:col-span-2 shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">{selectedPost?.title || "בחר פוסט"}</CardTitle>
                  {selectedPost && (
                    <p className="text-sm text-gray-600 mt-1">
                      {mockComments.length} תגובות | {mockComments.filter(c => !c.replied).length} ממתינות למענה
                    </p>
                  )}
                </div>
                {selectedPost && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {selectedPost?.platform}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {selectedPost ? (
                <>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {mockComments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg ${
                            comment.replied
                              ? 'bg-green-50 border-2 border-green-200'
                              : 'bg-gray-50 border-2 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-purple-700" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-gray-900">{comment.author}</h4>
                                  <p className="text-xs text-gray-500">{comment.timestamp}</p>
                                </div>
                                {comment.replied && (
                                  <Badge className="bg-green-600 text-white">
                                    נענה ✓
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700 mb-3">{comment.text}</p>
                              
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs">
                                  <Heart className="w-3 h-3 ml-1" />
                                  {comment.likes}
                                </Button>
                                {!comment.replied && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => setReplyText(`@${comment.author} `)}
                                    >
                                      <MessageCircle className="w-3 h-3 ml-1" />
                                      השב
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs bg-blue-50"
                                      onClick={() => handleCreateLead(comment)}
                                    >
                                      <UserIcon className="w-3 h-3 ml-1" />
                                      צור ליד
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Reply Box */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex gap-3">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="כתוב תגובה..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="w-4 h-4 ml-2" />
                        שלח
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 טיפ: תגובות מהירות (תוך 30 דקות) מגבירות מעורבות ב-60%
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <p>בחר פוסט מהרשימה כדי לראות ולנהל תגובות.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
