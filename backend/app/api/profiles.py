"""Profile endpoints — this is where the 'upload once, reuse forever' magic
is set: the user picks ONE canonical photo that every future try-on reuses.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..deps import get_current_user_id
from ..db import supabase
from ..services import storage

router = APIRouter(prefix="/profiles", tags=["profiles"])


class UpsertProfile(BaseModel):
    canonical_photo_id: str
    display_name: str | None = None


@router.post("")
def upsert_profile(body: UpsertProfile, user_id: str = Depends(get_current_user_id)):
    # Verify the chosen photo belongs to this user.
    photo = (
        supabase.table("uploaded_photos")
        .select("*")
        .eq("id", body.canonical_photo_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not photo:
        raise HTTPException(404, "Photo not found")

    # Mark this one canonical, clear the flag on the user's others.
    supabase.table("uploaded_photos").update({"is_canonical": False}).eq(
        "user_id", user_id
    ).execute()
    supabase.table("uploaded_photos").update({"is_canonical": True}).eq(
        "id", body.canonical_photo_id
    ).execute()

    existing = (
        supabase.table("user_profiles").select("id").eq("user_id", user_id).execute().data
    )
    payload = {
        "user_id": user_id,
        "canonical_photo_id": body.canonical_photo_id,
        "display_name": body.display_name,
    }
    if existing:
        profile = (
            supabase.table("user_profiles")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
            .data[0]
        )
    else:
        profile = supabase.table("user_profiles").insert(payload).execute().data[0]

        # Give every new user a default wardrobe.
        supabase.table("wardrobes").insert({"user_id": user_id}).execute()

    return profile


@router.get("/me")
def my_profile(user_id: str = Depends(get_current_user_id)):
    rows = (
        supabase.table("user_profiles").select("*").eq("user_id", user_id).execute().data
    )
    if not rows:
        return {"profile": None}
    profile = rows[0]
    if profile.get("canonical_photo_id"):
        photo = (
            supabase.table("uploaded_photos")
            .select("storage_url")
            .eq("id", profile["canonical_photo_id"])
            .execute()
            .data
        )
        if photo:
            profile["canonical_read_url"] = storage.signed_read_url(photo[0]["storage_url"])
    return {"profile": profile}
