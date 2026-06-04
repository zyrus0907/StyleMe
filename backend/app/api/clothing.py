from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..db import supabase
from ..services import storage

router = APIRouter(prefix="/clothing", tags=["clothing"])


class PresignReq(BaseModel):
    ext: str = "jpg"


class CreateClothing(BaseModel):
    path: str | None = None
    external_url: str | None = None
    shop_url: str | None = None      # where to buy it
    category: str = "upper"
    name: str | None = None


@router.post("/presign")
def presign(body: PresignReq, user_id: str = Depends(get_current_user_id)):
    path = storage.make_path(user_id, "garments", body.ext)
    return storage.presign_upload(path)


@router.post("")
def create(body: CreateClothing, user_id: str = Depends(get_current_user_id)):
    return (
        supabase.table("clothing_items")
        .insert(
            {
                "user_id": user_id,
                "source": "upload" if body.path else "url",
                "source_url": body.external_url,
                "shop_url": body.shop_url,
                "image_url": body.path or body.external_url,
                "category": body.category,
                "name": body.name,
            }
        )
        .execute()
        .data[0]
    )


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