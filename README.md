# Virtual Fashion Assistant

Create a fashion profile once, try on unlimited clothing items without re-uploading photos.
https://styleme-jade.vercel.app/

> Architecture & full plan: see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind — `frontend/`
- **Backend:** FastAPI — `backend/`
- **DB / Auth / Storage:** Supabase
- **VTON:** fal.ai (Kling Kolors Virtual Try-On v1.5)

## The core idea
VTON models are image-in → image-out. We store one **canonical base photo** per user at
onboarding and silently reuse it for every try-on. That is the entire "no re-upload" trick.

## Quick start (backend)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in FAL_KEY, SUPABASE_*, etc.
uvicorn app.main:app --reload
# open http://localhost:8000/health  and  /docs
```

## Quick start (frontend)
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev   # http://localhost:3000
```

## Roadmap
W1 scaffold+auth · W2 upload+onboarding · W3 first try-on · **W4 = 30-day demo** ·
W5 wardrobe · W6 compare. Details in ARCHITECTURE.md.
