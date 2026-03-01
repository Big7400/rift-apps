import os
import json
from anthropic import Anthropic
from models.fitforge import FitnessProfile, PROut

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


PLAN_SYSTEM_PROMPT = """You are FitForge AI, an expert personal trainer and strength & conditioning coach.
You create personalized, progressive workout plans based on user profiles and current performance levels.
Always respond with valid JSON only — no markdown, no explanation, just the JSON object.
"""


def epley_1rm(weight: float, reps: int) -> float:
    """Estimate one-rep max using Epley formula."""
    if reps == 1:
        return weight
    return round(weight * (1 + reps / 30), 1)


def build_plan_prompt(profile: FitnessProfile, prs: list[dict]) -> str:
    equipment_str = ", ".join(profile.equipment) if profile.equipment else "bodyweight only"
    goals_str = ", ".join(profile.goals) if profile.goals else "general fitness"

    pr_section = ""
    if prs:
        pr_lines = [
            f"  - {pr['exercise_name']}: {pr['weight_kg']}kg x {pr['reps']} reps (est. 1RM: {pr['one_rep_max']}kg)"
            for pr in prs[:15]
        ]
        pr_section = "Current Personal Records:\n" + "\n".join(pr_lines)
    else:
        pr_section = "No existing personal records — this is a beginner starting from scratch."

    age_info = f"Age: {profile.age}" if profile.age else ""
    weight_info = f"Bodyweight: {profile.weight_kg}kg" if profile.weight_kg else ""

    return f"""Create a {profile.days_per_week}-day per week workout plan for this athlete.

Athlete Profile:
- Fitness Level: {profile.fitness_level}
- Goals: {goals_str}
- Available Equipment: {equipment_str}
- Days per week: {profile.days_per_week}
{age_info}
{weight_info}

{pr_section}

Return a JSON object with this exact structure:
{{
  "plan_name": "string — short catchy name for this program",
  "description": "string — 1-2 sentence program overview",
  "duration_weeks": 8,
  "days_per_week": {profile.days_per_week},
  "days": [
    {{
      "day_number": 1,
      "name": "string — e.g. Push Day A, Upper Body, Full Body",
      "focus": "string — primary muscle groups",
      "exercises": [
        {{
          "name": "string — exercise name",
          "category": "string — chest|back|shoulders|arms|legs|core|cardio",
          "sets": 3,
          "reps": "string — e.g. '8-10' or '5' or 'AMRAP'",
          "rest_seconds": 90,
          "notes": "string — form tips or progression notes",
          "weight_suggestion": "string — e.g. '70% of 1RM' or 'moderate weight' or 'bodyweight'"
        }}
      ]
    }}
  ],
  "progression_notes": "string — how to progress week over week",
  "deload_week": "string — when and how to deload"
}}

Make the plan realistic, progressive, and appropriate for the athlete's level and goals.
Include {profile.days_per_week} training days. Use compound movements as primary lifts.
"""


async def generate_workout_plan(profile: FitnessProfile, prs: list[dict]) -> dict:
    """Call Claude to generate a personalized workout plan."""
    prompt = build_plan_prompt(profile, prs)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        system=PLAN_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    # Strip markdown code blocks if Claude wraps in them
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])

    plan = json.loads(raw)
    return plan


async def analyze_progress(workout_logs: list[dict], prs: list[dict]) -> dict:
    """Use Claude to analyze training progress and suggest plan adjustments."""
    if not workout_logs:
        return {"message": "Not enough data yet — complete a few workouts first!", "suggestions": []}

    summary = {
        "workout_count": len(workout_logs),
        "recent_prs": prs[:5],
        "recent_workouts": workout_logs[-5:]
    }

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Analyze this athlete's recent training data and provide brief, actionable insights.

Training Data: {json.dumps(summary, indent=2)}

Return JSON: {{"message": "brief 1-2 sentence summary", "suggestions": ["tip1", "tip2", "tip3"]}}
Return JSON only."""
        }]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])

    return json.loads(raw)
