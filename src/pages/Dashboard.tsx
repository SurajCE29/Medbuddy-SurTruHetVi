import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  User, 
  Globe, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Stethoscope, 
  Pill, 
  Calendar, 
  ChevronRight, 
  Loader2,
  Bell,
  Volume2,
  Download,
  MessageSquare,
  ShieldAlert,
  Plus,
  AlertTriangle,
  Utensils
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { cn } from '@/src/lib/utils';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeMedicalDocument } from '@/src/services/geminiService';

import { generateMedicalReport } from '@/src/lib/pdfGenerator';

type Step = 'UPLOAD' | 'AGE' | 'GENDER' | 'LANGUAGE' | 'PROCESSING' | 'RESULT';

interface AnalysisResult {
  diagnosis: string;
  medicines: string[];
  medicine_availability?: { name: string; is_available_in_india: boolean; warning: string }[];
  frequency: string[];
  side_effects: string[];
  disease_explanation: string;
  diet_plan?: {
    what_to_eat: string[];
    what_to_avoid: string[];
    calories: string;
    protein: string;
  };
  follow_up: string;
  risk_level: string;
  reminders: { medicine: string; times: string[] }[];
}

interface DashboardProps {
  activeProfileId: string;
  setIsAIAssistantOpen: (isOpen: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeProfileId, setIsAIAssistantOpen }) => {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [file, setFile] = useState<{ data: string; mimeType: string } | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('Not Specified');
  const [language, setLanguage] = useState<string>('English');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = auth.currentUser;

  const handleExportPDF = async () => {
    if (!result) return;
    setIsGeneratingPDF(true);
    try {
      // Small delay for UX to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      generateMedicalReport({
        patientAge: age,
        patientGender: gender,
        language,
        fileName,
        result,
        remindersEnabled
      });
    } catch (error) {
      console.error("PDF Generation failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const processingSteps = [
    "Extracting text from documents...",
    "Understanding diagnosis and clinical notes...",
    "Mapping medicines and dosages...",
    "Generating personalized health insights..."
  ];

  useEffect(() => {
    if (step === 'PROCESSING') {
      const interval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev < processingSteps.length - 1) return prev + 1;
          return prev;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let uploadedFile: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      uploadedFile = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      uploadedFile = e.dataTransfer.files[0];
    }

    if (uploadedFile) {
      const size = (uploadedFile.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${size} MB`);
      setFileName(uploadedFile.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFile({ data: base64String, mimeType: uploadedFile!.type });
      };
      reader.readAsDataURL(uploadedFile);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e);
  };

  const startAnalysis = async () => {
    if (!file || !age) return;
    setStep('PROCESSING');
    try {
      const analysis = await analyzeMedicalDocument(file, parseInt(age), language);
      setResult(analysis);
      
      // Save to history
      if (auth.currentUser) {
        const path = 'history';
        try {
          await addDoc(collection(db, path), {
            uid: auth.currentUser.uid,
            profileId: activeProfileId,
            type: 'report-analysis',
            query: `Medical Report Analysis (${fileName})`,
            result: JSON.stringify(analysis),
            timestamp: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      
      setStep('RESULT');
    } catch (error) {
      console.error("Analysis failed:", error);
      setStep('UPLOAD');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'UPLOAD':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto w-full"
          >
            <div className="text-center mb-12">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-gradient-to-tr from-brand-primary to-brand-purple rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-primary/20 relative"
              >
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                <Upload className="w-10 h-10 text-white relative z-10" />
              </motion.div>
              <h1 className="text-5xl font-display font-bold text-text-main mb-4 tracking-tight">
                Upload Your Medical Reports
              </h1>
              <p className="text-text-muted text-xl font-medium max-w-xl mx-auto">
                Prescriptions, lab reports, or scans. Our AI will analyze them instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div
                      key="upload-zone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative group p-16 border-3 border-dashed rounded-[40px] transition-all duration-500 cursor-pointer overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center",
                        isDragging 
                          ? "border-brand-primary bg-brand-primary/5 shadow-2xl shadow-brand-primary/10" 
                          : "border-border-light bg-white/40 backdrop-blur-md hover:border-brand-primary/50 hover:bg-white/60"
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      
                      {/* Animated Background Elements */}
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl"
                        />
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.1, 0.15, 0.1]
                          }}
                          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                          className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-purple/20 rounded-full blur-3xl"
                        />
                      </div>

                      <div className="relative z-10 space-y-8">
                        <div className="relative w-24 h-24 mx-auto">
                          <motion.div
                            animate={isDragging ? { y: [0, -20, 0] } : { y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-full h-full bg-white rounded-3xl shadow-xl flex items-center justify-center"
                          >
                            <FileText className="w-10 h-10 text-brand-primary" />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-accent rounded-2xl shadow-lg flex items-center justify-center text-white"
                          >
                            <Plus className="w-6 h-6" />
                          </motion.div>
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="text-2xl font-bold text-text-main">
                            {isDragging ? "Drop your files here" : "Drag & drop or click to upload"}
                          </h3>
                          <p className="text-text-muted font-medium">
                            Support for PDF, JPG, PNG, DOC (Max 10MB)
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-4">
                          <div className="h-px w-12 bg-border-light" />
                          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">OR</span>
                          <div className="h-px w-12 bg-border-light" />
                        </div>

                        <button className="px-8 py-4 bg-white border border-border-light rounded-2xl font-bold text-text-main shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all flex items-center gap-3 mx-auto">
                          <Globe className="w-5 h-5 text-brand-primary" />
                          Browse Files
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-10 border-2 border-brand-primary/20 rounded-[40px] bg-white/60 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center min-h-[400px]"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-brand-green/10 rounded-3xl flex items-center justify-center mb-8"
                      >
                        <CheckCircle2 className="w-10 h-10 text-brand-green" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-text-main mb-2">File Ready for Analysis</h3>
                      <p className="text-text-muted mb-8">We've successfully processed your document.</p>

                      <div className="w-full max-w-sm p-6 bg-white rounded-3xl shadow-sm border border-border-light flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-sm font-bold text-text-main truncate">{fileName}</p>
                          <p className="text-xs text-text-muted font-bold">{fileSize}</p>
                        </div>
                        <button 
                          onClick={() => { setFile(null); setFileName(''); }}
                          className="p-2 hover:bg-brand-red/10 text-text-muted hover:text-brand-red rounded-lg transition-all"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex gap-4 w-full max-w-sm">
                        <button 
                          onClick={() => { setFile(null); setFileName(''); }}
                          className="flex-1 py-4 rounded-2xl bg-brand-secondary text-text-main font-bold hover:bg-border-light transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => setStep('AGE')}
                          className="flex-1 py-4 rounded-2xl gradient-primary text-white font-bold shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-6">
                <GlassCard className="p-8 border-l-4 border-brand-primary">
                  <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand-primary" />
                    Privacy First
                  </h4>
                  <p className="text-sm text-text-muted leading-relaxed font-medium">
                    Your medical data is encrypted and processed securely. We never share your personal information with third parties.
                  </p>
                </GlassCard>

                <GlassCard className="p-8 border-l-4 border-brand-purple">
                  <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-purple" />
                    AI Insights
                  </h4>
                  <p className="text-sm text-text-muted leading-relaxed font-medium">
                    Our advanced AI models extract diagnosis, medications, and risk factors to give you a clear understanding of your health.
                  </p>
                </GlassCard>

                <div className="p-8 rounded-[32px] bg-gradient-to-br from-brand-primary to-brand-purple text-white shadow-xl shadow-brand-primary/20">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Multilingual Support
                  </h4>
                  <p className="text-sm opacity-90 leading-relaxed font-medium">
                    Get your reports explained in English, Hindi, or Hinglish for better clarity and comfort.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'AGE':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto"
          >
            <GlassCard className="p-10 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-brand-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Please enter your Age</h2>
              <p className="text-text-muted mb-8">This helps our AI provide more accurate dosage and risk assessment.</p>
              
              <div className="space-y-6">
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter age (0-120)"
                  className="input-field text-center text-2xl font-bold py-4"
                  min="0"
                  max="120"
                />
                <button 
                  onClick={() => setStep('GENDER')}
                  disabled={!age || parseInt(age) < 0 || parseInt(age) > 120}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        );

      case 'GENDER':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto"
          >
            <GlassCard className="p-10 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-brand-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Choose your Gender</h2>
              <p className="text-text-muted mb-8">This helps our AI provide more accurate dosage and risk assessment.</p>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200",
                      gender === g 
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary" 
                        : "border-border-light hover:border-brand-primary/30"
                    )}
                  >
                    <span className="font-bold">{g}</span>
                    {gender === g && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setStep('LANGUAGE')}
                className="btn-primary w-full"
              >
                Continue
              </button>
            </GlassCard>
          </motion.div>
        );

      case 'LANGUAGE':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto"
          >
            <GlassCard className="p-10 text-center">
              <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-brand-purple" />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Choose your preferred language</h2>
              <p className="text-text-muted mb-8">We can explain your reports in multiple languages.</p>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                {['English', 'Hindi', 'Hinglish'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200",
                      language === lang 
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary" 
                        : "border-border-light hover:border-brand-primary/30"
                    )}
                  >
                    <span className="font-bold">{lang}</span>
                    {language === lang && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>

              <button 
                onClick={startAnalysis}
                className="btn-primary w-full"
              >
                Analyze Report
              </button>
            </GlassCard>
          </motion.div>
        );

      case 'PROCESSING':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-center py-20"
          >
            <div className="relative w-40 h-40 mx-auto mb-16">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-brand-primary/10 border-t-brand-primary rounded-[40px]"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-4 border-brand-purple/10 border-t-brand-purple rounded-[32px]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-16 h-16 text-brand-primary animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-4xl font-display font-bold text-text-main mb-4 tracking-tight">Analyzing your medical documents...</h2>
            <p className="text-text-muted text-lg mb-12 font-medium">Our AI is extracting critical health data from your report.</p>
            
            <div className="max-w-md mx-auto space-y-6 text-left">
              {processingSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className={cn(
                    "w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    processingStep >= i ? "bg-brand-accent text-white scale-110" : "bg-brand-secondary text-text-muted"
                  )}>
                    {processingStep > i ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <span className={cn(
                      "text-base font-bold transition-colors duration-500",
                      processingStep >= i ? "text-text-main" : "text-text-muted"
                    )}>
                      {s}
                    </span>
                    {processingStep === i && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-1 bg-brand-primary/20 rounded-full mt-2 overflow-hidden"
                      >
                        <motion.div 
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="h-full w-1/2 bg-brand-primary"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'RESULT':
        if (!result) return null;
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-text-main">Analysis Results</h1>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                    result.risk_level === 'High' ? "bg-brand-red/10 text-brand-red" :
                    result.risk_level === 'Medium' ? "bg-brand-orange/10 text-brand-orange" :
                    "bg-brand-accent/10 text-brand-accent"
                  )}>
                    {result.risk_level} Risk
                  </span>
                </div>
                <p className="text-text-muted">Comprehensive AI insights based on your medical documents.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleExportPDF}
                  disabled={isGeneratingPDF}
                  className="btn-secondary flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export PDF
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Chat with AI
                </button>
              </div>
            </header>

            <div className="space-y-8">
              {/* Medicine Availability Warning */}
              {result.medicine_availability && result.medicine_availability.some(m => !m.is_available_in_india) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-brand-orange font-semibold text-sm">Medicine Availability Warning</h4>
                    <p className="text-sm text-brand-orange/80 mt-1">
                      Some prescribed medicines might not be commonly available in India. 
                      {result.medicine_availability.filter(m => !m.is_available_in_india).map(m => (
                        <span key={m.name} className="block mt-1 font-medium">• {m.name}: {m.warning || "Consult your doctor for generic alternatives."}</span>
                      ))}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Diagnosis */}
                <GlassCard className="p-6 border-t-4 border-brand-primary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-brand-primary/10">
                      <Stethoscope className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h3 className="font-bold text-text-main">Diagnosis Summary</h3>
                  </div>
                  <p className="text-text-main font-bold text-xl leading-tight mb-2">{result.diagnosis}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Risk Level:</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      result.risk_level === 'High' ? 'bg-brand-red/10 text-brand-red' :
                      result.risk_level === 'Medium' ? 'bg-brand-orange/10 text-brand-orange' :
                      'bg-brand-accent/10 text-brand-accent'
                    )}>
                      {result.risk_level}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{result.disease_explanation}</p>
                </GlassCard>

                {/* Diet Plan Card */}
                {result.diet_plan && (
                  <GlassCard className="p-6 border-t-4 border-brand-accent">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-brand-accent/10 rounded-xl">
                        <Utensils className="w-5 h-5 text-brand-accent" />
                      </div>
                      <h3 className="font-bold text-text-main">Indian Diet Plan</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-brand-secondary p-2 rounded-xl border border-border-light">
                        <p className="text-[9px] uppercase font-bold text-text-muted mb-0.5">Calories</p>
                        <p className="text-xs font-bold text-brand-primary">{result.diet_plan.calories}</p>
                      </div>
                      <div className="bg-brand-secondary p-2 rounded-xl border border-border-light">
                        <p className="text-[9px] uppercase font-bold text-text-muted mb-0.5">Protein</p>
                        <p className="text-xs font-bold text-brand-accent">{result.diet_plan.protein}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-brand-accent flex items-center gap-1 mb-1.5 uppercase">
                          <CheckCircle2 className="w-3 h-3" /> WHAT TO EAT
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.diet_plan.what_to_eat.map((item, idx) => (
                            <span key={idx} className="text-[10px] bg-brand-accent/5 text-brand-accent px-2 py-0.5 rounded-lg border border-brand-accent/10 font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-red flex items-center gap-1 mb-1.5 uppercase">
                          <AlertCircle className="w-3 h-3" /> WHAT TO AVOID
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.diet_plan.what_to_avoid.map((item, idx) => (
                            <span key={idx} className="text-[10px] bg-brand-red/5 text-brand-red px-2 py-0.5 rounded-lg border border-brand-red/10 font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Medicines */}
                <GlassCard className="p-6 border-t-4 border-brand-purple">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-brand-purple/10">
                      <Pill className="w-5 h-5 text-brand-purple" />
                    </div>
                    <h3 className="font-bold text-text-main">Medicines Prescribed</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.medicines.map((med, i) => (
                      <li key={i} className="p-3 bg-brand-secondary rounded-xl border border-border-light">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-brand-purple font-bold text-sm">{med}</span>
                          {result.medicine_availability?.find(m => m.name === med)?.is_available_in_india === false && (
                            <span className="text-[9px] bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded-full font-bold">Rare in India</span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted">{result.frequency[i]}</p>
                        <p className="text-[10px] text-brand-red/70 font-medium mt-1">Side effects: {result.side_effects[i]}</p>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Follow-ups */}
                <GlassCard className="p-6 border-t-4 border-brand-primary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-brand-primary/10">
                      <Calendar className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h3 className="font-bold text-text-main">Follow-up Plan</h3>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{result.follow_up}</p>
                </GlassCard>
              </div>
            </div>

            {/* Medicine Reminders */}
            <GlassCard className="p-8 bg-gradient-to-r from-brand-primary/5 to-brand-purple/5 border-none">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    <Bell className="w-8 h-8 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-main">Medicine Reminders</h3>
                    <p className="text-text-muted">Get notified when it's time to take your medicine.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-text-muted">Enable Reminders</span>
                  <button 
                    onClick={() => setRemindersEnabled(!remindersEnabled)}
                    className={cn(
                      "w-14 h-8 rounded-full p-1 transition-colors duration-200",
                      remindersEnabled ? "bg-brand-primary" : "bg-border-light"
                    )}
                  >
                    <motion.div 
                      animate={{ x: remindersEnabled ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {remindersEnabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-8 pt-8 border-t border-border-light"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Morning', 'Afternoon', 'Night'].map((time) => (
                      <div key={time} className="p-4 bg-white rounded-2xl shadow-sm border border-border-light">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="w-4 h-4 text-brand-primary" />
                          <span className="font-bold text-text-main">{time}</span>
                        </div>
                        <div className="space-y-2">
                          {result.reminders
                            .filter(r => r.times.includes(time))
                            .map((r, i) => (
                              <div key={i} className="text-sm text-text-muted flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                {r.medicine}
                              </div>
                            ))}
                          {result.reminders.filter(r => r.times.includes(time)).length === 0 && (
                            <p className="text-xs text-text-muted italic">No medicines scheduled</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </GlassCard>

            <div className="flex justify-center pt-8">
              <button 
                onClick={() => setStep('UPLOAD')}
                className="text-brand-primary font-bold hover:underline flex items-center gap-2"
              >
                Start New Analysis
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
};

