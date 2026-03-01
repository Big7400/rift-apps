from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import date, datetime, timedelta
import os
from supabase import create_client, Client
from models.fitforge import (
    FitnessProfile, FitnessProfileOut,
    ExerciseOut, PRCreate, PROut,
    WorkoutLogCreate, WorkoutLogOut,
    WorkoutPlanOut, PlanGenerateRequest, ProgressOut
)
from services.ai_planner import generate_workout_plan, analyze_progress, epley_1rm

router = APIRouter(prefix="/fitforge", tags=["fitforge"])

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ["SUPABASE_KEY"])

def get_db() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ── PROFILE ───────────────────────────────────────────────────────────────────

@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    db = get_db()
    result = db.table("fitness_profiles").select("*").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


@router.post("/profile/{user_id}")
async def upsert_profile(user_id: str, data: FitnessProfile):
    db = get_db()
    profile = {
        "user_id": user_id,
        **data.model_dump(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    existing = db.table("fitness_profiles").select("id").eq("user_id", user_id).execute()
    if existing.data:
        result = db.table("fitness_profiles").update(profile).eq("user_id", user_id).execute()
    else:
        result = db.table("fitness_profiles").insert(profile).execute()
    return result.data[0]


# ── EXERCISE LIBRARY ──────────────────────────────────────────────────────────

@router.get("/exercises")
async def get_exercises(category: Optional[str] = None, equipment: Optional[str] = None, search: Optional[str] = None):
    db = get_db()
    query = db.table("exercises").select("*")
    if category:
        query = query.eq("category", category)
    if search:
        query = query.ilike("name", f"%{search}%")
    result = query.limit(100).execute()
    return {"exercises": result.data, "total": len(result.data)}


# ── PERSONAL RECORDS ──────────────────────────────────────────────────────────

@router.post("/pr/{user_id}", response_model=PROut)
async def log_pr(user_id: str, data: PRCreate):
    db = get_db()
    one_rep_max = epley_1rm(data.weight_kg, data.reps)

    # Check if this is a new PR for this exercise
    previous_best = db.table("personal_records").select("one_rep_max").eq("user_id", user_id).eq("exercise_id", data.exercise_id).order("one_rep_max", desc=True).limit(1).execute()

    is_pr = True
    if previous_best.data:
        is_pr = one_rep_max > previous_best.data[0]["one_rep_max"]

    record = {
        "user_id": user_id,
        "exercise_id": data.exercise_id,
        "exercise_name": data.exercise_name,
        "weight_kg": data.weight_kg,
        "reps": data.reps,
        "one_rep_max": one_rep_max,
        "is_pr": is_pr,
        "notes": data.notes,
        "recorded_at": datetime.utcnow().isoformat(),
    }
    result = db.table("personal_records").insert(record).execute()
    return result.data[0]


@router.get("/prs/{user_id}")
async def get_all_prs(user_id: str):
    """Get the best PR for every exercise this user has logged."""
    db = get_db()
    result = db.table("personal_records").select("*").eq("user_id", user_id).order("recorded_at", desc=True).execute()

    # Group by exercise, keep best 1RM
    best: dict = {}
    for row in result.data:
        eid = row["exercise_id"]
        if eid not in best or row["one_rep_max"] > best[eid]["one_rep_max"]:
            best[eid] = row

    return {"records": list(best.values())}


@router.get("/prs/{user_id}/{exercise_id}")
async def get_exercise_prs(user_id: str, exercise_id: str):
    """Get full PR history for a single exercise."""
    db = get_db()
    result = db.table("personal_records").select("*").eq("user_id", user_id).eq("exercise_id", exercise_id).order("recorded_at").execute()
    return {"records": result.data}


# ── WORKOUT PLAN (AI GENERATED) ───────────────────────────────────────────────

@router.post("/plan/generate")
async def generate_plan(data: PlanGenerateRequest):
    db = get_db()

    # Get user profile
    profile_result = db.table("fitness_profiles").select("*").eq("user_id", data.user_id).execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Fitness profile not found. Complete onboarding first.")

    profile_data = profile_result.data[0]
    profile = FitnessProfile(**{k: profile_data[k] for k in FitnessProfile.model_fields if k in profile_data})

    # Get existing PRs
    prs_result = db.table("personal_records").select("*").eq("user_id", data.user_id).order("one_rep_max", desc=True).limit(20).execute()
    prs = prs_result.data or []

    # Call Claude
    plan_json = await generate_workout_plan(profile, prs)

    # Deactivate existing plans
    db.table("workout_plans").update({"is_active": False}).eq("user_id", data.user_id).execute()

    # Save new plan
    plan_record = {
        "user_id": data.user_id,
        "name": plan_json.get("plan_name", "Custom Plan"),
        "generated_by_ai": True,
        "days_per_week": plan_json.get("days_per_week", profile.days_per_week),
        "plan_json": plan_json,
        "is_active": True,
    }
    result = db.table("workout_plans").insert(plan_record).execute()
    return result.data[0]


@router.get("/plan/{user_id}")
async def get_active_plan(user_id: str):
    db = get_db()
    result = db.table("workout_plans").select("*").eq("user_id", user_id).eq("is_active", True).order("created_at", desc=True).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No active workout plan. Generate one first.")
    return result.data[0]


# ── WORKOUT LOG ───────────────────────────────────────────────────────────────

@router.post("/log/{user_id}", response_model=WorkoutLogOut)
async def log_workout(user_id: str, data: WorkoutLogCreate):
    db = get_db()
    log = {
        "user_id": user_id,
        "plan_id": data.plan_id,
        "day_name": data.day_name,
        "exercises": [e.model_dump() for e in data.exercises],
        "duration_minutes": data.duration_minutes,
        "notes": data.notes,
        "date": str(data.date or date.today()),
    }
    result = db.table("workout_logs").insert(log).execute()
    return result.data[0]


@router.get("/logs/{user_id}")
async def get_workout_logs(user_id: str, limit: int = 20):
    db = get_db()
    result = db.table("workout_logs").select("*").eq("user_id", user_id).order("date", desc=True).limit(limit).execute()
    return {"logs": result.data}


# ── PROGRESS ANALYTICS ────────────────────────────────────────────────────────

@router.get("/progress/{user_id}")
async def get_progress(user_id: str):
    db = get_db()

    logs = db.table("workout_logs").select("*").eq("user_id", user_id).order("date", desc=True).limit(50).execute()
    prs = db.table("personal_records").select("*").eq("user_id", user_id).order("one_rep_max", desc=True).limit(10).execute()

    # Volume per day
    volume_history = []
    for log in logs.data:
        volume = 0
        for ex in (log.get("exercises") or []):
            for s in (ex.get("sets") or []):
                volume += s.get("weight_kg", 0) * s.get("reps", 0)
        volume_history.append({"date": log["date"], "volume_kg": round(volume, 1)})

    this_week = [l for l in logs.data if l["date"] >= str(date.today() - timedelta(days=7))]

    # AI progress analysis
    analysis = await analyze_progress(logs.data[:5], prs.data[:5])

    return {
        "total_workouts": len(logs.data),
        "this_week_workouts": len(this_week),
        "pr_count": len(prs.data),
        "top_prs": prs.data[:5],
        "volume_history": volume_history,
        "ai_analysis": analysis,
    }
