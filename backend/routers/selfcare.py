from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import date, datetime, timedelta
import os
from supabase import create_client, Client
from models.selfcare import (
    PuppyCreate, PuppyUpdate, PuppyOut,
    CheckInCreate, CheckInOut,
    GoalCreate, GoalOut, GoalCompletion,
    ActivityLog, FriendRequest, InsightsOut
)

router = APIRouter(prefix="/selfcare", tags=["selfcare"])

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ["SUPABASE_KEY"])

def get_db() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


XP_PER_GOAL = 25
XP_PER_ACTIVITY = 15
XP_PER_CHECKIN = 10

def xp_for_level(level: int) -> int:
    """XP needed to reach the next level."""
    return 100 + (level - 1) * 50


def compute_level(total_xp: int) -> tuple[int, int, int]:
    """Returns (level, xp_in_current_level, xp_to_next_level)."""
    level = 1
    remaining = total_xp
    while True:
        needed = xp_for_level(level)
        if remaining < needed:
            return level, remaining, needed
        remaining -= needed
        level += 1


# ── DEFAULT GOALS ──────────────────────────────────────────────────────────────
DEFAULT_GOALS = [
    {"title": "Get out of bed", "category": "health", "xp_reward": 15},
    {"title": "Drink 8 glasses of water", "category": "health", "xp_reward": 20},
    {"title": "Eat a nutritious meal", "category": "health", "xp_reward": 20},
    {"title": "Get 7-8 hours of sleep", "category": "health", "xp_reward": 25},
    {"title": "Take a shower", "category": "health", "xp_reward": 15},
    {"title": "Go for a walk outside", "category": "health", "xp_reward": 25},
    {"title": "Take medication / vitamins", "category": "health", "xp_reward": 20},
    {"title": "Brush teeth twice", "category": "health", "xp_reward": 10},
    {"title": "Do 10 minutes of stretching", "category": "health", "xp_reward": 20},
    {"title": "Text a friend", "category": "social", "xp_reward": 20},
    {"title": "Call a family member", "category": "social", "xp_reward": 25},
    {"title": "Do something kind for someone", "category": "social", "xp_reward": 25},
    {"title": "Spend time with a pet", "category": "social", "xp_reward": 20},
    {"title": "10-minute meditation", "category": "mindfulness", "xp_reward": 25},
    {"title": "Write 3 things you're grateful for", "category": "mindfulness", "xp_reward": 20},
    {"title": "Journal for 5 minutes", "category": "mindfulness", "xp_reward": 20},
    {"title": "5-minute breathing exercise", "category": "mindfulness", "xp_reward": 15},
    {"title": "Read for 20 minutes", "category": "productivity", "xp_reward": 20},
    {"title": "Complete one task you've been avoiding", "category": "productivity", "xp_reward": 30},
    {"title": "Clean your space for 10 minutes", "category": "productivity", "xp_reward": 20},
    {"title": "Draw or doodle for 10 minutes", "category": "creativity", "xp_reward": 20},
    {"title": "Listen to an album you love", "category": "creativity", "xp_reward": 15},
    {"title": "Cook a meal from scratch", "category": "creativity", "xp_reward": 30},
]


# ── PUPPY ROUTES ───────────────────────────────────────────────────────────────

@router.post("/puppy/{user_id}", response_model=PuppyOut)
async def create_puppy(user_id: str, data: PuppyCreate):
    db = get_db()
    existing = db.table("puppies").select("*").eq("user_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Puppy already exists for this user")

    puppy = {
        "user_id": user_id,
        "name": data.name,
        "breed": data.breed,
        "color": data.color,
        "pronouns": data.pronouns,
        "accessories": [],
        "background": "meadow",
        "level": 1,
        "xp": 0,
    }
    result = db.table("puppies").insert(puppy).execute()
    row = result.data[0]

    # Seed default goals for this user
    goals = [
        {"user_id": user_id, "title": g["title"], "category": g["category"],
         "is_custom": False, "is_active": True, "xp_reward": g["xp_reward"]}
        for g in DEFAULT_GOALS[:8]  # Start with 8 default goals
    ]
    db.table("goals").insert(goals).execute()

    level, xp_in, xp_to = compute_level(row["xp"])
    return {**row, "xp_to_next_level": xp_to}


@router.get("/puppy/{user_id}", response_model=PuppyOut)
async def get_puppy(user_id: str):
    db = get_db()
    result = db.table("puppies").select("*").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No puppy found")
    row = result.data[0]
    level, xp_in, xp_to = compute_level(row["xp"])
    return {**row, "xp_to_next_level": xp_to}


@router.patch("/puppy/{user_id}/customize", response_model=PuppyOut)
async def customize_puppy(user_id: str, data: PuppyUpdate):
    db = get_db()
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    result = db.table("puppies").update(updates).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Puppy not found")
    row = result.data[0]
    level, xp_in, xp_to = compute_level(row["xp"])
    return {**row, "xp_to_next_level": xp_to}


# ── CHECK-IN ROUTES ────────────────────────────────────────────────────────────

@router.post("/checkin/{user_id}", response_model=CheckInOut)
async def daily_checkin(user_id: str, data: CheckInCreate):
    db = get_db()
    today = str(data.date or date.today())

    # Prevent duplicate check-in for same day
    existing = db.table("daily_checkins").select("id").eq("user_id", user_id).eq("date", today).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Already checked in today")

    checkin = {
        "user_id": user_id,
        "date": today,
        "mood_score": data.mood_score,
        "note": data.note,
    }
    result = db.table("daily_checkins").insert(checkin).execute()

    # Award XP for checking in
    puppy = db.table("puppies").select("xp").eq("user_id", user_id).execute()
    if puppy.data:
        new_xp = puppy.data[0]["xp"] + XP_PER_CHECKIN
        level, xp_in, xp_to = compute_level(new_xp)
        db.table("puppies").update({"xp": new_xp, "level": level}).eq("user_id", user_id).execute()

    return result.data[0]


@router.get("/checkin/{user_id}/today")
async def get_todays_checkin(user_id: str):
    db = get_db()
    today = str(date.today())
    result = db.table("daily_checkins").select("*").eq("user_id", user_id).eq("date", today).execute()
    return {"checked_in": bool(result.data), "data": result.data[0] if result.data else None}


# ── GOALS ROUTES ───────────────────────────────────────────────────────────────

@router.get("/goals/{user_id}")
async def get_goals(user_id: str, date_str: Optional[str] = None):
    db = get_db()
    today = date_str or str(date.today())
    goals = db.table("goals").select("*").eq("user_id", user_id).eq("is_active", True).execute()

    completed_today = db.table("goal_completions").select("goal_id").eq("user_id", user_id).eq("date", today).execute()
    completed_ids = {r["goal_id"] for r in completed_today.data}

    return {
        "goals": goals.data,
        "completed_today": list(completed_ids),
        "date": today,
    }


@router.post("/goals/{user_id}")
async def create_goal(user_id: str, data: GoalCreate):
    db = get_db()
    goal = {
        "user_id": user_id,
        "title": data.title,
        "category": data.category,
        "is_custom": data.is_custom,
        "is_active": True,
        "xp_reward": XP_PER_GOAL,
    }
    result = db.table("goals").insert(goal).execute()
    return result.data[0]


@router.post("/goals/{user_id}/complete/{goal_id}")
async def complete_goal(user_id: str, goal_id: str):
    db = get_db()
    today = str(date.today())

    # Check not already completed today
    existing = db.table("goal_completions").select("id").eq("user_id", user_id).eq("goal_id", goal_id).eq("date", today).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Goal already completed today")

    goal = db.table("goals").select("title,xp_reward").eq("id", goal_id).execute()
    if not goal.data:
        raise HTTPException(status_code=404, detail="Goal not found")

    xp_earned = goal.data[0].get("xp_reward", XP_PER_GOAL)

    db.table("goal_completions").insert({
        "user_id": user_id,
        "goal_id": goal_id,
        "date": today,
        "xp_earned": xp_earned,
    }).execute()

    puppy = db.table("puppies").select("xp").eq("user_id", user_id).execute()
    if puppy.data:
        new_xp = puppy.data[0]["xp"] + xp_earned
        level, xp_in, xp_to = compute_level(new_xp)
        db.table("puppies").update({"xp": new_xp, "level": level}).eq("user_id", user_id).execute()
        return {"xp_earned": xp_earned, "new_total_xp": new_xp, "level": level, "xp_to_next": xp_to}

    return {"xp_earned": xp_earned}


@router.delete("/goals/{user_id}/{goal_id}")
async def delete_goal(user_id: str, goal_id: str):
    db = get_db()
    db.table("goals").update({"is_active": False}).eq("id", goal_id).eq("user_id", user_id).execute()
    return {"deleted": True}


# ── ACTIVITIES ────────────────────────────────────────────────────────────────

@router.post("/activity/{user_id}")
async def log_activity(user_id: str, data: ActivityLog):
    db = get_db()
    activity = {
        "user_id": user_id,
        "type": data.activity_type,
        "duration": data.duration_seconds,
        "xp_earned": XP_PER_ACTIVITY,
        "note": data.note,
    }
    db.table("activities").insert(activity).execute()

    # Award XP
    puppy = db.table("puppies").select("xp").eq("user_id", user_id).execute()
    if puppy.data:
        new_xp = puppy.data[0]["xp"] + XP_PER_ACTIVITY
        level, xp_in, xp_to = compute_level(new_xp)
        db.table("puppies").update({"xp": new_xp, "level": level}).eq("user_id", user_id).execute()
        return {"xp_earned": XP_PER_ACTIVITY, "new_total_xp": new_xp, "level": level}

    return {"xp_earned": XP_PER_ACTIVITY}


# ── INSIGHTS ───────────────────────────────────────────────────────────────────

@router.get("/insights/{user_id}", response_model=InsightsOut)
async def get_insights(user_id: str):
    db = get_db()

    puppy = db.table("puppies").select("xp,level").eq("user_id", user_id).execute()
    level_data = {}
    if puppy.data:
        xp = puppy.data[0]["xp"]
        lvl, xp_in, xp_to = compute_level(xp)
        level_data = {"level": lvl, "xp": xp_in, "xp_to_next": xp_to}

    # Mood history last 14 days
    since = str(date.today() - timedelta(days=13))
    moods = db.table("daily_checkins").select("date,mood_score").eq("user_id", user_id).gte("date", since).order("date").execute()
    mood_history = [{"date": r["date"], "score": r["mood_score"]} for r in moods.data]
    mood_avg = sum(r["mood_score"] for r in moods.data) / len(moods.data) if moods.data else 0.0

    # Streak
    checkin_dates = sorted(set(r["date"] for r in moods.data), reverse=True)
    streak = 0
    check = date.today()
    for d in checkin_dates:
        if str(check) == d:
            streak += 1
            check -= timedelta(days=1)
        else:
            break

    # Goal completions
    completions = db.table("goal_completions").select("goal_id").eq("user_id", user_id).execute()

    return InsightsOut(
        streak_days=streak,
        total_goals_completed=len(completions.data),
        mood_average_7d=round(mood_avg, 1),
        mood_history=mood_history,
        top_categories=[],
        level_progress=level_data,
    )


# ── FRIENDS / DOG PARK ────────────────────────────────────────────────────────

@router.post("/friends/{user_id}/add")
async def add_friend(user_id: str, data: FriendRequest):
    db = get_db()
    friend = db.table("users").select("id").eq("email", data.friend_email).execute()
    if not friend.data:
        raise HTTPException(status_code=404, detail="User not found with that email")

    friend_id = friend.data[0]["id"]
    if friend_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    existing = db.table("friends").select("id").or_(
        f"and(user_id.eq.{user_id},friend_id.eq.{friend_id}),and(user_id.eq.{friend_id},friend_id.eq.{user_id})"
    ).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Friend request already sent or friends")

    db.table("friends").insert({"user_id": user_id, "friend_id": friend_id, "status": "pending"}).execute()
    return {"message": "Friend request sent"}


@router.get("/friends/{user_id}")
async def get_friends(user_id: str):
    db = get_db()
    friends = db.table("friends").select("*").or_(
        f"user_id.eq.{user_id},friend_id.eq.{user_id}"
    ).eq("status", "accepted").execute()

    friend_ids = [
        r["friend_id"] if r["user_id"] == user_id else r["user_id"]
        for r in friends.data
    ]

    result = []
    for fid in friend_ids:
        puppy = db.table("puppies").select("name,breed,color,level,xp").eq("user_id", fid).execute()
        user = db.table("users").select("display_name").eq("id", fid).execute()
        if puppy.data and user.data:
            result.append({
                "user_id": fid,
                "display_name": user.data[0]["display_name"],
                "puppy": puppy.data[0],
            })

    return {"friends": result}
