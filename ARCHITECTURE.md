# Virtual Fashion Assistant — Architecture & Build Plan

> One opinionated architecture, optimized for a solo/small team shipping a portfolio-quality MVP in 2–3 months with minimal infra cost.

---

## 0. The One Decision That Shapes Everything

Image-based virtual try-on (VTON) models are **image-in → image-out**: they take *one* person photo + *one* garment photo and return *one* composited image. They do **not** learn a reusable per-user model from 2–5 photos.

So the "create a profile once, never re-upload" promise is implemented as:

1. During onboarding, collect 2–5 photos.
2. Auto-select (or let the user pick) the **best full-body, front-facing, neutral-pose photo** → store it as the user's **canonical base image**.
3. Every future try-on silently sends `base_image + garment_image` to the VTON API.

The user *experiences* "one-time setup." Under the hood you're just reusing a stored URL. This keeps the MVP trivially cheap and removes any need to train models. **Do not overengineer this.**

---

## 1. Product Architecture

### User Flow
1. Sign up (email + password / OAuth).
2. Onboarding wizard: upload 2–5 photos → preview → pick canonical base photo → profile created.
3. Dashboard: "Try something on."
4. Add garment: upload image **or** paste a product URL (we scrape the main image).
5. Generate try-on → result shown in ~10–30s with a loading state.
6. Save result to **Wardrobe** (tag, name, category).
7. **Compare** 2–4 saved outfits side-by-side.

### System Architecture (single recommended design)
```
[ Next.js (Vercel) ] ──HTTPS──> [ FastAPI (Render/Fly.io) ]
        │                                  │
        │                          ┌───────┼─────────────┐
   Clerk/Supabase Auth      Postgres(Supabase)   Object Storage (Supabase/S3-compatible)
        │                          │                     │
        └──────────────> async job ─> [ fal.ai VTON API ] (Kolors v1.5 default)
```
- **No GPU servers.** All inference is offloaded to a hosted API (fal.ai). This is the key cost/complexity win.
- Backend is stateless; all state in Postgres + object storage.
- Generation runs as a short async task; frontend polls a `try-on` record by `status`.

### Data Flow
1. Photo upload → backend gets a **pre-signed upload URL** → client uploads directly to storage (keeps large files off your API).
2. Backend stores the resulting public/signed URL in Postgres.
3. Try-on request → backend creates a `try_on` row (`status=pending`) → calls fal.ai with `base_image_url` + `garment_image_url`.
4. On completion → store output URL, `status=done`.
5. Frontend polls `GET /try-ons/{id}` until `done`.

### AI Pipeline
```
canonical_base_photo ─┐
                      ├─> fal.ai (Kolors v1.5 / CatVTON / FASHN adapter) ─> result image ─> storage
garment_image ────────┘   (cloth_type hint: upper/lower/full)
```
Optional pre-steps (add later, not MVP): garment background removal, base-photo quality scoring.

---

## 2. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + Tailwind + shadcn/ui** | Fast, portfolio-friendly, deploys free on Vercel |
| Backend | **FastAPI (Python)** | Async, great for AI/image workflows, you asked for it |
| Database | **Postgres via Supabase** | Free tier, managed, pairs with auth + storage |
| Auth | **Clerk** (or Supabase Auth) | Drop-in, handles OAuth/email, generous free tier |
| Storage | **Supabase Storage** (S3-compatible) | Pre-signed uploads, public/signed URLs, free tier |
| Async | FastAPI `BackgroundTasks` (MVP) → Celery/Redis later | Don't add a queue until you need it |
| Deployment | **Vercel** (frontend) + **Render** or **Fly.io** (backend) | Cheapest managed path, no DevOps |
| VTON | **fal.ai**, default model **Kling Kolors Virtual Try-On v1.5** | Hosted, commercial-cleared, ~$0.07/img, 768×1024 |

Pick **either** Clerk **or** Supabase Auth — not both. Recommendation: **Supabase Auth** so auth + DB + storage are one vendor (simpler, cheaper). Use Clerk only if you want polished prebuilt UI fast.

---

## 3. AI Model Evaluation

| Model | Hosting | Res / Speed | Commercial | Cost | Notes |
|---|---|---|---|---|---|
| **Kolors v1.5** (Kuaishou) | fal.ai hosted | 768×1024, fast | ✅ cleared | ~$0.07/gen | Simplest API (2 URLs), strong realism, **MVP pick** |
| **FASHN API** | fashn.ai hosted | 576×864 std (~10–17s); Try-On Max ~50s, higher detail | ✅ | ~$0.075/img, <$0.04 at volume | Fashion-specialized, flat-lay/ghost-mannequin inputs, more controls; lower base res |
| **CatVTON** | fal.ai hosted or self-host | 1024×768, ~35s | ✅ (license check) | ~$0.07 hosted / GPU if self | Lightweight (runs <8GB VRAM), great if you ever self-host |
| **IDM-VTON** | HF/self-host | High realism | research-grade | GPU cost | Best ceiling on drape/pose but needs a compositing + segmentation pipeline; too much ops for MVP |

**Recommendation:** Use **fal.ai as a provider abstraction layer**, defaulting to **Kolors v1.5** for the MVP. Build your backend so the model name is a config value — you can swap to CatVTON or wire in FASHN without touching your app logic. This hedges model risk for free.

*Sources: fal.ai model docs (Kolors $0.07/gen, 768×1024); fashn.ai changelog & third-party reviews (Feb–Mar 2026, $0.075/img, 576×864, Try-On Max); CatVTON/IDM-VTON comparison articles (2025–2026).*

---

## 4. Database Design (Postgres)

```sql
-- users (if not fully delegated to auth provider; otherwise mirror minimal fields)
users(
  id UUID PK,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ
)

user_profiles(
  id UUID PK,
  user_id UUID FK -> users.id,
  display_name TEXT,
  canonical_photo_id UUID FK -> uploaded_photos.id,  -- the reused base image
  height_cm INT NULL,            -- future: measurements
  body_notes JSONB NULL,         -- future: measurement estimation
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

uploaded_photos(
  id UUID PK,
  user_id UUID FK,
  storage_url TEXT,
  is_canonical BOOLEAN DEFAULT false,
  quality_score FLOAT NULL,      -- future: auto-pick best base
  width INT, height INT,
  created_at TIMESTAMPTZ
)

clothing_items(
  id UUID PK,
  user_id UUID FK,
  source TEXT,                   -- 'upload' | 'url'
  source_url TEXT NULL,
  image_url TEXT,                -- stored garment image
  category TEXT,                 -- 'upper' | 'lower' | 'full' | 'other'
  name TEXT NULL,
  created_at TIMESTAMPTZ
)

try_ons(
  id UUID PK,
  user_id UUID FK,
  base_photo_id UUID FK -> uploaded_photos.id,
  clothing_item_id UUID FK -> clothing_items.id,
  status TEXT,                   -- 'pending' | 'processing' | 'done' | 'failed'
  provider TEXT DEFAULT 'fal',
  model TEXT DEFAULT 'kolors-v1.5',
  result_url TEXT NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ
)

wardrobes(
  id UUID PK,
  user_id UUID FK,
  name TEXT DEFAULT 'My Wardrobe',
  created_at TIMESTAMPTZ
)

saved_outfits(
  id UUID PK,
  wardrobe_id UUID FK -> wardrobes.id,
  try_on_id UUID FK -> try_ons.id,
  name TEXT NULL,
  tags TEXT[] NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ
)
```
Indexes: FK columns, `try_ons(user_id, status)`, `saved_outfits(wardrobe_id)`.

---

## 5. Development Roadmap (weekly)

- **W1** Repo + scaffolding, Supabase project, auth working, deploy "hello world" frontend+backend.
- **W2** Photo upload (pre-signed URLs), onboarding wizard, canonical-photo selection, profile creation.
- **W3** Clothing item add (upload + URL scrape), fal.ai integration, first end-to-end try-on.
- **W4** Try-on status polling, result display, error handling, loading UX. **← 30-day demo target.**
- **W5** Wardrobe + save outfits, gallery view.
- **W6** Side-by-side outfit comparison view.
- **W7** Polish: empty states, mobile responsiveness, rate limits, basic analytics.
- **W8** Hardening: privacy (signed URLs, deletion), cost guards, retries.
- **W9–12** Stretch: garment background removal, base-photo quality scoring, Phase 2 starts (stylist recs).

---

## 6. Backend (FastAPI)

### Folder structure
```
backend/
  app/
    main.py
    config.py
    db.py
    deps.py
    models/        # SQLAlchemy models
    schemas/       # Pydantic
    api/
      auth.py
      photos.py
      clothing.py
      tryons.py
      wardrobe.py
    services/
      storage.py   # pre-signed URLs
      vton.py      # fal.ai adapter (provider-agnostic)
      scrape.py    # product URL -> image
  requirements.txt
  .env.example
```

### Key endpoints
```
POST /auth/...                 (delegated to Supabase/Clerk)
POST /photos/presign           -> { upload_url, photo_id }
POST /photos/confirm           -> finalize stored photo
POST /profiles                 -> create/update, set canonical photo
POST /clothing                 -> upload OR { source_url }
POST /try-ons                  -> { clothing_item_id } -> creates job
GET  /try-ons/{id}             -> poll status/result
POST /wardrobe/outfits         -> save a try-on
GET  /wardrobe/outfits         -> list
GET  /wardrobe/compare?ids=... -> fetch 2–4 for side-by-side
```

### Auth flow
JWT from auth provider → `Authorization: Bearer` → FastAPI dependency verifies token (provider JWKS) → injects `user_id`. No password handling in your code.

### Image upload flow
Client asks `/photos/presign` → backend returns a Supabase signed upload URL → client PUTs the file directly to storage → client calls `/photos/confirm` → backend records the row. Big files never touch your API.

### AI generation flow
`POST /try-ons` → create row `pending` → `BackgroundTasks` calls `vton.generate(base_url, garment_url, cloth_type)` → fal.ai → on return store `result_url`, set `done`. Frontend polls.

*(Working example code is in the scaffolded repo: `backend/app/services/vton.py` and `backend/app/api/tryons.py`.)*

---

## 7. Frontend (Next.js App Router)

### Pages
```
/                      landing
/sign-in /sign-up      auth
/onboarding            photo upload + pick canonical
/dashboard             start a try-on
/try-on/[id]           generation + result
/wardrobe              saved outfits grid
/compare               side-by-side (2–4)
```

### Components
`PhotoUploader`, `CanonicalPicker`, `GarmentInput` (upload/URL toggle), `TryOnResult`, `OutfitCard`, `CompareGrid`, `LoadingState`.

### State management
- Server state: **TanStack Query** (polling try-on status, caching wardrobe).
- Auth/session: provider hook (Clerk/Supabase).
- Local UI: React state. **Don't add Redux.**

### API integration
Single typed `apiClient` (fetch wrapper) injecting the bearer token; one hook per resource (`useTryOn`, `useWardrobe`).

---

## 8. Production Deployment & Cost

| Service | Tier | Est. monthly |
|---|---|---|
| Vercel (frontend) | Hobby/Pro | $0–20 |
| Render/Fly.io (FastAPI) | Starter instance | $0–7 |
| Supabase (DB+auth+storage) | Free → Pro | $0–25 |
| fal.ai (VTON) | usage | ~$0.07 × generations |
| **Total (low usage)** | | **~$0–50/mo + per-image** |

At 1,000 try-ons/month ≈ **$70** in inference. Add a per-user monthly generation cap to keep costs bounded.

---

## 9. Technical Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Pose mismatch** | Constrain onboarding to front-facing, full-body, arms-relaxed; show a pose guide overlay; reject low-quality photos. |
| **Clothing segmentation** | Offload to the VTON model; for URL garments, prefer clean product images; add background removal (e.g. `rembg`/Bria) for messy inputs in Phase 2. |
| **Background removal** | Not needed for person photo (model handles it); only clean the garment image if results degrade. |
| **Image quality / face fidelity** | Kolors/Kolors-class models preserve identity well; offer an optional face-restore (GFPGAN) pass later if needed; cap output, then upscale if required. |
| **Generation latency (10–50s)** | Async job + polling + good loading UX; pre-warm nothing (serverless API); set expectations in UI. |
| **Privacy** | Photos are biometric-adjacent. Use signed (not public) URLs, per-user storage paths, hard-delete on request, clear consent at onboarding, EU/GDPR-aware data handling. |
| **Scalability** | Stateless backend scales horizontally; move `BackgroundTasks` → Celery/Redis when concurrency grows; CDN-cache result images. |
| **Cost runaway** | Per-user generation quotas + monthly budget alert on fal.ai. |

---

## 10. Future Roadmap

**Phase 2 — Intelligence:** AI stylist recommendations (LLM over wardrobe + occasion), outfit scoring (color/fit heuristics + LLM), shoppable recommendations.

**Phase 3 — 3D & measurements:** 3D avatar from the multiple onboarding photos (photogrammetry / SMPL body fitting), body-measurement estimation, multi-angle try-on (run VTON per stored angle).

---

## Final Summary

### The exact architecture to build
Next.js (Vercel) + FastAPI (Render) + Supabase (Postgres/Auth/Storage) + fal.ai Kolors v1.5 behind a provider-agnostic VTON adapter. Canonical-photo-reuse pattern for the "no re-upload" UX. Async try-on via BackgroundTasks + polling. No GPUs, no queue, no custom models for MVP.

### First 10 development tasks
1. Create GitHub repo + push the scaffold (below).
2. Create Supabase project; enable Auth + a private Storage bucket.
3. Wire FastAPI ↔ Supabase (DB connection + JWT verification dependency).
4. Deploy bare frontend (Vercel) + backend (Render); confirm `/health`.
5. Implement sign-up/sign-in end-to-end.
6. Implement pre-signed photo upload + `/photos/confirm`.
7. Build onboarding wizard + canonical-photo selection → create profile.
8. Implement clothing add (upload + URL scrape) storing garment image.
9. Implement `vton.py` fal.ai adapter + `POST /try-ons` + polling; ship first real try-on.
10. Build result screen + "Save to wardrobe."

### Fastest path to a working demo in 30 days
Auth → upload one canonical photo → add one garment → one fal.ai try-on → show result. That single happy path *is* the demo. Everything else is additive.

### Cut from MVP (avoid overengineering)
- Custom/self-hosted models, GPUs, Celery/Redis, microservices.
- 3D avatars, body measurements, multi-angle (Phase 3).
- Stylist AI / scoring (Phase 2).
- Multiple wardrobes, social sharing, mobile app.
- Auto background removal & face restoration (add only if quality demands).
- Auto quality scoring of photos (let the user pick the base manually for now).
