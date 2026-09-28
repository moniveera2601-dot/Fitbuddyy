export interface Exercise {
  name: string;
  sets: number | string;
  reps: string;
  rest: string;
  target_muscle: string;
  notes?: string;
}

export interface DaySchedule {
  day_number: number;
  day_name: string;
  title: string;
  is_rest_day: boolean;
  focus: string;
  duration_minutes: number;
  intensity: 'low' | 'medium' | 'high';
  warm_up: string[];
  exercises: Exercise[];
  cool_down: string[];
  calorie_estimate: number;
}

export interface NutritionTip {
  id: string;
  category: string;
  headline: string;
  tip: string;
  action_item: string;
  created_at: string;
}

export interface PlanRecord {
  id: number;
  user_id: number;
  version: number;
  is_current: number;
  plan_name: string;
  summary: string;
  target_goal: string;
  intensity: string;
  feedback_applied?: string | null;
  schedule: DaySchedule[];
  nutrition_tips: NutritionTip[];
  coach_notes?: string;
  created_at: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email?: string;
  picture_url?: string;
  google_id?: string;
  age: number;
  weight: number;
  weight_unit: string;
  fitness_goal: string;
  workout_intensity: string;
  experience_level: string;
  equipment: string;
  health_notes: string;
  created_at: string;
  updated_at: string;
  // Meta fields from admin endpoint
  plan_count?: number;
  current_version?: number;
  current_plan_name?: string;
  has_feedback_revision?: boolean;
  original_plan?: string;
  updated_plan?: string;
  last_activity?: string;
}
