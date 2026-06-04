"""Try-on endpoints, now wired to real Supabase data + persisted to Postgres.

Flow:
  POST /try-ons       -> resolve canonical photo + garment, create row, run async
  GET  /try-ons/{id}  -> poll status/result
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..db import supabase
from ..services import storage
from ..services.vton import generate_tryon

router = APIRouter(prefix="/try-ons", tags=["try-ons"])


class CreateTryOn(BaseModel):
    clothing_item_id: str


def _resolve_base_url(user_id: str) -> tuple[str | None, str | None]:
    """Return (photo_id, signed_read_url) for the user's canonical photo."""
    prof = (
        supabase.table("user_profiles")
        .select("canonical_photo_id")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not prof or not prof[0].get("canonical_photo_id"):
        return None, None
    photo_id = prof[0]["canonical_photo_id"]
    photo = (
        supabase.table("uploaded_photos")
        .select("storage_url")
        .eq("id", photo_id)
        .execute()
        .data
    )
    if not photo:
        return None, None
    return photo_id, storage.signed_read_url(photo[0]["storage_url"])


def _resolve_garment_url(user_id: str, clothing_item_id: str) -> str | None:
    rows = (
        supabase.table("clothing_items")
        .select("*")
        .eq("id", clothing_item_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not rows:
        return None
    item = rows[0]
    if item["source"] == "url":
        return item["image_url"]  # external url, already public
    return storage.signed_read_url(item["image_url"])  # storage path


def _run_generation(tryon_id: str, base_url: str, garment_url: str):
    supabase.table("try_ons").update({"status": "processing"}).eq("id", tryon_id).execute()
    try:
        result_url = generate_tryon(base_url, garment_url)
        supabase.table("try_ons").update(
            {"status": "done", "result_url": result_url}
        ).eq("id", tryon_id).execute()
    except Exception as e:  # noqa: BLE001
        supabase.table("try_ons").update(
            {"status": "failed", "error": str(e)}
        ).eq("id", tryon_id).execute()


@router.post("")
def create_try_on(
    body: CreateTryOn,
    background: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    base_photo_id, base_url = _resolve_base_url(user_id)
    if not base_url:
        raise HTTPException(400, "No canonical photo set. Finish onboarding first.")

    garment_url = _resolve_garment_url(user_id, body.clothing_item_id)
    if not garment_url:
        raise HTTPException(404, "Clothing item not found.")

    row = (
        supabase.table("try_ons")
        .insert(
            {
                "user_id": user_id,
                "base_photo_id": base_photo_id,
                "clothing_item_id": body.clothing_item_id,
                "status": "pending",
            }
        )
        .execute()
        .data[0]
    )
    background.add_task(_run_generation, row["id"], base_url, garment_url)
    return row


@router.get("/{tryon_id}")
def get_try_on(tryon_id: str, user_id: str = Depends(get_current_user_id)):
    rows = (
        supabase.table("try_ons")
        .select("*")
        .eq("id", tryon_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(404, "Not found")
    return rows[0]
