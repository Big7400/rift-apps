from pydantic import BaseModel
from typing import Optional, List
from datetime import date as date_type, datetime


class FitnessProfile(BaseModel):
    fitness_level: str  # beginner | intermediate | advanced
    goals: List[str]    # lose_fat | build_muscle | strength | endurance | general
    equipment: List[str]  # gym | barbell | dumbbells | bodyweight | bands | cables
    days_per_week: int  # 2-6
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    preferred_workout_time: Optional[str] = None  # HH:MM in 24h


class FitnessProfileOut(FitnessProfile):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class ExerciseOut(BaseModel):
    id: str
    name: str
    category: str  # chest | back | shoulders | arms | legs | core | cardio
    equipment: List[str]
    muscle_groups: List[str]
    instructions: str
    video_url: Optional[str] = None


class PRCreate(BaseModel):
    exercise_id: str
    exercise_name: str  # stored denormalized for quick display
    weight_kg: float
    reps: int
    notes: Optional[str] = None


class PROut(BaseModel):
    id: str
    user_id: str
    exercise_id: str
    exercise_name: str
    weight_kg: float
    reps: int
    one_rep_max: float  # Epley: weight * (1 + reps/30)
    is_pr: bool         # True if this is a new personal record
    notes: Optional[str]
    recorded_at: datetime


class SetLog(BaseModel):
    set_number: int
    weight_kg: float
    reps: int
    rpe: Optional[float] = None  # Rate of Perceived Exertion 1-10


class ExerciseSessionLog(BaseModel):
    exercise_id: str
    exercise_name: str
    sets: List[SetLog]


class WorkoutLogCreate(BaseModel):
    plan_id: Optional[str] = None
    day_name: Optional[str] = None  # e.g. "Push Day A"
    exercises: List[ExerciseSessionLog]
    duration_minutes: int
    notes: Optional[str] = None
    date: Optional[date_type] = None


class WorkoutLogOut(WorkoutLogCreate):
    id: str
    user_id: str
    created_at: datetime


class WorkoutPlanOut(BaseModel):
    id: str
    user_id: str
    name: str
    generated_by_ai: bool
    days_per_week: int
    plan_json: dict   # {days: [{name, exercises: [{id, name, sets, reps, rest_sec}]}]}
    created_at: datetime
    is_active: bool


class PlanGenerateRequest(BaseModel):
    user_id: str


class ProgressOut(BaseModel):
    total_workouts: int
    total_volume_kg: float
    this_week_workouts: int
    pr_count: int
    top_prs: List[PROut]
    volume_history: List[dict]   # [{date, volume_kg}]
    recent_workouts: List[dict]
