from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PushTokenRegister(BaseModel):
    user_id: str
    expo_push_token: str
    platform: str  # ios | android
    app: str  # selfcare-pup | fitforge


class NotificationSchedule(BaseModel):
    user_id: str
    app: str
    time_local: str  # HH:MM
    timezone: str
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    environment: str
