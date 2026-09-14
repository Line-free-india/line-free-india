import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, getCategoryInfo } from '../store/AppContext';
import { useState } from 'react';
import QuickActions from './QuickActions';
import { AnimatePresence, motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { 
  Home, 
  Compass, 
  Heart, 
  Ticket, 
  User, 
  Users, 
  BarChart3, 
  Plus 
} from 'lucide-react';

export default function BottomNav() {
  const { role, unreadCount, businessProfile } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleTabClick = (path: string) => {
    triggerHaptic('selection');
    nav(path);
  };

  if (role === 'customer') {
    const tabs = [
      { path: '/customer/home', label: 'Home', icon: Home },
      { path: '/customer/search', label: 'Discover', icon: Compass },
      { path: '/customer/favourites', label: 'Saved', icon: Heart },
      { path: '/customer/tokens', label: 'My Tokens', icon: Ticket, badge: unreadCount || 1 },
      { path: '/customer/profile', label: 'Account', icon: User },
    ];

    return (
      <nav
        aria-label="Customer Navigation"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_25px_rgba(0,0,0,0.05)] px-3 pt-2.5 app-bottom-safe"
      >
        <div className="flex items-center justify-around relative">
          {tabs.map((tab) => {
            const active = loc.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => handleTabClick(tab.path)}
                className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 cursor-pointer ${
                  active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5.5 h-5.5 transition-transform duration-200 ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.9]'}`} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-sm">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>

                <span className={`text-xs tracking-tight ${active ? 'font-black text-emerald-600' : 'font-bold text-gray-400'}`}>
                  {tab.label}
                </span>

                {active && (
                  <motion.div
                    layoutId="activeTabDotCustomer"
                    className="w-1.5 h-1.5 rounded-full bg-emerald-600 -mt-0.5"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (role === 'business') {
    const tabs = [
      { path: '/barber/home', label: 'Command', icon: Home },
      { path: '/barber/customers', label: 'Queue', icon: Users },
      { path: 'FAB', label: 'Action', icon: null },
      { path: '/barber/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/barber/profile', label: 'Profile', icon: User },
    ];

    return (
      <>
        <nav
          aria-label="Merchant Navigation"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_25px_rgba(0,0,0,0.05)] px-3 pt-2.5 app-bottom-safe"
        >
          <div className="flex items-center justify-around relative">
            {tabs.map((tab) => {
              if (tab.path === 'FAB') {
                return (
                  <div key="fab" className="flex-1 flex items-center justify-center -mt-6">
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setShowQuickActions(true);
                      }}
                      className="w-13 h-13 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition cursor-pointer border-3 border-white"
                      title="Quick Actions"
                    >
                      <Plus className="w-6.5 h-6.5 stroke-[2.8]" />
                    </button>
                  </div>
                );
              }

              const active = loc.pathname === tab.path || (tab.path === '/barber/home' && loc.pathname === '/barber/dashboard');
              const Icon = tab.icon!;

              return (
                <button
                  key={tab.path}
                  onClick={() => handleTabClick(tab.path)}
                  className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 cursor-pointer ${
                    active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className={`w-5.5 h-5.5 transition-transform duration-200 ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.9]'}`} />
                  <span className={`text-xs tracking-tight ${active ? 'font-black text-emerald-600' : 'font-bold text-gray-400'}`}>
                    {tab.label}
                  </span>

                  {active && (
                    <motion.div
                      layoutId="activeTabDotMerchant"
                      className="w-1.5 h-1.5 rounded-full bg-emerald-600 -mt-0.5"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <AnimatePresence>
          {showQuickActions && (
            <QuickActions onClose={() => setShowQuickActions(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
}
