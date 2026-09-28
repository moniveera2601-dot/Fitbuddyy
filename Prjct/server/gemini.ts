import { GoogleGenAI, Type } from '@google/genai';
import { DaySchedule, NutritionTip, Exercise } from './db.js';

const apiKey = process.env.GEMINI_API_KEY;

// Server-side initialization per guidelines
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Scenario 1: Generate personalized 7-day workout plan
export async function generateAIFitnessPlan(user: {
  name: string;
  age: number;
  weight: number;
  weight_unit: string;
  fitness_goal: string;
  workout_intensity: string;
  experience_level?: string;
  equipment?: string;
  health_notes?: string;
}): Promise<{
  plan_name: string;
  summary: string;
  schedule: DaySchedule[];
}> {
  if (!ai) {
    console.warn('GEMINI_API_KEY not found in environment, using high-fidelity fallback generator');
    return generateStructuredFallbackPlan(user);
  }

  const prompt = `
Generate a personalized, scientifically sound 7-Day Workout Schedule for this user:
- Name: ${user.name}
- Age: ${user.age} years old
- Weight: ${user.weight} ${user.weight_unit}
- Primary Fitness Goal: ${user.fitness_goal} (e.g. weight loss, muscle gain, endurance, strength)
- Preferred Workout Intensity: ${user.workout_intensity} (low, medium, or high)
- Experience Level: ${user.experience_level || 'intermediate'}
- Equipment Available: ${user.equipment || 'gym'}
- Health Notes / Limitations: ${user.health_notes || 'None'}

Requirements:
1. Provide a realistic 7-Day Day-by-Day schedule (Day 1 through Day 7).
2. For each day, include:
   - day_number: 1 to 7
   - day_name: e.g. "Day 1 - Monday"
   - title: e.g. "Upper Body Push & Core" or "Active Recovery & Mobility"
   - is_rest_day: boolean
   - focus: primary muscle groups or physiological goal
   - duration_minutes: estimated workout time (typically 30-65 mins, or 0-25 mins for rest/mobility days)
   - intensity: "low", "medium", or "high"
   - warm_up: list of 2-3 specific warm-up movements
   - exercises: list of 3 to 6 exercises with name, sets (number or string like 3-4), reps (e.g. "8-10" or "45s"), rest (e.g. "60s" or "90s"), target_muscle, and short execution form note
   - cool_down: list of 2-3 cool-down stretches
   - calorie_estimate: estimated burn in kcal based on user weight and intensity
3. Match the user's intensity and goal:
   - If "weight loss": incorporate metabolic conditioning, compound movements, higher rep ranges, and cardio intervals.
   - If "muscle gain": incorporate hypertrophy protocols (8-12 reps, progressive overload, adequate rest periods).
   - If intensity is "low" or "medium": ensure manageable volume and safe joint angles.
4. Output must be valid JSON adhering to the provided schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FitBuddy AI, an elite certified exercise physiologist and personal trainer. You build personalized, safe, goal-driven 7-day fitness plans tailored to age, weight, and fitness objectives.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan_name: { type: Type.STRING, description: 'Catchy and descriptive title for the workout routine' },
            summary: { type: Type.STRING, description: '2-3 sentence overview explaining how this 7-day program hits their goals' },
            schedule: {
              type: Type.ARRAY,
              description: 'Exact 7 days array from Day 1 to Day 7',
              items: {
                type: Type.OBJECT,
                properties: {
                  day_number: { type: Type.INTEGER },
                  day_name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  is_rest_day: { type: Type.BOOLEAN },
                  focus: { type: Type.STRING },
                  duration_minutes: { type: Type.INTEGER },
                  intensity: { type: Type.STRING },
                  warm_up: { type: Type.ARRAY, items: { type: Type.STRING } },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.STRING },
                        reps: { type: Type.STRING },
                        rest: { type: Type.STRING },
                        target_muscle: { type: Type.STRING },
                        notes: { type: Type.STRING },
                      },
                      required: ['name', 'sets', 'reps', 'rest', 'target_muscle'],
                    },
                  },
                  cool_down: { type: Type.ARRAY, items: { type: Type.STRING } },
                  calorie_estimate: { type: Type.INTEGER },
                },
                required: ['day_number', 'day_name', 'title', 'is_rest_day', 'focus', 'duration_minutes', 'intensity', 'warm_up', 'exercises', 'cool_down', 'calorie_estimate'],
              },
            },
          },
          required: ['plan_name', 'summary', 'schedule'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.schedule) && parsed.schedule.length > 0) {
        return parsed;
      }
    }
    return generateStructuredFallbackPlan(user);
  } catch (error) {
    console.error('Gemini API call failed for generateAIFitnessPlan:', error);
    return generateStructuredFallbackPlan(user);
  }
}

// Scenario 2: Regenerate updated workout plan based on user feedback
export async function regenerateAIPlanWithFeedback(
  user: {
    name: string;
    age: number;
    weight: number;
    weight_unit: string;
    fitness_goal: string;
    workout_intensity: string;
  },
  currentPlan: {
    plan_name: string;
    summary: string;
    schedule: DaySchedule[];
  },
  feedback: string
): Promise<{
  plan_name: string;
  summary: string;
  schedule: DaySchedule[];
}> {
  if (!ai) {
    console.warn('GEMINI_API_KEY not found in environment, modifying plan via smart fallback engine');
    return modifyPlanWithFeedbackFallback(user, currentPlan, feedback);
  }

  const prompt = `
The user submitted feedback on their existing 7-Day Workout Plan.
User profile:
- Name: ${user.name}, Age: ${user.age}, Weight: ${user.weight} ${user.weight_unit}
- Goal: ${user.fitness_goal}
- Intensity: ${user.workout_intensity}

Existing Plan Name: ${currentPlan.plan_name}
Existing Plan Summary: ${currentPlan.summary}

USER FEEDBACK / REQUESTED CHANGES:
"${feedback}" (e.g., "more focus on cardio", "include more rest days", "shorter 30-min sessions", "less knee impact", etc.)

Your Task:
Regenerate and update the 7-day schedule to directly incorporate the user's feedback while preserving the overall training balance for their goal (${user.fitness_goal}).
Explain clearly in the summary what adjustments were made in response to their feedback.
Return a revised 7-day schedule in valid JSON format matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FitBuddy AI. You refine and evolve fitness plans based on user feedback, ensuring adaptive progressive overload, joint safety, and high adherence.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan_name: { type: Type.STRING, description: 'Updated title reflecting the revision (e.g. adding "(Updated for Cardio & Recovery)")' },
            summary: { type: Type.STRING, description: 'Clear summary highlighting the exact adaptations made based on user feedback' },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day_number: { type: Type.INTEGER },
                  day_name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  is_rest_day: { type: Type.BOOLEAN },
                  focus: { type: Type.STRING },
                  duration_minutes: { type: Type.INTEGER },
                  intensity: { type: Type.STRING },
                  warm_up: { type: Type.ARRAY, items: { type: Type.STRING } },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.STRING },
                        reps: { type: Type.STRING },
                        rest: { type: Type.STRING },
                        target_muscle: { type: Type.STRING },
                        notes: { type: Type.STRING },
                      },
                      required: ['name', 'sets', 'reps', 'rest', 'target_muscle'],
                    },
                  },
                  cool_down: { type: Type.ARRAY, items: { type: Type.STRING } },
                  calorie_estimate: { type: Type.INTEGER },
                },
                required: ['day_number', 'day_name', 'title', 'is_rest_day', 'focus', 'duration_minutes', 'intensity', 'warm_up', 'exercises', 'cool_down', 'calorie_estimate'],
              },
            },
          },
          required: ['plan_name', 'summary', 'schedule'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.schedule) && parsed.schedule.length > 0) {
        return parsed;
      }
    }
    return modifyPlanWithFeedbackFallback(user, currentPlan, feedback);
  } catch (error) {
    console.error('Gemini API call failed for regenerateAIPlanWithFeedback:', error);
    return modifyPlanWithFeedbackFallback(user, currentPlan, feedback);
  }
}

// Scenario 3: Request targeted nutrition or recovery tip based on fitness goal
export async function generateAINutritionTip(params: {
  fitness_goal: string;
  workout_intensity: string;
  category?: string; // e.g. "Post-Workout", "Hydration", "Rest Day", "Meal Timing"
  user_name?: string;
  weight?: number;
  weight_unit?: string;
}): Promise<NutritionTip> {
  const category = params.category || 'Post-Workout Fuel';

  if (!ai) {
    return generateFallbackNutritionTip(params.fitness_goal, category, params.workout_intensity);
  }

  const prompt = `
The user has the fitness goal "${params.fitness_goal}" with "${params.workout_intensity}" workout intensity.
Category requested: "${category}".
User details: Name: ${params.user_name || 'Athlete'}, Weight: ${params.weight || 70} ${params.weight_unit || 'kg'}.

Deliver a concise, practical, and highly relevant nutrition or recovery tip aligned with their goal.
Examples of style:
- Muscle Gain: "Include protein in your post-workout meal: Ingest 25-35g of complete protein with fast-digesting carbohydrates within 60-90 minutes to elevate muscle protein synthesis and replenish glycogen."
- Weight Loss: "Prioritize protein and fiber pre-loading: Begin main meals with 200g of fibrous greens or broth to increase satiety while sustaining a moderate caloric deficit."

Return JSON with:
- category: "${category}"
- headline: short catchy headline (max 7 words)
- tip: concise scientific explanation (1-2 sentences)
- action_item: concrete single-step recommendation they can implement today
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FitBuddy AI Nutritionist. Deliver targeted, evidence-based nutrition and recovery tips that complement physical training regimens.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            headline: { type: Type.STRING },
            tip: { type: Type.STRING },
            action_item: { type: Type.STRING },
          },
          required: ['category', 'headline', 'tip', 'action_item'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        id: `tip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category: parsed.category || category,
        headline: parsed.headline,
        tip: parsed.tip,
        action_item: parsed.action_item,
        created_at: new Date().toISOString(),
      };
    }
    return generateFallbackNutritionTip(params.fitness_goal, category, params.workout_intensity);
  } catch (error) {
    console.error('Gemini API call failed for generateAINutritionTip:', error);
    return generateFallbackNutritionTip(params.fitness_goal, category, params.workout_intensity);
  }
}

// Fallback generators in case GEMINI_API_KEY is not supplied in dev environment
function generateStructuredFallbackPlan(user: {
  name: string;
  age: number;
  weight: number;
  weight_unit: string;
  fitness_goal: string;
  workout_intensity: string;
}): {
  plan_name: string;
  summary: string;
  schedule: DaySchedule[];
} {
  const isLoss = user.fitness_goal.toLowerCase().includes('loss');
  const isGain = user.fitness_goal.toLowerCase().includes('muscle') || user.fitness_goal.toLowerCase().includes('gain');
  const intensity = (user.workout_intensity.toLowerCase() as 'low' | 'medium' | 'high') || 'medium';

  const plan_name = isLoss
    ? `FitBuddy 7-Day Metabolic Fat-Burn & Tone Plan`
    : isGain
    ? `FitBuddy 7-Day Hypertrophy & Power Split`
    : `FitBuddy 7-Day Total Body Functional Conditioning`;

  const summary = `Personalized 7-day regimen engineered for ${user.name} (${user.age} yrs, ${user.weight}${user.weight_unit}). Designed to target ${user.fitness_goal} through a ${intensity}-intensity schedule balancing progressive stimulation and optimal central nervous system recovery.`;

  const schedule: DaySchedule[] = [
    {
      day_number: 1,
      day_name: 'Day 1 - Monday',
      title: isGain ? 'Chest, Shoulders & Triceps (Push)' : 'Full-Body Metabolic Circuit',
      is_rest_day: false,
      focus: isGain ? 'Upper Body Pushing Muscles' : 'Metabolic Calorie Burn & Core',
      duration_minutes: intensity === 'high' ? 55 : 45,
      intensity: intensity,
      warm_up: ['Dynamic arm circles 60s', 'Cat-cow 10 reps', 'Jumping jacks or high knees 2 mins'],
      exercises: [
        { name: isGain ? 'Dumbbell Bench Press' : 'Goblet Squats', sets: '3-4', reps: isGain ? '8-10' : '12-15', rest: '60s', target_muscle: isGain ? 'Chest' : 'Quads & Glutes', notes: 'Maintain strict control on eccentric phase' },
        { name: isGain ? 'Overhead Shoulder Press' : 'Push-Ups to Renegade Row', sets: '3', reps: '10-12', rest: '60s', target_muscle: isGain ? 'Deltoids' : 'Chest & Back', notes: 'Keep core braced firmly' },
        { name: isGain ? 'Incline Dumbbell Flyes' : 'Mountain Climbers', sets: '3', reps: isGain ? '12' : '40s', rest: '45s', target_muscle: isGain ? 'Pectorals' : 'Core & Cardio', notes: 'Steady rhythmic pace' },
        { name: isGain ? 'Rope Triceps Pushdown' : 'Forearm Plank with Hip Dips', sets: '3', reps: isGain ? '12-15' : '12/side', rest: '45s', target_muscle: isGain ? 'Triceps' : 'Core Obliques', notes: 'Peak contraction 1 second' },
      ],
      cool_down: ['Chest door stretch 60s', 'Shoulder stretch 60s'],
      calorie_estimate: intensity === 'high' ? 420 : 330,
    },
    {
      day_number: 2,
      day_name: 'Day 2 - Tuesday',
      title: isGain ? 'Back, Lats & Biceps (Pull)' : 'Lower Body Sculpt & Cardio Intervals',
      is_rest_day: false,
      focus: isGain ? 'Posterior Upper Body' : 'Hips, Quads & Glute Activation',
      duration_minutes: intensity === 'high' ? 50 : 40,
      intensity: intensity,
      warm_up: ['Hip openers 10/side', 'Glute bridges 15 reps', 'Light jog in place 2 mins'],
      exercises: [
        { name: isGain ? 'Barbell or Dumbbell Bent-Over Row' : 'Romanian Deadlifts', sets: '3-4', reps: '10-12', rest: '75s', target_muscle: isGain ? 'Lats & Rhomboids' : 'Hamstrings & Glutes', notes: 'Flat spine, hinge deeply at hips' },
        { name: isGain ? 'Lat Pulldowns or Pull-Ups' : 'Walking Lunges', sets: '3', reps: isGain ? '8-10' : '12/leg', rest: '60s', target_muscle: isGain ? 'Lats' : 'Glutes & Quads', notes: 'Keep chest tall throughout movement' },
        { name: isGain ? 'Incline Dumbbell Bicep Curls' : 'Step-Jacks or Speed Skaters', sets: '3', reps: isGain ? '10-12' : '45s', rest: '45s', target_muscle: isGain ? 'Biceps' : 'Heart Rate', notes: 'No momentum swinging' },
        { name: isGain ? 'Face Pulls with Cable or Band' : 'Bicycle Crunches', sets: '3', reps: isGain ? '15' : '16 total', rest: '45s', target_muscle: isGain ? 'Rear Deltoids' : 'Rectus Abdominis', notes: 'Focus on quality mind-muscle connection' },
      ],
      cool_down: ['Hamstring seated stretch 90s', 'Child pose 60s'],
      calorie_estimate: intensity === 'high' ? 440 : 350,
    },
    {
      day_number: 3,
      day_name: 'Day 3 - Wednesday',
      title: 'Active Recovery & Mobility Reset',
      is_rest_day: true,
      focus: 'Joint Health, Blood Flow & Stress Reduction',
      duration_minutes: 25,
      intensity: 'low',
      warm_up: ['Deep diaphragmatic box breathing 3 mins'],
      exercises: [
        { name: 'Brisk Outdoor Walk or Stationary Cycling', sets: '1', reps: '20 mins', rest: '0', target_muscle: 'Cardiovascular Low-Impact', notes: 'Keep conversation pace (Zone 2)' },
        { name: 'Full Body Mobility Flow (Spine, Hips, Ankles)', sets: '1', reps: '10 mins', rest: '0', target_muscle: 'Mobility & Fascia', notes: 'Work through full comfortable range of motion' },
      ],
      cool_down: ['Legs up the wall pose 5 mins'],
      calorie_estimate: 130,
    },
    {
      day_number: 4,
      day_name: 'Day 4 - Thursday',
      title: isGain ? 'Legs & Core Power' : 'Upper Body Tone & Core Density',
      is_rest_day: false,
      focus: isGain ? 'Quadriceps, Hamstrings & Calves' : 'Arms, Shoulders & Back Definition',
      duration_minutes: intensity === 'high' ? 55 : 45,
      intensity: intensity,
      warm_up: ['Leg swings 15/side', 'Bodyweight squats 15 reps'],
      exercises: [
        { name: isGain ? 'Barbell or Dumbbell Squats' : 'Dumbbell Shoulder Press', sets: '4', reps: isGain ? '8-10' : '12-15', rest: '90s', target_muscle: isGain ? 'Quads' : 'Deltoids', notes: 'Brace abdominal wall prior to descent' },
        { name: isGain ? 'Bulgarian Split Squats' : 'Bent-Over Dumbbell Rows', sets: '3', reps: '10-12', rest: '60s', target_muscle: isGain ? 'Glutes' : 'Upper Back', notes: 'Controlled tempo' },
        { name: isGain ? 'Lying Leg Curls' : 'Push-Ups on Incline or Mat', sets: '3', reps: '12-15', rest: '60s', target_muscle: isGain ? 'Hamstrings' : 'Pectorals', notes: 'Full extension' },
        { name: isGain ? 'Hanging Knee Raises' : 'Russian Twists', sets: '3', reps: '15', rest: '45s', target_muscle: 'Core', notes: 'Contract abs at peak' },
      ],
      cool_down: ['Quad couch stretch 60s/side', 'Pigeon pose 60s/side'],
      calorie_estimate: intensity === 'high' ? 460 : 360,
    },
    {
      day_number: 5,
      day_name: 'Day 5 - Friday',
      title: isGain ? 'Upper Body Volume & Arms' : 'HIIT & Functional Cardio Sweat',
      is_rest_day: false,
      focus: isGain ? 'Upper Body Hypertrophy' : 'Cardiovascular Stamina & Endurance',
      duration_minutes: intensity === 'high' ? 48 : 38,
      intensity: intensity,
      warm_up: ['Arm swings 60s', 'Inchworms 6 reps'],
      exercises: [
        { name: isGain ? 'Incline Dumbbell Press' : 'Kettlebell or DB Swings', sets: '3-4', reps: isGain ? '10-12' : '15', rest: '60s', target_muscle: isGain ? 'Upper Chest' : 'Posterior Chain & Lungs', notes: 'Hip hinge power' },
        { name: isGain ? 'Seated Cable Row' : 'Box Step-Ups or Jump Rope', sets: '3', reps: isGain ? '12' : '45s', rest: '60s', target_muscle: isGain ? 'Rhomboids' : 'Cardio & Legs', notes: 'Explosive drive' },
        { name: isGain ? 'Lateral DB Raises' : 'Plank with Shoulder Taps', sets: '3', reps: isGain ? '15' : '12/side', rest: '45s', target_muscle: isGain ? 'Side Delts' : 'Deep Core', notes: 'Prevent hip swaying' },
        { name: isGain ? 'Dumbbell Hammer Curls' : 'Burpees or Squat Thrusts', sets: '3', reps: isGain ? '12' : '10-12', rest: '45s', target_muscle: isGain ? 'Brachialis' : 'Total Body Burn', notes: 'Safe pacing' },
      ],
      cool_down: ['Shoulder cross stretch 60s', 'Lower back twist 60s'],
      calorie_estimate: intensity === 'high' ? 410 : 370,
    },
    {
      day_number: 6,
      day_name: 'Day 6 - Saturday',
      title: 'Full Body Functional Stamina & Core',
      is_rest_day: false,
      focus: 'Multi-planar Movement & Conditioning',
      duration_minutes: 40,
      intensity: intensity === 'high' ? 'medium' : 'low',
      warm_up: ['Dynamic lunges with torso reach 8/side'],
      exercises: [
        { name: 'Dumbbell Deadlifts to Upright Row', sets: '3', reps: '12', rest: '60s', target_muscle: 'Full Chain', notes: 'Smooth coordinated motion' },
        { name: 'Reverse Lunges with Bicep Curl', sets: '3', reps: '10/leg', rest: '60s', target_muscle: 'Legs & Biceps', notes: 'Upright torso' },
        { name: 'Side Plank Holds', sets: '3', reps: '30s/side', rest: '30s', target_muscle: 'Obliques', notes: 'Keep hips elevated' },
      ],
      cool_down: ['Cat-cow 10 cycles', 'Seated butterfly stretch 90s'],
      calorie_estimate: 310,
    },
    {
      day_number: 7,
      day_name: 'Day 7 - Sunday',
      title: 'Complete Rest & Weekly Prep',
      is_rest_day: true,
      focus: 'Sleep Hygiene, Hydration & Nutrition Reset',
      duration_minutes: 0,
      intensity: 'low',
      warm_up: [],
      exercises: [],
      cool_down: ['Enjoy a relaxing walk and hydrate with 2.5L water'],
      calorie_estimate: 80,
    },
  ];

  return { plan_name, summary, schedule };
}

function modifyPlanWithFeedbackFallback(
  user: {
    name: string;
    fitness_goal: string;
    workout_intensity: string;
  },
  currentPlan: {
    plan_name: string;
    summary: string;
    schedule: DaySchedule[];
  },
  feedback: string
): {
  plan_name: string;
  summary: string;
  schedule: DaySchedule[];
} {
  const lowerFeedback = feedback.toLowerCase();
  const schedule = JSON.parse(JSON.stringify(currentPlan.schedule)) as DaySchedule[];

  // Scenario 2 examples:
  // "more focus on cardio"
  if (lowerFeedback.includes('cardio') || lowerFeedback.includes('hiit') || lowerFeedback.includes('running')) {
    schedule.forEach((day) => {
      if (!day.is_rest_day) {
        day.exercises.push({
          name: 'Cardio Finisher (Interval Sprints / Skipping / Fast Walk)',
          sets: '3',
          reps: '45 seconds on / 15s rest',
          rest: '45s',
          target_muscle: 'Cardiovascular System',
          notes: 'High heart-rate interval added per user feedback',
        });
        day.calorie_estimate = Math.round(day.calorie_estimate * 1.2);
        day.duration_minutes = Math.min(65, day.duration_minutes + 10);
      }
    });
  }

  // "include more rest days"
  if (lowerFeedback.includes('rest') || lowerFeedback.includes('recovery') || lowerFeedback.includes('less days')) {
    // Turn Day 5 or Day 6 into an active rest day
    if (!schedule[4].is_rest_day) {
      schedule[4].is_rest_day = true;
      schedule[4].title = 'Added Rest & Muscle Regeneration (User Requested)';
      schedule[4].focus = 'Tissue Repair & CNS Recovery';
      schedule[4].duration_minutes = 20;
      schedule[4].intensity = 'low';
      schedule[4].exercises = [
        {
          name: 'Casual Recovery Walk & Gentle Foam Rolling',
          sets: '1',
          reps: '20 mins',
          rest: '0',
          target_muscle: 'Full Body',
          notes: 'Low stress to facilitate total systemic recuperation',
        },
      ];
      schedule[4].calorie_estimate = 120;
    }
  }

  // "shorter" or "30 min"
  if (lowerFeedback.includes('shorter') || lowerFeedback.includes('30 min') || lowerFeedback.includes('quick')) {
    schedule.forEach((day) => {
      if (!day.is_rest_day) {
        day.duration_minutes = 32;
        day.exercises = day.exercises.slice(0, 3);
        day.exercises.forEach((ex) => {
          ex.rest = '40s';
          ex.notes = (ex.notes || '') + ' [Superset tempo for time efficiency]';
        });
      }
    });
  }

  return {
    plan_name: `${currentPlan.plan_name} (Revised)`,
    summary: `Dynamically re-optimized based on your feedback: "${feedback}". Adjustments made to training volume, cardio density, and recovery intervals to match your updated preferences.`,
    schedule,
  };
}

function generateFallbackNutritionTip(goal: string, category: string, intensity: string): NutritionTip {
  const isGain = goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('gain');
  const isLoss = goal.toLowerCase().includes('loss') || goal.toLowerCase().includes('fat');

  let headline = 'Targeted Post-Workout Fueling';
  let tip = 'Consume 25-35g of bioavailable protein paired with complex carbohydrates within 60-90 minutes of finishing your training session.';
  let action_item = 'Prepare a shake with 1 scoop protein isolate + 1 banana or a chicken breast wrap right after training.';

  if (category.toLowerCase().includes('hydrate') || category.toLowerCase().includes('hydration')) {
    headline = 'Optimal Electrolyte & Fluid Replacement';
    tip = 'For every hour of training, aim to consume 500-750ml of water supplemented with a pinch of Himalayan salt or electrolyte mix.';
    action_item = 'Drink 500ml of cold water with a squeeze of lemon and pinch of sea salt 30 mins before your workout.';
  } else if (category.toLowerCase().includes('rest') || category.toLowerCase().includes('recovery')) {
    headline = 'Rest Day Nutrient Partitioning';
    tip = isGain
      ? 'Do not drop calories drastically on rest days; muscle tissue rebuilds and repairs during your recovery periods with sustained amino acid flow.'
      : 'Maintain high protein and non-starchy vegetables on rest days while tapering carbohydrates slightly around lower energy expenditure.';
    action_item = 'Ensure 7-9 hours of uninterrupted sleep tonight to maximize growth hormone release.';
  } else if (isLoss) {
    headline = 'Caloric Satiety & High-Volume Nutrition';
    tip = 'Include 30g of protein and 10g of dietary fiber in your first post-workout meal to suppress ghrelin (hunger hormone) while in a deficit.';
    action_item = 'Build your next meal around leafy greens, grilled chicken/tofu, and roasted sweet potatoes.';
  } else if (isGain) {
    headline = 'Anabolic Leucine Spike for Muscle Gain';
    tip = 'Target 3-4g of leucine per meal to activate the mTOR pathway responsible for muscle hypertrophy and strength gains.';
    action_item = 'Include eggs, whey, Greek yogurt, or lean beef in your post-training nutrition window.';
  }

  return {
    id: `tip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    category,
    headline,
    tip,
    action_item,
    created_at: new Date().toISOString(),
  };
}
