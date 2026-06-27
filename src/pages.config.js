/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Attendance from './pages/Attendance';
import CaseAutomationSettings from './pages/CaseAutomationSettings';
import AttendanceReport from './pages/AttendanceReport';
import CalendarSync from './pages/CalendarSync';
import CampaignAnalysis from './pages/CampaignAnalysis';
import CaseDetails from './pages/CaseDetails';
import Cases from './pages/Cases';
import CasesPipeline from './pages/CasesPipeline';
import ClientDetails from './pages/ClientDetails';
import ClientDocumentUpload from './pages/ClientDocumentUpload';
import Clients from './pages/Clients';
import ContentCalendar from './pages/ContentCalendar';
import ContentGenerator from './pages/ContentGenerator';
import ContentIdeas from './pages/ContentIdeas';
import ContentManagement from './pages/ContentManagement';
import ContentTemplates from './pages/ContentTemplates';
import CreateSignatureRequest from './pages/CreateSignatureRequest';
import Dashboard from './pages/Dashboard';
import FeeManagement from './pages/FeeManagement';
import Finances from './pages/Finances';
import FinancialAnalysis from './pages/FinancialAnalysis';
import FineGuide from './pages/FineGuide';
import ForeignWorkersDashboard from './pages/ForeignWorkersDashboard';
import GoogleDriveBrowser from './pages/GoogleDriveBrowser';
import HearingsDashboard from './pages/HearingsDashboard';
import Home from './pages/Home';
import InternalChat from './pages/InternalChat';
import InvoicesDashboard from './pages/InvoicesDashboard';
import LeadManagement from './pages/LeadManagement';
import LeadsShatafYaniv from './pages/LeadsShatafYaniv';
import LeadsTalushDashboard from './pages/LeadsTalushDashboard';
import MarketingDashboard from './pages/MarketingDashboard';
import Messages from './pages/Messages';
import NetHamishpatEmails from './pages/NetHamishpatEmails';
import PersonalBrandStudio from './pages/PersonalBrandStudio';
import PersonalBranding from './pages/PersonalBranding';
import PostComposer from './pages/PostComposer';
import ProceduresDashboard from './pages/ProceduresDashboard';
import Settings from './pages/Settings';
import SignDocument from './pages/SignDocument';
import SignatureDashboard from './pages/SignatureDashboard';
import SocialAccounts from './pages/SocialAccounts';
import SocialAnalytics from './pages/SocialAnalytics';
import SocialEngagement from './pages/SocialEngagement';
import SocialMediaAPIGuide from './pages/SocialMediaAPIGuide';
import SystemAssets from './pages/SystemAssets';
import TalushCheck from './pages/TalushCheck';
import Tasks from './pages/Tasks';
import TasksProductivity from './pages/TasksProductivity';
import TaxDashboard from './pages/TaxDashboard';
import UserManagement from './pages/UserManagement';
import WebsiteAnalytics from './pages/WebsiteAnalytics';
import WhatsAppSetup from './pages/WhatsAppSetup';
import WorkAnalytics from './pages/WorkAnalytics';
import WorkerIntake from './pages/WorkerIntake';
import WorkDashboard from './pages/WorkDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Attendance": Attendance,
    "CaseAutomationSettings": CaseAutomationSettings,
    "AttendanceReport": AttendanceReport,
    "CalendarSync": CalendarSync,
    "CampaignAnalysis": CampaignAnalysis,
    "CaseDetails": CaseDetails,
    "Cases": Cases,
    "CasesPipeline": CasesPipeline,
    "ClientDetails": ClientDetails,
    "ClientDocumentUpload": ClientDocumentUpload,
    "Clients": Clients,
    "ContentCalendar": ContentCalendar,
    "ContentGenerator": ContentGenerator,
    "ContentIdeas": ContentIdeas,
    "ContentManagement": ContentManagement,
    "ContentTemplates": ContentTemplates,
    "CreateSignatureRequest": CreateSignatureRequest,
    "Dashboard": Dashboard,
    "FeeManagement": FeeManagement,
    "Finances": Finances,
    "FinancialAnalysis": FinancialAnalysis,
    "FineGuide": FineGuide,
    "ForeignWorkersDashboard": ForeignWorkersDashboard,
    "GoogleDriveBrowser": GoogleDriveBrowser,
    "HearingsDashboard": HearingsDashboard,
    "Home": Home,
    "InternalChat": InternalChat,
    "InvoicesDashboard": InvoicesDashboard,
    "LeadManagement": LeadManagement,
    "LeadsShatafYaniv": LeadsShatafYaniv,
    "LeadsTalushDashboard": LeadsTalushDashboard,
    "MarketingDashboard": MarketingDashboard,
    "Messages": Messages,
    "NetHamishpatEmails": NetHamishpatEmails,
    "PersonalBrandStudio": PersonalBrandStudio,
    "PersonalBranding": PersonalBranding,
    "PostComposer": PostComposer,
    "ProceduresDashboard": ProceduresDashboard,
    "Settings": Settings,
    "SignDocument": SignDocument,
    "SignatureDashboard": SignatureDashboard,
    "SocialAccounts": SocialAccounts,
    "SocialAnalytics": SocialAnalytics,
    "SocialEngagement": SocialEngagement,
    "SocialMediaAPIGuide": SocialMediaAPIGuide,
    "SystemAssets": SystemAssets,
    "TalushCheck": TalushCheck,
    "Tasks": Tasks,
    "TasksProductivity": TasksProductivity,
    "TaxDashboard": TaxDashboard,
    "UserManagement": UserManagement,
    "WebsiteAnalytics": WebsiteAnalytics,
    "WhatsAppSetup": WhatsAppSetup,
    "WorkAnalytics": WorkAnalytics,
    "WorkerIntake": WorkerIntake,
    "WorkDashboard": WorkDashboard,
}

export const pagesConfig = {
    mainPage: "SignatureDashboard",
    Pages: PAGES,
    Layout: __Layout,
};