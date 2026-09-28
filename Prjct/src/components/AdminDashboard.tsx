import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  GitCompare,
  Sparkles,
  Dumbbell,
  Flame,
  Award,
  Calendar,
  Activity,
  UserCheck,
  CheckCircle2,
  Trash2,
  Save,
  MessageSquare,
  Clock,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { UserRecord, PlanRecord } from '../types';
import { PlanComparisonModal } from './PlanComparisonModal';

interface AdminDashboardProps {
  users: UserRecord[];
  onSelectUserForInspection: (user: UserRecord) => void;
  onRefreshUsers: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  onSelectUserForInspection,
  onRefreshUsers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [intensityFilter, setIntensityFilter] = useState('all');
  const [revisionOnlyFilter, setRevisionOnlyFilter] = useState(false);

  // Inspector modal state
  const [inspectedUser, setInspectedUser] = useState<UserRecord | null>(null);
  const [userPlans, setUserPlans] = useState<PlanRecord[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [coachNotesText, setCoachNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Statistics calculation
  const totalUsers = users.length;
  const totalRevisions = users.filter((u) => u?.has_feedback_revision).length;
  const muscleGainCount = users.filter((u) => (u?.fitness_goal || '').toLowerCase().includes('muscle') || (u?.fitness_goal || '').toLowerCase().includes('gain')).length;
  const weightLossCount = users.filter((u) => (u?.fitness_goal || '').toLowerCase().includes('loss') || (u?.fitness_goal || '').toLowerCase().includes('fat')).length;
  const highIntensityCount = users.filter((u) => (u?.workout_intensity || '').toLowerCase() === 'high').length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = goalFilter === 'all' || (u?.fitness_goal || '').toLowerCase() === goalFilter.toLowerCase();
    const matchesIntensity = intensityFilter === 'all' || (u?.workout_intensity || '').toLowerCase() === intensityFilter.toLowerCase();
    const matchesRevision = !revisionOnlyFilter || !!u?.has_feedback_revision;
    return matchesSearch && matchesGoal && matchesIntensity && matchesRevision;
  });

  const handleOpenInspector = async (user: UserRecord) => {
    setInspectedUser(user);
    setIsLoadingPlans(true);
    setNotesSuccess(false);

    try {
      const res = await fetch(`/api/plans/user/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserPlans(data.plans);
        const currentPlan = data.plans.find((p: PlanRecord) => p.is_current === 1) || data.plans[0];
        setCoachNotesText(currentPlan?.coach_notes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSaveCoachNotes = async () => {
    if (!inspectedUser || userPlans.length === 0) return;
    const currentPlan = userPlans.find((p) => p.is_current === 1) || userPlans[0];
    if (!currentPlan) return;

    setSavingNotes(true);
    setNotesSuccess(false);

    try {
      const res = await fetch('/api/admin/coach-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: currentPlan.id,
          notes: coachNotesText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotesSuccess(true);
        // Update local plan state
        setUserPlans((prev) =>
          prev.map((p) => (p.id === currentPlan.id ? { ...p, coach_notes: coachNotesText } : p))
        );
        setTimeout(() => setNotesSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteUser = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this athlete and their workout plans from fitbuddy.db?')) {
      return;
    }
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      onRefreshUsers();
      if (inspectedUser?.id === userId) {
        setInspectedUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Scenario 4: Coach & Trainer Oversight Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            Athlete Directory & Workout Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Track individual progress, compare original baseline plans with updated AI feedback revisions, and monitor user training activity.
          </p>
        </div>

        <button
          onClick={onRefreshUsers}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors flex items-center gap-2 self-start md:self-center"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Sync Database</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Athletes</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-['Space_Grotesk']">{totalUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Persisted in fitbuddy.db</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Feedback Revisions</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-['Space_Grotesk']">{totalRevisions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Regenerated with user input</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Muscle Gain Roster</span>
            <Dumbbell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-['Space_Grotesk']">{muscleGainCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Hypertrophy programs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Weight Loss Roster</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-['Space_Grotesk']">{weightLossCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Metabolic conditioning</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search athletes by name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Goal Filter */}
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="all">All Goals</option>
            <option value="muscle gain">Muscle Gain</option>
            <option value="weight loss">Weight Loss</option>
            <option value="endurance">Endurance</option>
            <option value="strength">Strength & Power</option>
          </select>

          {/* Intensity Filter */}
          <select
            value={intensityFilter}
            onChange={(e) => setIntensityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="all">All Intensities</option>
            <option value="high">High Intensity</option>
            <option value="medium">Medium Intensity</option>
            <option value="low">Low Intensity</option>
          </select>

          {/* Revisions Toggle */}
          <button
            type="button"
            onClick={() => setRevisionOnlyFilter(!revisionOnlyFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              revisionOnlyFilter
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Regenerated v2+ Only
          </button>
        </div>
      </div>

      {/* Users Table matching PDF Page 24 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📋</span>
            <h3 className="font-extrabold text-base sm:text-lg text-white font-['Space_Grotesk']">
              FitBuddy - All Users & Workout Plans
            </h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30 self-start sm:self-auto">
            PDF Activity 3.1 (/view-all-users)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300 border-collapse">
            {/* Bright blue header bar matching Page 24 screenshot */}
            <thead className="bg-[#0284c7] text-white font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 border border-[#0369a1] text-center w-20">User ID</th>
                <th className="py-3 px-3 border border-[#0369a1]">Name</th>
                <th className="py-3 px-3 border border-[#0369a1] text-center w-14">Age</th>
                <th className="py-3 px-3 border border-[#0369a1] text-center w-24">Weight (kg)</th>
                <th className="py-3 px-3 border border-[#0369a1] w-28">Goal</th>
                <th className="py-3 px-3 border border-[#0369a1] text-center w-24">Intensity</th>
                <th className="py-3 px-4 border border-[#0369a1] min-w-[300px]">Original Plan</th>
                <th className="py-3 px-4 border border-[#0369a1] min-w-[300px]">Updated Plan</th>
                <th className="py-3 px-3 border border-[#0369a1] text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/70">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="py-3 px-3 border border-slate-800 text-center font-mono font-bold text-emerald-400">
                      {u.id}
                    </td>
                    <td className="py-3 px-3 border border-slate-800 font-bold text-white">
                      {u.name}
                    </td>
                    <td className="py-3 px-3 border border-slate-800 text-center">
                      {u.age}
                    </td>
                    <td className="py-3 px-3 border border-slate-800 text-center">
                      {u.weight}
                    </td>
                    <td className="py-3 px-3 border border-slate-800 capitalize text-emerald-300 font-medium">
                      {u.fitness_goal}
                    </td>
                    <td className="py-3 px-3 border border-slate-800 text-center capitalize text-cyan-300 font-medium">
                      {u.workout_intensity}
                    </td>
                    <td className="py-3 px-4 border border-slate-800 align-top">
                      <div className="max-h-48 overflow-y-auto pr-1">
                        <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 select-text">
                          {u.original_plan || 'N/A'}
                        </pre>
                      </div>
                    </td>
                    <td className="py-3 px-4 border border-slate-800 align-top">
                      <div className="max-h-48 overflow-y-auto pr-1">
                        <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 select-text">
                          {u.updated_plan || 'Not updated'}
                        </pre>
                      </div>
                    </td>
                    <td className="py-3 px-3 border border-slate-800 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenInspector(u)}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer border border-emerald-500/30"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteUser(u.id, e)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No athletes match the search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DETAILED ATHLETE INSPECTION MODAL (Scenario 4 Oversight) */}
      {/* ======================================================== */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center font-bold text-white text-base shadow-md">
                  {(inspectedUser?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                      {inspectedUser?.name || 'Athlete'}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      ID #{inspectedUser.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inspectedUser.age} yrs old • {inspectedUser.weight} {inspectedUser.weight_unit} • {inspectedUser.equipment}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectUserForInspection(inspectedUser)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5"
                >
                  <span>Open Active Plan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setInspectedUser(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Biometrics & Injury Context */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Fitness Objective</p>
                  <p className="text-sm font-bold text-emerald-400 capitalize mt-0.5">
                    {inspectedUser.fitness_goal}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Target Intensity</p>
                  <p className="text-sm font-bold text-cyan-400 capitalize mt-0.5">
                    {inspectedUser.workout_intensity}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Experience</p>
                  <p className="text-sm font-bold text-slate-200 capitalize mt-0.5">
                    {inspectedUser.experience_level}
                  </p>
                </div>
              </div>

              {inspectedUser.health_notes && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="font-bold text-amber-300">Health / Limitations: </span>
                  <span className="text-slate-200">{inspectedUser.health_notes}</span>
                </div>
              )}

              {/* Workout Plan Version History & Comparison CTA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Workout Plan Progression History ({userPlans.length})
                  </h3>

                  {userPlans.length > 1 && (
                    <button
                      onClick={() => setComparisonModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Compare Baseline (v1) vs Revision (v{userPlans[0]?.version})</span>
                    </button>
                  )}
                </div>

                {isLoadingPlans ? (
                  <p className="text-xs text-slate-400">Loading plan records from fitbuddy.db...</p>
                ) : userPlans.length > 0 ? (
                  <div className="space-y-3">
                    {userPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-xl border transition-all ${
                          plan.is_current
                            ? 'bg-slate-950 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                plan.version > 1
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              Version {plan.version}
                            </span>
                            <span className="font-bold text-sm text-slate-100">{plan.plan_name}</span>
                            {plan.is_current === 1 && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-semibold">
                                Active Plan
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{plan.created_at.slice(0, 16).replace('T', ' ')}</span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{plan.summary}</p>

                        {plan.feedback_applied && (
                          <div className="mt-2 text-xs text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20">
                            <strong>User Feedback Applied:</strong> "{plan.feedback_applied}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No plans generated yet for this athlete.</p>
                )}
              </div>

              {/* Scenario 4: Coach Review Notes Editor */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Trainer / Coach Notes & Endorsements
                  </h4>
                  {notesSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Notes saved to fitbuddy.db
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={coachNotesText}
                  onChange={(e) => setCoachNotesText(e.target.value)}
                  placeholder="Add coach evaluation (e.g., 'Form review verified. Ensure 8 hours of sleep and adequate hydration during high intensity phase. Approved.')"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCoachNotes}
                    disabled={savingNotes}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotes ? 'Saving...' : 'Save Coach Feedback'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <PlanComparisonModal
        isOpen={comparisonModalOpen}
        plans={userPlans}
        userName={inspectedUser?.name}
        onClose={() => setComparisonModalOpen(false)}
      />
    </div>
  );
};
