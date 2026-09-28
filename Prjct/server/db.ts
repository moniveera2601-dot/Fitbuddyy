import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'fitbuddy.db');

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
}

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
  day_name: string; // e.g. "Day 1 - Monday"
  title: string; // e.g. "Chest & Triceps Hypertrophy"
  is_rest_day: boolean;
  focus: string; // e.g. "Upper Body Strength"
  duration_minutes: number;
  intensity: 'low' | 'medium' | 'high';
  warm_up: string[];
  exercises: Exercise[];
  cool_down: string[];
  calorie_estimate: number;
}

export interface NutritionTip {
  id: string;
  category: string; // e.g. "Post-Workout", "Hydration", "Meal Timing"
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

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing fitbuddy.db, creating fresh database', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables according to fitbuddy.db schema
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      weight_unit TEXT DEFAULT 'kg',
      fitness_goal TEXT NOT NULL,
      workout_intensity TEXT NOT NULL,
      experience_level TEXT DEFAULT 'intermediate',
      equipment TEXT DEFAULT 'gym',
      health_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_current INTEGER NOT NULL DEFAULT 1,
      plan_name TEXT NOT NULL,
      summary TEXT NOT NULL,
      target_goal TEXT NOT NULL,
      intensity TEXT NOT NULL,
      feedback_applied TEXT,
      schedule_json TEXT NOT NULL,
      nutrition_tips_json TEXT DEFAULT '[]',
      coach_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Ensure columns for Google login exist
  try {
    dbInstance.run(`ALTER TABLE users ADD COLUMN email TEXT;`);
  } catch (e) {
    // Column might already exist
  }
  try {
    dbInstance.run(`ALTER TABLE users ADD COLUMN picture_url TEXT;`);
  } catch (e) {
    // Column might already exist
  }
  try {
    dbInstance.run(`ALTER TABLE users ADD COLUMN google_id TEXT;`);
  } catch (e) {
    // Column might already exist
  }

  persistDb();

  // Seed default demonstration users and plans if empty
  seedInitialData(dbInstance);

  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving fitbuddy.db:', err);
  }
}

// User CRUD Helpers
export async function getAllUsers(): Promise<UserRecord[]> {
  const db = await getDb();
  const res = db.exec("SELECT * FROM users ORDER BY id DESC;");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as UserRecord;
  });
}

export async function getUserById(id: number): Promise<UserRecord | null> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM users WHERE id = ${Number(id)};`);
  if (!res.length || !res[0].values.length) return null;
  const columns = res[0].columns;
  const row = res[0].values[0];
  const obj: any = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj as UserRecord;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await getDb();
  const cleanEmail = email.trim().replace(/'/g, "''").toLowerCase();
  const res = db.exec(`SELECT * FROM users WHERE LOWER(email) = '${cleanEmail}' LIMIT 1;`);
  if (!res.length || !res[0].values.length) return null;
  const columns = res[0].columns;
  const row = res[0].values[0];
  const obj: any = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj as UserRecord;
}

export async function findOrCreateGoogleUser(data: {
  email: string;
  name: string;
  picture_url?: string;
  google_id?: string;
}): Promise<UserRecord> {
  const existing = await getUserByEmail(data.email);
  const now = new Date().toISOString();
  const db = await getDb();

  if (existing) {
    db.run(
      `UPDATE users SET name = ?, picture_url = ?, google_id = ?, updated_at = ? WHERE id = ?;`,
      [
        data.name || existing.name,
        data.picture_url || existing.picture_url || '',
        data.google_id || existing.google_id || '',
        now,
        existing.id
      ]
    );
    persistDb();
    const updated = await getUserById(existing.id);
    return updated || existing;
  }

  // Insert brand new user account for this Google email
  db.run(
    `INSERT INTO users (name, email, picture_url, google_id, age, weight, weight_unit, fitness_goal, workout_intensity, experience_level, equipment, health_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      data.name || 'Athlete',
      data.email.toLowerCase().trim(),
      data.picture_url || '',
      data.google_id || '',
      26,
      70,
      'kg',
      'muscle gain',
      'medium',
      'intermediate',
      'Commercial Gym',
      '',
      now,
      now
    ]
  );

  const idRes = db.exec("SELECT last_insert_rowid() as id;");
  let newId = (idRes.length && idRes[0].values.length && idRes[0].values[0][0]) as number;
  if (!newId || newId <= 0) {
    const maxRes = db.exec("SELECT MAX(id) as id FROM users;");
    newId = (maxRes.length && maxRes[0].values.length && maxRes[0].values[0][0]) as number;
  }

  persistDb();

  const user = await getUserById(newId);
  return user || {
    id: newId || 1,
    name: data.name,
    email: data.email,
    picture_url: data.picture_url,
    google_id: data.google_id,
    age: 26,
    weight: 70,
    weight_unit: 'kg',
    fitness_goal: 'muscle gain',
    workout_intensity: 'medium',
    experience_level: 'intermediate',
    equipment: 'Commercial Gym',
    health_notes: '',
    created_at: now,
    updated_at: now
  };
}

export async function createUser(data: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>): Promise<UserRecord> {
  const db = await getDb();
  const now = new Date().toISOString();

  // If email is provided, check if user exists first
  if (data.email) {
    const existing = await getUserByEmail(data.email);
    if (existing) {
      db.run(
        `UPDATE users SET name = ?, age = ?, weight = ?, weight_unit = ?, fitness_goal = ?, workout_intensity = ?, experience_level = ?, equipment = ?, health_notes = ?, picture_url = ?, google_id = ?, updated_at = ? WHERE id = ?;`,
        [
          data.name || existing.name,
          data.age,
          data.weight,
          data.weight_unit || 'kg',
          data.fitness_goal,
          data.workout_intensity,
          data.experience_level || 'intermediate',
          data.equipment || 'gym',
          data.health_notes || '',
          data.picture_url || existing.picture_url || '',
          data.google_id || existing.google_id || '',
          now,
          existing.id
        ]
      );
      persistDb();
      const updated = await getUserById(existing.id);
      if (updated) return updated;
    }
  }

  db.run(
    `INSERT INTO users (name, email, picture_url, google_id, age, weight, weight_unit, fitness_goal, workout_intensity, experience_level, equipment, health_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      data.name,
      data.email || null,
      data.picture_url || null,
      data.google_id || null,
      data.age,
      data.weight,
      data.weight_unit || 'kg',
      data.fitness_goal,
      data.workout_intensity,
      data.experience_level || 'intermediate',
      data.equipment || 'gym',
      data.health_notes || '',
      now,
      now
    ]
  );

  // In sql.js, obtain inserted row id before persistDb
  const idRes = db.exec("SELECT last_insert_rowid() as id;");
  let newId = (idRes.length && idRes[0].values.length && idRes[0].values[0][0]) as number;
  if (!newId || newId <= 0) {
    const maxRes = db.exec("SELECT MAX(id) as id FROM users;");
    newId = (maxRes.length && maxRes[0].values.length && maxRes[0].values[0][0]) as number;
  }

  persistDb();

  let user = await getUserById(newId);
  if (!user) {
    const all = await getAllUsers();
    user = all.find(u => u.name === data.name) || all[0] || null;
  }

  if (!user) {
    user = {
      id: newId || 1,
      name: data.name,
      email: data.email,
      picture_url: data.picture_url,
      google_id: data.google_id,
      age: data.age,
      weight: data.weight,
      weight_unit: data.weight_unit || 'kg',
      fitness_goal: data.fitness_goal,
      workout_intensity: data.workout_intensity,
      experience_level: data.experience_level || 'intermediate',
      equipment: data.equipment || 'gym',
      health_notes: data.health_notes || '',
      created_at: now,
      updated_at: now
    };
  }

  return user;
}

// Plan CRUD Helpers
export async function getPlansForUser(userId: number): Promise<PlanRecord[]> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM plans WHERE user_id = ${userId} ORDER BY version DESC;`);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return {
      id: obj.id,
      user_id: obj.user_id,
      version: obj.version,
      is_current: obj.is_current,
      plan_name: obj.plan_name,
      summary: obj.summary,
      target_goal: obj.target_goal,
      intensity: obj.intensity,
      feedback_applied: obj.feedback_applied,
      schedule: JSON.parse(obj.schedule_json || '[]'),
      nutrition_tips: JSON.parse(obj.nutrition_tips_json || '[]'),
      coach_notes: obj.coach_notes || '',
      created_at: obj.created_at,
    };
  });
}

export async function getCurrentPlanForUser(userId: number): Promise<PlanRecord | null> {
  const plans = await getPlansForUser(userId);
  const current = plans.find(p => p.is_current === 1);
  return current || plans[0] || null;
}

export async function savePlan(plan: {
  user_id: number;
  version: number;
  plan_name: string;
  summary: string;
  target_goal: string;
  intensity: string;
  feedback_applied?: string;
  schedule: DaySchedule[];
  nutrition_tips?: NutritionTip[];
  coach_notes?: string;
}): Promise<PlanRecord> {
  const db = await getDb();
  const now = new Date().toISOString();

  // Mark previous plans for this user as not current
  db.run(`UPDATE plans SET is_current = 0 WHERE user_id = ?;`, [plan.user_id]);

  db.run(
    `INSERT INTO plans (user_id, version, is_current, plan_name, summary, target_goal, intensity, feedback_applied, schedule_json, nutrition_tips_json, coach_notes, created_at)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      plan.user_id,
      plan.version,
      plan.plan_name,
      plan.summary,
      plan.target_goal,
      plan.intensity,
      plan.feedback_applied || null,
      JSON.stringify(plan.schedule),
      JSON.stringify(plan.nutrition_tips || []),
      plan.coach_notes || '',
      now
    ]
  );
  // Capture inserted plan id before persistDb
  const idRes = db.exec("SELECT last_insert_rowid() as id;");
  let newPlanId = (idRes.length && idRes[0].values.length && idRes[0].values[0][0]) as number;
  if (!newPlanId || newPlanId <= 0) {
    const maxRes = db.exec("SELECT MAX(id) as id FROM plans;");
    newPlanId = (maxRes.length && maxRes[0].values.length && maxRes[0].values[0][0]) as number;
  }

  persistDb();

  const current = await getCurrentPlanForUser(plan.user_id);
  if (current) return current;

  return {
    id: newPlanId || 1,
    user_id: plan.user_id,
    version: plan.version,
    is_current: 1,
    plan_name: plan.plan_name,
    summary: plan.summary,
    target_goal: plan.target_goal,
    intensity: plan.intensity,
    feedback_applied: plan.feedback_applied || null,
    schedule: plan.schedule,
    nutrition_tips: plan.nutrition_tips || [],
    coach_notes: plan.coach_notes || '',
    created_at: now
  };
}

export async function addNutritionTipToPlan(planId: number, tip: NutritionTip) {
  const db = await getDb();
  const res = db.exec(`SELECT nutrition_tips_json FROM plans WHERE id = ${planId};`);
  if (!res.length || !res[0].values.length) return;
  const currentTips: NutritionTip[] = JSON.parse((res[0].values[0][0] as string) || '[]');
  currentTips.unshift(tip);
  db.run(`UPDATE plans SET nutrition_tips_json = ? WHERE id = ?;`, [JSON.stringify(currentTips), planId]);
  persistDb();
}

export async function updateCoachNotes(planId: number, notes: string) {
  const db = await getDb();
  db.run(`UPDATE plans SET coach_notes = ? WHERE id = ?;`, [notes, planId]);
  persistDb();
}

export async function deleteUserAndPlans(userId: number) {
  const db = await getDb();
  db.run(`DELETE FROM plans WHERE user_id = ?;`, [userId]);
  db.run(`DELETE FROM users WHERE id = ?;`, [userId]);
  persistDb();
}

// Initial Seed Data for Demo & Coach Oversight (Scenario 4)
function seedInitialData(db: Database) {
  const userCheck = db.exec("SELECT COUNT(*) FROM users;");
  const count = userCheck.length ? (userCheck[0].values[0][0] as number) : 0;
  if (count > 0) return;

  console.log("Seeding fitbuddy.db with initial demonstration clients and workout plans...");
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString();
  const today = now.toISOString();

  // User 1: Alex Rivera (Muscle Gain, has updated plan with feedback!)
  db.run(`
    INSERT INTO users (id, name, age, weight, weight_unit, fitness_goal, workout_intensity, experience_level, equipment, health_notes, created_at, updated_at)
    VALUES (1, 'Alex Rivera', 26, 74, 'kg', 'muscle gain', 'high', 'intermediate', 'Commercial Gym (Barbells, Dumbbells, Cables)', 'Minor lower back tightness on heavy deadlifts', ?, ?);
  `, [twoDaysAgo, today]);

  // Plan V1 for Alex
  const alexV1Schedule: DaySchedule[] = [
    {
      day_number: 1,
      day_name: 'Day 1 - Monday',
      title: 'Upper Body Hypertrophy (Chest & Back)',
      is_rest_day: false,
      focus: 'Chest, Lats & Upper Back',
      duration_minutes: 55,
      intensity: 'high',
      warm_up: ['Arm circles 60s', 'Band pull-aparts 2x15', 'Rotator cuff external rotations 2x12'],
      exercises: [
        { name: 'Barbell Incline Bench Press', sets: 4, reps: '8-10', rest: '90s', target_muscle: 'Upper Chest', notes: 'Keep shoulder blades retracted and elbows at 45 degrees' },
        { name: 'Lat Pulldown (Neutral Grip)', sets: 4, reps: '10-12', rest: '75s', target_muscle: 'Latissimus Dorsi', notes: 'Pause 1s at bottom, full squeeze' },
        { name: 'Flat Dumbbell Press', sets: 3, reps: '10-12', rest: '75s', target_muscle: 'Pectoralis Major', notes: 'Controlled 3-second eccentric tempo' },
        { name: 'Seated Cable Row', sets: 3, reps: '12', rest: '60s', target_muscle: 'Rhomboids & Mid-Back', notes: 'Drive with elbows, don’t round lower back' },
        { name: 'Cable Overhead Triceps Extension', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Triceps Long Head', notes: 'Keep upper arms pinned by ears' }
      ],
      cool_down: ['Chest doorway stretch 60s', 'Lat child pose 60s'],
      calorie_estimate: 420
    },
    {
      day_number: 2,
      day_name: 'Day 2 - Tuesday',
      title: 'Lower Body Strength (Quads & Hamstrings)',
      is_rest_day: false,
      focus: 'Quads, Hamstrings & Calves',
      duration_minutes: 60,
      intensity: 'high',
      warm_up: ['Leg swings front/back 20 reps', 'World greatest stretch 5/side', 'Goblet squat hold 60s'],
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: '6-8', rest: '120s', target_muscle: 'Quadriceps & Glutes', notes: 'Descend to parallel, brace core tight' },
        { name: 'Romanian Deadlift (Dumbbell)', sets: 4, reps: '8-10', rest: '90s', target_muscle: 'Hamstrings & Glutes', notes: 'Hip hinge focus, neutral spine to protect lower back' },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', rest: '75s', target_muscle: 'Single Leg Quad/Glute', notes: 'Slight forward torso lean' },
        { name: 'Lying Hamstring Leg Curl', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Hamstrings', notes: 'Slow negative' },
        { name: 'Standing Calf Raise', sets: 4, reps: '15', rest: '45s', target_muscle: 'Gastrocnemius', notes: 'Pause 2s at peak contraction' }
      ],
      cool_down: ['Hamstring seated stretch 90s', 'Quad couch stretch 90s/side'],
      calorie_estimate: 480
    },
    {
      day_number: 3,
      day_name: 'Day 3 - Wednesday',
      title: 'Shoulders, Arms & Abs',
      is_rest_day: false,
      focus: 'Deltoids, Biceps & Triceps',
      duration_minutes: 50,
      intensity: 'high',
      warm_up: ['Jumping jacks 2 mins', 'Band dislocates 15 reps'],
      exercises: [
        { name: 'Seated Dumbbell Shoulder Press', sets: 4, reps: '8-10', rest: '90s', target_muscle: 'Anterior & Lateral Delts', notes: 'Press overhead without arching spine' },
        { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12-15', rest: '60s', target_muscle: 'Lateral Deltoids', notes: 'Pour pitch slightly inward at top' },
        { name: 'Incline Dumbbell Bicep Curl', sets: 3, reps: '10-12', rest: '60s', target_muscle: 'Biceps Brachii', notes: 'Strict form, no swinging' },
        { name: 'Dips / Assisted Dip Machine', sets: 3, reps: '10-12', rest: '75s', target_muscle: 'Triceps & Lower Chest', notes: 'Upright posture for triceps' },
        { name: 'Hanging Knee Raises', sets: 3, reps: '15', rest: '45s', target_muscle: 'Rectus Abdominis', notes: 'Curl pelvis up' }
      ],
      cool_down: ['Shoulder cross-body stretch 60s', 'Bicep wall stretch 60s'],
      calorie_estimate: 390
    },
    {
      day_number: 4,
      day_name: 'Day 4 - Thursday',
      title: 'Active Rest & Recovery',
      is_rest_day: true,
      focus: 'Tissue Repair & Mobility',
      duration_minutes: 25,
      intensity: 'low',
      warm_up: ['Cat-cow stretch 10 breaths'],
      exercises: [
        { name: 'Brisk Incline Walk or Light Cycling', sets: 1, reps: '20 mins', rest: '0', target_muscle: 'Cardiovascular system', notes: 'Zone 1-2 aerobic flow' },
        { name: 'Foam Rolling (Thoracic spine, Quads, IT band)', sets: 1, reps: '10 mins', rest: '0', target_muscle: 'Myofascial release', notes: 'Breathe smoothly on tender spots' }
      ],
      cool_down: ['Deep diaphragmatic breathing 5 mins'],
      calorie_estimate: 150
    },
    {
      day_number: 5,
      day_name: 'Day 5 - Friday',
      title: 'Upper Body Power & Pull',
      is_rest_day: false,
      focus: 'Back Thickness & Chest Volume',
      duration_minutes: 55,
      intensity: 'high',
      warm_up: ['Scapular pull-ups 2x10', 'Push-ups 2x12'],
      exercises: [
        { name: 'Barbell Bent Over Row', sets: 4, reps: '6-8', rest: '90s', target_muscle: 'Upper Back & Lats', notes: 'Maintain 45 degree hip hinge' },
        { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', rest: '90s', target_muscle: 'Chest', notes: 'Full depth stretch' },
        { name: 'Chest Supported Row', sets: 3, reps: '10-12', rest: '75s', target_muscle: 'Rhomboids', notes: 'Zero lower back fatigue' },
        { name: 'Face Pulls with Rope', sets: 3, reps: '15', rest: '60s', target_muscle: 'Rear Delts & Rotator Cuff', notes: 'Pull toward eyes' }
      ],
      cool_down: ['Foam roll lats 60s', 'Cobra stretch 60s'],
      calorie_estimate: 440
    },
    {
      day_number: 6,
      day_name: 'Day 6 - Saturday',
      title: 'Legs & Core Conditioning',
      is_rest_day: false,
      focus: 'Posterior Chain & Core',
      duration_minutes: 50,
      intensity: 'high',
      warm_up: ['Glute bridges 2x15', 'Inchworms 2x8'],
      exercises: [
        { name: 'Leg Press (Foot high & wide)', sets: 4, reps: '10-12', rest: '90s', target_muscle: 'Glutes & Quads', notes: 'Control the sled descent' },
        { name: 'Walking Lunges with Dumbbells', sets: 3, reps: '12 steps/leg', rest: '75s', target_muscle: 'Quads & Glute Medius', notes: 'Chest tall' },
        { name: 'Leg Extension', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Quad VMO', notes: 'Lock out 1s' },
        { name: 'Plank with Shoulder Taps', sets: 3, reps: '45 seconds', rest: '45s', target_muscle: 'Core Stability', notes: 'Hips completely level' }
      ],
      cool_down: ['Figure-4 glute stretch 90s/side', 'Pigeon pose 60s/side'],
      calorie_estimate: 430
    },
    {
      day_number: 7,
      day_name: 'Day 7 - Sunday',
      title: 'Full Rest & Nutrition Recharge',
      is_rest_day: true,
      focus: 'Full System Regeneration',
      duration_minutes: 0,
      intensity: 'low',
      warm_up: [],
      exercises: [],
      cool_down: ['Light casual walking 15-30 mins optional'],
      calorie_estimate: 100
    }
  ];

  // Plan V2 for Alex (Regenerated after feedback: "Include more rest days and emphasize core stability without lower back strain")
  const alexV2Schedule: DaySchedule[] = [
    {
      day_number: 1,
      day_name: 'Day 1 - Monday',
      title: 'Upper Body Hypertrophy (Chest & Back Focus)',
      is_rest_day: false,
      focus: 'Upper Push & Pull Balance',
      duration_minutes: 50,
      intensity: 'high',
      warm_up: ['Band dislocates 2x15', 'Bird-dog 2x10 each side (lower back activation)'],
      exercises: [
        { name: 'Barbell Incline Bench Press', sets: 4, reps: '8-10', rest: '90s', target_muscle: 'Upper Pectorals', notes: 'Tuck elbows at 45 degrees' },
        { name: 'Chest-Supported Neutral Dumbbell Row', sets: 4, reps: '10-12', rest: '75s', target_muscle: 'Lats & Rhomboids', notes: 'Supports chest, eliminating lower back torque' },
        { name: 'Cable Flyes (Mid Pulley)', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Chest Squeeze', notes: 'Continuous cable tension' },
        { name: 'Deadbugs (Core)', sets: 3, reps: '12/side', rest: '45s', target_muscle: 'Transverse Abdominis', notes: 'Press lower back flush against the mat' }
      ],
      cool_down: ['Doorway chest stretch 60s', 'Cat-cow 10 cycles'],
      calorie_estimate: 390
    },
    {
      day_number: 2,
      day_name: 'Day 2 - Tuesday',
      title: 'Legs & Core (Spine-Spared Lower Body)',
      is_rest_day: false,
      focus: 'Quads & Glutes with Zero Axial Loading',
      duration_minutes: 48,
      intensity: 'high',
      warm_up: ['Glute bridge holds 2x30s', 'Bodyweight squats 2x15'],
      exercises: [
        { name: 'Leg Press (Neutral spine)', sets: 4, reps: '10-12', rest: '90s', target_muscle: 'Quads & Glutes', notes: 'No butt curl off pad at the bottom' },
        { name: 'Bulgarian Split Squats (Dumbbells at side)', sets: 3, reps: '10/leg', rest: '75s', target_muscle: 'Unilateral Legs', notes: 'Upright spine' },
        { name: 'Lying Leg Curls', sets: 4, reps: '12', rest: '60s', target_muscle: 'Hamstrings', notes: 'Zero lumbar extension' },
        { name: 'Pallof Press (Cable or Band)', sets: 3, reps: '12/side', rest: '45s', target_muscle: 'Anti-Rotation Core', notes: 'Resist rotational twist' }
      ],
      cool_down: ['Couch quad stretch 60s', 'Pigeon pose 60s'],
      calorie_estimate: 410
    },
    {
      day_number: 3,
      day_name: 'Day 3 - Wednesday',
      title: 'Rest & Myofascial Recovery (Added Rest Day)',
      is_rest_day: true,
      focus: 'Muscle Tissue Rebuilding & Central Nervous System Reset',
      duration_minutes: 20,
      intensity: 'low',
      warm_up: ['Gentle spinal twists', 'Diaphragmatic box breathing 5 mins'],
      exercises: [
        { name: 'Casual Outdoor Walk', sets: 1, reps: '20 mins', rest: '0', target_muscle: 'Active recovery', notes: 'Low stress, promotes blood flow' },
        { name: 'Lacrosse Ball Glute & Upper Back Release', sets: 1, reps: '10 mins', rest: '0', target_muscle: 'Tissue quality', notes: 'Work out trigger knots' }
      ],
      cool_down: ['Hamstring strap stretch 90s'],
      calorie_estimate: 110
    },
    {
      day_number: 4,
      day_name: 'Day 4 - Thursday',
      title: 'Shoulders, Arms & Anti-Extension Core',
      is_rest_day: false,
      focus: 'Delts, Biceps & Deep Core',
      duration_minutes: 48,
      intensity: 'high',
      warm_up: ['Arm swings 60s', 'Plank hold 45s'],
      exercises: [
        { name: 'Seated DB Shoulder Press', sets: 4, reps: '8-10', rest: '90s', target_muscle: 'Deltoids', notes: 'Back supported by bench at 85 degrees' },
        { name: 'Cable Lateral Raise', sets: 4, reps: '12-15', rest: '60s', target_muscle: 'Side Delts', notes: 'Smooth upward drive' },
        { name: 'Incline Dumbbell Hammer Curls', sets: 3, reps: '10-12', rest: '60s', target_muscle: 'Brachialis & Biceps', notes: 'Elbows stationary' },
        { name: 'Triceps Rope Pushdown', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Triceps Lateral Head', notes: 'Spread rope at lockout' },
        { name: 'Ab Wheel Rollouts (from knees)', sets: 3, reps: '10-12', rest: '60s', target_muscle: 'Core Stability', notes: 'Keep pelvis tucked, stop before lower back dips' }
      ],
      cool_down: ['Shoulder cross-body stretch 60s', 'Child pose with side reach 60s'],
      calorie_estimate: 370
    },
    {
      day_number: 5,
      day_name: 'Day 5 - Friday',
      title: 'Full Body Functional & Metabolic Circuit',
      is_rest_day: false,
      focus: 'Hypertrophy with Safe Compound Volume',
      duration_minutes: 45,
      intensity: 'medium',
      warm_up: ['World’s greatest stretch 6 reps/side'],
      exercises: [
        { name: 'Goblet Squat to Bench', sets: 3, reps: '12', rest: '60s', target_muscle: 'Quads & Core', notes: 'Counterbalance dumbbell in front protects spine' },
        { name: 'Lat Pulldown (Wide Grip)', sets: 4, reps: '10-12', rest: '75s', target_muscle: 'Lats', notes: 'Pull collarbone to bar' },
        { name: 'Dumbbell Push-Ups (Deficit handles)', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Pecs & Core', notes: 'Full plank tension' },
        { name: 'Side Plank with Hip Dip', sets: 3, reps: '10/side', rest: '45s', target_muscle: 'Obliques & QL', notes: 'Strengthens lateral core stability' }
      ],
      cool_down: ['Hip flexor lunge stretch 60s/side', 'Foam roll thoracic spine 60s'],
      calorie_estimate: 380
    },
    {
      day_number: 6,
      day_name: 'Day 6 - Saturday',
      title: 'Cardio Intervals & Recovery Mobility',
      is_rest_day: true,
      focus: 'Cardiovascular Conditioning (Low Impact)',
      duration_minutes: 25,
      intensity: 'low',
      warm_up: ['Dynamic leg swings 2 mins'],
      exercises: [
        { name: 'Stationary Cycling or Elliptical Intervals', sets: 1, reps: '20 mins', rest: '0', target_muscle: 'Heart & Lungs', notes: 'Zone 2 base cardio, zero spinal compression' },
        { name: 'Couch Stretch & Pigeon Pose', sets: 1, reps: '10 mins', rest: '0', target_muscle: 'Hip Capsule', notes: 'Breathe deeply into tightness' }
      ],
      cool_down: ['Full body corpse pose 5 mins'],
      calorie_estimate: 170
    },
    {
      day_number: 7,
      day_name: 'Day 7 - Sunday',
      title: 'Full Rest & Weekly Reflection',
      is_rest_day: true,
      focus: 'Hydration, Meal Prep & Central Nervous System Rebound',
      duration_minutes: 0,
      intensity: 'low',
      warm_up: [],
      exercises: [],
      cool_down: ['Rest day relaxation'],
      calorie_estimate: 80
    }
  ];

  // Insert Alex V1
  db.run(`
    INSERT INTO plans (id, user_id, version, is_current, plan_name, summary, target_goal, intensity, feedback_applied, schedule_json, nutrition_tips_json, coach_notes, created_at)
    VALUES (1, 1, 1, 0, 'Hypertrophy 5-Day Push/Pull Split', 'Intensive 5-day progressive overload split focusing on chest, back, and leg hypertrophy with high mechanical tension.', 'muscle gain', 'high', NULL, ?, ?, 'Good starting baseline. Advised Alex to monitor back during squats.', ?);
  `, [
    JSON.stringify(alexV1Schedule),
    JSON.stringify([
      {
        id: 'tip-1',
        category: 'Post-Workout Fuel',
        headline: 'Optimize Anabolic Window with High-Leucine Protein',
        tip: 'Consume 30-40g of high-quality whey or complete protein within 60-90 minutes post-workout to trigger Muscle Protein Synthesis (MPS).',
        action_item: 'Add 1 scoop whey isolate + 1 medium banana post heavy lifts.',
        created_at: twoDaysAgo
      }
    ]),
    twoDaysAgo
  ]);

  // Insert Alex V2 (Current)
  db.run(`
    INSERT INTO plans (id, user_id, version, is_current, plan_name, summary, target_goal, intensity, feedback_applied, schedule_json, nutrition_tips_json, coach_notes, created_at)
    VALUES (2, 1, 2, 1, 'Hypertrophy 4-Day Split + Spine-Safe Core (Regenerated)', 'Updated schedule incorporating an extra mid-week rest day and swapping axial loading exercises with spine-spared core movements based on user feedback.', 'muscle gain', 'high', 'Include more rest days and emphasize core stability without lower back strain', ?, ?, 'V2 looks balanced! The chest-supported row and deadbugs should completely eliminate lower back irritation while keeping hypertrophy high.', ?);
  `, [
    JSON.stringify(alexV2Schedule),
    JSON.stringify([
      {
        id: 'tip-2',
        category: 'Muscle Recovery',
        headline: 'Creatine Monohydrate & Rest Day Saturation',
        tip: 'Take 5g of creatine monohydrate consistently every day, including rest days, to maintain intramuscular phosphocreatine reserves.',
        action_item: 'Mix 5g creatine with water or morning oats.',
        created_at: today
      },
      {
        id: 'tip-1',
        category: 'Post-Workout Fuel',
        headline: 'Optimize Anabolic Window with High-Leucine Protein',
        tip: 'Consume 30-40g of high-quality whey or complete protein within 60-90 minutes post-workout.',
        action_item: 'Add 1 scoop whey isolate + 1 medium banana post heavy lifts.',
        created_at: twoDaysAgo
      }
    ]),
    today
  ]);

  // User 2: Sarah Chen (Weight Loss, High Cardio)
  db.run(`
    INSERT INTO users (id, name, age, weight, weight_unit, fitness_goal, workout_intensity, experience_level, equipment, health_notes, created_at, updated_at)
    VALUES (2, 'Sarah Chen', 31, 63, 'kg', 'weight loss', 'medium', 'beginner', 'Dumbbells & Resistance Bands (Home Setup)', 'Previous mild runner knee', ?, ?);
  `, [oneDayAgo, today]);

  const sarahSchedule: DaySchedule[] = [
    {
      day_number: 1,
      day_name: 'Day 1 - Monday',
      title: 'Full Body Metabolic Resistance',
      is_rest_day: false,
      focus: 'Caloric Expenditure & Compound Toning',
      duration_minutes: 42,
      intensity: 'medium',
      warm_up: ['Arm sweeps 60s', 'Hip openers 10/side', 'March in place 2 mins'],
      exercises: [
        { name: 'Dumbbell Goblet Squats', sets: 3, reps: '15', rest: '45s', target_muscle: 'Quads & Glutes', notes: 'Keep weight on heels, push knees out' },
        { name: 'Standing Dumbbell Overhead Press', sets: 3, reps: '12', rest: '45s', target_muscle: 'Shoulders & Triceps', notes: 'Engage core, no back arch' },
        { name: 'Bent-Over Dumbbell Rows', sets: 3, reps: '15', rest: '45s', target_muscle: 'Back & Core', notes: 'Squeeze shoulder blades together' },
        { name: 'Low-Impact Step Jacks', sets: 3, reps: '45 seconds', rest: '30s', target_muscle: 'Cardiovascular Burn', notes: 'Quick rhythmic steps, protects knees' }
      ],
      cool_down: ['Hamstring toe touch 60s', 'Chest stretch on wall 60s'],
      calorie_estimate: 320
    },
    {
      day_number: 2,
      day_name: 'Day 2 - Tuesday',
      title: 'Low-Impact Cardio & Core Sculpt',
      is_rest_day: false,
      focus: 'Aerobic Burn & Abdominal Definition',
      duration_minutes: 38,
      intensity: 'medium',
      warm_up: ['Torso rotations 60s', 'Cat-cow 10 reps'],
      exercises: [
        { name: 'Brisk Incline Walking / Shadow Boxing', sets: 1, reps: '20 mins', rest: '0', target_muscle: 'Aerobic Base', notes: 'Keep heart rate in fat-burn zone 65-75% max' },
        { name: 'Bicycle Crunches (Controlled tempo)', sets: 3, reps: '16 total', rest: '45s', target_muscle: 'Obliques', notes: 'Do not pull on neck' },
        { name: 'Glute Bridges with Resistance Band', sets: 3, reps: '18', rest: '45s', target_muscle: 'Glutes', notes: 'Squeeze 2s at peak' },
        { name: 'Forearm Plank Hold', sets: 3, reps: '40 seconds', rest: '45s', target_muscle: 'Full Core', notes: 'Draw belly button to spine' }
      ],
      cool_down: ['Child pose 90s', 'Quadriceps stretch 60s/leg'],
      calorie_estimate: 290
    },
    {
      day_number: 3,
      day_name: 'Day 3 - Wednesday',
      title: 'Active Mobility & Rest',
      is_rest_day: true,
      focus: 'Recovery & Flexibility',
      duration_minutes: 20,
      intensity: 'low',
      warm_up: ['Deep diaphragmatic breaths 3 mins'],
      exercises: [
        { name: 'Gentle Vinyasa Yoga Flow', sets: 1, reps: '20 mins', rest: '0', target_muscle: 'Whole Body', notes: 'Focus on breathing and gentle joint mobilization' }
      ],
      cool_down: ['Corpse pose 3 mins'],
      calorie_estimate: 95
    },
    {
      day_number: 4,
      day_name: 'Day 4 - Thursday',
      title: 'Upper Body & Cardio Intervals',
      is_rest_day: false,
      focus: 'Arms, Back & Heart Rate Spikes',
      duration_minutes: 40,
      intensity: 'medium',
      warm_up: ['Shoulder rolls 60s', 'Walkouts 5 reps'],
      exercises: [
        { name: 'Push-ups on Knees or Incline', sets: 3, reps: '10-12', rest: '45s', target_muscle: 'Chest & Arms', notes: 'Elbows tucked at 45 degrees' },
        { name: 'Resistance Band Lat Pulldown', sets: 3, reps: '15', rest: '45s', target_muscle: 'Upper Back', notes: 'Anchor band high' },
        { name: 'Dumbbell Bicep Curl to Hammer Curl', sets: 3, reps: '12', rest: '45s', target_muscle: 'Biceps & Forearms', notes: 'Strict form' },
        { name: 'Speed Skater Taps (Knee Friendly)', sets: 3, reps: '45 seconds', rest: '45s', target_muscle: 'Glutes & Cardio', notes: 'Step without hard jumping' }
      ],
      cool_down: ['Triceps overhead stretch 60s/arm', 'Shoulder stretch 60s'],
      calorie_estimate: 310
    },
    {
      day_number: 5,
      day_name: 'Day 5 - Friday',
      title: 'Lower Body Toning & Balance',
      is_rest_day: false,
      focus: 'Hips, Hamstrings & Calves',
      duration_minutes: 40,
      intensity: 'medium',
      warm_up: ['Leg swings side to side 15/leg'],
      exercises: [
        { name: 'Dumbbell Romanian Deadlifts', sets: 3, reps: '12-15', rest: '60s', target_muscle: 'Hamstrings & Glutes', notes: 'Push hips backwards like closing a car door' },
        { name: 'Static Reverse Lunges (Alternating)', sets: 3, reps: '10/leg', rest: '45s', target_muscle: 'Quads & Glutes', notes: 'Step back to take impact off knee joint' },
        { name: 'Banded Monster Walks', sets: 3, reps: '15 steps each way', rest: '45s', target_muscle: 'Glute Medius', notes: 'Band around ankles or above knees' },
        { name: 'Standing Calf Raises', sets: 3, reps: '20', rest: '30s', target_muscle: 'Calves', notes: 'Full extension' }
      ],
      cool_down: ['Seated forward fold 90s', 'Butterfly stretch 60s'],
      calorie_estimate: 300
    },
    {
      day_number: 6,
      day_name: 'Day 6 - Saturday',
      title: 'Weekend Cardio Sweat & Core Blast',
      is_rest_day: false,
      focus: 'High Caloric Burn & Fun Movement',
      duration_minutes: 35,
      intensity: 'medium',
      warm_up: ['High knee marches 60s', 'Arm windmills 60s'],
      exercises: [
        { name: '25-Min Outdoor Power Walk or Jog Intervals', sets: 1, reps: '25 mins', rest: '0', target_muscle: 'Cardiorespiratory Endurance', notes: 'Alternating 2 min brisk walk, 1 min moderate jog' },
        { name: 'Deadbugs (Alternating)', sets: 3, reps: '12/side', rest: '30s', target_muscle: 'Deep Core', notes: 'Slow and controlled' },
        { name: 'Bird-Dogs', sets: 3, reps: '10/side', rest: '30s', target_muscle: 'Posterior chain stability', notes: 'Hold 2s at top' }
      ],
      cool_down: ['Full body stretch routine 5 mins'],
      calorie_estimate: 280
    },
    {
      day_number: 7,
      day_name: 'Day 7 - Sunday',
      title: 'Rest, Recovery & Hydration Reset',
      is_rest_day: true,
      focus: 'Full Rest & Weekly Prep',
      duration_minutes: 0,
      intensity: 'low',
      warm_up: [],
      exercises: [],
      cool_down: ['Relax and hydrate with 2.5L water'],
      calorie_estimate: 70
    }
  ];

  db.run(`
    INSERT INTO plans (id, user_id, version, is_current, plan_name, summary, target_goal, intensity, feedback_applied, schedule_json, nutrition_tips_json, coach_notes, created_at)
    VALUES (3, 2, 1, 1, 'Metabolic Calorie Burn & Knee-Safe Sculpt', 'Balanced 4-day resistance + low-impact cardio split formulated for steady fat loss and joint longevity.', 'weight loss', 'medium', NULL, ?, ?, 'Great consistency shown. Reminded Sarah to prioritize hydration and keep protein at 1.8g/kg.', ?);
  `, [
    JSON.stringify(sarahSchedule),
    JSON.stringify([
      {
        id: 'tip-101',
        category: 'Fat Loss Nutrition',
        headline: 'Maintain Caloric Deficit with High Satiety Foods',
        tip: 'Prioritize fiber-rich vegetables, leafy greens, and lean protein at every meal to stay full while in a moderate 300-500 kcal deficit.',
        action_item: 'Fill half your lunch and dinner plate with non-starchy vegetables before adding grains.',
        created_at: oneDayAgo
      }
    ]),
    oneDayAgo
  ]);

  persistDb();
  console.log("fitbuddy.db seeded successfully!");
}
