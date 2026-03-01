import json
import logging
import os
from collections import Counter

from anthropic import Anthropic

from models.fitforge import FitnessProfile

logger = logging.getLogger(__name__)

_anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
client = Anthropic(api_key=_anthropic_key) if _anthropic_key else None


PLAN_SYSTEM_PROMPT = """You are FitForge AI, an expert personal trainer and strength & conditioning coach.
You create personalized, progressive workout plans based on user profiles and current performance levels.
Always respond with valid JSON only - no markdown, no explanation, just the JSON object.
"""


GOAL_LABELS = {
    "build_muscle": "hypertrophy",
    "strength": "strength",
    "lose_fat": "recomposition",
    "endurance": "conditioning",
    "general": "general fitness",
}

GOAL_PRIORITY = ["build_muscle", "strength", "lose_fat", "endurance", "general"]

SPLIT_TEMPLATES = {
    2: [
        {"name": "Full Body A", "focus": "legs, chest, and back", "patterns": ["squat", "h_push", "h_pull", "hinge", "core"]},
        {"name": "Full Body B", "focus": "posterior chain, shoulders, and conditioning", "patterns": ["single_leg", "v_push", "v_pull", "glute", "conditioning"]},
    ],
    3: [
        {"name": "Full Body A", "focus": "squat strength and push work", "patterns": ["squat", "h_push", "h_pull", "core", "arms"]},
        {"name": "Full Body B", "focus": "hinge strength and upper back", "patterns": ["hinge", "v_push", "v_pull", "single_leg", "core"]},
        {"name": "Full Body C", "focus": "hypertrophy volume and conditioning", "patterns": ["glute", "incline_push", "row", "arms", "conditioning"]},
    ],
    4: [
        {"name": "Upper A", "focus": "chest, back, and shoulders", "patterns": ["h_push", "h_pull", "v_push", "v_pull", "arms"]},
        {"name": "Lower A", "focus": "squat pattern and core", "patterns": ["squat", "hinge", "single_leg", "calves", "core"]},
        {"name": "Upper B", "focus": "upper hypertrophy and posture", "patterns": ["incline_push", "row", "rear_delts", "arms", "core"]},
        {"name": "Lower B", "focus": "posterior chain and conditioning", "patterns": ["hinge", "glute", "single_leg", "conditioning", "core"]},
    ],
    5: [
        {"name": "Push", "focus": "chest, shoulders, and triceps", "patterns": ["h_push", "incline_push", "v_push", "lateral_raise", "triceps"]},
        {"name": "Pull", "focus": "back and biceps", "patterns": ["v_pull", "row", "h_pull", "rear_delts", "biceps"]},
        {"name": "Legs", "focus": "quads, glutes, and hamstrings", "patterns": ["squat", "hinge", "single_leg", "glute", "calves"]},
        {"name": "Upper", "focus": "upper-body strength", "patterns": ["h_push", "v_pull", "v_push", "row", "arms"]},
        {"name": "Lower + Conditioning", "focus": "lower-body volume and conditioning", "patterns": ["hinge", "single_leg", "glute", "conditioning", "core"]},
    ],
    6: [
        {"name": "Push A", "focus": "heavy chest and shoulders", "patterns": ["h_push", "incline_push", "v_push", "lateral_raise", "triceps"]},
        {"name": "Pull A", "focus": "heavy back work", "patterns": ["v_pull", "row", "h_pull", "rear_delts", "biceps"]},
        {"name": "Legs A", "focus": "squat emphasis", "patterns": ["squat", "hinge", "single_leg", "calves", "core"]},
        {"name": "Push B", "focus": "upper-body hypertrophy", "patterns": ["incline_push", "h_push", "v_push", "lateral_raise", "triceps"]},
        {"name": "Pull B", "focus": "lat width and arm finishers", "patterns": ["v_pull", "row", "rear_delts", "biceps", "conditioning"]},
        {"name": "Legs B", "focus": "posterior chain and athleticism", "patterns": ["hinge", "glute", "single_leg", "conditioning", "core"]},
    ],
}

EXERCISE_CHOICES = {
    "squat": {
        "category": "legs",
        "names": {"gym": "Barbell Back Squat", "barbell": "Barbell Back Squat", "dumbbells": "Goblet Squat", "bodyweight": "Split Squat", "bands": "Banded Squat", "cables": "Hack Squat Machine"},
        "notes": "Brace hard before each rep and keep the same depth across all working sets.",
        "kind": "main",
    },
    "hinge": {
        "category": "legs",
        "names": {"gym": "Romanian Deadlift", "barbell": "Romanian Deadlift", "dumbbells": "Dumbbell Romanian Deadlift", "bodyweight": "Single-Leg Hip Hinge", "bands": "Banded Romanian Deadlift", "cables": "Cable Pull-Through"},
        "notes": "Own the eccentric and keep your lats tight so the hinge stays controlled.",
        "kind": "main",
    },
    "single_leg": {
        "category": "legs",
        "names": {"gym": "Bulgarian Split Squat", "barbell": "Front-Foot Elevated Split Squat", "dumbbells": "Bulgarian Split Squat", "bodyweight": "Reverse Lunge", "bands": "Banded Reverse Lunge", "cables": "Cable Split Squat"},
        "notes": "Use a full range of motion and match the same rep quality on both legs.",
        "kind": "accessory",
    },
    "glute": {
        "category": "legs",
        "names": {"gym": "Barbell Hip Thrust", "barbell": "Barbell Hip Thrust", "dumbbells": "Dumbbell Hip Thrust", "bodyweight": "Single-Leg Glute Bridge", "bands": "Banded Glute Bridge", "cables": "Cable Glute Kickback"},
        "notes": "Pause for a beat at lockout and keep your ribs down.",
        "kind": "accessory",
    },
    "calves": {
        "category": "legs",
        "names": {"gym": "Standing Calf Raise", "barbell": "Standing Calf Raise", "dumbbells": "Single-Leg Calf Raise", "bodyweight": "Single-Leg Calf Raise", "bands": "Banded Calf Raise", "cables": "Seated Calf Raise"},
        "notes": "Use a full stretch and hard squeeze on each rep.",
        "kind": "accessory",
    },
    "h_push": {
        "category": "chest",
        "names": {"gym": "Barbell Bench Press", "barbell": "Barbell Bench Press", "dumbbells": "Dumbbell Bench Press", "bodyweight": "Push-Up", "bands": "Banded Push-Up", "cables": "Machine Chest Press"},
        "notes": "Set your upper back first and press through a stable shoulder position.",
        "kind": "main",
    },
    "incline_push": {
        "category": "chest",
        "names": {"gym": "Incline Dumbbell Press", "barbell": "Incline Barbell Press", "dumbbells": "Incline Dumbbell Press", "bodyweight": "Decline Push-Up", "bands": "Banded Incline Press", "cables": "Low-to-High Cable Press"},
        "notes": "Control the lowering phase and keep the ribcage stacked.",
        "kind": "accessory",
    },
    "v_push": {
        "category": "shoulders",
        "names": {"gym": "Seated Dumbbell Shoulder Press", "barbell": "Standing Overhead Press", "dumbbells": "Seated Dumbbell Shoulder Press", "bodyweight": "Pike Push-Up", "bands": "Banded Overhead Press", "cables": "Cable Shoulder Press"},
        "notes": "Finish overhead without losing your brace or leaning back.",
        "kind": "main",
    },
    "lateral_raise": {
        "category": "shoulders",
        "names": {"gym": "Dumbbell Lateral Raise", "barbell": "Plate Lateral Raise", "dumbbells": "Dumbbell Lateral Raise", "bodyweight": "Prone Y-Raise", "bands": "Banded Lateral Raise", "cables": "Cable Lateral Raise"},
        "notes": "Lead with the elbows and stop before momentum takes over.",
        "kind": "accessory",
    },
    "v_pull": {
        "category": "back",
        "names": {"gym": "Lat Pulldown", "barbell": "Pull-Up", "dumbbells": "Pull-Up", "bodyweight": "Pull-Up", "bands": "Banded Lat Pulldown", "cables": "Wide-Grip Lat Pulldown"},
        "notes": "Drive elbows down and keep your ribcage stacked.",
        "kind": "main",
    },
    "h_pull": {
        "category": "back",
        "names": {"gym": "Chest-Supported Row", "barbell": "Bent-Over Barbell Row", "dumbbells": "One-Arm Dumbbell Row", "bodyweight": "Inverted Row", "bands": "Banded Row", "cables": "Seated Cable Row"},
        "notes": "Reach at the bottom and finish each row with the shoulder blade moving back.",
        "kind": "main",
    },
    "row": {
        "category": "back",
        "names": {"gym": "Seated Cable Row", "barbell": "Pendlay Row", "dumbbells": "Seal Row", "bodyweight": "Inverted Row", "bands": "Banded Seated Row", "cables": "Single-Arm Cable Row"},
        "notes": "Use a slight pause at the torso so the back does the work, not momentum.",
        "kind": "accessory",
    },
    "rear_delts": {
        "category": "shoulders",
        "names": {"gym": "Reverse Pec Deck", "barbell": "Rear-Delt Barbell Row", "dumbbells": "Rear-Delt Fly", "bodyweight": "Prone T-Raise", "bands": "Banded Rear-Delt Fly", "cables": "Cable Rear-Delt Fly"},
        "notes": "Keep the scapula moving smoothly and avoid shrugging.",
        "kind": "accessory",
    },
    "arms": {
        "category": "arms",
        "names": {"gym": "Superset: Cable Curl + Rope Pressdown", "barbell": "Superset: Barbell Curl + Close-Grip Push-Up", "dumbbells": "Superset: Hammer Curl + Overhead Extension", "bodyweight": "Superset: Diamond Push-Up + Towel Curl", "bands": "Superset: Band Curl + Band Pressdown", "cables": "Superset: Cable Curl + Rope Pressdown"},
        "notes": "Keep rest tight and chase a strong pump without sloppy reps.",
        "kind": "accessory",
    },
    "biceps": {
        "category": "arms",
        "names": {"gym": "Incline Dumbbell Curl", "barbell": "EZ-Bar Curl", "dumbbells": "Hammer Curl", "bodyweight": "Towel Curl Isometric", "bands": "Banded Curl", "cables": "Cable Curl"},
        "notes": "Keep elbows quiet and control the lowering phase.",
        "kind": "accessory",
    },
    "triceps": {
        "category": "arms",
        "names": {"gym": "Cable Pressdown", "barbell": "Skull Crusher", "dumbbells": "Overhead Dumbbell Extension", "bodyweight": "Bench Dip", "bands": "Banded Pressdown", "cables": "Cable Pressdown"},
        "notes": "Lock out fully without letting the shoulders roll forward.",
        "kind": "accessory",
    },
    "core": {
        "category": "core",
        "names": {"gym": "Weighted Dead Bug", "barbell": "Ab Wheel Rollout", "dumbbells": "Suitcase Carry", "bodyweight": "Dead Bug", "bands": "Banded Pallof Press", "cables": "Cable Pallof Press"},
        "notes": "Breathe behind the brace and keep your ribcage down.",
        "kind": "core",
    },
    "conditioning": {
        "category": "cardio",
        "names": {"gym": "Bike Intervals", "barbell": "Loaded Carry Intervals", "dumbbells": "Farmer Carry Intervals", "bodyweight": "Tempo Incline Walk", "bands": "Band Circuit Finisher", "cables": "Rowing Intervals"},
        "notes": "Stay submaximal early and finish with one strong round instead of burning out.",
        "kind": "conditioning",
    },
}


def epley_1rm(weight: float, reps: int) -> float:
    """Estimate one-rep max using Epley formula."""
    if reps == 1:
        return weight
    return round(weight * (1 + reps / 30), 1)


def build_plan_prompt(profile: FitnessProfile, prs: list[dict]) -> str:
    equipment_str = ", ".join(profile.equipment) if profile.equipment else "bodyweight only"
    goals_str = ", ".join(profile.goals) if profile.goals else "general fitness"

    if prs:
        pr_lines = [
            f"  - {pr['exercise_name']}: {pr['weight_kg']}kg x {pr['reps']} reps (est. 1RM: {pr['one_rep_max']}kg)"
            for pr in prs[:15]
        ]
        pr_section = "Current Personal Records:\n" + "\n".join(pr_lines)
    else:
        pr_section = "No existing personal records - this is a beginner starting from scratch."

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
  "plan_name": "string - short catchy name for this program",
  "description": "string - 1-2 sentence program overview",
  "duration_weeks": 8,
  "days_per_week": {profile.days_per_week},
  "days": [
    {{
      "day_number": 1,
      "name": "string - e.g. Push Day A, Upper Body, Full Body",
      "focus": "string - primary muscle groups",
      "exercises": [
        {{
          "name": "string - exercise name",
          "category": "string - chest|back|shoulders|arms|legs|core|cardio",
          "sets": 3,
          "reps": "string - e.g. '8-10' or '5' or 'AMRAP'",
          "rest_seconds": 90,
          "notes": "string - form tips or progression notes",
          "weight_suggestion": "string - e.g. '70% of 1RM' or 'moderate weight' or 'bodyweight'"
        }}
      ]
    }}
  ],
  "progression_notes": "string - how to progress week over week",
  "deload_week": "string - when and how to deload"
}}

Make the plan realistic, progressive, and appropriate for the athlete's level and goals.
Include {profile.days_per_week} training days. Use compound movements as primary lifts.
"""


def _primary_goal(profile: FitnessProfile) -> str:
    for goal in GOAL_PRIORITY:
        if goal in (profile.goals or []):
            return goal
    return "general"


def _equipment_preference(profile: FitnessProfile) -> str:
    available = set(profile.equipment or [])
    for option in ("gym", "barbell", "dumbbells", "cables", "bands", "bodyweight"):
        if option in available:
            return option
    return "bodyweight"


def _rep_scheme(kind: str, goal: str, level: str) -> tuple[int, str, int, str]:
    if kind == "conditioning":
        return 4, "45-60 sec", 45, "Moderate pace that still lets you recover before the next round."
    if kind == "core":
        return 3, "10-15 / side", 45, "Own the positions and stop before your brace breaks."

    if goal == "strength":
        if kind == "main":
            return 4, "4-6", 150, "Start around 70-80% effort and leave 1-2 reps in reserve."
        return 3, "8-12", 75, "Use a controlled tempo and focus on position quality."
    if goal == "endurance":
        if kind == "main":
            return 3, "8-12", 75, "Pick a sustainable load you can repeat cleanly across all sets."
        return 2, "12-18", 45, "Keep transitions tight and maintain breathing control."
    if goal == "lose_fat":
        if kind == "main":
            return 3, "6-10", 90, "Use a challenging load while keeping 1-2 reps in reserve."
        return 3, "10-15", 45, "Use steady pace and avoid long rest breaks."

    if kind == "main":
        return 4 if level == "advanced" else 3, "6-10", 90, "Use a load you can progress week to week without grinding reps."
    return 3, "10-15", 60, "Chase clean reps and a strong muscle contraction instead of load jumps."


def _best_pr_map(prs: list[dict]) -> dict[str, dict]:
    best: dict[str, dict] = {}
    for pr in prs:
        name = pr.get("exercise_name", "").strip().lower()
        if not name:
            continue
        if name not in best or pr.get("one_rep_max", 0) > best[name].get("one_rep_max", 0):
            best[name] = pr
    return best


def _weight_suggestion(exercise_name: str, goal: str, pr_map: dict[str, dict], kind: str) -> str:
    pr = pr_map.get(exercise_name.lower())
    if pr and pr.get("one_rep_max"):
        orm = pr["one_rep_max"]
        if goal == "strength":
            return f"Start around {round(orm * 0.78, 1)}kg (~78% of your estimated 1RM)."
        if kind == "main":
            return f"Start around {round(orm * 0.7, 1)}kg (~70% of your estimated 1RM)."
        return f"Use about {round(orm * 0.55, 1)}kg and keep the reps smooth."

    if kind == "conditioning":
        return "Pick a pace you can repeat for every interval."
    if kind == "core":
        return "Bodyweight or a light load that lets you stay braced."
    if goal == "strength":
        return "Heavy but crisp - stop 1-2 reps before failure."
    if goal == "endurance":
        return "Light to moderate load with short rest."
    if goal == "lose_fat":
        return "Moderate load you can move with intent."
    return "Moderate load with 1-2 reps left in the tank."


def _build_exercise(pattern: str, profile: FitnessProfile, pr_map: dict[str, dict]) -> dict:
    choice = EXERCISE_CHOICES[pattern]
    equipment = _equipment_preference(profile)
    exercise_name = choice["names"].get(equipment) or choice["names"]["bodyweight"]
    goal = _primary_goal(profile)
    sets, reps, rest_seconds, cue = _rep_scheme(choice["kind"], goal, profile.fitness_level)

    return {
        "name": exercise_name,
        "category": choice["category"],
        "sets": sets,
        "reps": reps,
        "rest_seconds": rest_seconds,
        "notes": f"{choice['notes']} {cue}",
        "weight_suggestion": _weight_suggestion(exercise_name, goal, pr_map, choice["kind"]),
    }


def _fallback_days(profile: FitnessProfile, prs: list[dict]) -> list[dict]:
    template = SPLIT_TEMPLATES.get(profile.days_per_week) or SPLIT_TEMPLATES[4]
    pr_map = _best_pr_map(prs)
    days = []
    for idx, day in enumerate(template, start=1):
        exercises = [_build_exercise(pattern, profile, pr_map) for pattern in day["patterns"]]
        days.append(
            {
                "day_number": idx,
                "name": day["name"],
                "focus": day["focus"],
                "exercises": exercises,
            }
        )
    return days


def _fallback_plan(profile: FitnessProfile, prs: list[dict]) -> dict:
    goal = _primary_goal(profile)
    goal_label = GOAL_LABELS.get(goal, "general fitness")
    plan_name_map = {
        "build_muscle": "Foundational Hypertrophy Builder",
        "strength": "Strength Forge Split",
        "lose_fat": "Lean Momentum Block",
        "endurance": "Engine Builder Block",
        "general": "Performance Base Camp",
    }

    progression = {
        "build_muscle": "Add 1 rep to each main lift before adding load. When you hit the top of the rep range on every set, increase the weight by the smallest jump available.",
        "strength": "Keep the reps crisp. Add a small load increase only when bar speed stays strong across all work sets for two straight sessions.",
        "lose_fat": "Keep the load stable for two weeks, then add reps or shorten rest before making the next weight jump.",
        "endurance": "Progress by adding reps, rounds, or interval time before increasing load. Stay efficient instead of maxing out early.",
        "general": "Make one small change per week: a rep, a set on one accessory, or a minor load increase when form stays locked in.",
    }

    return {
        "plan_name": plan_name_map.get(goal, "Performance Base Camp"),
        "description": f"A {profile.days_per_week}-day {goal_label} split built around your current equipment, training level, and recent performance.",
        "duration_weeks": 8,
        "days_per_week": profile.days_per_week,
        "days": _fallback_days(profile, prs),
        "progression_notes": progression.get(goal, progression["general"]),
        "deload_week": "Use week 5 as a lighter week if recovery slips: cut working sets by about one-third and stop every set 3 reps before failure.",
    }


def _fallback_analysis(workout_logs: list[dict], prs: list[dict]) -> dict:
    if not workout_logs:
        return {"message": "Not enough data yet - complete a few workouts first.", "suggestions": []}

    total_volume = 0.0
    day_counter: Counter[str] = Counter()
    for log in workout_logs:
        if log.get("day_name"):
            day_counter[log["day_name"]] += 1
        for exercise in log.get("exercises") or []:
            for set_log in exercise.get("sets") or []:
                total_volume += float(set_log.get("weight_kg", 0) or 0) * float(set_log.get("reps", 0) or 0)

    avg_volume = round(total_volume / max(len(workout_logs), 1), 1)
    most_common_day = day_counter.most_common(1)[0][0] if day_counter else "your current split"
    pr_count = len(prs)

    suggestions = [
        "Keep at least one main lift per session 1-2 reps shy of failure so progression stays sustainable.",
        "If recovery feels good, add a rep before you add weight. That keeps momentum steady without spiking fatigue.",
        "Use your first working set as a quality check. If bar speed or form is off, hold load steady and win the session with cleaner reps.",
    ]

    if avg_volume < 1500:
        suggestions[1] = "Your logged volume is still modest. Add one extra accessory set or one more working set on your main lift each week."
    if pr_count >= 3:
        suggestions[2] = "You already have a few PRs on the board. Re-test one anchor lift every 3-4 weeks instead of chasing PRs every session."

    return {
        "message": f"You have logged {len(workout_logs)} workouts with about {avg_volume} kg of average session volume. {most_common_day} is getting the most consistent work, and you have {pr_count} recorded PRs.",
        "suggestions": suggestions,
    }


def _parse_json_response(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1]).strip()
    return json.loads(cleaned)


async def generate_workout_plan(profile: FitnessProfile, prs: list[dict]) -> dict:
    """Call Claude when available and fall back to a deterministic plan if it fails."""
    prompt = build_plan_prompt(profile, prs)

    if client is None:
        logger.warning("Anthropic API key not configured; using fallback workout planner")
        return _fallback_plan(profile, prs)

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=PLAN_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse_json_response(message.content[0].text)
    except Exception as exc:
        logger.warning("Falling back to local workout planner: %s", exc)
        return _fallback_plan(profile, prs)


async def analyze_progress(workout_logs: list[dict], prs: list[dict]) -> dict:
    """Use Claude when available and fall back to heuristic coaching if it fails."""
    if not workout_logs:
        return {"message": "Not enough data yet - complete a few workouts first.", "suggestions": []}

    if client is None:
        logger.warning("Anthropic API key not configured; using fallback progress analysis")
        return _fallback_analysis(workout_logs, prs)

    summary = {
        "workout_count": len(workout_logs),
        "recent_prs": prs[:5],
        "recent_workouts": workout_logs[-5:],
    }

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""Analyze this athlete's recent training data and provide brief, actionable insights.

Training Data: {json.dumps(summary, indent=2)}

Return JSON: {{"message": "brief 1-2 sentence summary", "suggestions": ["tip1", "tip2", "tip3"]}}
Return JSON only.""",
                }
            ],
        )
        return _parse_json_response(message.content[0].text)
    except Exception as exc:
        logger.warning("Falling back to heuristic progress analysis: %s", exc)
        return _fallback_analysis(workout_logs, prs)
