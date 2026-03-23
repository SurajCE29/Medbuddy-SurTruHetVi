import React from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Search, 
  User, 
  Calendar,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface HeaderProps {
  activeProfileId: string;
}

export const Header: React.FC<HeaderProps> = ({ activeProfileId }) => {
  const user = auth.currentUser;
  const [activeProfileName, setActiveProfileName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProfileName = async () => {
      if (activeProfileId === 'self') {
        setActiveProfileName(user?.displayName || 'Self');
        return;
      }

      try {
        const docRef = doc(db, 'family', activeProfileId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActiveProfileName(docSnap.data().name);
        }
      } catch (error) {
        console.error("Error fetching profile name:", error);
      }
    };

    fetchProfileName();
  }, [activeProfileId, user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="h-24 flex items-center justify-between px-10 sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border-light">
      <div className="flex-1 max-w-2xl relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/40 w-5 h-5 group-focus-within:text-brand-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Search diagnostics, medicines, or records..."
          className="w-full bg-brand-secondary border border-border-light rounded-2xl py-3.5 pl-14 pr-6 focus:outline-none focus:border-brand-primary/30 focus:bg-white transition-all text-sm font-medium shadow-sm"
        />
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-3 text-text-muted hover:text-text-main transition-colors cursor-pointer px-4 py-2 rounded-xl hover:bg-brand-secondary">
          <Calendar className="w-5 h-5 text-brand-primary" />
          <span className="text-sm font-bold tracking-tight">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="w-px h-8 bg-border-light" />

        <div className="flex items-center gap-6">
          <button className="relative p-3 rounded-2xl hover:bg-brand-secondary text-text-muted hover:text-text-main transition-all shadow-sm border border-border-light">
            <Bell className="w-6 h-6" />
            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-red rounded-full border-2 border-white" />
          </button>
          
          <div className="flex items-center gap-4 pl-2 group relative cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-white border-2 border-border-light p-0.5 group-hover:border-brand-primary/30 transition-all overflow-hidden shadow-sm">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-secondary text-text-muted/40">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-text-main leading-none mb-1.5">{activeProfileName || user?.displayName || 'User'}</p>
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-primary/10 inline-block">
                {activeProfileId === 'self' ? 'Primary Account' : 'Family Member'}
              </p>
            </div>
            
            <div className="absolute top-full right-0 mt-4 w-56 py-3 bg-white border border-border-light rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button 
                onClick={handleLogout}
                className="w-full px-5 py-3 flex items-center gap-4 text-sm font-bold text-text-muted hover:text-brand-red hover:bg-brand-red/5 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-main transition-all" />
          </div>
        </div>
      </div>
    </header>
  );
};
