import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Pill, 
  Apple, 
  Activity, 
  History,
  User,
  MessageSquare,
  Users
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleAI: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab, toggleAI }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', notification: false },
    { id: 'disease-predictor', icon: Stethoscope, label: 'Disease', notification: true },
    { id: 'medicine-predictor', icon: Pill, label: 'Medicine', notification: false },
    { id: 'family', icon: Users, label: 'Family', notification: false },
    { id: 'diet', icon: Apple, label: 'Diet', notification: false },
    { id: 'firstaid', icon: Activity, label: 'First Aid', notification: false },
    { id: 'history', icon: History, label: 'History', notification: false },
    { id: 'profile', icon: User, label: 'Profile', notification: false },
  ];

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-xl border-t border-border-light shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-[100] rounded-t-[32px] px-4 pb-safe"
    >
      <div className="max-w-screen-xl mx-auto h-full flex items-center justify-around relative">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center gap-1.5 group flex-1 py-2"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ y: -2 }}
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300 relative",
                  isActive 
                    ? "gradient-primary text-white shadow-xl shadow-brand-primary/30 scale-110" 
                    : "text-text-muted hover:text-brand-primary hover:bg-brand-primary/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.notification && !isActive && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-red border-2 border-white rounded-full animate-pulse" />
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] font-bold tracking-wider transition-all duration-300 uppercase",
                isActive ? "text-brand-primary opacity-100" : "text-text-muted opacity-60 group-hover:opacity-100"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
