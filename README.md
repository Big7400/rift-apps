# Rift Apps — SelfCare Pup + FitForge

Two React Native (Expo) apps + shared FastAPI backend.

## Apps

### SelfCare Pup 🐾
Finch-inspired self-care app with a virtual puppy companion.
- Daily mood check-ins
- Self-care goals & XP system
- Puppy levels up as you complete goals
- Dog Park (friends/social)
- Breathing, journaling, activities

### FitForge ⚡
AI-powered workout tracking app.
- AI workout plan generation (Claude API)
- Personal record logging with 1RM calculation
- Volume and progress analytics
- Push notifications on workout days

---

## Project Structure

```
rift-apps/
├── selfcare-pup/     ← Expo React Native app
├── fitforge/         ← Expo React Native app
├── backend/          ← Shared FastAPI backend
└── supabase_migration.sql ← Run in Supabase SQL editor
```

---

## Setup

### 1. Supabase
Open Supabase dashboard → SQL Editor → paste `supabase_migration.sql` → Run

### 2. Firebase
- Go to https://console.firebase.google.com
- Create project "rift-apps"
- Enable Cloud Messaging
- Add iOS app (bundle: `com.rift.selfcarepup`) → download `GoogleService-Info.plist`
- Add Android app (package: `com.rift.selfcarepup`) → download `google-services.json`
- Repeat for FitForge (`com.rift.fitforge`)
- Place files in `selfcare-pup/` and `fitforge/` directories

### 3. Backend (local dev)
```bash
cd backend
cp .env.example .env  # fill in your credentials
.venv/Scripts/activate  # Windows
pip install -r requirements.txt
python main.py
```
Backend runs at http://localhost:8000
Docs at http://localhost:8000/docs

### 4. Run Apps (local)
```bash
cd selfcare-pup
npx expo start

cd fitforge
npx expo start
```
Scan QR code with Expo Go app on your phone.

### 5. Deploy Backend to Railway
1. Create new project at https://railway.app/new
2. Connect this GitHub repo (push rift-apps/ to your GitHub first)
3. Set root directory to `backend/`
4. Set environment variables in Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `FIREBASE_SERVER_KEY`
   - `JWT_SECRET` (random 32+ char string)
   - `ENVIRONMENT=production`
5. Update `EXPO_PUBLIC_API_URL` in both apps' `.env.local` to Railway URL

### 6. EAS Build (production)
```bash
npm install -g eas-cli
eas login  # use your Expo account

cd selfcare-pup
eas build --platform all --profile development

cd fitforge
eas build --platform all --profile development
```

---

## API Docs
Once running: http://localhost:8000/docs (interactive Swagger UI)

Key endpoints:
- `POST /auth/register` — create account
- `POST /auth/login` — login
- `GET /selfcare/puppy/{user_id}` — get puppy
- `POST /selfcare/checkin/{user_id}` — daily check-in
- `GET /selfcare/goals/{user_id}` — get goals
- `POST /fitforge/plan/generate` — AI workout plan
- `POST /fitforge/pr/{user_id}` — log personal record
- `GET /fitforge/progress/{user_id}` — progress analytics
