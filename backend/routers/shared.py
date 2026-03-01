from fastapi import APIRouter, HTTPException
import os
from supabase import create_client
from models.shared import PushTokenRegister, NotificationSchedule, HealthResponse
from services.notifications import send_expo_push, send_daily_selfcare_reminder, send_fitforge_workout_reminder

router = APIRouter(tags=["shared"])

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ["SUPABASE_KEY"])

def get_db():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(environment=os.environ.get("ENVIRONMENT", "production"))


@router.post("/notify/register")
async def register_push_token(data: PushTokenRegister):
    db = get_db()
    existing = db.table("push_tokens").select("id").eq("user_id", data.user_id).eq("app", data.app).execute()
    token_row = {
        "user_id": data.user_id,
        "expo_push_token": data.expo_push_token,
        "platform": data.platform,
        "app": data.app,
    }
    if existing.data:
        db.table("push_tokens").update(token_row).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("push_tokens").insert(token_row).execute()
    return {"registered": True}


@router.post("/notify/test/{user_id}")
async def test_notification(user_id: str, app: str = "selfcare-pup"):
    db = get_db()
    token = db.table("push_tokens").select("expo_push_token").eq("user_id", user_id).eq("app", app).execute()
    if not token.data:
        raise HTTPException(status_code=404, detail="No push token registered")

    expo_token = token.data[0]["expo_push_token"]
    if app == "selfcare-pup":
        ok = send_expo_push(expo_token, "SelfCare Pup", "Test notification from your puppy! 🐾")
    else:
        ok = send_expo_push(expo_token, "FitForge", "Test notification! Time to crush it 💪")

    return {"sent": ok}
