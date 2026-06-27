import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, CheckCheck, Check, AlertCircle, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [priority, setPriority] = useState("רגיל");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "unread", "unconfirmed"
  const [prevMessagesCount, setPrevMessagesCount] = useState(0);

  useEffect(() => {
    loadData();
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // רשימת המשתמשים המורשים לצ'אט הפנימי
const ALLOWED_CHAT_USERS = [
    'tevetlawfirm@gmail.com',
    'ohad@tevet-law.com', 
    'adam@tevet-law.com'
  ];

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      const [messagesData, usersData] = await Promise.all([
        base44.entities.Message.list("-created_date"),
        base44.entities.User.list()
      ]);

      // Filter messages for current user - only between allowed chat users
      const myMessages = messagesData.filter(
        m => (m.from_email === userData.email || m.to_email === userData.email) &&
             ALLOWED_CHAT_USERS.includes(m.from_email) && 
             ALLOWED_CHAT_USERS.includes(m.to_email)
      );

      // Check for new messages for sound notification
      if (prevMessagesCount > 0 && myMessages.length > prevMessagesCount) {
          // Only play if the latest message is not from me
          const latest = myMessages[0];
          if (latest && latest.from_email !== userData.email) {
             try {
                const audio = new Audio('https://cdn.freesound.org/previews/536/536108_1415754-lq.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log("Audio play failed", e));
             } catch (e) { console.log("Audio error", e); }
          }
      }
      setPrevMessagesCount(myMessages.length);

      setMessages(myMessages);
      // Filter users to only show allowed chat users
      setUsers(usersData.filter(u => 
        u.email !== userData.email && 
        ALLOWED_CHAT_USERS.includes(u.email)
      ));
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading messages:", error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      from_email: currentUser.email,
      from_name: currentUser.full_name,
      to_email: selectedUser.email,
      to_name: selectedUser.full_name,
      message: newMessage,
      priority: priority,
      message_type: "הודעה רגילה",
      is_read: false,
      is_confirmed: false
    };

    await base44.entities.Message.create(messageData);
    setNewMessage("");
    setPriority("רגיל");
    loadData();
  };

  const handleMarkAsRead = async (messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    await base44.entities.Message.update(messageId, {
      ...message,
      is_read: true,
      read_date: new Date().toISOString()
    });
    loadData();
  };

  const handleConfirm = async (messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    await base44.entities.Message.update(messageId, {
      ...message,
      is_read: true,
      is_confirmed: true,
      read_date: message.read_date || new Date().toISOString(),
      confirmed_date: new Date().toISOString()
    });
    loadData();
  };

  const getConversation = (userId) => {
    return messages
      .filter(m =>
        (m.from_email === currentUser.email && m.to_email === userId) ||
        (m.to_email === currentUser.email && m.from_email === userId)
      )
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  };

  const getUnreadCount = (userId) => {
    return messages.filter(
      m => m.from_email === userId && m.to_email === currentUser.email && !m.is_read
    ).length;
  };

  const getFilteredMessages = () => {
    let filtered = messages;
    
    if (filter === "unread") {
      filtered = messages.filter(m => m.to_email === currentUser.email && !m.is_read);
    } else if (filter === "unconfirmed") {
      filtered = messages.filter(m => m.from_email === currentUser.email && !m.is_confirmed);
    }
    
    return filtered;
  };

  const myUnreadCount = messages.filter(m => m.to_email === currentUser.email && !m.is_read).length;
  const myUnconfirmedCount = messages.filter(m => m.from_email === currentUser.email && !m.is_confirmed).length;

  const conversation = selectedUser ? getConversation(selectedUser.email) : [];

  const priorityColors = {
    "רגיל": "bg-gray-100 text-gray-800",
    "גבוה": "bg-orange-100 text-orange-800",
    "דחוף": "bg-red-100 text-red-800"
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight flex items-center gap-2 md:gap-3">
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
              צ'אט פנימי
            </h1>
            <p className="text-slate-500 text-sm md:text-lg">תקשורת מהירה ויעילה עם הצוות</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">הודעות שלי</p>
              <p className="text-2xl font-bold">{messages.filter(m => m.from_email === currentUser.email).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">הודעות שקיבלתי</p>
              <p className="text-2xl font-bold">{messages.filter(m => m.to_email === currentUser.email).length}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="p-4">
              <p className="text-sm text-orange-700">לא נקראו</p>
              <p className="text-2xl font-bold text-orange-600">{myUnreadCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-700">ממתינות לאישור</p>
              <p className="text-2xl font-bold text-red-600">{myUnconfirmedCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Users List */}
          <Card className="lg:col-span-1">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                אנשי קשר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {users.map((user) => {
                  const unreadCount = getUnreadCount(user.email);
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-4 border-b hover:bg-gray-50 transition-colors text-right ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.role === 'admin' ? 'מנהל' : 'עובד'}</p>
                        </div>
                        {unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedUser ? `שיחה עם ${selectedUser.full_name}` : 'בחר איש קשר'}
                </span>
                {selectedUser && (
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="רגיל">רגיל</SelectItem>
                      <SelectItem value="גבוה">גבוה</SelectItem>
                      <SelectItem value="דחוף">דחוף</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!selectedUser ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>בחר איש קשר כדי להתחיל שיחה</p>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
                    <AnimatePresence>
                      {conversation.map((msg) => {
                        const isMe = msg.from_email === currentUser.email;
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                              <div className="flex items-center gap-2 mb-1">
                                {msg.priority !== "רגיל" && (
                                  <Badge className={priorityColors[msg.priority]} variant="outline">
                                    {msg.priority}
                                  </Badge>
                                )}
                                {msg.message_type !== "הודעה רגילה" && (
                                  <Badge variant="outline">{msg.message_type}</Badge>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(msg.created_date).toLocaleString('he-IL')}</span>
                                {isMe && (
                                  <>
                                    {msg.is_confirmed ? (
                                      <CheckCheck className="w-4 h-4 text-green-500" />
                                    ) : msg.is_read ? (
                                      <CheckCheck className="w-4 h-4 text-blue-500" />
                                    ) : (
                                      <Check className="w-4 h-4 text-gray-300" />
                                    )}
                                  </>
                                )}
                              </div>
                              {!isMe && !msg.is_confirmed && (
                                <div className="mt-2 flex gap-2">
                                  {!msg.is_read && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkAsRead(msg.id)}
                                      className="text-xs bg-white hover:bg-gray-50"
                                    >
                                      <Check className="w-3 h-3 ml-1" />
                                      קראתי
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirm(msg.id)}
                                    className="text-xs bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <CheckCheck className="w-3 h-3 ml-1" />
                                    אישור קבלה
                                  </Button>
                                </div>
                              )}
                            </div>
                            </motion.div>
                            );
                            })}
                            </AnimatePresence>
                            </div>

                            {/* Send Message */}
                            <div className="flex gap-2">
                            <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="כתוב הודעה..."
                            rows={3}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                            handleSendMessage();
                            }
                            }}
                            />
                            <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                            >
                            <Send className="w-4 h-4" />
                            </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Ctrl+Enter לשליחה מהירה</p>
                            </>
                            )}
                            </CardContent>
                            </Card>
                            </div>
                            </div>
                            );
                            }