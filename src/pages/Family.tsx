import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  User, 
  ChevronRight, 
  Activity, 
  ShieldCheck, 
  Calendar,
  Trash2,
  Loader2,
  Heart,
  Baby,
  UserPlus,
  X
} from 'lucide-react';
import { GlassCard } from '@/src/components/GlassCard';
import { db, auth, OperationType, handleFirestoreError } from '@/src/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  gender: string;
  relation: string;
  avatar?: string;
  lastCheckup?: string;
}

interface FamilyProps {
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
}

export const Family: React.FC<FamilyProps> = ({ activeProfileId, setActiveProfileId }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    gender: 'Male',
    relation: 'Father'
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'family'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FamilyMember[];
      setMembers(membersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'family');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'family'), {
        uid: auth.currentUser.uid,
        name: newMember.name,
        age: parseInt(newMember.age),
        gender: newMember.gender.toLowerCase(),
        relation: newMember.relation,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewMember({ name: '', age: '', gender: 'male', relation: 'Father' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'family');
    }
  };

  const handleDeleteMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this family member?')) {
      try {
        await deleteDoc(doc(db, 'family', id));
        if (activeProfileId === id) {
          setActiveProfileId('self');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'family');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-6xl font-display font-bold text-text-main tracking-tight leading-tight">Family Health Hub</h1>
          <p className="text-text-muted text-xl font-medium">Centralized health management for your entire household.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-4 px-10 py-5 gradient-primary text-white rounded-[32px] font-bold text-lg shadow-2xl shadow-brand-primary/30 hover:scale-105 hover:shadow-brand-primary/40 transition-all active:scale-95"
        >
          <UserPlus className="w-6 h-6" />
          Add Family Member
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-20 h-20 rounded-full border-4 border-brand-primary/10 border-t-brand-primary animate-spin" />
          <p className="text-text-muted text-xl font-bold uppercase tracking-[0.3em] animate-pulse">Syncing Family Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Self Profile */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => setActiveProfileId('self')}
            className={cn(
              "cursor-pointer transition-all duration-500 group",
              activeProfileId === 'self' ? "scale-105" : "opacity-90 hover:opacity-100"
            )}
          >
            <div className={cn(
              "premium-card p-10 border-4 transition-all duration-500 h-full relative overflow-hidden",
              activeProfileId === 'self' ? "border-brand-primary shadow-2xl shadow-brand-primary/20" : "border-transparent"
            )}>
              {activeProfileId === 'self' && (
                <div className="absolute top-6 right-6 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                  Active Profile
                </div>
              )}
              <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 rounded-[32px] bg-brand-primary/10 flex items-center justify-center shadow-inner relative group-hover:bg-brand-primary/20 transition-colors">
                  <User className="w-12 h-12 text-brand-primary" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-accent border-4 border-white flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-text-main mb-1">Me (Self)</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">Primary Account Holder</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-border-light shadow-inner">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Health Status</span>
                  <span className="text-sm font-bold text-brand-accent flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-brand-accent" />
                    Optimal
                  </span>
                </div>
                <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-border-light shadow-inner">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Last Activity</span>
                  <span className="text-sm font-bold text-text-main">Today, 10:45 AM</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Family Members */}
          <AnimatePresence>
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => setActiveProfileId(member.id)}
                className={cn(
                  "cursor-pointer transition-all duration-500 group",
                  activeProfileId === member.id ? "scale-105" : "opacity-90 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "premium-card p-10 border-4 transition-all duration-500 h-full relative overflow-hidden",
                  activeProfileId === member.id ? "border-brand-primary shadow-2xl shadow-brand-primary/20" : "border-transparent"
                )}>
                  {activeProfileId === member.id && (
                    <div className="absolute top-6 right-6 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                      Active Profile
                    </div>
                  )}
                  <button 
                    onClick={(e) => handleDeleteMember(member.id, e)}
                    className="absolute bottom-6 right-6 p-3 rounded-2xl hover:bg-brand-red/10 text-text-muted hover:text-brand-red transition-all opacity-0 group-hover:opacity-100 shadow-sm bg-white border border-border-light"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-8 mb-10">
                    <div className="w-24 h-24 rounded-[32px] bg-brand-accent/10 flex items-center justify-center shadow-inner relative group-hover:bg-brand-accent/20 transition-colors">
                      {member.relation === 'Son' || member.relation === 'Daughter' ? (
                        <Baby className="w-12 h-12 text-brand-accent" />
                      ) : (
                        <Users className="w-12 h-12 text-brand-accent" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-text-main mb-1">{member.name}</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">{member.relation} • {member.age} Years</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-border-light shadow-inner">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Gender</span>
                      <span className="text-sm font-bold text-text-main">{member.gender}</span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-border-light shadow-inner">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Health Records</span>
                      <span className="text-sm font-bold text-brand-primary flex items-center gap-2">
                        View History
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl relative z-10"
            >
              <div className="premium-card p-12 shadow-2xl border-white/40 bg-white/95">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-4xl font-display font-bold text-text-main tracking-tight">Add Family Member</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-3 rounded-2xl hover:bg-slate-100 transition-all">
                    <X className="w-6 h-6 text-text-muted" />
                  </button>
                </div>
                <form onSubmit={handleAddMember} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted ml-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all"
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted ml-2">Age</label>
                      <input
                        type="number"
                        required
                        value={newMember.age}
                        onChange={(e) => setNewMember({...newMember, age: e.target.value})}
                        className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all"
                        placeholder="Age"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted ml-2">Gender</label>
                      <select
                        value={newMember.gender}
                        onChange={(e) => setNewMember({...newMember, gender: e.target.value})}
                        className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all appearance-none cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted ml-2">Relation</label>
                    <select
                      value={newMember.relation}
                      onChange={(e) => setNewMember({...newMember, relation: e.target.value})}
                      className="w-full bg-slate-50 border border-border-light rounded-[24px] px-8 py-5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 font-semibold text-lg transition-all appearance-none cursor-pointer"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-6 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-5 rounded-[24px] bg-slate-100 text-text-main font-bold text-lg hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-5 rounded-[24px] gradient-primary text-white font-bold text-lg shadow-2xl shadow-brand-primary/30 hover:scale-[1.02] hover:shadow-brand-primary/40 transition-all active:scale-95"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
