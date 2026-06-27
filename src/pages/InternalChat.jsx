import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { format } from "date-fns";

// Team members configuration
const TEAM_MEMBERS = [
    { email: "adam@tevet-law.com", name: "אדם טבת", initials: "את", color: "bg-blue-600" },
    { email: "ohad@tevet-law.com", name: "אוהד טבת", initials: "אט", color: "bg-green-600" },
    { email: "tevetlawfirm@gmail.com", name: "משרד טבת", initials: "מט", color: "bg-purple-600" }
];

// Notification sound URL
const NOTIFICATION_SOUND = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function InternalChat() {
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCounts, setUnreadCounts] = useState({});
    const [contactPreviews, setContactPreviews] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const lastMessageCountRef = useRef(0);
    const audioRef = useRef(null);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        audioRef.current.volume = 0.5;
    }, []);

    // Load current user
    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (error) {
                console.error("Failed to load user:", error);
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    // Load unread counts and previews
    const loadMetadata = useCallback(async () => {
        if (!currentUser) return;
        try {
            const [unreadRes, previewsRes] = await Promise.all([
                base44.functions.invoke("internalChat", { action: "get-unread-counts" }),
                base44.functions.invoke("internalChat", { action: "get-contacts-preview" })
            ]);
            
            if (unreadRes.data?.unreadCounts) {
                setUnreadCounts(unreadRes.data.unreadCounts);
            }
            if (previewsRes.data?.previews) {
                setContactPreviews(previewsRes.data.previews);
            }
        } catch (error) {
            console.error("Failed to load metadata:", error);
        }
    }, [currentUser]);

    // Load conversation
    const loadConversation = useCallback(async () => {
        if (!currentUser || !selectedContact) return;
        try {
            const res = await base44.functions.invoke("internalChat", {
                action: "get-conversation",
                other_email: selectedContact.email
            });
            
            if (res.data?.messages) {
                const newMessages = res.data.messages;
                
                // Play sound if new messages arrived from other user
                if (soundEnabled && newMessages.length > lastMessageCountRef.current) {
                    const latestMsg = newMessages[newMessages.length - 1];
                    if (latestMsg && latestMsg.sender_email !== currentUser.email) {
                        audioRef.current?.play().catch(() => {});
                    }
                }
                
                lastMessageCountRef.current = newMessages.length;
                setMessages(newMessages);
            }
            
            // Mark messages as read
            await base44.functions.invoke("internalChat", {
                action: "mark-read",
                sender_email: selectedContact.email
            });
            
            loadMetadata();
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    }, [currentUser, selectedContact, soundEnabled, loadMetadata]);

    // Initial load
    useEffect(() => {
        loadMetadata();
    }, [loadMetadata]);

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!selectedContact) return;
        
        loadConversation();
        const interval = setInterval(loadConversation, 3000);
        return () => clearInterval(interval);
    }, [loadConversation, selectedContact]);

    // Poll metadata every 5 seconds
    useEffect(() => {
        const interval = setInterval(loadMetadata, 5000);
        return () => clearInterval(interval);
    }, [loadMetadata]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedContact || isSending) return;
        
        setIsSending(true);
        try {
            await base44.functions.invoke("internalChat", {
                action: "send",
                receiver_email: selectedContact.email,
                content: newMessage.trim()
            });
            setNewMessage("");
            loadConversation();
        } catch (error) {
            console.error("Failed to send:", error);
            alert("שגיאה בשליחת ההודעה");
        }
        setIsSending(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getOtherMembers = () => {
        return TEAM_MEMBERS.filter(m => m.email !== currentUser?.email);
    };

    const getMemberInfo = (email) => {
        return TEAM_MEMBERS.find(m => m.email === email) || { name: email, initials: "?", color: "bg-gray-500" };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-180px)] flex gap-4">
            {/* Contacts Sidebar */}
            <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden border-slate-200">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        צ'אט פנימי
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">תקשורת צוות המשרד</p>
                </div>
                
                <div className="flex-1 overflow-auto p-2">
                    {getOtherMembers().map((member) => {
                        const unread = unreadCounts[member.email] || 0;
                        const preview = contactPreviews[member.email];
                        const isSelected = selectedContact?.email === member.email;
                        
                        return (
                            <button
                                key={member.email}
                                onClick={() => {
                                    setSelectedContact(member);
                                    lastMessageCountRef.current = 0;
                                }}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all mb-1 ${
                                    isSelected 
                                        ? "bg-blue-50 border-2 border-blue-200" 
                                        : "hover:bg-slate-50 border-2 border-transparent"
                                }`}
                            >
                                <div className="relative">
                                    <Avatar className={`w-12 h-12 ${member.color}`}>
                                        <AvatarFallback className="text-white font-bold">
                                            {member.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Online indicator */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                
                                <div className="flex-1 text-right min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-900">{member.name}</span>
                                        {unread > 0 && (
                                            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {unread}
                                            </Badge>
                                        )}
                                    </div>
                                    {preview && (
                                        <p className="text-xs text-slate-500 truncate mt-1">
                                            {preview.sender_email === currentUser?.email ? "את/ה: " : ""}
                                            {preview.content}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
                
                {/* Sound toggle */}
                <div className="p-3 border-t border-slate-100">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        {soundEnabled ? "צלילים פעילים" : "צלילים כבויים"}
                    </button>
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
                            <div className="relative">
                                <Avatar className={`w-10 h-10 ${selectedContact.color}`}>
                                    <AvatarFallback className="text-white font-bold text-sm">
                                        {selectedContact.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{selectedContact.name}</h3>
                                <p className="text-xs text-green-600">מחובר/ת</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            className="flex-1 overflow-auto p-4 space-y-3"
                            style={{ 
                                background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                            }}
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
                                    <p>אין הודעות עדיין</p>
                                    <p className="text-sm">התחל/י שיחה חדשה!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_email === currentUser?.email;
                                    const senderInfo = getMemberInfo(msg.sender_email);
                                    
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            {!isMe && (
                                                <Avatar className={`w-8 h-8 ${senderInfo.color} flex-shrink-0`}>
                                                    <AvatarFallback className="text-white text-xs font-bold">
                                                        {senderInfo.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            
                                            <div
                                                className={`max-w-[70%] px-4 py-2.5 relative ${
                                                    isMe
                                                        ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                                                        : "bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-sm border border-slate-100"
                                                }`}
                                            >
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                    {msg.content}
                                                </p>
                                                <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                                                    {format(new Date(msg.created_date), "HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="כתוב/י הודעה..."
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm"
                                    disabled={isSending}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || isSending}
                                    size="icon"
                                    className="rounded-full bg-blue-600 hover:bg-blue-700 w-10 h-10 flex-shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-600 mb-2">בחר/י איש קשר</h3>
                        <p className="text-sm">בחר/י אחד מאנשי הצוות כדי להתחיל שיחה</p>
                    </div>
                )}
            </Card>
        </div>
    );
}