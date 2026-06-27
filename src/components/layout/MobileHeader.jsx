import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Briefcase, CheckSquare, Users, Menu, X, Bell, Search, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MobileHeader({ currentUser, pageName, menuItems: propMenuItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Color mapping logic for dynamic items
  const getColorClasses = (index) => {
    const colors = [
      { color: "text-blue-600", bg: "bg-blue-50" },
      { color: "text-indigo-600", bg: "bg-indigo-50" },
      { color: "text-purple-600", bg: "bg-purple-50" },
      { color: "text-pink-600", bg: "bg-pink-50" },
      { color: "text-orange-600", bg: "bg-orange-50" },
      { color: "text-emerald-600", bg: "bg-emerald-50" },
    ];
    return colors[index % colors.length];
  };

  const menuItems = propMenuItems || [
    { title: "לוח בקרה", url: createPageUrl("Dashboard"), icon: LayoutDashboard, ...getColorClasses(0) },
    { title: "תיקים", url: createPageUrl("Cases"), icon: Briefcase, ...getColorClasses(1) },
    { title: "משימות", url: createPageUrl("Tasks"), icon: CheckSquare, ...getColorClasses(2) },
    { title: "לקוחות", url: createPageUrl("Clients"), icon: Users, ...getColorClasses(3) },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="md:hidden sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMenu}
                className="relative z-50 hover:bg-slate-100 rounded-full"
            >
                <motion.div
                    animate={isOpen ? "open" : "closed"}
                    className="w-6 h-6 flex items-center justify-center"
                >
                    {isOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
                </motion.div>
            </Button>
            <h1 className="font-bold text-lg text-slate-800 truncate max-w-[150px]">
                {pageName === 'Dashboard' ? 'LegalTech' : 
                 pageName === 'Cases' ? 'ניהול תיקים' :
                 pageName === 'Tasks' ? 'משימות' :
                 pageName === 'Clients' ? 'לקוחות' : pageName}
            </h1>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 text-slate-500">
                <Search className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8 border border-slate-200">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {currentUser?.full_name?.charAt(0)}
                </AvatarFallback>
            </Avatar>
        </div>
      </div>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 right-0 bg-white shadow-2xl border-b border-slate-200 p-4 rounded-b-3xl overflow-hidden"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="grid grid-cols-2 gap-4 mb-8">
                {menuItems.map((item, idx) => {
                    const style = item.bg ? { bg: item.bg, color: item.color } : getColorClasses(idx);
                    
                    return (
                        <Link 
                            key={item.title} 
                            to={item.url} 
                            onClick={() => setIsOpen(false)}
                        >
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 ${style.bg} hover:shadow-md transition-all h-full text-center`}
                            >
                                <item.icon className={`w-8 h-8 mb-2 ${style.color}`} />
                                <span className="font-bold text-slate-700 text-sm">{item.title}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
                <Link to={createPageUrl("Settings")} onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-slate-600 hover:bg-slate-50 rounded-xl">
                        <Settings className="w-5 h-5" />
                        הגדרות מערכת
                    </Button>
                </Link>
                <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                    onClick={() => base44.auth.logout()}
                >
                    <LogOut className="w-5 h-5" />
                    התנתק
                </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40"
            />
        )}
      </AnimatePresence>
    </div>
  );
}