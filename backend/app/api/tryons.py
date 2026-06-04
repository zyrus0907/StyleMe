"""Try-on endpoints: create a job (async) and poll for the result.

This is intentionally storage-agnostic for the scaffold: it shows the control
flow (create row -> background generate -> poll). Wire `_db_*` helpers to your
SQLAlchemy session / Supabase tables.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..services.vton import generate_tryon

router = APIRouter(prefix="/try-ons", tags=["try-ons"])

# --- placeholder store; replace with real DB calls -------------------------
_TRY_ONS: dict[str, dict] = {}


class CreateTryOn(BaseModel):
    clothing_item_id: str
    cloth_type: str | None = None  # "upper" | "lower" | "overall"


def _run_generation(tryon_id: str, base_url: str, garment_url: str, cloth_type: str | None):
    rec = _TRY_ONS[tryon_id]
    rec["status"] = "processing"
    try:
        rec["result_url"] = generate_tryon(base_url, garment_url, cloth_type)
        rec["status"] = "done"
    except Exception as e:  # noqa: BLE001
        rec["status"] = "failed"
        rec["error"] = str(e)


@router.post("")
def create_try_on(
    body: CreateTryOn,
    background: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    # TODO: look up canonical base photo URL + garment image URL from DB
    base_url = _db_get_canonical_photo_url(user_id)
    garment_url = _db_get_clothing_image_url(user_id, body.clothing_item_id)
    if not base_url:
        raise HTTPException(400, "No canonical photo set. Finish onboarding first.")

    tryon_id = str(uuid.uuid4())
    _TRY_ONS[tryon_id] = {
        "id": tryon_id,
        "user_id": user_id,
        "status": "pending",
        "result_url": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    background.add_task(_run_generation, tryon_id, base_url, garment_url, body.cloth_type)
    return _TRY_ONS[tryon_id]


@router.get("/{tryon_id}")
def get_try_on(tryon_id: str, user_id: str = Depends(get_current_user_id)):
    rec = _TRY_ONS.get(tryon_id)
    if not rec or rec["user_id"] != user_id:
        raise HTTPException(404, "Not found")
    return rec


# --- replace these stubs with real DB lookups ------------------------------
def _db_get_canonical_photo_url(user_id: str) -> str | None:
    return None  # TODO


def _db_get_clothing_image_url(user_id: str, clothing_item_id: str) -> str | None:
    return None  # TODO
