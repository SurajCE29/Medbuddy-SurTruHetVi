import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Calendar, 
  Users, 
  FileText, 
  ShieldCheck, 
  Edit3, 
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [medicalHistory, setMedicalHistory] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const path = `users/${auth.currentUser.uid}`;
      try {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setName(data.name || '');
          setAge(data.age?.toString() || '');
          setGender(data.gender || 'male');
          setMedicalHistory(data.medicalHistory || '');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    const path = `users/${auth.currentUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: name,
        age: parseInt(age),
        gender: gender,
        medicalHistory: medicalHistory
      });
      setProfile({
        ...profile,
        name: name,
        age: parseInt(age),
        gender: gender,
        medicalHistory: medicalHistory
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="w-20 h-20 rounded-full border-4 border-brand-primary/10 border-t-brand-primary animate-spin" />
        <p className="text-text-muted font-bold uppercase tracking-widest animate-pulse">Retrieving Secure Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-display font-bold text-text-main tracking-tight leading-tight">Your Profile</h1>
          <p className="text-text-muted text-xl font-medium">Manage your secure health data and preferences.</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={saving}
          className="flex items-center gap-4 px-10 py-5 gradient-primary text-white rounded-[32px] font-bold text-lg shadow-2xl shadow-brand-primary/30 hover:scale-105 hover:shadow-brand-primary/40 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditing ? <Save className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />)}
          <span>{saving ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-4">
          <div className="premium-card p-12 flex flex-col items-center text-center border-4 border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary" />
            
            <div className="w-48 h-48 rounded-[64px] bg-gradient-to-br from-brand-primary/10 to-brand-purple/10 border-4 border-white p-2 mb-10 relative group shadow-2xl">
              <div className="w-full h-full rounded-[56px] overflow-hidden bg-white flex items-center justify-center shadow-inner">
                {auth.currentUser?.photoURL ? (
                  <img 
                    src={auth.currentUser.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-24 h-24 text-text-muted/20" />
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-3xl bg-brand-accent flex items-center justify-center shadow-2xl border-4 border-white">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
            </div>
            
            <h2 className="text-4xl font-display font-bold text-text-main mb-3">{profile?.name || 'User'}</h2>
            <div className="px-6 py-2 rounded-2xl bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-10 shadow-sm border border-brand-primary/20">
              Verified Patient
            </div>
            
            <div className="w-full space-y-6 pt-10 border-t border-slate-200">
              <div className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-border-light shadow-inner group hover:bg-white transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm font-bold text-text-main truncate">{auth.currentUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-border-light shadow-inner group hover:bg-white transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-brand-accent" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Security Status</p>
                  <p className="text-sm font-bold text-text-main">Account Secured</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-8">
          <div className="premium-card p-12 space-y-12 border-4 border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted flex items-center gap-3 ml-2">
                  <User className="w-4 h-4 text-brand-primary" /> Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all shadow-inner"
                  />
                ) : (
                  <div className="p-6 rounded-[24px] bg-white border border-border-light shadow-sm">
                    <p className="text-2xl font-display font-bold text-text-main">{profile?.name || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted flex items-center gap-3 ml-2">
                  <Calendar className="w-4 h-4 text-brand-accent" /> Age
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all shadow-inner"
                  />
                ) : (
                  <div className="p-6 rounded-[24px] bg-white border border-border-light shadow-sm">
                    <p className="text-2xl font-display font-bold text-text-main">{profile?.age || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted flex items-center gap-3 ml-2">
                  <Users className="w-4 h-4 text-brand-purple" /> Gender
                </label>
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="p-6 rounded-[24px] bg-white border border-border-light shadow-sm">
                    <p className="text-2xl font-display font-bold text-text-main capitalize">{profile?.gender || 'Not set'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted flex items-center gap-3 ml-2">
                <FileText className="w-4 h-4 text-brand-orange" /> Medical History
              </label>
              {isEditing ? (
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="w-full bg-slate-50 border border-border-light rounded-[32px] px-8 py-6 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all shadow-inner min-h-[200px]"
                  placeholder="List any chronic conditions, allergies, or past surgeries..."
                />
              ) : (
                <div className="p-10 rounded-[40px] bg-slate-50 border border-border-light shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange/30" />
                  <p className="text-lg text-text-muted leading-relaxed font-medium italic">
                    {profile?.medicalHistory || 'No medical history recorded.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
