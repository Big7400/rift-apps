from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class PuppyCreate(BaseModel):
    name: str
    breed: str  # corgi | labrador | husky | poodle | dalmatian
    color: str
    pronouns: Optional[str] = "they/them"


class PuppyUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    accessories: Optional[List[str]] = None
    background: Optional[str] = None


class PuppyOut(BaseModel):
    id: str
    user_id: str
    name: str
    breed: str
    color: str
    accessories: List[str]
    background: Optional[str]
    level: int
    xp: int
    xp_to_next_level: int
    created_at: datetime


class CheckInCreate(BaseModel):
    mood_score: int  # 1-10
    note: Optional[str] = None
    date: Optional[date] = None


class CheckInOut(BaseModel):
    id: str
    user_id: str
    date: date
    mood_score: int
    note: Optional[str]
    created_at: datetime


class GoalCreate(BaseModel):
    title: str
    category: str  # health | social | mindfulness | productivity | creativity
    is_custom: bool = True


class GoalOut(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    is_custom: bool
    is_active: bool
    xp_reward: int
    created_at: datetime


class GoalCompletion(BaseModel):
    id: str
    user_id: str
    goal_id: str
    goal_title: str
    date: date
    xp_earned: int


class ActivityLog(BaseModel):
    activity_type: str  # breathing | journal | quiz | timer | soundscape
    duration_seconds: int
    note: Optional[str] = None


class FriendRequest(BaseModel):
    friend_email: str


class InsightsOut(BaseModel):
    streak_days: int
    total_goals_completed: int
    mood_average_7d: float
    mood_history: List[dict]  # [{date, score}]
    top_categories: List[dict]  # [{category, count}]
    level_progress: dict  # {level, xp, xp_to_next}
