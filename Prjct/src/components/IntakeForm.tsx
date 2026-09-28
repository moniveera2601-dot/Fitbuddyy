import React, { useState } from 'react';
import { Dumbbell, Flame, Target, Zap, Activity, Heart, Shield, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserRecord, PlanRecord } from '../types';

interface IntakeFormProps {
  currentUser?: UserRecord | null;
  onPlanGenerated: (user: UserRecord, plan: PlanRecord) => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ currentUser, onPlanGenerated }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    userId: currentUser?.id ? String(currentUser.id) : '10',
    age: currentUser?.age && currentUser.age > 0 ? String(currentUser.age) : '20',
    weight: currentUser?.weight && currentUser.weight > 0 ? String(currentUser.weight) : '70.0',
    weight_unit: currentUser?.weight_unit || 'kg',
    fitness_goal: currentUser?.fitness_goal || 'muscle gain',
    workout_intensity: currentUser?.workout_intensity || 'high',
    experience_level: currentUser?.experience_level || 'intermediate',
    equipment: currentUser?.equipment || 'Commercial Gym (Barbells, Dumbbells, Cables)',
    health_notes: currentUser?.health_notes || '',
  });

  // Sync if currentUser changes
  React.useEffect(() => {
    if (currentUser?.name && !formData.name) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name,
        userId: currentUser.id ? String(currentUser.id) : prev.userId,
        fitness_goal: currentUser.fitness_goal || prev.fitness_goal,
        workout_intensity: currentUser.workout_intensity || prev.workout_intensity,
      }));
    }
  }, [currentUser]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const goalOptions = [
    {
      id: 'muscle gain',
      title: 'Muscle Gain',
      subtitle: 'Hypertrophy & progressive overload',
      icon: Dumbbell,
      accent: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
      selectedStyle: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10 text-white',
    },
    {
      id: 'weight loss',
      title: 'Weight Loss',
      subtitle: 'Calorie burn & metabolic conditioning',
      icon: Flame,
      accent: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
      selectedStyle: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/10 text-white',
    },
    {
      id: 'endurance',
      title: 'Endurance & Stamina',
      subtitle: 'Cardiorespiratory & aerobic base',
      icon: Activity,
      accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
      selectedStyle: 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/10 text-white',
    },
    {
      id: 'strength',
      title: 'Strength & Power',
      subtitle: 'Heavy compound lifts & neural force',
      icon: Zap,
      accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
      selectedStyle: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10 text-white',
    },
  ];

  const intensityOptions = [
    {
      id: 'low',
      title: 'Low Intensity',
      desc: 'Gentle, steady pace, safe for joints (RPE 4-5)',
      badge: 'Joint Friendly',
      color: 'border-teal-500/40 text-teal-400',
    },
    {
      id: 'medium',
      title: 'Medium Intensity',
      desc: 'Balanced volume, solid burn & recovery (RPE 6-7)',
      badge: 'Most Popular',
      color: 'border-blue-500/40 text-blue-400',
    },
    {
      id: 'high',
      title: 'High Intensity',
      desc: 'Max effort, high volume, heavy lifts & supersets (RPE 8-9)',
      badge: 'Intense',
      color: 'border-red-500/40 text-red-400',
    },
  ];

  const loadingSteps = [
    'Initializing FitBuddy personal engine...',
    'Consulting Gemini 3.8 Flash Exercise Physiologist...',
    'Generating tailored 7-Day Day-by-Day schedule...',
    'Calibrating sets, reps, rest intervals and warm-ups...',
    'Writing plan & profile to SQLite fitbuddy.db...',
  ];

  const handlePreset = (type: 'gain' | 'loss' | 'beginner') => {
    if (type === 'gain') {
      setFormData({
        name: 'Tyler Vance',
        userId: '10',
        age: '25',
        weight: '76',
        weight_unit: 'kg',
        fitness_goal: 'muscle gain',
        workout_intensity: 'high',
        experience_level: 'intermediate',
        equipment: 'Commercial Gym (Barbells, Dumbbells, Machines)',
        health_notes: 'None. Ready for heavy push/pull split.',
      });
    } else if (type === 'loss') {
      setFormData({
        name: 'Elena Rostova',
        userId: '11',
        age: '29',
        weight: '68',
        weight_unit: 'kg',
        fitness_goal: 'weight loss',
        workout_intensity: 'medium',
        experience_level: 'beginner',
        equipment: 'Home Dumbbells & Resistance Bands',
        health_notes: 'Knee sensitivity, prefers low-impact cardio.',
      });
    } else {
      setFormData({
        name: 'David Kim',
        userId: '12',
        age: '38',
        weight: '82',
        weight_unit: 'kg',
        fitness_goal: 'endurance',
        workout_intensity: 'low',
        experience_level: 'beginner',
        equipment: 'Bodyweight Only & Mat',
        health_notes: 'Desk worker, tight shoulders and lower back.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: currentUser?.id,
          email: currentUser?.email,
          picture_url: currentUser?.picture_url,
          google_id: currentUser?.google_id,
        }),
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate workout plan');
      }

      if (!data.user) {
        throw new Error('User profile could not be created or retrieved.');
      }
      if (!data.plan) {
        throw new Error('Workout plan generation failed to return a valid plan.');
      }

      onPlanGenerated(data.user, data.plan);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Header matching PDF Page 19 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Dumbbell className="w-4 h-4 text-emerald-400" />
          <span>FitBuddy • AI Workout Generator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
          FitBuddy - <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">AI Workout Generator</span>
        </h1>
        <p className="mt-2 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Enter your details below to generate a tailored 7-day fitness regimen and targeted recovery tips powered by Gemini models.
        </p>

        {/* Quick Sample Presets */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset('gain')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 text-slate-300 transition-colors"
          >
            🏋️ Muscle Gain (Tyler, 25)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('loss')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:text-rose-300 text-slate-300 transition-colors"
          >
            🔥 Weight Loss (Elena, 29)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('beginner')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300 text-slate-300 transition-colors"
          >
            🏃 Mobility & Base (David, 38)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Intake Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-emerald-500/25 hover:border-emerald-500/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/70 backdrop-blur-2xl space-y-8 transition-all relative">
        {/* Ambient subtle corner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Personal Details Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold border border-emerald-500/30">1</span>
              User Biometrics & Identification
            </h2>
            <span className="text-[11px] text-slate-400">PDF Activity 2.2 Standard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. xyz"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                User ID <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="e.g. 10"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Age <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                min="12"
                max="95"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Weight (kg) <span className="text-emerald-400">*</span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, weight_unit: 'kg' })}
                    className={`px-1.5 py-0.5 rounded ${formData.weight_unit === 'kg' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400'}`}
                  >
                    kg
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, weight_unit: 'lbs' })}
                    className={`px-1.5 py-0.5 rounded ${formData.weight_unit === 'lbs' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400'}`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="20"
                max="300"
                step="0.5"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Fitness Goal Section */}
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 font-['Space_Grotesk']">
            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">2</span>
            Primary Fitness Objective <span className="text-emerald-400">*</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {goalOptions.map((goal) => {
              const Icon = goal.icon;
              const isSelected = formData.fitness_goal.toLowerCase() === goal.id.toLowerCase();
              return (
                <div
                  key={goal.id}
                  onClick={() => setFormData({ ...formData, fitness_goal: goal.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? goal.selectedStyle : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg border ${goal.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mt-3">{goal.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{goal.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workout Intensity Section */}
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 font-['Space_Grotesk']">
            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">3</span>
            Preferred Workout Intensity <span className="text-emerald-400">*</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {intensityOptions.map((opt) => {
              const isSelected = formData.workout_intensity.toLowerCase() === opt.id.toLowerCase();
              return (
                <div
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, workout_intensity: opt.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white capitalize">{opt.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${opt.color}`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience & Equipment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Experience Level
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all"
            >
              <option value="beginner">Beginner (0 - 6 months)</option>
              <option value="intermediate">Intermediate (6 months - 2 years)</option>
              <option value="advanced">Advanced (2+ years dedicated training)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Equipment Access
            </label>
            <select
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all"
            >
              <option value="Commercial Gym (Barbells, Dumbbells, Cables, Machines)">
                Commercial Gym (Full Equipment)
              </option>
              <option value="Home Gym (Dumbbells, Adjustable Bench)">
                Home Gym (Dumbbells & Bench)
              </option>
              <option value="Resistance Bands & Pull-up Bar">
                Resistance Bands & Pull-Up Bar
              </option>
              <option value="Bodyweight Only & Mat">Bodyweight Only (No Equipment)</option>
            </select>
          </div>
        </div>

        {/* Health Notes / Injuries */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Health Notes, Joint Sensitivities or Injuries (Optional)
          </label>
          <input
            type="text"
            value={formData.health_notes}
            onChange={(e) => setFormData({ ...formData, health_notes: e.target.value })}
            placeholder="e.g. Mild knee stiffness, lower back tightness, preferred workout days..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Your AI Plan with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Personalized 7-Day Workout Plan</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {/* Loading status steps */}
          {isLoading && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center animate-pulse">
              <p className="text-xs font-mono text-emerald-400 font-medium">
                {loadingSteps[loadingStep]}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-1.5 transition-all duration-700"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
