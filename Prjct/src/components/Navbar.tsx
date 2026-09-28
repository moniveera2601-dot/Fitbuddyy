import React from 'react';
import { Dumbbell, Sparkles, Cpu, Calendar, UserCheck } from 'lucide-react';
import { UserRecord } from '../types';

interface NavbarProps {
  activeTab: 'generator' | 'plan' | 'admin' | 'architecture';
  setActiveTab: (tab: 'generator' | 'plan' | 'admin' | 'architecture') => void;
  currentUser: UserRecord | null;
  hasPlan?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  hasPlan,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/15 bg-slate-950/80 backdrop-blur-2xl shadow-xl shadow-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => setActiveTab('generator')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-slate-950 group-hover:scale-105 transition-transform duration-300">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-['Space_Grotesk']">
                Fit<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Buddy</span>
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/90 font-medium tracking-wide">AI Fitness Plan Engine</p>
          </div>
        </div>

        {/* Main Navigation matching PDF Core Pages */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Plan</span>
          </button>

          {hasPlan && (
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'plan'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current Plan</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
            }`}
            title="View All Users & Plans (/view-all-users)"
          >
            <span className="text-xs">📋</span>
            <span>All Users & Plans</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
            }`}
            title="System Architecture Diagram"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Architecture</span>
          </button>
        </div>

        {/* Right side info / Athlete ID badge without Google Login */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left hidden sm:block">
                <span className="font-bold text-slate-100">{currentUser.name}</span>
                <span className="text-[11px] text-emerald-400 font-mono ml-1.5">ID: {currentUser.id}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('generator')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Start Plan
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
