import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Apple, 
  Utensils, 
  Zap, 
  Search, 
  Loader2,
  Clock,
  Flame,
  Scale,
  FileText,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { getDietPlan } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface DietPlannerProps {
  activeProfileId: string;
}

export const DietPlanner: React.FC<DietPlannerProps> = ({ activeProfileId }) => {
  const [disease, setDisease] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = async (query: string, result: any) => {
    if (!auth.currentUser) return;
    const path = 'history';
    try {
      await addDoc(collection(db, path), {
        uid: auth.currentUser.uid,
        profileId: activeProfileId,
        type: 'diet-plan',
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

  const handleGenerate = async () => {
    if (!disease.trim() && !selectedFile) return;
    setLoading(true);
    try {
      const data = await getDietPlan(disease, selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : undefined);
      setPlan(data);
      // Save to history
      saveToHistory(disease || (selectedFile ? `File: ${selectedFile.name}` : ''), data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-bold uppercase tracking-widest mb-4">
          <Apple className="w-4 h-4" />
          Grounded in WHO Nutritional Guidelines
        </div>
        <h1 className="text-6xl font-bold text-text-main tracking-tight">Diet Recommendation</h1>
        <p className="text-text-muted text-xl max-w-2xl mx-auto leading-relaxed">
          Personalized nutrition plans tailored to your health condition and recovery needs.
        </p>
        
        <div className="max-w-2xl mx-auto space-y-6 pt-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                placeholder="Enter condition (e.g., Diabetes)"
                className="input-field w-full pl-6 pr-14 py-5 text-lg"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted/40 w-6 h-6" />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-2xl bg-brand-secondary border border-border-light hover:bg-white hover:shadow-md transition-all group"
              title="Attach medical report or image"
            >
              <FileText className="w-7 h-7 text-text-muted group-hover:text-brand-primary" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || (!disease.trim() && !selectedFile)}
              className="btn-primary px-10 py-5 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Generate Plan'}
            </button>
          </div>

          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 w-fit mx-auto"
              >
                <FileText className="w-5 h-5 text-brand-primary" />
                <span className="text-sm font-bold text-brand-primary truncate max-w-[250px]">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="p-1.5 hover:bg-brand-primary/20 rounded-xl transition-all">
                  <X className="w-4 h-4 text-brand-primary" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <GlassCard className="lg:col-span-2 p-10 bg-gradient-to-r from-brand-accent/5 to-transparent border-t-4 border-brand-accent/20">
                <div className="flex items-start gap-8">
                  <div className="w-20 h-20 rounded-3xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                    <Utensils className="text-brand-accent w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-3">Core Strategy</p>
                    <h2 className="text-3xl font-bold mb-4 text-text-main">Nutritional Strategy</h2>
                    <p className="text-text-muted text-lg leading-relaxed">{plan.overview}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-8 border-t-4 border-brand-primary/20 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
                        <Flame className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-text-muted">Daily Calories</span>
                    </div>
                    <span className="text-xl font-bold text-text-main">{plan.nutrition_requirements.calories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                        <Scale className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-text-muted">Daily Protein</span>
                    </div>
                    <span className="text-xl font-bold text-text-main">{plan.nutrition_requirements.protein}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GlassCard className="p-8 border-t-4 border-brand-accent/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-brand-accent/10 text-brand-accent">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main">What to Eat (Indian Foods)</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {plan.what_to_eat.map((item: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-brand-accent/5 text-brand-accent rounded-2xl border border-brand-accent/10 font-bold text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-8 border-t-4 border-brand-red/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-brand-red/10 text-brand-red">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main">What to Avoid</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {plan.what_to_avoid.map((item: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-brand-red/5 text-brand-red rounded-2xl border border-brand-red/10 font-bold text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plan.meals.map((meal: any, i: number) => (
                <GlassCard key={i} delay={i * 0.1} className="flex flex-col p-8 group border-t-4 border-brand-primary/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-brand-secondary group-hover:bg-brand-primary/10 transition-colors">
                      <Clock className="w-5 h-5 text-brand-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{meal.time}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-6 flex-1 text-text-main leading-tight">{meal.food}</h3>
                  <div className="pt-6 border-t border-border-light space-y-3">
                    <div className="flex items-center gap-3 text-sm text-text-muted font-bold">
                      <Zap className="w-4 h-4 text-brand-accent" />
                      <span>{meal.nutrition}</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
