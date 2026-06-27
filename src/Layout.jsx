import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Briefcase, CheckSquare, Scale, TrendingUp, FileText, Kanban, Target, PieChart, Globe, BarChart3, Megaphone, Clock, Sparkles, MessageCircle, DollarSign, LogIn, Menu, ChevronRight, Settings, Bell, LogOut, Calendar, Mail, HardDrive, Timer, Receipt, Zap, Sun, PenLine } from "lucide-react";

import { base44 } from "@/api/base44Client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/layout/Footer";
import MobileHeader from "@/components/layout/MobileHeader";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [userPermissions, setUserPermissions] = React.useState({ pages: [], specific: [] });
  const [isLoading, setIsLoading] = React.useState(true);
  const [unviewedLeads, setUnviewedLeads] = React.useState({ talush: 0, marketing: 0 });
  
  // Check if public page FIRST - before any auth checks
  const publicPages = ['WorkerIntake', 'ClientDocumentUpload', 'SignDocument', 'FineGuide', 'TalushCheck'];
  const pathName = location.pathname.toLowerCase().replace('/', '');
  const isPublicPage = publicPages.some(page => 
    currentPageName === page || pathName === page.toLowerCase()
  );

  React.useEffect(() => {
    // Skip auth loading for public pages
    if (isPublicPage) {
      setIsLoading(false);
      return;
    }
    
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Load dynamic permissions
        try {
          const allPerms = await base44.entities.UserPermission.list();
          const myPerms = allPerms.find(p => p.email === user.email);
          if (myPerms) {
            setUserPermissions({
              pages: myPerms.allowed_pages || [],
              specific: myPerms.specific_permissions || []
            });
          }
        } catch (err) {
          console.error("Error loading permissions", err);
        }

        // Load unviewed leads count
        try {
          const [talushLeads, marketingLeads] = await Promise.all([
            base44.entities.LeadTalush.filter({ is_viewed: false }),
            base44.entities.Lead.filter({ is_viewed: false })
          ]);
          setUnviewedLeads({
            talush: talushLeads?.length || 0,
            marketing: marketingLeads?.length || 0
          });
        } catch (err) {
          console.error("Error loading unviewed leads", err);
        }

        setIsLoading(false);
      } catch (error) {
        console.log("No user logged in");
        setIsLoading(false);
      }
    };
    loadUser();
  }, [isPublicPage]);

  // For public pages, render immediately without any auth
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50 font-assistant" dir="rtl">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap');
          
          :root {
            --font-assistant: 'Assistant', sans-serif;
          }
          
          body {
            font-family: var(--font-assistant);
            background-color: #f8fafc;
          }
        `}</style>
        {children}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-assistant">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">טוען מערכת...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-assistant p-4">
        <Card className="max-w-md w-full shadow-2xl border-slate-800 bg-slate-900 text-white">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Scale className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              ברוכים הבאים
            </h1>
            <p className="text-slate-400 mb-8">
              מערכת ניהול משפטי מתקדמת
            </p>

            <Button
              size="lg"
              onClick={() => base44.auth.redirectToLogin(location.pathname)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20"
            >
              <LogIn className="w-5 h-5 ml-2" />
              התחברות למערכת
            </Button>

            <div className="mt-8 pt-8 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Secure Legal CRM System v2.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = currentUser?.role || "user";

  const filterByRole = (items) => items.filter(item => {
    // 0. Admin Always Sees All
    if (userRole === 'admin') return true;

    // 1. Check dynamic page permissions - Strict Mode (Overrides everything else if configured)
    if (userPermissions.pages.length > 0 && item.page) {
       return userPermissions.pages.includes(item.page);
    }

    // 2. Check specific functional permissions (overrides roles if present in DB)
    if (item.permissions && userPermissions.specific.length > 0) {
      if (item.permissions.some(p => userPermissions.specific.includes(p))) return true;
    }
    
    // 3. Fallback to role-based (if no specific permission required or not found in DB)
    if (item.roles.includes(userRole)) {
        // If item has specific permissions required, and we haven't granted them via DB, don't show
        // UNLESS the user is admin/superuser (implied by roles check usually, but let's be strict if specific permissions exist)
        if (item.permissions && userPermissions.specific.length > 0) {
            return false; // Has permissions requirements but didn't match above
        }
        return true;
    }
    
    // 4. Legacy/Fallback check on currentUser object directly
    if (item.permissions && currentUser?.specific_permissions) {
      return item.permissions.some(p => currentUser.specific_permissions.includes(p));
    }
    
    return false;
  });

  const navigationItems = [
    { title: "לוח בקרה", url: createPageUrl("Dashboard"), icon: LayoutDashboard, roles: ["admin", "user"], page: "Dashboard" },
    { title: "יום העבודה שלי", url: createPageUrl("WorkDashboard"), icon: Sun, roles: ["admin", "user"], page: "WorkDashboard" },
    { title: "כתיבת מסמכים AI", url: "/LegalDocumentWriter", icon: PenLine, roles: ["admin", "user"], page: "LegalDocumentWriter" },
    { title: "תיקים", url: createPageUrl("Cases"), icon: Briefcase, roles: ["admin", "user"], page: "Cases" },
    { title: "לקוחות", url: createPageUrl("Clients"), icon: Users, roles: ["admin", "user"], page: "Clients" },
    { title: "משימות", url: createPageUrl("Tasks"), icon: CheckSquare, roles: ["admin", "user"], page: "Tasks" },
    { title: "דואר נט-המשפט", url: createPageUrl("NetHamishpatEmails"), icon: Mail, roles: ["admin", "user"], page: "NetHamishpatEmails" },
    { title: "Google Drive", url: createPageUrl("GoogleDriveBrowser"), icon: HardDrive, roles: ["admin", "user"], page: "GoogleDriveBrowser" },
    { title: "שיווק ולידים", url: createPageUrl("MarketingDashboard"), icon: Megaphone, roles: ["admin", "user"], permissions: ["view_marketing"], page: "MarketingDashboard" },
    { title: "Personal Brand", url: createPageUrl("PersonalBrandStudio"), icon: Sparkles, roles: ["admin", "user"], page: "PersonalBrandStudio" },
    { title: "לידים תלושים", url: createPageUrl("LeadsTalushDashboard"), icon: FileText, roles: ["admin", "user"], page: "LeadsTalushDashboard" },
    { title: "לידים שתפ יניב", url: createPageUrl("LeadsShatafYaniv"), icon: FileText, roles: ["admin", "user"], page: "LeadsShatafYaniv" },
    { title: "דף נחיתה תלושים", url: createPageUrl("TalushCheck"), icon: Target, roles: ["admin", "user"], page: "TalushCheck" },
    { title: "יומן דיונים", url: createPageUrl("HearingsDashboard"), icon: Scale, roles: ["admin", "user"], page: "HearingsDashboard" },
    { title: "סדרי דין", url: createPageUrl("ProceduresDashboard"), icon: FileText, roles: ["admin", "user"], page: "ProceduresDashboard" },
    { title: "צ'אט פנימי", url: createPageUrl("InternalChat"), icon: MessageCircle, roles: ["admin", "user"], page: "InternalChat" },
    { title: "פיננסים", url: createPageUrl("Finances"), icon: DollarSign, roles: ["admin"], permissions: ["view_finance"], page: "Finances" },
    { title: "נוכחות", url: createPageUrl("AttendanceReport"), icon: Clock, roles: ["admin", "user"], page: "AttendanceReport" },
    { title: "יומן Google", url: createPageUrl("CalendarSync"), icon: Calendar, roles: ["admin", "user"], page: "CalendarSync" },
    { title: "חתימה מרחוק", url: createPageUrl("SignatureDashboard"), icon: FileText, roles: ["admin", "user"], page: "SignatureDashboard" },
    { title: "WhatsApp Bot", url: createPageUrl("WhatsAppSetup"), icon: MessageCircle, roles: ["admin"], page: "WhatsAppSetup" },
    { title: "אנליטיקת זמן", url: createPageUrl("WorkAnalytics"), icon: Timer, roles: ["admin", "user"], page: "WorkAnalytics" },
    { title: "רואה חשבון דיגיטלי", url: createPageUrl("TaxDashboard"), icon: DollarSign, roles: ["admin"], page: "TaxDashboard" },
    { title: "חשבוניות", url: createPageUrl("InvoicesDashboard"), icon: Receipt, roles: ["admin"], page: "InvoicesDashboard" },
  ];

  const advancedItems = [
    { title: "אוטומציות", url: createPageUrl("TasksProductivity"), icon: Target, roles: ["admin"], permissions: ["manage_automations"], page: "TasksProductivity" },
    { title: "אוטומציית משימות", url: createPageUrl("CaseAutomationSettings"), icon: Zap, roles: ["admin"], page: "CaseAutomationSettings" },
    { title: "אנליטיקה", url: createPageUrl("FinancialAnalysis"), icon: PieChart, roles: ["admin"], permissions: ["view_analytics"], page: "FinancialAnalysis" },
    { title: "ניהול משתמשים", url: createPageUrl("UserManagement"), icon: Users, roles: ["admin"], permissions: ["manage_users"], page: "UserManagement" },
    { title: "עזרים למערכת", url: createPageUrl("SystemAssets"), icon: HardDrive, roles: ["admin"], page: "SystemAssets" },
  ];

  // Calculate filtered items for mobile menu
  const filteredNavItems = filterByRole(navigationItems);
  const filteredAdvancedItems = filterByRole(advancedItems);
  const allMobileItems = [...filteredNavItems, ...filteredAdvancedItems];

  const NavigationGroup = ({ label, items }) => {
    const filtered = filterByRole(items);
    if (filtered.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <SidebarMenuItem key={item.title} className="px-2">
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    className={`
                      w-full h-11 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700 hover:text-white' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }
                    `}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3 relative">
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="font-medium">{item.title}</span>
                      {item.page === 'LeadsTalushDashboard' && unviewedLeads.talush > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0 rounded-full">
                          {unviewedLeads.talush}
                        </Badge>
                      )}
                      {item.page === 'MarketingDashboard' && unviewedLeads.marketing > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0 rounded-full">
                          {unviewedLeads.marketing}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <SidebarProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap');
        
        :root {
          --font-assistant: 'Assistant', sans-serif;
        }
        
        body {
          font-family: var(--font-assistant);
          background-color: #f8fafc;
        }

        h1, h2, h3, h4, h5, h6 {
          font-weight: 700;
          letter-spacing: -0.025em;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-slate-50 font-assistant" dir="rtl">
        <Sidebar className="border-l border-slate-800/50 bg-slate-900" side="right">
          <SidebarHeader className="h-20 flex items-center border-b border-slate-800/50 px-6 bg-slate-900">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg leading-none">LegalTech</span>
                <span className="text-xs text-slate-400 mt-1">CRM System</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="bg-slate-900 py-4">
            <NavigationGroup label="תפריט ראשי" items={navigationItems} />
            <NavigationGroup label="מתקדם" items={advancedItems} />
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-slate-800/50 bg-slate-900">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <Avatar className="w-9 h-9 border-2 border-slate-700">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {currentUser?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser?.full_name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {userRole === 'admin' ? 'מנהל מערכת' : 'עובד'}
                </p>
              </div>
              <Link to={createPageUrl("Settings")}>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  onClick={() => base44.auth.logout()}
                  title="התנתק"
              >
                  <LogOut className="w-4 h-4" />
              </Button>
              </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
          <MobileHeader 
            currentUser={currentUser} 
            pageName={currentPageName} 
            menuItems={allMobileItems}
          />

          <header className="hidden md:flex h-14 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-6 items-center justify-between sticky top-0 z-50 transition-all duration-200">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-500 hover:text-slate-900 hover:bg-slate-100/50" />
              <div className="hidden md:block">
                <h2 className="text-sm font-semibold text-slate-700 tracking-tight">
                  {currentPageName === 'Dashboard' ? 'לוח בקרה' : 
                   currentPageName === 'Cases' ? 'ניהול תיקים' :
                   currentPageName === 'Clients' ? 'מאגר לקוחות' :
                   currentPageName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100/50 rounded-full transition-colors">
                <Bell className="w-4 h-4" />
              </Button>
              <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block"></div>
              <p className="text-xs text-slate-400 hidden md:block font-medium">
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-auto scroll-smooth flex flex-col">
            <div className="flex-1 p-4 md:p-6">
                <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 slide-in-from-bottom-2">
                  {children}
                </div>
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}