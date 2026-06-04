from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import tryons, photos, profiles, clothing, wardrobe

app = FastAPI(title="StyleMe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(photos.router)
app.include_router(profiles.router)
app.include_router(clothing.router)
app.include_router(tryons.router)
app.include_router(wardrobe.router)


@app.get("/health")
def health():
    return {"status": "ok"}