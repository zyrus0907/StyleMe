from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..db import supabase

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])


class SaveOutfit(BaseModel):
    try_on_id: str
    name: str | None = None


def _user_wardrobe_id(user_id: str) -> str:
    rows = supabase.table("wardrobes").select("id").eq("user_id", user_id).execute().data
    if rows:
        return rows[0]["id"]
    return supabase.table("wardrobes").insert({"user_id": user_id}).execute().data[0]["id"]


@router.post("/outfits")
def save_outfit(body: SaveOutfit, user_id: str = Depends(get_current_user_id)):
    t = (
        supabase.table("try_ons")
        .select("id")
        .eq("id", body.try_on_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not t:
        raise HTTPException(404, "Try-on not found")
    wid = _user_wardrobe_id(user_id)
    return (
        supabase.table("saved_outfits")
        .insert({"wardrobe_id": wid, "try_on_id": body.try_on_id, "name": body.name})
        .execute()
        .data[0]
    )


@router.get("/outfits")
def list_outfits(user_id: str = Depends(get_current_user_id)):
    wid = _user_wardrobe_id(user_id)
    outfits = (
        supabase.table("saved_outfits")
        .select("*")
        .eq("wardrobe_id", wid)
        .order("created_at", desc=True)
        .execute()
        .data
    )
    for o in outfits:
        t = supabase.table("try_ons").select("result_url").eq("id", o["try_on_id"]).execute().data
        o["result_url"] = t[0]["result_url"] if t else None
    return outfits