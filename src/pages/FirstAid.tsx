import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Camera, 
  Upload, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  X,
  ShieldAlert,
  Phone
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { getFirstAid } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const injuries = [
  { id: 'burn', label: 'Burn', icon: '🔥' },
  { id: 'fracture', label: 'Fracture', icon: '🦴' },
  { id: 'bleeding', label: 'Bleeding', icon: '🩸' },
  { id: 'choking', label: 'Choking', icon: '😮‍💨' },
  { id: 'sprain', label: 'Sprain', icon: '🦵' },
  { id: 'poisoning', label: 'Poisoning', icon: '🧪' },
];

interface FirstAidProps {
  activeProfileId: string;
}

export const FirstAid: React.FC<FirstAidProps> = ({ activeProfileId }) => {
  const [selectedInjury, setSelectedInjury] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = async (query: string, result: any) => {
    if (!auth.currentUser) return;
    const path = 'history';
    try {
      await addDoc(collection(db, path), {
        uid: auth.currentUser.uid,
        profileId: activeProfileId,
        type: 'first-aid',
        query,
        result: JSON.stringify(result),
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setSelectedFile({
          data: base64Data,
          mimeType: file.type || 'application/octet-stream',
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetAid = async (injury: string) => {
    setSelectedInjury(injury);
    setLoading(true);
    try {
      const data = await getFirstAid(injury, selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : undefined);
      setSteps(data);
      // Save to history
      saveToHistory(injury || (selectedFile ? `File: ${selectedFile.name}` : ''), data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16">
        <div className="flex-1 space-y-10">
          <div className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-[11px] font-bold uppercase tracking-[0.4em] mb-4 shadow-sm">
            <AlertCircle className="w-5 h-5" />
            Emergency Response Protocol
          </div>
          <h1 className="text-8xl font-display font-bold text-text-main leading-tight tracking-tight">
            First Aid <br />
            <span className="text-brand-red">Assistant</span>
          </h1>
          <p className="text-text-muted text-2xl leading-relaxed font-medium max-w-3xl">
            Immediate emergency response instructions for common injuries and medical situations in India. Select an injury type or upload a photo for analysis.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-12 py-8 rounded-[40px] bg-white/80 backdrop-blur-xl border-4 border-white shadow-2xl hover:border-brand-primary/40 hover:scale-105 transition-all group flex items-center gap-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                <Upload className="w-8 h-8 text-brand-primary group-hover:text-white transition-all" />
              </div>
              <span className="font-bold text-2xl text-text-main">Analyze Injury Photo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
          </div>

          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-6 p-6 rounded-[32px] bg-white/90 backdrop-blur-2xl border-4 border-white shadow-2xl w-fit"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center shadow-inner">
                  <FileText className="w-7 h-7 text-brand-primary" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-lg font-bold text-text-main truncate max-w-[250px]">{selectedFile.name}</span>
                  <span className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">Visual Context Active</span>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)} 
                  className="ml-4 p-3 hover:bg-brand-red/10 rounded-2xl transition-all text-text-muted hover:text-brand-red"
                >
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden lg:block w-[500px] h-[500px] bg-white/60 backdrop-blur-xl border-4 border-white rounded-[80px] relative overflow-hidden shadow-2xl shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-red/5 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <div className="w-72 h-72 rounded-[64px] border-4 border-brand-red/10 flex items-center justify-center shadow-inner">
                <div className="w-64 h-64 rounded-[56px] border-4 border-brand-red/5 flex items-center justify-center bg-white/40">
                  <ShieldAlert className="w-32 h-32 text-brand-red drop-shadow-2xl" />
                </div>
              </div>
              <div className="absolute -inset-8 border-4 border-brand-red/10 rounded-[80px] animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {injuries.map((injury) => (
          <button
            key={injury.id}
            onClick={() => handleGetAid(injury.label)}
            className={cn(
              "p-10 rounded-[56px] border-4 transition-all duration-500 flex flex-col items-center gap-6 group relative overflow-hidden shadow-2xl",
              selectedInjury === injury.label 
                ? "border-brand-red bg-white shadow-brand-red/20 -translate-y-4" 
                : "bg-white/60 border-white/40 hover:border-brand-red/30 hover:bg-white hover:-translate-y-2"
            )}
          >
            {selectedInjury === injury.label && (
              <motion.div 
                layoutId="active-bg"
                className="absolute inset-0 bg-brand-red/5 -z-10"
              />
            )}
            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-inner">
              <span className="text-5xl drop-shadow-lg">{injury.icon}</span>
            </div>
            <span className="font-bold text-xs text-text-main uppercase tracking-[0.3em] text-center">{injury.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-40 space-y-10"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-brand-primary/10 border-t-brand-primary animate-spin" />
              <Activity className="absolute inset-0 m-auto w-12 h-12 text-brand-primary animate-pulse" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-text-main text-2xl font-bold uppercase tracking-[0.4em] animate-pulse">Retrieving Protocol</p>
              <p className="text-text-muted text-lg font-medium">Consulting Indian Emergency Guidelines...</p>
            </div>
          </motion.div>
        ) : steps.length > 0 ? (
          <motion.div
            key="steps"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-10 mb-20">
              <div className="w-24 h-24 rounded-[40px] bg-brand-red/5 flex items-center justify-center shadow-2xl border-4 border-white">
                <AlertCircle className="text-brand-red w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-6xl font-display font-bold text-text-main tracking-tight">Emergency Steps: {selectedInjury}</h2>
                <p className="text-text-muted text-xl font-medium">Follow these instructions carefully while waiting for help.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <div className="premium-card flex flex-col md:flex-row md:items-start gap-10 p-12 group-hover:border-brand-red/30 transition-all border-4 border-white/40 bg-white/60 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-brand-red/40" />
                    <div className="w-20 h-20 rounded-[32px] bg-white border border-border-light flex items-center justify-center shrink-0 font-bold text-4xl text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all shadow-xl">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-3xl text-text-main leading-tight font-bold tracking-tight">{step.instruction}</p>
                      <div className="flex items-center gap-3 text-brand-accent font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                        <CheckCircle2 className="w-5 h-5" />
                        Action Required
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="premium-card p-16 border-4 border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden mt-24">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-red" />
              <div className="flex flex-col xl:flex-row items-center justify-between gap-16">
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                  <div className="w-32 h-32 rounded-[48px] bg-brand-red/10 flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
                    <Activity className="text-brand-red w-16 h-16" />
                  </div>
                  <div className="space-y-3 text-center md:text-left">
                    <h3 className="text-5xl font-display font-bold text-text-main tracking-tight">Need Immediate Help?</h3>
                    <p className="text-text-muted text-2xl font-medium">Call <span className="text-brand-red font-bold text-3xl">102</span> or <span className="text-brand-red font-bold text-3xl">108</span> for emergency services in India.</p>
                  </div>
                </div>
                <button className="px-16 py-8 rounded-[40px] bg-brand-red text-white font-bold text-2xl shadow-2xl shadow-brand-red/40 hover:scale-105 transition-all active:scale-95 flex items-center gap-6">
                  <Phone className="w-8 h-8" />
                  Call Emergency
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
