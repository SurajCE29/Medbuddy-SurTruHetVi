import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  Clock, 
  ChevronRight, 
  Activity, 
  Pill, 
  Utensils, 
  AlertCircle,
  Loader2,
  FileText,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';

interface HistoryItem {
  id: string;
  type: 'disease-prediction' | 'medicine-prediction' | 'diet-plan' | 'first-aid' | 'report-analysis';
  query: string;
  result: string;
  timestamp: any;
}

interface HistoryProps {
  activeProfileId: string;
}

export const History: React.FC<HistoryProps> = ({ activeProfileId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = 'history';
    const q = query(
      collection(db, path),
      where('uid', '==', auth.currentUser.uid),
      where('profileId', '==', activeProfileId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as HistoryItem);
      });
      setHistory(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const path = 'history';
    try {
      await deleteDoc(doc(db, path, id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredHistory = history.filter(item => 
    item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'disease-prediction': return <Activity className="w-5 h-5 text-brand-primary" />;
      case 'report-analysis': return <FileText className="w-5 h-5 text-brand-primary" />;
      case 'medicine-prediction': return <Pill className="w-5 h-5 text-brand-primary" />;
      case 'diet-plan': return <Utensils className="w-5 h-5 text-brand-accent" />;
      case 'first-aid': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <HistoryIcon className="w-5 h-5 text-brand-secondary-text" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-display font-bold text-text-main tracking-tight leading-tight">Health History</h1>
          <p className="text-text-muted text-xl font-medium">Your personal archive of health insights and AI analysis.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted w-6 h-6" />
          <input 
            type="text" 
            placeholder="Search your records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 backdrop-blur-md border border-border-light rounded-[32px] pl-16 pr-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all shadow-xl shadow-brand-primary/5"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* History List */}
        <div className="lg:col-span-4 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="w-16 h-16 rounded-full border-4 border-brand-primary/10 border-t-brand-primary animate-spin" />
              <p className="text-text-muted text-sm font-bold uppercase tracking-[0.3em] animate-pulse">Retrieving Records...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-32 premium-card rounded-[48px] border-white/40 bg-white/30 backdrop-blur-xl">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <HistoryIcon className="w-12 h-12 text-text-muted/30" />
              </div>
              <h3 className="text-2xl font-display font-bold text-text-main mb-2">No Records Found</h3>
              <p className="text-text-muted font-medium px-10">Start a new analysis to see your health history here.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "group p-6 rounded-[32px] premium-card border-4 cursor-pointer transition-all duration-500 relative overflow-hidden",
                  selectedItem?.id === item.id 
                    ? "border-brand-primary bg-white shadow-2xl shadow-brand-primary/20 scale-[1.02]" 
                    : "border-transparent bg-white/40 hover:bg-white/60 hover:border-brand-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "p-4 rounded-2xl shadow-inner transition-colors duration-500",
                      selectedItem?.id === item.id ? "bg-brand-primary/10" : "bg-slate-100 group-hover:bg-brand-primary/5"
                    )}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-text-main truncate max-w-[180px] mb-1">{item.query}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">
                        <span className="text-brand-primary">{item.type}</span>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-3 rounded-xl hover:bg-brand-red/10 text-text-muted hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all shadow-sm bg-white border border-border-light"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {selectedItem?.id === item.id && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-brand-primary" />
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Details View */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full"
              >
                <div className="premium-card h-full flex flex-col p-12 border-4 border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary animate-gradient-x" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[32px] bg-brand-primary/10 flex items-center justify-center shadow-inner">
                        {getTypeIcon(selectedItem.type)}
                      </div>
                      <div>
                        <h2 className="text-4xl font-display font-bold text-text-main mb-2 leading-tight">{selectedItem.query}</h2>
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 rounded-full bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-brand-primary/20">
                            {selectedItem.type} Analysis
                          </span>
                          <span className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest">
                            <Calendar className="w-4 h-4" />
                            {formatDate(selectedItem.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-6">
                    <div className="space-y-10">
                      <div className="p-10 rounded-[40px] bg-white/80 border border-white shadow-2xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-2 h-8 rounded-full bg-brand-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-primary">AI Insight Summary</h4>
                        </div>
                        
                        <div className="text-text-main leading-relaxed">
                          {(() => {
                            try {
                              const result = JSON.parse(selectedItem.result);
                              if (selectedItem.type === 'disease-prediction') {
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {result.map((res: any, i: number) => (
                                      <div key={i} className="p-8 rounded-[32px] bg-slate-50 border border-border-light shadow-inner group hover:bg-white hover:shadow-xl transition-all duration-500">
                                        <div className="flex justify-between items-center mb-6">
                                          <span className="text-xl font-display font-bold text-text-main">{res.disease}</span>
                                          <div className="px-4 py-2 rounded-2xl bg-brand-primary/10 text-brand-primary font-bold text-lg">
                                            {res.probability}%
                                          </div>
                                        </div>
                                        <p className="text-sm text-text-muted leading-relaxed mb-6 font-medium">{res.description}</p>
                                        {res.modelReasoning && (
                                          <div className="p-5 rounded-2xl bg-white border border-brand-primary/10 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/30" />
                                            <p className="text-[11px] text-text-muted italic leading-relaxed">{res.modelReasoning}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              if (selectedItem.type === 'diet-plan') {
                                return (
                                  <div className="space-y-8">
                                    <div className="p-8 rounded-[32px] bg-brand-accent/5 border border-brand-accent/10 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent/30" />
                                      <p className="text-lg font-medium text-text-main leading-relaxed italic">"{result.overview}"</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {result.meals.map((meal: any, i: number) => (
                                        <div key={i} className="p-6 rounded-[24px] bg-white border border-border-light shadow-sm hover:shadow-md transition-all">
                                          <div className="text-[10px] text-brand-accent font-bold uppercase tracking-[0.2em] mb-2">{meal.time}</div>
                                          <div className="text-lg font-bold text-text-main">{meal.food}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              if (selectedItem.type === 'first-aid') {
                                return (
                                  <div className="space-y-4">
                                    {result.map((step: any, i: number) => (
                                      <div key={i} className="flex gap-6 p-6 rounded-[24px] bg-slate-50 border border-border-light shadow-inner group hover:bg-white transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center font-display font-bold text-2xl text-brand-primary shrink-0">
                                          {step.step}
                                        </div>
                                        <p className="text-lg text-text-main font-medium leading-relaxed pt-1">{step.instruction}</p>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              if (selectedItem.type === 'report-analysis') {
                                return (
                                  <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="p-8 rounded-[32px] bg-slate-50 border border-border-light shadow-inner">
                                        <div className="flex items-center gap-4 mb-6">
                                          <div className="p-3 rounded-xl bg-brand-primary/10">
                                            <Activity className="w-6 h-6 text-brand-primary" />
                                          </div>
                                          <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Diagnosis</h5>
                                        </div>
                                        <p className="text-2xl font-display font-bold text-text-main leading-tight">{result.diagnosis}</p>
                                      </div>
                                      <div className="p-8 rounded-[32px] bg-slate-50 border border-border-light shadow-inner">
                                        <div className="flex items-center gap-4 mb-6">
                                          <div className="p-3 rounded-xl bg-brand-red/10">
                                            <ShieldAlert className="w-6 h-6 text-brand-red" />
                                          </div>
                                          <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Risk Level</h5>
                                        </div>
                                        <span className={cn(
                                          "px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] shadow-lg",
                                          result.risk_level === 'High' ? "bg-brand-red text-white shadow-brand-red/20" :
                                          result.risk_level === 'Medium' ? "bg-brand-orange text-white shadow-brand-orange/20" :
                                          "bg-brand-green text-white shadow-brand-green/20"
                                        )}>
                                          {result.risk_level}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-8 rounded-[32px] bg-slate-50 border border-border-light shadow-inner">
                                      <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 rounded-xl bg-brand-primary/10">
                                          <Pill className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Medicines & Frequency</h5>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.medicines.map((med: string, i: number) => (
                                          <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-border-light shadow-sm">
                                            <span className="text-lg font-bold text-text-main">{med}</span>
                                            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-4 py-2 rounded-xl border border-brand-primary/20 uppercase tracking-widest">
                                              {result.frequency[i]}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="p-8 rounded-[32px] bg-slate-50 border border-border-light shadow-inner">
                                      <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 rounded-xl bg-brand-orange/10">
                                          <AlertCircle className="w-6 h-6 text-brand-orange" />
                                        </div>
                                        <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Side Effects</h5>
                                      </div>
                                      <div className="flex flex-wrap gap-4">
                                        {result.side_effects.map((effect: string, i: number) => (
                                          <span key={i} className="px-5 py-3 rounded-2xl bg-white border border-border-light text-sm font-bold text-text-main shadow-sm flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-brand-orange" />
                                            {effect}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="p-8 rounded-[32px] bg-slate-50 border border-border-light shadow-inner">
                                      <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 rounded-xl bg-brand-primary/10">
                                          <FileText className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Detailed Explanation</h5>
                                      </div>
                                      <p className="text-lg text-text-main leading-relaxed font-medium">{result.disease_explanation}</p>
                                    </div>

                                    <div className="p-10 rounded-[40px] bg-brand-primary text-white shadow-2xl shadow-brand-primary/30 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                                      <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <Calendar className="w-8 h-8" />
                                        <h5 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">Recommended Follow-up</h5>
                                      </div>
                                      <p className="text-2xl font-display font-bold relative z-10 leading-tight">{result.follow_up}</p>
                                    </div>
                                  </div>
                                );
                              }
                              if (selectedItem.type === 'medicine-prediction') {
                                return (
                                  <div className="space-y-10">
                                    {result.medicines ? (
                                      result.medicines.map((medicine: any, idx: number) => (
                                        <div key={idx} className="p-10 rounded-[40px] bg-slate-50 border border-border-light shadow-inner space-y-8">
                                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <h3 className="text-4xl font-display font-bold text-text-main leading-tight">{medicine.medicine_name}</h3>
                                            <div className="px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold text-lg shadow-xl shadow-brand-primary/20">
                                              {medicine.confidence}% Confidence
                                            </div>
                                          </div>
                                          
                                          <div className="p-8 rounded-[32px] bg-white border border-border-light shadow-sm">
                                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted mb-6">Primary Uses</p>
                                            <div className="flex flex-wrap gap-4">
                                              {medicine.uses.map((use: string, i: number) => (
                                                <span key={i} className="px-6 py-3 rounded-2xl bg-brand-primary/10 text-brand-primary font-bold text-sm border border-brand-primary/20">
                                                  {use}
                                                </span>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 rounded-[32px] bg-white border border-border-light shadow-sm">
                                              <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted mb-4">Recommended Dosage</p>
                                              <p className="text-xl font-bold text-text-main leading-relaxed">{medicine.dosage}</p>
                                            </div>
                                            <div className="p-8 rounded-[32px] bg-white border border-border-light shadow-sm">
                                              <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted mb-4">Potential Side Effects</p>
                                              <ul className="space-y-3">
                                                {medicine.side_effects.slice(0, 4).map((effect: string, i: number) => (
                                                  <li key={i} className="flex items-center gap-4 text-sm font-bold text-text-muted">
                                                    <div className="w-2 h-2 rounded-full bg-brand-red shrink-0" />
                                                    {effect}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-10 rounded-[40px] bg-slate-50 border border-border-light shadow-inner space-y-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <h3 className="text-4xl font-display font-bold text-text-main leading-tight">{result.medicine_name}</h3>
                                          <div className="px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold text-lg shadow-xl shadow-brand-primary/20">
                                            {result.confidence}% Confidence
                                          </div>
                                        </div>
                                        <div className="p-8 rounded-[32px] bg-white border border-border-light shadow-sm">
                                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted mb-6">Primary Uses</p>
                                          <div className="flex flex-wrap gap-4">
                                            {result.uses.map((use: string, i: number) => (
                                              <span key={i} className="px-6 py-3 rounded-2xl bg-brand-primary/10 text-brand-primary font-bold text-sm border border-brand-primary/20">
                                                {use}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div className="p-8 rounded-[32px] bg-white border border-border-light shadow-sm">
                                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted mb-4">Recommended Dosage</p>
                                            <p className="text-xl font-bold text-text-main leading-relaxed">{result.dosage}</p>
                                          </div>
                                          <div className="p-8 rounded-[32px] bg-white border border-border-light shadow-sm">
                                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted mb-4">Potential Side Effects</p>
                                            <ul className="space-y-3">
                                              {result.side_effects.map((effect: string, i: number) => (
                                                <li key={i} className="flex items-center gap-4 text-sm font-bold text-text-muted">
                                                  <div className="w-2 h-2 rounded-full bg-brand-red shrink-0" />
                                                  {effect}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return <pre className="text-xs text-text-main font-mono bg-slate-900 text-white p-8 rounded-[32px] overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>;
                            } catch (e) {
                              return <p className="text-xl font-medium text-text-main leading-relaxed whitespace-pre-wrap">{selectedItem.result}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center premium-card rounded-[48px] border-white/40 bg-white/30 backdrop-blur-xl text-center p-20">
                <div className="w-32 h-32 rounded-[40px] bg-slate-100 flex items-center justify-center mb-10 shadow-inner">
                  <ChevronRight className="w-16 h-16 text-text-muted/20" />
                </div>
                <h3 className="text-3xl font-display font-bold mb-4 text-text-main">Select a Record</h3>
                <p className="text-text-muted text-lg max-w-sm font-medium">Choose an activity from your history to view the detailed AI analysis and health recommendations.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
