import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  X, 
  User, 
  Loader2, 
  Paperclip, 
  FileText, 
  MessageCircle, 
  Plus,
  Sparkles,
  Mic
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { db, auth } from '@/src/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface AIAssistantProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeProfileId: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, setIsOpen, activeProfileId }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, fileName?: string }[]>([
    { role: 'ai', text: 'Hi, I’m your AI Health Assistant 👨‍⚕️. How can I assist you with your health today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [profileName, setProfileName] = useState('Self');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch profile name
    if (activeProfileId === 'self') {
      setProfileName('Self');
    } else {
      const unsubscribeName = onSnapshot(doc(db, 'family', activeProfileId), (doc) => {
        if (doc.exists()) {
          setProfileName(doc.data().name);
        }
      });
      return () => unsubscribeName();
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'history'),
      where('uid', '==', auth.currentUser.uid),
      where('profileId', '==', activeProfileId),
      where('type', '==', 'report-analysis'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        try {
          const parsedResult = JSON.parse(data.result);
          if (parsedResult.diagnosis) {
            setReportData(parsedResult);
          }
        } catch (e) {
          console.error("Failed to parse history result", e);
        }
      } else {
        setReportData(null);
      }
    });

    return () => unsubscribe();
  }, [activeProfileId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    
    const userMsg = input;
    const currentFile = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg || (currentFile ? `Sent a file: ${currentFile.name}` : ''),
      fileName: currentFile?.name
    }]);
    setLoading(true);

    try {
      const parts: any[] = [];
      if (userMsg) parts.push({ text: userMsg });
      if (currentFile) {
        parts.push({
          inlineData: {
            data: currentFile.data,
            mimeType: currentFile.mimeType
          }
        });
      }

      const systemInstruction = `You are AetherMed AI, an intelligent medical assistant integrated into a healthcare dashboard.
      
      PATIENT PROFILE:
      Name: ${profileName}
      Profile ID: ${activeProfileId}
      
      CORE BEHAVIOR:
      1. PRIORITIZE REPORT DATA: Always check the provided medical report data (below) first. If the user's question relates to their diagnosis, medicines, or health status, use this data as the primary source of truth.
      2. FRIENDLY & REASSURING TONE: Maintain a calm, supportive, and friendly tone. Use simple, non-technical language where possible.
      3. LANGUAGE ADAPTATION: Detect the user's language and respond in the same language (e.g., English, Hindi, Hinglish, etc.).
      
      CONTEXT DATA (Most Recent Report):
      ${reportData ? JSON.stringify(reportData, null, 2) : "No medical report data available for this profile yet. Encourage the user to upload a report on the dashboard for personalized analysis."}
      
      RESPONSE RULES:
      - If data is MISSING in the report: Say something like "I couldn't find specific details about [topic] in your latest report for ${profileName}, but generally speaking..." and provide safe medical guidance.
      - If user asks about medicines: Refer to the "medicines" and "frequency" fields.
      - If user asks about their condition: Refer to "diagnosis" and "disease_explanation".
      - If user asks about next steps: Refer to "follow_up".
      - SAFETY: Never give definitive medical advice. Always include a disclaimer that you are an AI and they should consult a doctor for critical decisions.
      
      Maintain conversation continuity. Suggest relevant follow-up questions based on the context.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          systemInstruction
        }
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[110px] right-6 z-[150] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, y: 100, x: 100, filter: 'blur(10px)' }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 1
            }}
            className="w-[440px] h-[600px] bg-white/80 backdrop-blur-2xl rounded-[40px] mb-6 flex flex-col overflow-hidden border border-white/20 shadow-2xl shadow-brand-primary/20"
          >
            {/* Header */}
            <div className="p-8 bg-brand-secondary border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                  <Bot className="text-brand-primary w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-text-main text-lg">AetherMed AI</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-xl hover:bg-brand-primary/5 text-text-muted transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-start gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-accent/10 text-brand-accent"
                  )}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={cn(
                    "p-5 rounded-3xl max-w-[85%] text-sm leading-relaxed font-medium",
                    msg.role === 'user' 
                      ? "gradient-primary text-white rounded-tr-none shadow-lg shadow-brand-primary/10" 
                      : "bg-brand-secondary text-text-main rounded-tl-none border border-border-light"
                  )}>
                    {msg.fileName && (
                      <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/10 border border-white/10">
                        <FileText className="w-5 h-5 text-white" />
                        <span className="text-xs font-bold truncate max-w-[180px]">{msg.fileName}</span>
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-5 rounded-3xl bg-brand-secondary text-text-muted rounded-tl-none border border-border-light">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-8 bg-brand-secondary border-t border-border-light">
              {selectedFile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand-primary" />
                    <span className="text-xs font-bold text-text-main truncate max-w-[240px]">{selectedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg hover:bg-brand-primary/10 text-text-muted transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
              <div className="relative flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl bg-white border border-border-light text-text-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm"
                >
                  <Paperclip className="w-6 h-6" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything..."
                    className="w-full bg-white border border-border-light rounded-2xl px-6 py-4 pr-24 focus:outline-none focus:border-brand-primary/50 transition-all shadow-sm font-medium"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-2 text-text-muted hover:text-brand-primary transition-all">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSend}
                      disabled={(!input.trim() && !selectedFile) || loading}
                      className="p-3 rounded-xl gradient-primary text-white hover:shadow-lg hover:shadow-brand-primary/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <div className="relative group">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-text-main text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-[160]"
            >
              Ask AI Doctor
              <div className="absolute top-full right-8 -mt-1 border-4 border-transparent border-t-text-main" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          animate={{
            scale: isOpen ? [0.9, 1.1, 1] : [1, 1.05, 1],
            boxShadow: isOpen 
              ? "0 20px 40px rgba(0, 0, 0, 0.15)" 
              : ["0 10px 30px rgba(79, 140, 255, 0.3)", "0 10px 50px rgba(79, 140, 255, 0.6)", "0 10px 30px rgba(79, 140, 255, 0.3)"]
          }}
          transition={{
            scale: isOpen 
              ? { duration: 0.3, ease: "backOut" }
              : { duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 },
            boxShadow: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className={cn(
            "w-16 h-16 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden",
            isOpen 
              ? "bg-white text-text-main border border-border-light shadow-2xl" 
              : "bg-gradient-to-br from-[#4F8CFF] to-[#7B61FF] text-white shadow-2xl"
          )}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="relative flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-8 h-8" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <MessageCircle className="w-8 h-8" />
                  <Plus className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#4F8CFF] rounded-full p-0.5 border-2 border-[#4F8CFF]" />
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-2 -left-2"
                  >
                    <Sparkles className="w-4 h-4 text-white/60" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Notification Dot */}
          {!isOpen && (
            <span className="absolute top-3 right-3 w-3 h-3 bg-brand-accent rounded-full border-2 border-white animate-pulse" />
          )}
        </motion.button>
      </div>
    </div>
  );
};
