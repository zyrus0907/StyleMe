from fastapi import APIRouter, Depends

from ..deps import get_current_user_id
from ..db import supabase

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("")
def delete_account(user_id: str = Depends(get_current_user_id)):
    # Deleting the auth user cascades to all their rows (profiles, photos,
    # clothing, try-ons, wardrobe) because the schema uses ON DELETE CASCADE.
    supabase.auth.admin.delete_user(user_id)
    return {"deleted": True}