/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BottomNavigation } from './components/BottomNavigation';
import { Header } from './components/Header';
import { MedicalScene } from './components/3d/MedicalScene';
import { AIAssistant } from './components/AIAssistant';
import { Dashboard } from './pages/Dashboard';
import { Predictor } from './pages/Predictor';
import { MedicinePredictor } from './pages/MedicinePredictor';
import { DietPlanner } from './pages/DietPlanner';
import { FirstAid } from './pages/FirstAid';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Family } from './pages/Family';
import { Auth } from './pages/Auth';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { Background3D } from './components/Background3D';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState('self');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
      // Simulate initial loading for futuristic feel
      setTimeout(() => setLoading(false), 1000);
    });
    return () => unsubscribe();
  }, []);

  if (authChecking) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl border-4 border-brand-primary border-t-transparent mb-8"
        />
        <h2 className="text-xl font-display font-bold text-text-main animate-pulse">
          AetherMed AI Security...
        </h2>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard activeProfileId={activeProfileId} setIsAIAssistantOpen={setIsAIAssistantOpen} />;
      case 'disease-predictor': return <Predictor activeProfileId={activeProfileId} />;
      case 'medicine-predictor': return <MedicinePredictor activeProfileId={activeProfileId} />;
      case 'diet': return <DietPlanner activeProfileId={activeProfileId} />;
      case 'firstaid': return <FirstAid activeProfileId={activeProfileId} />;
      case 'history': return <History activeProfileId={activeProfileId} />;
      case 'family': return <Family activeProfileId={activeProfileId} setActiveProfileId={setActiveProfileId} />;
      case 'profile': return <Profile />;
      default: return <Dashboard activeProfileId={activeProfileId} setIsAIAssistantOpen={setIsAIAssistantOpen} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent selection:bg-brand-primary/10">
      <Background3D />
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl border-4 border-brand-primary border-t-transparent mb-8"
            />
            <h2 className="text-xl font-display font-bold text-text-main animate-pulse">
              Initializing AetherMed AI...
            </h2>
            <div className="mt-6 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
                className="h-full bg-brand-primary"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header activeProfileId={activeProfileId} />
      
      <main className="flex-1 flex flex-col min-w-0 pb-24">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        toggleAI={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
      />
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        setIsOpen={setIsAIAssistantOpen} 
        activeProfileId={activeProfileId}
      />
    </div>
  );
}
