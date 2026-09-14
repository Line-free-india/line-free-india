import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import AdvancedSplashScreen from './components/AdvancedSplashScreen';
import TokenNotificationListener from './components/TokenNotificationListener';
import Sidebar from './components/Sidebar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NativeAppBridge from './components/NativeAppBridge';
import { useTheme, getThemeMode } from './hooks/useTheme';

import { lazyWithRetry } from './utils/lazyWithRetry';

import { Capacitor } from '@capacitor/core';

// ─── Eager Core Pages (Zero network fetch, 100% instant & immune to load failures) ───
import LanguageSelect from './pages/LanguageSelect';
import RoleSelect from './pages/RoleSelect';
import PremiumAnimatedAuth from './pages/PremiumAnimatedAuth';
import CustomerHome from './pages/CustomerHome';
import BarberHome from './pages/BarberHome';
import CustomerSearch from './pages/CustomerSearch';
import SalonDetail from './pages/SalonDetail';
import CustomerTokens from './pages/CustomerTokens';
import NotificationsPage from './pages/NotificationsPage';
import BarberProfile from './pages/BarberProfile';
import BarberCustomers from './pages/BarberCustomers';

// ─── Lazy-loaded Secondary & Deep Pages (Instant first-paint) ───
const CustomerFavourites = lazyWithRetry(() => import('./pages/CustomerFavourites'), 'CustomerFavourites');
const CustomerProfileEdit = lazyWithRetry(() => import('./pages/CustomerProfileEdit'), 'CustomerProfileEdit');
const CustomerHistory = lazyWithRetry(() => import('./pages/CustomerHistory'), 'CustomerHistory');
const CustomerChat = lazyWithRetry(() => import('./pages/CustomerChat'), 'CustomerChat');
const BarberDashboard = lazyWithRetry(() => import('./pages/BarberDashboard'), 'BarberDashboard');
const BarberAnalytics = lazyWithRetry(() => import('./pages/BarberAnalytics'), 'BarberAnalytics');
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'), 'NotFoundPage');
const OfflinePage = lazyWithRetry(() => import('./pages/OfflinePage'), 'OfflinePage');

// ─── Lazy-loaded Pages (Protected with 3x Auto-Retry & Self-Healing Manifest Reload) ───
const ThemeSelect = lazyWithRetry(() => import('./pages/ThemeSelect'), 'ThemeSelect');
const CustomerProfileSetup = lazyWithRetry(() => import('./pages/CustomerProfileSetup'), 'CustomerProfileSetup');
const BarberProfileSetup = lazyWithRetry(() => import('./pages/BarberProfileSetup'), 'BarberProfileSetup');
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const SecretAdminPanel = lazyWithRetry(() => import('./pages/SecretAdminPanel'), 'SecretAdminPanel');
const GetMyUID = lazyWithRetry(() => import('./pages/GetMyUID'), 'GetMyUID');
const SalonQRPage = lazyWithRetry(() => import('./pages/SalonQRPage'), 'SalonQRPage');
const QRScanLanding = lazyWithRetry(() => import('./pages/QRScanLanding'), 'QRScanLanding');
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'), 'TermsOfService');
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'), 'PrivacyPolicy');
const DeleteAccount = lazyWithRetry(() => import('./pages/DeleteAccount'), 'DeleteAccount');
const RefundPolicy = lazyWithRetry(() => import('./pages/RefundPolicy'), 'RefundPolicy');
const TVDisplay = lazyWithRetry(() => import('./pages/TVDisplay'), 'TVDisplay');
const Floorplan = lazyWithRetry(() => import('./pages/Floorplan'), 'Floorplan');
const ProductCatalog = lazyWithRetry(() => import('./pages/ProductCatalog'), 'ProductCatalog');

// ─── Customer Discovery & Addons ───
const CommunityBoard = lazyWithRetry(() => import('./pages/CommunityBoard'), 'CommunityBoard');
const SupportChat = lazyWithRetry(() => import('./pages/SupportChat'), 'SupportChat');
const ReferralPage = lazyWithRetry(() => import('./pages/ReferralPage'), 'ReferralPage');
const SalonDetailSimple = lazyWithRetry(() => import('./pages/SalonDetailSimple'), 'SalonDetailSimple');
const CustomerSubscription = lazyWithRetry(() => import('./pages/CustomerSubscription'), 'CustomerSubscription');
const CustomerHairstyles = lazyWithRetry(() => import('./pages/CustomerHairstyles'), 'CustomerHairstyles');
const CustomerTryOn = lazyWithRetry(() => import('./pages/CustomerTryOn'), 'CustomerTryOn');
const LoyaltyPage = lazyWithRetry(() => import('./pages/LoyaltyPage'), 'LoyaltyPage');
const CustomerLoyalty = lazyWithRetry(() => import('./pages/CustomerLoyalty'), 'CustomerLoyalty');
const ConsultationRoom = lazyWithRetry(() => import('./pages/ConsultationRoom'), 'ConsultationRoom');
const CartPage = lazyWithRetry(() => import('./pages/CartPage'), 'CartPage');
const BusinessCompare = lazyWithRetry(() => import('./pages/BusinessCompare'), 'BusinessCompare');

// ─── Business / Partner Dashboard Addons ───
const BarberMessages = lazyWithRetry(() => import('./pages/BarberMessages'), 'BarberMessages');
const BarberSubscription = lazyWithRetry(() => import('./pages/BarberSubscription'), 'BarberSubscription');

// ─── Business Tools (Beauty-Relevant) ───
const TherapistCalendar = lazyWithRetry(() => import('./pages/TherapistCalendar'), 'TherapistCalendar');
const DesignGalleryManager = lazyWithRetry(() => import('./pages/DesignGalleryManager'), 'DesignGalleryManager');
const UniversalStaffManager = lazyWithRetry(() => import('./pages/UniversalStaffManager'), 'UniversalStaffManager');
const DynamicTaxSettings = lazyWithRetry(() => import('./pages/DynamicTaxSettings'), 'DynamicTaxSettings');
const InventoryLowAlerts = lazyWithRetry(() => import('./pages/InventoryLowAlerts'), 'InventoryLowAlerts');
const MembershipRenewalBot = lazyWithRetry(() => import('./pages/MembershipRenewalBot'), 'MembershipRenewalBot');
const SmartInventory = lazyWithRetry(() => import('./pages/SmartInventory'), 'SmartInventory');
const BridalPackageBuilder = lazyWithRetry(() => import('./pages/BridalPackageBuilder'), 'BridalPackageBuilder');
const DigitalConsentForm = lazyWithRetry(() => import('./pages/DigitalConsentForm'), 'DigitalConsentForm');
const UniversalFeedbackLoop = lazyWithRetry(() => import('./pages/UniversalFeedbackLoop'), 'UniversalFeedbackLoop');
const UniversalReferralEngine = lazyWithRetry(() => import('./pages/UniversalReferralEngine'), 'UniversalReferralEngine');
const DynamicPricing = lazyWithRetry(() => import('./pages/DynamicPricing'), 'DynamicPricing');
const CouponManager = lazyWithRetry(() => import('./pages/CouponManager'), 'CouponManager');
const AppointmentReminders = lazyWithRetry(() => import('./pages/AppointmentReminders'), 'AppointmentReminders');
const BookingCalendar = lazyWithRetry(() => import('./pages/BookingCalendar'), 'BookingCalendar');
const InvoiceGenerator = lazyWithRetry(() => import('./pages/InvoiceGenerator'), 'InvoiceGenerator');
const ExpenseTracker = lazyWithRetry(() => import('./pages/ExpenseTracker'), 'ExpenseTracker');
const CashRegister = lazyWithRetry(() => import('./pages/CashRegister'), 'CashRegister');
const StaffPayroll = lazyWithRetry(() => import('./pages/StaffPayroll'), 'StaffPayroll');
const StaffAttendance = lazyWithRetry(() => import('./pages/StaffAttendance'), 'StaffAttendance');
const ProductRetailPOS = lazyWithRetry(() => import('./pages/ProductRetailPOS'), 'ProductRetailPOS');
const WhatsAppCRM = lazyWithRetry(() => import('./pages/WhatsAppCRM'), 'WhatsAppCRM');
const CustomerCRM = lazyWithRetry(() => import('./pages/CustomerCRM'), 'CustomerCRM');
const CustomerInsights = lazyWithRetry(() => import('./pages/CustomerInsights'), 'CustomerInsights');
const SellProducts = lazyWithRetry(() => import('./pages/SellProducts'), 'SellProducts');
const LeadManager = lazyWithRetry(() => import('./pages/LeadManager'), 'LeadManager');
const MembershipDashboard = lazyWithRetry(() => import('./pages/MembershipDashboard'), 'MembershipDashboard');
const GroomingChecklist = lazyWithRetry(() => import('./pages/GroomingChecklist'), 'GroomingChecklist');
const SmartNotifications = lazyWithRetry(() => import('./pages/SmartNotifications'), 'SmartNotifications');
const LoyaltyProgramManager = lazyWithRetry(() => import('./pages/LoyaltyProgramManager'), 'LoyaltyProgramManager');
const TaskManager = lazyWithRetry(() => import('./pages/TaskManager'), 'TaskManager');
const ShiftPlanner = lazyWithRetry(() => import('./pages/ShiftPlanner'), 'ShiftPlanner');
const BusinessAnalyticsPro = lazyWithRetry(() => import('./pages/BusinessAnalyticsPro'), 'BusinessAnalyticsPro');
const ReferralProgram = lazyWithRetry(() => import('./pages/ReferralProgram'), 'ReferralProgram');
const DailyReportDashboard = lazyWithRetry(() => import('./pages/DailyReportDashboard'), 'DailyReportDashboard');
const DailyReportGenerator = lazyWithRetry(() => import('./pages/DailyReportGenerator'), 'DailyReportGenerator');
const CustomerFeedback = lazyWithRetry(() => import('./pages/CustomerFeedback'), 'CustomerFeedback');
const ContractManager = lazyWithRetry(() => import('./pages/ContractManager'), 'ContractManager');
const SubscriptionManager = lazyWithRetry(() => import('./pages/SubscriptionManager'), 'SubscriptionManager');
const BirthdayReminder = lazyWithRetry(() => import('./pages/BirthdayReminder'), 'BirthdayReminder');
const MembershipCard = lazyWithRetry(() => import('./pages/MembershipCard'), 'MembershipCard');
const HairstyleTryOn = lazyWithRetry(() => import('./pages/HairstyleTryOn'), 'HairstyleTryOn');
const SalonProductCatalog = lazyWithRetry(() => import('./pages/SalonProductCatalog'), 'SalonProductCatalog');
const FranchiseAuth = lazyWithRetry(() => import('./pages/FranchiseAuth'), 'FranchiseAuth');
const FranchiseDashboard = lazyWithRetry(() => import('./pages/FranchiseDashboard'), 'FranchiseDashboard');
const FranchiseManager = lazyWithRetry(() => import('./pages/FranchiseManager'), 'FranchiseManager');
const MarketingDashboard = lazyWithRetry(() => import('./pages/MarketingDashboard'), 'MarketingDashboard');
const TechnicianTracker = lazyWithRetry(() => import('./pages/TechnicianTracker'), 'TechnicianTracker');
const ToolsGridPage = lazyWithRetry(() => import('./pages/ToolsGridPage'), 'ToolsGridPage');
const TVDashboard = lazyWithRetry(() => import('./pages/TVDashboard'), 'TVDashboard');
const MenuEditor = lazyWithRetry(() => import('./pages/MenuEditor'), 'MenuEditor');
const RevenueOps = lazyWithRetry(() => import('./pages/RevenueOps'), 'RevenueOps');

// New Pages
const QueuePassport = lazyWithRetry(() => import('./pages/QueuePassport'), 'QueuePassport');
const OperationsTimeline = lazyWithRetry(() => import('./pages/OperationsTimeline'), 'OperationsTimeline');
const BusinessHealthScore = lazyWithRetry(() => import('./pages/BusinessHealthScore'), 'BusinessHealthScore');

// ─── Beauty Niche Pages (Kept categories only) ───
const MehndiArtist = lazyWithRetry(() => import('./pages/MehndiArtist'), 'MehndiArtist');
const TattooStudio = lazyWithRetry(() => import('./pages/TattooStudio'), 'TattooStudio');
const SpaWellness = lazyWithRetry(() => import('./pages/SpaWellness'), 'SpaWellness');

// ─── NEW: Sprint 1-8 Feature Pages ───
const Achievements = lazyWithRetry(() => import('./pages/Achievements'), 'Achievements');
const RewardsCenter = lazyWithRetry(() => import('./pages/RewardsCenter'), 'RewardsCenter');
const Wallet = lazyWithRetry(() => import('./pages/Wallet'), 'Wallet');
const GiftCards = lazyWithRetry(() => import('./pages/GiftCards'), 'GiftCards');

const OWNER_EMAIL = 'satyamkumar56021@gmail.com';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.email !== OWNER_EMAIL) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'customer' | 'business' }) {
  const { user, role, loading } = useApp();
  if (loading || (user && !role)) return (<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg)"}}>
      <div style={{width:24,height:24,border:"2.5px solid var(--color-border)",borderTopColor:"var(--color-primary)",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
    </div>);
  if (!user) {
    if (requiredRole === 'customer') return <Navigate to="/customer/auth" replace />;
    if (requiredRole === 'business') return <Navigate to="/barber/auth" replace />;
    return <Navigate to="/" replace />;
  }
  if (role !== requiredRole) return <Navigate to="/role" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { loading } = useApp();
  const location = useLocation();
  
  // Apply theme globally
  const [themeMode, setThemeMode] = useState(getThemeMode());
  useTheme(undefined, themeMode);
  
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeMode(getThemeMode());
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  if (loading) return (<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg)"}}>
      <div style={{width:24,height:24,border:"2.5px solid var(--color-border)",borderTopColor:"var(--color-primary)",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
    </div>);

  const isBusinessRoute = location.pathname.startsWith('/barber') ||
    location.pathname.startsWith('/business') ||
    location.pathname.startsWith('/franchise') ||
    location.pathname.startsWith('/beauty');

  return (
    <div className={isBusinessRoute ? 'business-layout scroll-viewport' : 'scroll-viewport'}>
      <Sidebar />
      <PageTransition>
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={
            <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg)"}}><div style={{width:24,height:24,border:"2.5px solid var(--color-border)",borderTopColor:"var(--color-primary)",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>
          }>
            <Routes>
            <Route path="/" element={<LanguageSelect />} />
            <Route path="/theme" element={<ThemeSelect />} />
            <Route path="/role" element={<RoleSelect />} />

          <Route path="/customer/community/:id" element={<CommunityBoard />} />
          <Route path="/customer/support" element={<SupportChat />} />
          <Route path="/customer/refer" element={<ReferralPage />} />
          <Route path="/customer/auth" element={<PremiumAnimatedAuth mode="customer" />} />
          <Route path="/barber/auth" element={<PremiumAnimatedAuth mode="business" />} />
          <Route path="/business/auth" element={<PremiumAnimatedAuth mode="business" />} />
          <Route path="/customer/setup" element={<CustomerProfileSetup />} />
          <Route path="/barber/setup" element={<BarberProfileSetup />} />
          <Route path="/business/setup" element={<BarberProfileSetup />} />
          <Route path="/salon/:id/qr" element={<SalonQRPage />} />
          <Route path="/qr/:id" element={<QRScanLanding />} />
          <Route path="/tv/:businessId" element={<TVDisplay />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/offline" element={<OfflinePage />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          
          {/* 🔐 Secret Admin Panel - Hidden Route */}
          <Route path="/secret-admin-x9z2k" element={<AdminGuard><SecretAdminPanel /></AdminGuard>} />
          
          {/* 🔑 Get My UID Helper */}
          <Route path="/get-my-uid" element={<GetMyUID />} />

          {/* ═══ Customer Side ═══ */}
          <Route path="/customer/home" element={<AuthGuard requiredRole="customer"><CustomerHome /></AuthGuard>} />
          <Route path="/customer/search" element={<AuthGuard requiredRole="customer"><CustomerSearch /></AuthGuard>} />
          <Route path="/customer/salon/:id" element={<AuthGuard requiredRole="customer"><SalonDetail /></AuthGuard>} />
          <Route path="/customer/tokens" element={<AuthGuard requiredRole="customer"><CustomerTokens /></AuthGuard>} />
          <Route path="/customer/profile" element={<AuthGuard requiredRole="customer"><CustomerProfileEdit /></AuthGuard>} />
          <Route path="/customer/subscription" element={<AuthGuard requiredRole="customer"><CustomerSubscription /></AuthGuard>} />
          <Route path="/customer/hairstyles" element={<AuthGuard requiredRole="customer"><CustomerHairstyles /></AuthGuard>} />
          <Route path="/customer/try-on" element={<AuthGuard requiredRole="customer"><CustomerTryOn /></AuthGuard>} />
          <Route path="/customer/passport" element={<AuthGuard requiredRole="customer"><QueuePassport /></AuthGuard>} />
          <Route path="/customer/history" element={<AuthGuard requiredRole="customer"><CustomerHistory /></AuthGuard>} />
          <Route path="/customer/loyalty" element={<AuthGuard requiredRole="customer"><LoyaltyPage /></AuthGuard>} />
          <Route path="/customer/loyalty/:businessId" element={<AuthGuard requiredRole="customer"><CustomerLoyalty /></AuthGuard>} />
          <Route path="/customer/favourites" element={<AuthGuard requiredRole="customer"><CustomerFavourites /></AuthGuard>} />
          <Route path="/customer/chat/:salonId" element={<AuthGuard requiredRole="customer"><CustomerChat /></AuthGuard>} />
          <Route path="/customer/notifications" element={<AuthGuard requiredRole="customer"><NotificationsPage /></AuthGuard>} />
          <Route path="/customer/consultation/:id" element={<AuthGuard requiredRole="customer"><ConsultationRoom /></AuthGuard>} />
          <Route path="/customer/cart" element={<AuthGuard requiredRole="customer"><CartPage /></AuthGuard>} />
          {/* <Route path="/customer/pets" element={<AuthGuard requiredRole="customer"><CustomerPets /></AuthGuard>} /> */}
          <Route path="/customer/achievements" element={<AuthGuard requiredRole="customer"><Achievements /></AuthGuard>} />
          <Route path="/customer/rewards" element={<AuthGuard requiredRole="customer"><RewardsCenter /></AuthGuard>} />
          <Route path="/customer/wallet" element={<AuthGuard requiredRole="customer"><Wallet /></AuthGuard>} />
          <Route path="/customer/gift-cards" element={<AuthGuard requiredRole="customer"><GiftCards /></AuthGuard>} />
          <Route path="/customer/compare" element={<AuthGuard requiredRole="customer"><BusinessCompare /></AuthGuard>} />

          {/* ═══ Business / Partner Side ═══ */}
          <Route path="/barber/home" element={<AuthGuard requiredRole="business"><BarberHome /></AuthGuard>} />
          <Route path="/barber/dashboard" element={<AuthGuard requiredRole="business"><BarberDashboard /></AuthGuard>} />
          <Route path="/barber/profile" element={<AuthGuard requiredRole="business"><BarberProfile /></AuthGuard>} />
          <Route path="/barber/customers" element={<AuthGuard requiredRole="business"><BarberCustomers /></AuthGuard>} />
          <Route path="/barber/analytics" element={<AuthGuard requiredRole="business"><BarberAnalytics /></AuthGuard>} />
          <Route path="/barber/subscription" element={<AuthGuard requiredRole="business"><BarberSubscription /></AuthGuard>} />
          <Route path="/barber/messages" element={<AuthGuard requiredRole="business"><BarberMessages /></AuthGuard>} />
          <Route path="/barber/notifications" element={<AuthGuard requiredRole="business"><NotificationsPage /></AuthGuard>} />
          <Route path="/barber/qr" element={<AuthGuard requiredRole="business"><SalonQRPage id="own" /></AuthGuard>} />

          {/* ═══ Business Aliases (/business/*) ═══ */}
          <Route path="/business/home" element={<AuthGuard requiredRole="business"><BarberHome /></AuthGuard>} />
          <Route path="/business/dashboard" element={<AuthGuard requiredRole="business"><BarberDashboard /></AuthGuard>} />
          <Route path="/business/profile" element={<AuthGuard requiredRole="business"><BarberProfile /></AuthGuard>} />
          <Route path="/business/customers" element={<AuthGuard requiredRole="business"><BarberCustomers /></AuthGuard>} />
          <Route path="/business/analytics" element={<AuthGuard requiredRole="business"><BarberAnalytics /></AuthGuard>} />
          <Route path="/business/subscription" element={<AuthGuard requiredRole="business"><BarberSubscription /></AuthGuard>} />
          <Route path="/business/messages" element={<AuthGuard requiredRole="business"><BarberMessages /></AuthGuard>} />
          <Route path="/business/notifications" element={<AuthGuard requiredRole="business"><NotificationsPage /></AuthGuard>} />
          <Route path="/business/qr" element={<AuthGuard requiredRole="business"><SalonQRPage id="own" /></AuthGuard>} />
          <Route path="/business/tools" element={<AuthGuard requiredRole="business"><ToolsGridPage /></AuthGuard>} />

          {/* ═══ Business Tools (Beauty OS) ═══ */}
          <Route path="/barber/therapist-calendar" element={<AuthGuard requiredRole="business"><TherapistCalendar /></AuthGuard>} />
          <Route path="/barber/gallery" element={<AuthGuard requiredRole="business"><DesignGalleryManager /></AuthGuard>} />
          <Route path="/barber/product-catalog" element={<AuthGuard requiredRole="business"><ProductCatalog /></AuthGuard>} />
          <Route path="/barber/floorplan" element={<AuthGuard requiredRole="business"><Floorplan /></AuthGuard>} />
          <Route path="/barber/staff" element={<AuthGuard requiredRole="business"><UniversalStaffManager /></AuthGuard>} />
          <Route path="/barber/tax" element={<AuthGuard requiredRole="business"><DynamicTaxSettings /></AuthGuard>} />
          <Route path="/barber/inventory-alerts" element={<AuthGuard requiredRole="business"><InventoryLowAlerts /></AuthGuard>} />
          <Route path="/barber/membership-bot" element={<AuthGuard requiredRole="business"><MembershipRenewalBot /></AuthGuard>} />
          <Route path="/barber/inventory" element={<AuthGuard requiredRole="business"><SmartInventory /></AuthGuard>} />
          <Route path="/barber/bridal-packages" element={<AuthGuard requiredRole="business"><BridalPackageBuilder /></AuthGuard>} />
          <Route path="/barber/consent-forms" element={<AuthGuard requiredRole="business"><DigitalConsentForm /></AuthGuard>} />
          <Route path="/barber/feedback" element={<AuthGuard requiredRole="business"><UniversalFeedbackLoop /></AuthGuard>} />
          <Route path="/barber/referrals" element={<AuthGuard requiredRole="business"><UniversalReferralEngine /></AuthGuard>} />
          <Route path="/barber/pricing" element={<AuthGuard requiredRole="business"><DynamicPricing /></AuthGuard>} />
          <Route path="/barber/coupons" element={<AuthGuard requiredRole="business"><CouponManager /></AuthGuard>} />
          <Route path="/barber/reminders" element={<AuthGuard requiredRole="business"><AppointmentReminders /></AuthGuard>} />
          <Route path="/barber/calendar" element={<AuthGuard requiredRole="business"><BookingCalendar /></AuthGuard>} />
          <Route path="/barber/invoices" element={<AuthGuard requiredRole="business"><InvoiceGenerator /></AuthGuard>} />
          <Route path="/barber/expenses" element={<AuthGuard requiredRole="business"><ExpenseTracker /></AuthGuard>} />
          <Route path="/barber/cash-register" element={<AuthGuard requiredRole="business"><CashRegister /></AuthGuard>} />
          <Route path="/barber/payroll" element={<AuthGuard requiredRole="business"><StaffPayroll /></AuthGuard>} />
          <Route path="/barber/attendance" element={<AuthGuard requiredRole="business"><StaffAttendance /></AuthGuard>} />
          <Route path="/barber/pos" element={<AuthGuard requiredRole="business"><ProductRetailPOS /></AuthGuard>} />
          <Route path="/barber/whatsapp" element={<AuthGuard requiredRole="business"><WhatsAppCRM /></AuthGuard>} />
          <Route path="/barber/crm" element={<AuthGuard requiredRole="business"><CustomerCRM /></AuthGuard>} />
          <Route path="/barber/customer-insights" element={<AuthGuard requiredRole="business"><CustomerInsights /></AuthGuard>} />
          <Route path="/barber/sell-products" element={<AuthGuard requiredRole="business"><SellProducts /></AuthGuard>} />
          <Route path="/barber/leads" element={<AuthGuard requiredRole="business"><LeadManager /></AuthGuard>} />
          <Route path="/barber/memberships" element={<AuthGuard requiredRole="business"><MembershipDashboard /></AuthGuard>} />
          <Route path="/barber/grooming-checklist" element={<AuthGuard requiredRole="business"><GroomingChecklist /></AuthGuard>} />
          <Route path="/barber/smart-notifications" element={<AuthGuard requiredRole="business"><SmartNotifications /></AuthGuard>} />
          <Route path="/barber/loyalty-program" element={<AuthGuard requiredRole="business"><LoyaltyProgramManager /></AuthGuard>} />
          <Route path="/barber/tasks" element={<AuthGuard requiredRole="business"><TaskManager /></AuthGuard>} />
          <Route path="/barber/shifts" element={<AuthGuard requiredRole="business"><ShiftPlanner /></AuthGuard>} />
          <Route path="/barber/analytics-pro" element={<AuthGuard requiredRole="business"><BusinessAnalyticsPro /></AuthGuard>} />
          <Route path="/barber/referral-program" element={<AuthGuard requiredRole="business"><ReferralProgram /></AuthGuard>} />
          <Route path="/barber/daily-report" element={<AuthGuard requiredRole="business"><DailyReportDashboard /></AuthGuard>} />
          <Route path="/barber/reports" element={<AuthGuard requiredRole="business"><DailyReportDashboard /></AuthGuard>} />
          <Route path="/barber/tools" element={<AuthGuard requiredRole="business"><ToolsGridPage /></AuthGuard>} />
          <Route path="/barber/report-gen" element={<AuthGuard requiredRole="business"><DailyReportGenerator /></AuthGuard>} />
          <Route path="/barber/customer-feedback" element={<AuthGuard requiredRole="business"><CustomerFeedback /></AuthGuard>} />
          <Route path="/barber/contracts" element={<AuthGuard requiredRole="business"><ContractManager /></AuthGuard>} />
          <Route path="/barber/subscription-mgr" element={<AuthGuard requiredRole="business"><SubscriptionManager /></AuthGuard>} />
          <Route path="/barber/birthdays" element={<AuthGuard requiredRole="business"><BirthdayReminder /></AuthGuard>} />
          <Route path="/barber/membership-card" element={<AuthGuard requiredRole="business"><MembershipCard /></AuthGuard>} />
          <Route path="/barber/hairstyle-tryon" element={<AuthGuard requiredRole="business"><HairstyleTryOn /></AuthGuard>} />
          <Route path="/barber/products" element={<AuthGuard requiredRole="business"><SalonProductCatalog /></AuthGuard>} />
          <Route path="/barber/marketing" element={<AuthGuard requiredRole="business"><MarketingDashboard /></AuthGuard>} />
          <Route path="/barber/technician-tracker" element={<AuthGuard requiredRole="business"><TechnicianTracker /></AuthGuard>} />
          <Route path="/barber/tv-dashboard" element={<AuthGuard requiredRole="business"><TVDashboard /></AuthGuard>} />
          <Route path="/barber/menu-editor" element={<AuthGuard requiredRole="business"><MenuEditor /></AuthGuard>} />
          <Route path="/barber/revenue-ops" element={<AuthGuard requiredRole="business"><RevenueOps /></AuthGuard>} />
          <Route path="/barber/operations" element={<AuthGuard requiredRole="business"><OperationsTimeline /></AuthGuard>} />
          <Route path="/barber/health-score" element={<AuthGuard requiredRole="business"><BusinessHealthScore /></AuthGuard>} />

          {/* ═══ Franchise ═══ */}
          <Route path="/franchise/auth" element={<FranchiseAuth />} />
          <Route path="/franchise/dashboard" element={<AuthGuard requiredRole="business"><FranchiseDashboard /></AuthGuard>} />
          <Route path="/franchise/manager" element={<AuthGuard requiredRole="business"><FranchiseManager /></AuthGuard>} />

          {/* ═══ Beauty Niche Pages ═══ */}
          <Route path="/beauty/mehndi" element={<AuthGuard requiredRole="business"><MehndiArtist /></AuthGuard>} />
          <Route path="/beauty/tattoo" element={<AuthGuard requiredRole="business"><TattooStudio /></AuthGuard>} />
          <Route path="/beauty/spa" element={<AuthGuard requiredRole="business"><SpaWellness /></AuthGuard>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </PageTransition>
    </div>
  );
}

export default function App() {
  // On native Android app, native splash already handles loading - skip web artificial delay for instant startup
  const isNative = Capacitor.isNativePlatform();
  const hasSeenSplash = isNative || localStorage.getItem('lf_splash_seen') === 'true';
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);

  const handleSplashComplete = () => {
    // Mark splash as seen in localStorage
    localStorage.setItem('lf_splash_seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <AdvancedSplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <NativeAppBridge />
          <TokenNotificationListener />
          <PWAInstallPrompt />
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
