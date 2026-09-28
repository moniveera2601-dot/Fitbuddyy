import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Flame,
  Dumbbell,
  Sparkles,
  RefreshCw,
  Apple,
  CheckCircle,
  CheckCircle2,
  Share2,
  Printer,
  ChevronRight,
  GitCompare,
  MessageSquare,
  Timer,
  AlertCircle,
  Send,
  Loader2,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { UserRecord, PlanRecord, DaySchedule, NutritionTip } from '../types';
import { RestTimerModal } from './RestTimerModal';
import { PlanComparisonModal } from './PlanComparisonModal';

interface PlanViewProps {
  user: UserRecord | null;
  currentPlan: PlanRecord;
  allPlans: PlanRecord[];
  onPlanUpdated: (updatedPlan: PlanRecord, allUserPlans: PlanRecord[]) => void;
  onNavigateToForm: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  user,
  currentPlan,
  allPlans,
  onPlanUpdated,
  onNavigateToForm,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  // Scenario 2: Feedback & Regeneration State
  const [feedbackText, setFeedbackText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationSuccess, setRegenerationSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Scenario 3: Nutrition Tip State
  const [selectedTipCategory, setSelectedTipCategory] = useState('Post-Workout Fuel');
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [nutritionTips, setNutritionTips] = useState<NutritionTip[]>(currentPlan.nutrition_tips || []);
  const [tipSuccess, setTipSuccess] = useState(false);

  // Quick feedback prompts from scenario 2
  const quickFeedbackOptions = [
    'More focus on cardio & HIIT',
    'Include more rest days',
    'Shorter 30-min sessions',
    'Lower joint impact / knee friendly',
    'Add more core & abdominal volume',
    'Heavier compound lifts',
  ];

  // Nutrition tip categories for scenario 3
  const tipCategories = [
    { id: 'Post-Workout Fuel', label: 'Post-Workout Protein', icon: '🍗' },
    { id: 'Pre-Workout Energy', label: 'Pre-Workout Fuel', icon: '⚡' },
    { id: 'Hydration & Electrolytes', label: 'Hydration Strategy', icon: '💧' },
    { id: 'Rest Day Recovery', label: 'Rest Day Nutrition', icon: '🛌' },
    { id: 'Caloric Balance & Macros', label: 'Macro Distribution', icon: '🥗' },
  ];

  const currentDaySchedule: DaySchedule | undefined = currentPlan.schedule?.find(
    (d) => d.day_number === selectedDayNumber
  ) || currentPlan.schedule?.[0];

  const toggleExerciseCheck = (key: string) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openRestTimer = (restStr: string) => {
    // Parse rest duration like "60s" or "90s"
    const match = restStr.match(/\d+/);
    const secs = match ? parseInt(match[0], 10) : 60;
    setTimerSeconds(secs);
    setTimerModalOpen(true);
  };

  // Scenario 2: Submit Feedback & Regenerate Plan
  const handleRegeneratePlan = async (feedbackToUse?: string) => {
    const feedback = feedbackToUse || feedbackText;
    if (!feedback.trim()) {
      setFeedbackError('Please enter or select feedback suggestions to update your plan.');
      return;
    }

    setFeedbackError(null);
    setIsRegenerating(true);
    setRegenerationSuccess(false);

    try {
      const effectiveUserId = user?.id || currentPlan.user_id;
      const res = await fetch('/api/plans/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          planId: currentPlan.id,
          feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to regenerate workout plan');
      }

      // Fetch all updated plans for this user
      const plansRes = await fetch(`/api/plans/user/${effectiveUserId}`);
      const plansData = await plansRes.json();
      const updatedList = plansData.plans || [data.plan];

      onPlanUpdated(data.plan, updatedList);
      setIsRegenerating(false);
      setRegenerationSuccess(true);
      setFeedbackText('');
      setTimeout(() => setRegenerationSuccess(false), 6000);
    } catch (err: any) {
      console.error(err);
      setFeedbackError(err.message || 'Error regenerating plan.');
      setIsRegenerating(false);
    }
  };

  // Scenario 3: Request Nutrition or Recovery Tip
  const handleGenerateNutritionTip = async (categoryToUse?: string) => {
    const cat = categoryToUse || selectedTipCategory;
    setIsGeneratingTip(true);
    setTipSuccess(false);

    try {
      const effectiveUserId = user?.id || currentPlan.user_id;
      const res = await fetch('/api/plans/nutrition-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          planId: currentPlan.id,
          category: cat,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch nutrition tip');
      }

      setNutritionTips((prev) => [data.tip, ...prev]);
      setIsGeneratingTip(false);
      setTipSuccess(true);
      setTimeout(() => setTipSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setIsGeneratingTip(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8">
      {/* PDF Page 20: Personalized Workout Plan & User Information Header */}
      <div className="bg-slate-900/90 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/25">
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
                Your Personalized Workout Plan
              </h1>
              <p className="text-xs text-slate-400">PDF Milestone 4 • Dynamically generated via Gemini AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allPlans.length > 1 && (
              <button
                onClick={() => setComparisonModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-2"
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare Versions ({allPlans.length})</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>

        {/* User Information Panel (Page 20 Screenshot) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>User Information</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Active Dossier</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-slate-400 mb-0.5">Name:</p>
              <p className="font-bold text-white text-sm truncate">{user?.name || 'Athlete'}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">User ID:</p>
              <p className="font-bold text-emerald-400 font-mono text-sm">{user?.id || '10'}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Age:</p>
              <p className="font-bold text-white text-sm">{user?.age || '20'}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Weight:</p>
              <p className="font-bold text-white text-sm">{user?.weight || '70.0'} {user?.weight_unit || 'kg'}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-slate-400 mb-0.5">Goal:</p>
              <p className="font-bold text-emerald-300 capitalize text-sm truncate">{user?.fitness_goal || 'Muscle Gain'}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Intensity:</p>
              <p className="font-bold text-cyan-300 capitalize text-sm">{user?.workout_intensity || 'High'}</p>
            </div>
          </div>
        </div>

        {/* Plan Summary & Feedback incorporated */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Plan v{currentPlan.version} {currentPlan.version > 1 ? '(Updated with Feedback)' : '(Original Baseline)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk']">
            {currentPlan.plan_name}
          </h2>
          <p className="text-slate-300 text-sm max-w-4xl leading-relaxed">
            {currentPlan.summary}
          </p>

          {currentPlan.feedback_applied && (
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-xs text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Feedback incorporated:</strong> "{currentPlan.feedback_applied}"
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Calendar Strip (Scenario 1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              7-Day Training Progression
            </h2>
            <p className="text-xs text-slate-400">Click any day to inspect routines, exercises, warm-ups, and form notes.</p>
          </div>
        </div>

        {/* 7 Day Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {currentPlan.schedule?.map((day) => {
            const isSelected = selectedDayNumber === day.day_number;
            const isRest = day.is_rest_day;

            return (
              <button
                key={day.day_number}
                onClick={() => setSelectedDayNumber(day.day_number)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-white'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-emerald-400">Day {day.day_number}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isRest ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isRest ? 'Rest' : `${day.duration_minutes}m`}
                  </span>
                </div>
                <p className="font-bold text-xs truncate text-slate-100">{day.title}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{day.focus}</p>

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule Details */}
      {currentDaySchedule && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Day Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentDaySchedule.day_name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                  Intensity: {currentDaySchedule.intensity}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-['Space_Grotesk']">
                {currentDaySchedule.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Focus Area: <span className="text-emerald-300 font-semibold">{currentDaySchedule.focus}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{currentDaySchedule.duration_minutes} Minutes</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>~{currentDaySchedule.calorie_estimate} kcal</span>
              </div>
            </div>
          </div>

          {/* Warm-Up Sequence */}
          {currentDaySchedule.warm_up && currentDaySchedule.warm_up.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Dynamic Warm-Up Protocol (5-8 mins)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {currentDaySchedule.warm_up.map((wu, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{wu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Table / Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-['Space_Grotesk']">
                Target Exercises ({currentDaySchedule.exercises?.length || 0})
              </h4>
              <p className="text-xs text-slate-400">Click checkbox when completed</p>
            </div>

            {currentDaySchedule.exercises && currentDaySchedule.exercises.length > 0 ? (
              <div className="space-y-2.5">
                {currentDaySchedule.exercises.map((exercise, idx) => {
                  const checkKey = `${currentPlan.id}-d${currentDaySchedule.day_number}-ex${idx}`;
                  const isDone = !!completedExercises[checkKey];

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-300'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleExerciseCheck(checkKey)}
                          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900 hover:border-emerald-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-bold text-sm ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                              {exercise.name}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-medium">
                              {exercise.target_muscle}
                            </span>
                          </div>

                          {exercise.notes && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 italic">
                              <Info className="w-3 h-3 text-slate-500 shrink-0" />
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Sets, Reps & Rest Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200">
                          {exercise.sets} Sets × {exercise.reps}
                        </div>

                        <button
                          type="button"
                          onClick={() => openRestTimer(exercise.rest)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                          title="Start Rest Timer"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>Rest: {exercise.rest}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800">
                <p className="text-sm font-semibold text-slate-300">Rest & Recovery Day</p>
                <p className="text-xs text-slate-400 mt-1">
                  Prioritize hydration, mobility, and deep sleep. Rebuilding muscle fibers occurs during rest intervals.
                </p>
              </div>
            )}
          </div>

          {/* Cool-Down Sequence */}
          {currentDaySchedule.cool_down && currentDaySchedule.cool_down.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Cool-Down & Myofascial Stretches (5 mins)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {currentDaySchedule.cool_down.map((cd, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>{cd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SCENARIO 2: FEEDBACK & DYNAMIC PLAN REGENERATION LOOP     */}
      {/* ======================================================== */}
      <div id="feedback-section" className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scenario 2: Feedback Loop (PDF Page 23)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <span>📝</span>
              <span>Share Your Feedback</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Submit feedback on your existing workout plan (e.g. “more focus on cardio” or “include more rest days”). The system regenerates an updated workout plan refining it based on your evolving needs.
            </p>
          </div>

          {currentPlan.version > 1 && (
            <button
              onClick={() => setComparisonModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Compare v1 vs v{currentPlan.version}</span>
            </button>
          )}
        </div>

        {/* Confirmation message matching PDF Page 23 */}
        {regenerationSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 animate-fadeIn">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">✔</span>
            <span>Your plan has been updated based on your feedback!</span>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Quick Feedback Suggestions:
          </label>
          <div className="flex flex-wrap gap-2">
            {quickFeedbackOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFeedbackText(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  feedbackText === opt
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Form Fields matching PDF Page 23 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Unique User ID:
            </label>
            <input
              type="text"
              readOnly
              value={user?.id || '10'}
              placeholder="Enter the same User ID used to generate your plan"
              className="w-full sm:w-80 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono outline-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Feedback:
            </label>
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Let us know how we can improve your plan..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all shadow-inner"
            />
          </div>

          {feedbackError && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {feedbackError}
            </p>
          )}

          <div>
            <button
              type="button"
              disabled={isRegenerating || !feedbackText.trim()}
              onClick={() => handleRegeneratePlan()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Workout Plan with Gemini...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SCENARIO 3: NUTRITION & RECOVERY TIPS GENERATOR          */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full mb-2">
              <Apple className="w-3.5 h-3.5" />
              <span>Scenario 3: Goal-Specific Nutrition & Recovery Guidance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk']">
              Targeted Nutrition & Recovery Tips
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Get concise, evidence-based suggestions aligned with your goal of <span className="text-emerald-300 font-semibold">{user?.fitness_goal || currentPlan.target_goal || 'fitness'}</span> (e.g., “Include protein in your post-workout meal” for muscle gain).
            </p>
          </div>

          <button
            type="button"
            disabled={isGeneratingTip}
            onClick={() => handleGenerateNutritionTip()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {isGeneratingTip ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Macros...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Request AI Tip</span>
              </>
            )}
          </button>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tipCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedTipCategory(c.id);
                handleGenerateNutritionTip(c.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedTipCategory === c.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {tipSuccess && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            New tip generated and added to your plan dossier!
          </p>
        )}

        {/* Nutrition Tips Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nutritionTips.length > 0 ? (
            nutritionTips.map((tip) => (
              <div
                key={tip.id}
                className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                      {tip.category}
                    </span>
                    <span className="text-slate-400">{tip.created_at.slice(0, 10)}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-100 mb-1.5 font-['Space_Grotesk']">
                    {tip.headline}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {tip.tip}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-start gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider shrink-0 mt-0.5">
                    Action Step:
                  </span>
                  <p className="text-xs text-cyan-200/90 italic">
                    {tip.action_item}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800">
              <p className="text-xs text-slate-400">
                Click any nutrition category above to generate targeted advice for {user?.fitness_goal || currentPlan.target_goal || 'your fitness routine'}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={timerModalOpen}
        initialSeconds={timerSeconds}
        onClose={() => setTimerModalOpen(false)}
      />

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        isOpen={comparisonModalOpen}
        plans={allPlans}
        userName={user?.name || 'Athlete'}
        onClose={() => setComparisonModalOpen(false)}
      />
    </div>
  );
};

function Heart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
