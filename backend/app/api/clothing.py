"""Clothing item endpoints. Garment-via-upload reuses the same storage flow
as photos. Garment-via-URL scraping comes in a later step; for now you can
also pass a direct external image URL.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..db import supabase
from ..services import storage

router = APIRouter(prefix="/clothing", tags=["clothing"])


class PresignReq(BaseModel):
    ext: str = "jpg"


class CreateClothing(BaseModel):
    path: str | None = None          # storage path (uploaded garment)
    external_url: str | None = None  # OR a direct external image URL
    category: str = "upper"          # upper | lower | full | other
    name: str | None = None


@router.post("/presign")
def presign(body: PresignReq, user_id: str = Depends(get_current_user_id)):
    path = storage.make_path(user_id, "garments", body.ext)
    return storage.presign_upload(path)


@router.post("")
def create(body: CreateClothing, user_id: str = Depends(get_current_user_id)):
    row = (
        supabase.table("clothing_items")
        .insert(
            {
                "user_id": user_id,
                "source": "upload" if body.path else "url",
                "source_url": body.external_url,
                # store storage path if uploaded, else the external url
                "image_url": body.path or body.external_url,
                "category": body.category,
                "name": body.name,
            }
        )
        .execute()
        .data[0]
    )
    return row


@router.get("")
def list_clothing(user_id: str = Depends(get_current_user_id)):
    return (
        supabase.table("clothing_items")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
