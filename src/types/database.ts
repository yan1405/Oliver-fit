export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Required extends keyof Row> = {
  Row: Row
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>
  Update: Partial<Row>
  Relationships: []
}

type Profile = {
  id: string
  display_name: string | null
  height_cm: number | null
  birth_date: string | null
  sex: 'male' | 'female' | 'other' | null
  initial_weight_kg: number | null
  goal_weight_kg: number | null
  daily_calorie_goal: number | null
  daily_protein_goal_g: number | null
  daily_carb_goal_g: number | null
  daily_fat_goal_g: number | null
  timezone: string
  created_at: string
  updated_at: string
}

type Exercise = {
  id: string
  user_id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  notes: string | null
  created_at: string
}

type WorkoutPlan = {
  id: string
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

type WorkoutPlanExercise = {
  id: string
  plan_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps: number | null
  target_load_kg: number | null
  rest_seconds: number | null
}

type WorkoutSchedule = {
  id: string
  user_id: string
  plan_id: string
  weekday: number
}

type WorkoutSession = {
  id: string
  user_id: string
  plan_id: string | null
  session_date: string
  started_at: string | null
  completed_at: string | null
  status: 'in_progress' | 'completed' | 'skipped'
}

type SetLog = {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  reps: number | null
  load_kg: number | null
  rest_seconds: number | null
  completed_at: string
}

type Meal = {
  id: string
  user_id: string
  meal_date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  quantity: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  logged_at: string
}

type Measurement = {
  id: string
  user_id: string
  measured_at: string
  weight_kg: number | null
  waist_cm: number | null
  arm_cm: number | null
  chest_cm: number | null
  hip_cm: number | null
  thigh_cm: number | null
  notes: string | null
}

type ProgressPhoto = {
  id: string
  user_id: string
  taken_at: string
  storage_path: string
  angle: 'front' | 'side' | 'back' | null
  created_at: string
}

type TrailDay = {
  id: string
  user_id: string
  trail_date: string
  workout_completed: boolean
  diet_completed: boolean
  day_completed: boolean
  completed_at: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, 'id'>
      exercises: Table<Exercise, 'user_id' | 'name'>
      workout_plans: Table<WorkoutPlan, 'user_id' | 'name'>
      workout_plan_exercises: Table<WorkoutPlanExercise, 'plan_id' | 'exercise_id'>
      workout_schedule: Table<WorkoutSchedule, 'user_id' | 'plan_id' | 'weekday'>
      workout_sessions: Table<WorkoutSession, 'user_id' | 'session_date'>
      set_logs: Table<SetLog, 'session_id' | 'exercise_id' | 'set_number'>
      meals: Table<Meal, 'user_id' | 'meal_date' | 'meal_type' | 'name' | 'calories'>
      measurements: Table<Measurement, 'user_id' | 'measured_at'>
      progress_photos: Table<ProgressPhoto, 'user_id' | 'taken_at' | 'storage_path'>
      trail_days: Table<TrailDay, 'user_id' | 'trail_date'>
    }
    Views: {
      v_daily_nutrition_status: {
        Row: {
          user_id: string | null
          meal_date: string | null
          meals_logged: number | null
          total_calories: number | null
          daily_calorie_goal: number | null
          pct_of_calorie_goal: number | null
          diet_completed: boolean | null
        }
        Relationships: []
      }
      v_current_streak: {
        Row: { user_id: string | null; current_streak: number | null }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
