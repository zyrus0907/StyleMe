"""Auth dependency.

Instead of locally decoding the JWT (which requires matching the exact signing
algorithm/secret), we ask Supabase to validate the access token and tell us who
the user is. This works regardless of how your project signs tokens and needs
no JWT secret configured.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .db import supabase

_bearer = HTTPBearer()


def get_current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    try:
        res = supabase.auth.get_user(creds.credentials)
        user = getattr(res, "user", None)
        if not user or not user.id:
            raise ValueError("no user")
        return user.id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
