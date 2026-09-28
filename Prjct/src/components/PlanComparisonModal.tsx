import React, { useState } from 'react';
import { X, GitCompare, ArrowRight, CheckCircle, Calendar, Sparkles, Flame, Clock } from 'lucide-react';
import { PlanRecord, DaySchedule } from '../types';

interface PlanComparisonModalProps {
  plans: PlanRecord[];
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  plans,
  isOpen,
  onClose,
  userName = 'Athlete',
}) => {
  if (!isOpen || plans.length < 2) return null;

  // By default compare earliest plan (v1) with newest plan
  const sortedPlans = [...plans].sort((a, b) => a.version - b.version);
  const v1 = sortedPlans[0];
  const vLatest = sortedPlans[sortedPlans.length - 1];

  const [selectedDay, setSelectedDay] = useState<number>(1);

  const getDaySchedule = (plan: PlanRecord, dayNum: number): DaySchedule | undefined => {
    return plan.schedule.find((d) => d.day_number === dayNum);
  };

  const dayV1 = getDaySchedule(v1, selectedDay);
  const dayLatest = getDaySchedule(vLatest, selectedDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Plan Version Comparison
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {userName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparing Original Baseline (v{v1.version}) with Dynamic AI Revision (v{vLatest.version})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Context Banner */}
        {vLatest.feedback_applied && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-cyan-300">Feedback Driving Revision: </span>
              <span className="italic text-slate-200">"{vLatest.feedback_applied}"</span>
            </div>
          </div>
        )}

        {/* Day Selector Pills */}
        <div className="px-4 sm:px-6 pt-4 flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-3">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isSelected = selectedDay === num;
            return (
              <button
                key={num}
                onClick={() => setSelectedDay(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Day {num}</span>
              </button>
            );
          })}
        </div>

        {/* Side-by-Side Comparison Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column: Version 1 (Original) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Version {v1.version} (Original)
                </span>
                <h3 className="font-bold text-sm text-slate-200 mt-1">{v1.plan_name}</h3>
              </div>
              <span className="text-xs text-slate-400">{v1.created_at.slice(0, 10)}</span>
            </div>

            {dayV1 ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{dayV1.title}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${dayV1.is_rest_day ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {dayV1.is_rest_day ? 'Rest Day' : `${dayV1.duration_minutes} min`}
                  </span>
                </div>
                <p className="text-slate-400">Focus: <span className="text-slate-200 font-medium">{dayV1.focus}</span></p>

                {/* Exercises */}
                <div>
                  <p className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                    Exercises ({dayV1.exercises.length})
                  </p>
                  <div className="space-y-2">
                    {dayV1.exercises.length === 0 ? (
                      <p className="text-slate-400 italic">No structured lifting (Rest & recovery protocol)</p>
                    ) : (
                      dayV1.exercises.map((ex, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between font-semibold text-slate-200">
                            <span>{ex?.name || 'Exercise'}</span>
                            <span className="text-slate-400 text-[11px]">{ex.sets} sets × {ex.reps}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ex.target_muscle} • Rest: {ex.rest}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs">Day schedule not available</p>
            )}
          </div>

          {/* Right Column: Version Latest (Updated with Feedback) */}
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/10 p-4 sm:p-5 flex flex-col relative">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                  Version {vLatest.version} (Updated)
                </span>
                <h3 className="font-bold text-sm text-cyan-100 mt-1">{vLatest.plan_name}</h3>
              </div>
              <span className="text-xs text-cyan-400/80">{vLatest.created_at.slice(0, 10)}</span>
            </div>

            {dayLatest ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{dayLatest.title}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${dayLatest.is_rest_day ? 'bg-blue-500/10 text-blue-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                    {dayLatest.is_rest_day ? 'Rest Day' : `${dayLatest.duration_minutes} min`}
                  </span>
                </div>
                <p className="text-slate-400">Focus: <span className="text-slate-200 font-medium">{dayLatest.focus}</span></p>

                {/* Exercises */}
                <div>
                  <p className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px] mb-2">
                    Updated Exercises ({dayLatest.exercises.length})
                  </p>
                  <div className="space-y-2">
                    {dayLatest.exercises.length === 0 ? (
                      <p className="text-slate-400 italic">No structured lifting (Rest & recovery protocol)</p>
                    ) : (
                      dayLatest.exercises.map((ex, idx) => {
                        // Check if this exercise differs from V1
                        const isDifferent = !dayV1?.exercises.some((oldEx) => oldEx?.name && ex?.name && oldEx.name.toLowerCase() === ex.name.toLowerCase());
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border transition-all ${
                              isDifferent
                                ? 'bg-cyan-900/20 border-cyan-500/40 text-cyan-100 shadow-sm'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span>{ex?.name || 'Exercise'}</span>
                                {isDifferent && (
                                  <span className="text-[9px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.2 rounded font-bold uppercase">
                                    Modified
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 text-[11px]">{ex.sets} sets × {ex.reps}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{ex.target_muscle} • Rest: {ex.rest}</p>
                            {ex.notes && (
                              <p className="text-[10px] text-cyan-300/80 mt-1 italic">Tip: {ex.notes}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs">Day schedule not available</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <p>
            FitBuddy Gemini feedback loop: changes persisted automatically in <code className="text-emerald-400">fitbuddy.db</code>.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
