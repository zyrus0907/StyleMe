from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import tryons

app = FastAPI(title="Virtual Fashion Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # add your Vercel URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tryons.router)


@app.get("/health")
def health():
    return {"status": "ok"}
