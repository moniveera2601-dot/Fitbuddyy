import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Globe,
  Layers,
  Sparkles,
  Server,
  FileCode,
  ArrowDown,
  CheckCircle2,
  Table,
  Terminal,
  ExternalLink
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: 'User (Browser Client)',
      tech: 'React 19 + Tailwind CSS + Vite',
      desc: 'Interactive UI providing personal biometrics intake form, dynamic 7-day calendar, feedback refinement console, and coach administration table.',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: 'Backend API Service',
      tech: 'Express / Node.js Engine (FastAPI Architecture)',
      desc: 'Handles endpoints /api/plans/generate (Form), /api/plans/regenerate (Feedback Loop), /api/plans/nutrition-tip, and /api/users (/view-all-users).',
      icon: Server,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 3,
      title: 'Google Generative AI Engine',
      tech: 'Gemini 3.8 Flash (@google/genai SDK)',
      desc: 'Executes structured exercise physiology reasoning, day-by-day split generation, progressive overload calibration, and feedback adaptation loops.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 4,
      title: 'AI Plan & Nutrition Generator',
      tech: 'Adaptive Re-Optimization Protocol',
      desc: 'Parses user feedback, calculates differential changes between versions, and attaches targeted micro/macronutrient and hydration strategies.',
      icon: Layers,
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 5,
      title: 'SQLite Database (fitbuddy.db)',
      tech: 'SQLite Database Engine (users & plans tables)',
      desc: 'Persists user profiles and multi-version workout plans on disk in fitbuddy.db, enabling coach oversight and version history comparison.',
      icon: Database,
      color: 'from-emerald-600 to-green-600',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>System Blueprint Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
          FitBuddy Architecture & Data Flow
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Faithfully constructed according to your system blueprint: Browser Client → Backend Logic → Gemini AI Models → SQLite Database (<code className="text-emerald-400">fitbuddy.db</code>).
        </p>
      </div>

      {/* Visual Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;

          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                isSelected
                  ? 'border-emerald-400 bg-slate-900 ring-2 ring-emerald-500/30 shadow-xl'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-slate-950 font-bold mb-3 shadow-md`}>
                  <Icon className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                </div>

                <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Layer 0{step.id}
                </div>
                <h3 className="font-bold text-sm text-white font-['Space_Grotesk'] mb-1">
                  {step.title}
                </h3>
                <p className="text-[11px] font-mono text-cyan-400/90 mb-2">
                  {step.tech}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 text-xs">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Database Schema & Tables Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                SQLite Storage Engine (<code className="text-emerald-400">fitbuddy.db</code>)
              </h2>
              <p className="text-xs text-slate-400">
                Persistent relational data schema maintaining users, plan iterations, and feedback history.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Active & Seeded
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: users */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-xs text-slate-200">Table: users</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Scenario 1 & 4</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-amber-400">id</span>
                <span className="text-slate-400">INTEGER PRIMARY KEY AUTOINCREMENT</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">name</span>
                <span className="text-slate-400">TEXT NOT NULL</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">age, weight, weight_unit</span>
                <span className="text-slate-400">INTEGER, REAL, TEXT</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">fitness_goal, workout_intensity</span>
                <span className="text-slate-400">TEXT NOT NULL</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">experience_level, equipment</span>
                <span className="text-slate-400">TEXT DEFAULT 'gym'</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">created_at, updated_at</span>
                <span className="text-slate-400">TEXT (ISO-8601)</span>
              </div>
            </div>
          </div>

          {/* Table 2: plans */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-xs text-slate-200">Table: plans</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Scenario 1, 2, 3 & 4</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-amber-400">id, user_id</span>
                <span className="text-slate-400">INTEGER (FK → users.id)</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-cyan-400">version, is_current</span>
                <span className="text-slate-400">INTEGER (v1 baseline, v2+ revised)</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">plan_name, summary</span>
                <span className="text-slate-400">TEXT NOT NULL</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-cyan-300">feedback_applied</span>
                <span className="text-slate-400">TEXT (User feedback prompt)</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-200">schedule_json</span>
                <span className="text-slate-400">TEXT (7-Day schedule objects)</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-emerald-300">nutrition_tips_json</span>
                <span className="text-slate-400">TEXT (Scenario 3 tips)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
