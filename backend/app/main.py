from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api import tryons, photos, profiles, clothing, wardrobe, account

app = FastAPI(title="StyleMe API")

origins = [o.strip() for o in settings.FRONTEND_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(photos.router)
app.include_router(profiles.router)
app.include_router(clothing.router)
app.include_router(tryons.router)
app.include_router(wardrobe.router)
app.include_router(account.router)


@app.get("/health")
def health():
    return {"status": "ok"}