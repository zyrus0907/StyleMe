"""Photo upload endpoints.

Two-step direct-to-storage upload so large files never pass through our API:
  POST /photos/presign  -> { path, signed_url, token }   (client uploads to storage)
  POST /photos/confirm  -> records the row, returns a readable signed url
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..db import supabase
from ..services import storage

router = APIRouter(prefix="/photos", tags=["photos"])


class PresignReq(BaseModel):
    ext: str = "jpg"


class ConfirmReq(BaseModel):
    path: str
    width: int | None = None
    height: int | None = None


@router.post("/presign")
def presign(body: PresignReq, user_id: str = Depends(get_current_user_id)):
    path = storage.make_path(user_id, "photos", body.ext)
    return storage.presign_upload(path)


@router.post("/confirm")
def confirm(body: ConfirmReq, user_id: str = Depends(get_current_user_id)):
    row = (
        supabase.table("uploaded_photos")
        .insert(
            {
                "user_id": user_id,
                "storage_url": body.path,  # we store the path, not a URL
                "width": body.width,
                "height": body.height,
            }
        )
        .execute()
        .data[0]
    )
    row["read_url"] = storage.signed_read_url(body.path)
    return row


@router.get("")
def list_photos(user_id: str = Depends(get_current_user_id)):
    rows = (
        supabase.table("uploaded_photos")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
    for r in rows:
        r["read_url"] = storage.signed_read_url(r["storage_url"])
    return rows
