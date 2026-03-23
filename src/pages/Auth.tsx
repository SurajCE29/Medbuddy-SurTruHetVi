import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Activity, 
  Calendar, 
  Users, 
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { 
  loginWithEmail, 
  signUpWithEmail, 
  loginWithGoogle, 
  db, 
  OperationType, 
  handleFirestoreError 
} from '@/src/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Background3D } from '@/src/components/Background3D';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [medicalHistory, setMedicalHistory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        // Sign up
        const user = await signUpWithEmail(email, password, name);
        
        // Create user profile in Firestore
        const path = `users/${user.uid}`;
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            age: parseInt(age),
            gender: gender,
            medicalHistory: medicalHistory,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <Background3D />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <GlassCard className="p-12 shadow-2xl shadow-brand-primary/5 border-brand-border/50">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-primary/20">
              <Activity className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-text-main tracking-tight mb-3">
              Aether<span className="text-brand-primary">Med</span> AI
            </h1>
            <p className="text-text-muted text-lg">
              {isLogin ? 'Welcome back to your health companion' : 'Create your secure health profile'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field w-full py-4 pl-12 pr-6 text-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 w-5 h-5" />
                      <input
                        type="number"
                        placeholder="Age"
                        required={!isLogin}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="input-field w-full py-4 pl-12 pr-6 text-lg"
                      />
                    </div>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 w-5 h-5" />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="input-field w-full py-4 pl-12 pr-6 text-lg appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-4 top-5 text-text-muted/50 w-5 h-5" />
                    <textarea
                      placeholder="Medical History (Optional)"
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className="input-field w-full py-4 pl-12 pr-6 text-lg min-h-[120px]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 w-5 h-5" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full py-4 pl-12 pr-6 text-lg"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full py-4 pl-12 pr-6 text-lg"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-4 text-red-600 text-sm font-medium"
              >
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-brand-primary/20 transition-all disabled:opacity-50 text-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Sign Up'}
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-6">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-text-muted text-sm font-bold uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-8 bg-white border border-border-light text-text-main font-bold py-5 rounded-2xl flex items-center justify-center gap-4 hover:bg-brand-secondary transition-all shadow-sm text-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Continue with Google
          </button>

          <p className="mt-10 text-center text-text-muted text-lg">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand-primary font-bold hover:underline ml-1"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};
