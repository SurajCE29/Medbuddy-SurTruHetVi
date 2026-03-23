import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Mic, 
  Loader2,
  ArrowRight,
  Paperclip,
  FileText,
  X,
  Activity,
  Plus
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { predictDisease } from '@/src/services/geminiService';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PredictorProps {
  activeProfileId: string;
}

export const Predictor: React.FC<PredictorProps> = ({ activeProfileId }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = async (query: string, result: any) => {
    if (!auth.currentUser) return;
    const path = 'history';
    try {
      await addDoc(collection(db, path), {
        uid: auth.currentUser.uid,
        profileId: activeProfileId,
        type: 'disease-prediction',
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

  const handlePredict = async () => {
    if (!symptoms.trim() && !selectedFile) return;
    setLoading(true);
    try {
      const data = await predictDisease(symptoms, selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : undefined);
      setResults(data);
      // Save to history
      saveToHistory(symptoms || (selectedFile ? `File: ${selectedFile.name}` : ''), data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center gap-16">
        <div className="flex-1 space-y-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-bold uppercase tracking-[0.4em] mb-4 shadow-sm"
          >
            <Sparkles className="w-5 h-5" />
            Grounded in WHO & CDC Datasets
          </motion.div>
          <h1 className="text-8xl font-display font-bold text-text-main leading-tight tracking-tight">
            Disease <br />
            <span className="text-brand-primary">Predictor</span>
          </h1>
          <p className="text-text-muted text-2xl leading-relaxed font-medium max-w-3xl">
            Input your symptoms below. Our advanced neural network will analyze them against global medical databases to provide potential health insights.
          </p>
          
          <div className="space-y-8">
            <div className="relative group">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms in detail (e.g., 'I have a persistent headache, mild fever, and dry cough for 3 days...')"
                className="w-full h-80 bg-white/80 backdrop-blur-xl border-4 border-white rounded-[48px] p-12 text-3xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-bold transition-all shadow-2xl placeholder:text-text-muted/20 resize-none custom-scrollbar text-text-main tracking-tight leading-tight"
              />
              <div className="absolute right-10 bottom-10 w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-border-light shadow-inner">
                <Activity className="text-text-muted/40 w-8 h-8" />
              </div>
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
                    <span className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">Medical Document Attached</span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="ml-4 p-3 rounded-2xl hover:bg-brand-red/10 text-text-muted hover:text-brand-red transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-3xl bg-white border-4 border-white text-text-muted hover:text-brand-primary hover:scale-110 transition-all shadow-2xl flex items-center justify-center"
                  title="Attach Document"
                >
                  <Paperclip className="w-10 h-10" />
                </button>
                <button className="w-20 h-20 rounded-3xl bg-white border-4 border-white text-text-muted hover:text-brand-primary hover:scale-110 transition-all shadow-2xl flex items-center justify-center">
                  <Mic className="w-10 h-10" />
                </button>
              </div>
              <button
                onClick={handlePredict}
                disabled={loading || (!symptoms.trim() && !selectedFile)}
                className="px-16 py-8 flex items-center gap-5 text-2xl font-bold text-white gradient-primary rounded-[40px] shadow-2xl shadow-brand-primary/40 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Search className="w-8 h-8" />}
                <span>{loading ? 'Analyzing Data...' : 'Analyze Symptoms'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[500px] h-[500px] bg-white/60 backdrop-blur-xl border-4 border-white rounded-[80px] relative overflow-hidden shadow-2xl shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="relative"
            >
              <div className="w-72 h-72 rounded-[64px] border-4 border-brand-primary/10 flex items-center justify-center shadow-inner">
                <div className="w-64 h-64 rounded-[56px] border-4 border-brand-primary/5 flex items-center justify-center bg-white/40">
                  <Activity className="w-32 h-32 text-brand-primary drop-shadow-2xl" />
                </div>
              </div>
              {/* Pulse animation */}
              <motion.div 
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-brand-primary/20 -z-10"
              />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {results.map((res, i) => (
              <div key={i} className="premium-card flex flex-col h-full p-12 border-4 border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 -mr-24 -mt-24 rounded-full blur-[80px] group-hover:bg-brand-primary/10 transition-all" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <h3 className="text-4xl font-display font-bold text-text-main leading-tight">{res.disease}</h3>
                  <div className="px-5 py-2 rounded-2xl bg-brand-primary/10 text-brand-primary text-sm font-bold shadow-sm border border-brand-primary/20">
                    {res.probability}%
                  </div>
                </div>
                
                <div className="w-full h-4 bg-slate-100 rounded-full mb-12 overflow-hidden border border-border-light shadow-inner relative z-10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${res.probability}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    className="h-full bg-brand-primary shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                  />
                </div>

                <p className="text-lg text-text-muted mb-12 flex-1 leading-relaxed font-medium relative z-10">{res.description}</p>

                <div className="p-10 rounded-[40px] bg-slate-50 border border-border-light mb-12 shadow-inner relative overflow-hidden z-10">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/30" />
                  <div className="flex items-center gap-4 text-brand-primary mb-5">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Model Reasoning</span>
                  </div>
                  <p className="text-sm text-text-muted italic leading-relaxed font-medium">{res.modelReasoning}</p>
                </div>

                <div className="space-y-10 relative z-10">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-accent flex items-center gap-4 ml-2">
                      <CheckCircle2 className="w-6 h-6" />
                      Precautions
                    </h4>
                    <ul className="space-y-4">
                      {res.precautions.map((p: string, j: number) => (
                        <li key={j} className="flex items-start gap-5 p-4 rounded-2xl bg-white border border-border-light shadow-sm group hover:bg-brand-accent/5 transition-all">
                          <div className="mt-1.5 w-3 h-3 rounded-full bg-brand-accent shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                          <span className="text-base text-text-muted font-medium leading-tight">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-red flex items-center gap-4 ml-2">
                      <ShieldAlert className="w-6 h-6" />
                      Side Effects
                    </h4>
                    <ul className="space-y-4">
                      {res.sideEffects.map((s: string, j: number) => (
                        <li key={j} className="flex items-start gap-5 p-4 rounded-2xl bg-white border border-border-light shadow-sm group hover:bg-brand-red/5 transition-all">
                          <div className="mt-1.5 w-3 h-3 rounded-full bg-brand-red shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                          <span className="text-base text-text-muted font-medium leading-tight">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="premium-card p-12 border-4 border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-red" />
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-[40px] bg-brand-red/10 flex items-center justify-center shrink-0 border border-brand-red/20">
            <ShieldAlert className="w-12 h-12 text-brand-red" />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-3xl font-display font-bold text-text-main">Medical Disclaimer</h4>
            <p className="text-xl text-text-muted font-medium leading-relaxed italic">
              This AI system is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
