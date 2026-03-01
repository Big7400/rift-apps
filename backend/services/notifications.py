import os
import json
import requests
from datetime import datetime
from typing import Optional

FIREBASE_SERVER_KEY = os.environ.get("FIREBASE_SERVER_KEY", "")
FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send"

SELFCARE_MESSAGES = [
    ("Your puppy misses you! Time for a quick check-in 🐾", "selfcare-pup"),
    ("How are you feeling today? Your pup wants to know 🐶", "selfcare-pup"),
    ("{puppy_name} is waiting for you — don't leave them alone! 🐕", "selfcare-pup"),
]

FITFORGE_MESSAGES = [
    ("Time to train! Your FitForge workout is ready 💪", "fitforge"),
    ("Today is {day_name} — let's get it! 🔥", "fitforge"),
    ("Consistency builds champions. Your workout is waiting 🏋️", "fitforge"),
]


def send_fcm_push(token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Send a single push notification via Firebase Cloud Messaging."""
    if not FIREBASE_SERVER_KEY:
        print("[notifications] FIREBASE_SERVER_KEY not set — skipping push")
        return False

    payload = {
        "to": token,
        "notification": {
            "title": title,
            "body": body,
            "sound": "default",
            "badge": 1,
        },
        "data": data or {},
        "priority": "high"
    }

    headers = {
        "Authorization": f"key={FIREBASE_SERVER_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(FCM_ENDPOINT, headers=headers, json=payload, timeout=10)
        result = response.json()
        if result.get("failure", 0) > 0:
            print(f"[notifications] FCM failure: {result}")
            return False
        return True
    except Exception as e:
        print(f"[notifications] FCM error: {e}")
        return False


def send_expo_push(expo_token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Send push via Expo's push notification service (works for both iOS and Android in dev)."""
    payload = {
        "to": expo_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {},
        "badge": 1,
    }

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10
        )
        result = response.json()
        if result.get("data", {}).get("status") == "error":
            print(f"[notifications] Expo push error: {result}")
            return False
        return True
    except Exception as e:
        print(f"[notifications] Expo push error: {e}")
        return False


def send_daily_selfcare_reminder(tokens: list[dict], puppy_name: str = "your puppy") -> int:
    """Send daily check-in reminder to all SelfCare Pup users. Returns count sent."""
    sent = 0
    title = "SelfCare Pup"
    body = f"{puppy_name} is waiting for you — don't forget your daily check-in! 🐾"

    for token_row in tokens:
        expo_token = token_row.get("expo_push_token", "")
        if expo_token.startswith("ExponentPushToken"):
            ok = send_expo_push(expo_token, title, body, {"screen": "home"})
        else:
            ok = send_fcm_push(expo_token, title, body, {"screen": "home"})
        if ok:
            sent += 1

    return sent


def send_fitforge_workout_reminder(tokens: list[dict], day_name: str = "your workout") -> int:
    """Send workout reminder to FitForge users. Returns count sent."""
    sent = 0
    title = "FitForge"
    body = f"Time to train! {day_name} is ready for you 💪"

    for token_row in tokens:
        expo_token = token_row.get("expo_push_token", "")
        if expo_token.startswith("ExponentPushToken"):
            ok = send_expo_push(expo_token, title, body, {"screen": "plan"})
        else:
            ok = send_fcm_push(expo_token, title, body, {"screen": "plan"})
        if ok:
            sent += 1

    return sent
