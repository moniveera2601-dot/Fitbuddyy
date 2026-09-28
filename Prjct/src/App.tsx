import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { IntakeForm } from './components/IntakeForm';
import { PlanView } from './components/PlanView';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureView } from './components/ArchitectureView';
import { UserRecord, PlanRecord } from './types';
import { Loader2, Calendar, ArrowRight, ShieldCheck, Dumbbell, Sparkles } from 'lucide-react';
import fitnessBg from './assets/images/fitness_bg_1790570722650.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'plan' | 'admin' | 'architecture'>('generator');
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanRecord | null>(null);
  const [allUserPlans, setAllUserPlans] = useState<PlanRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);

  // Check URL path or hash on initial load
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('view-all-users') || hash === '#admin') {
      setActiveTab('admin');
    }
  }, []);

  const loadPlansForUser = async (userId: number) => {
    try {
      const res = await fetch(`/api/plans/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setAllUserPlans(data.plans || []);
          const active = data.plans?.find((p: PlanRecord) => p.is_current === 1) || data.plans?.[0] || null;
          setCurrentPlan(active);
          return active;
        }
      }
    } catch (err) {
      console.warn('Note while fetching user plans:', err);
    }
    return null;
  };

  const loadAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.users) {
          setAllUsers(data.users);
          return data.users as UserRecord[];
        }
      }
    } catch (err) {
      console.warn('Note while loading users:', err);
    }
    return [];
  };

  // Initial load: restore session or load latest user from database
  useEffect(() => {
    const initialize = async () => {
      try {
        const users = await loadAllUsers();
        const stored = localStorage.getItem('fitbuddy_active_user');

        let targetUser: UserRecord | null = null;

        if (stored) {
          try {
            targetUser = JSON.parse(stored);
          } catch (e) {
            targetUser = null;
          }
        }

        if (!targetUser && users.length > 0) {
          targetUser = users[0];
        }

        if (targetUser) {
          setCurrentUser(targetUser);
          const activePlan = await loadPlansForUser(targetUser.id);
          if (activePlan) {
            setCurrentPlan(activePlan);
          }
        }
      } catch (e) {
        console.warn('Initialization note:', e);
      }
    };

    initialize();
  }, []);

  const handlePlanGenerated = (user: UserRecord, plan: PlanRecord) => {
    setCurrentUser(user);
    setCurrentPlan(plan);
    setAllUserPlans([plan]);
    localStorage.setItem('fitbuddy_active_user', JSON.stringify(user));
    loadAllUsers();
    setActiveTab('plan');
  };

  const handlePlanUpdated = (updatedPlan: PlanRecord, allPlans: PlanRecord[]) => {
    setCurrentPlan(updatedPlan);
    setAllUserPlans(allPlans);
    loadAllUsers();
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] relative selection:bg-emerald-500 selection:text-slate-950">
      {/* ======================================================== */}
      {/* TRANSPARENT GYM BACKGROUND IMAGE LAYER                    */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img
          src={fitnessBg}
          alt="Gym Background"
          className="w-full h-full object-cover object-center opacity-30 filter contrast-125 brightness-90 scale-105"
        />
        {/* Atmospheric vignettes for maximum contrast and theme immersion */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/70 via-[#050811]/80 to-[#050811]/95" />
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-[160px] pointer-events-none" />
      </div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        hasPlan={!!currentPlan}
      />

      {/* Contextual Quick Banner when a plan is available while on the generator tab */}
      {currentPlan && activeTab === 'generator' && (
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-black/40 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white font-['Space_Grotesk']">
                    Active 7-Day Workout Schedule Ready
                  </p>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    v{currentPlan.version}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate max-w-md mt-0.5">
                  {currentPlan.plan_name} • <span className="text-emerald-400 capitalize">{currentUser?.fitness_goal || currentPlan.target_goal}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('plan')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
            >
              <span>View Full Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 pb-16">
        {activeTab === 'generator' && (
          <IntakeForm
            currentUser={currentUser}
            onPlanGenerated={handlePlanGenerated}
          />
        )}

        {activeTab === 'plan' && (
          currentPlan ? (
            <PlanView
              user={currentUser}
              currentPlan={currentPlan}
              allPlans={allUserPlans}
              onPlanUpdated={handlePlanUpdated}
              onNavigateToForm={() => setActiveTab('generator')}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 text-center bg-slate-900/85 border border-emerald-500/30 backdrop-blur-2xl rounded-3xl shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-['Space_Grotesk']">
                No Plan Generated Yet
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Complete the fitness intake form to generate your AI-powered 7-day workout routine and targeted recovery tips.
              </p>
              <button
                onClick={() => setActiveTab('generator')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                Generate 7-Day Plan
              </button>
            </div>
          )
        )}

        {activeTab === 'architecture' && <ArchitectureView />}

        {activeTab === 'admin' && (
          <AdminDashboard
            users={allUsers}
            onSelectUserForInspection={(user) => {
              // Read-only inspection in admin mode
              console.log('Inspecting user', user);
            }}
            onRefreshUsers={async () => {
              const res = await fetch('/api/users');
              const data = await res.json();
              if (data.success) setAllUsers(data.users);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/90 bg-[#050811]/90 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#10b981]" />
            <span className="text-slate-300 font-medium">FitBuddy AI • Private Google Auth & SQLite Workout Storage</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              System Architecture
            </button>
            {currentUser && currentPlan && (
              <>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => setActiveTab('plan')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer font-semibold text-slate-300"
                >
                  My 7-Day Schedule
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
