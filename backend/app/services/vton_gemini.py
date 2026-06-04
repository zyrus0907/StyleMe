"""Gemini (Nano Banana) try-on adapter.

Gemini is a general image editor, not a dedicated try-on model, so quality
varies. It returns image bytes, which we upload to Supabase and return a
signed URL for (so the rest of the app behaves the same as with fal.ai).
"""
import uuid

import httpx
from google import genai
from google.genai import types

from ..config import settings
from . import storage

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


PROMPT = (
    "Create a photorealistic image of the person in the first image wearing the "
    "garment shown in the second image. Keep the person's face, hair, body shape, "
    "skin tone, and pose exactly the same. Only replace their clothing with the garment."
)


def _fetch(url: str) -> bytes:
    r = httpx.get(url, timeout=60, follow_redirects=True)
    r.raise_for_status()
    return r.content


def generate_tryon_gemini(base_image_url: str, garment_image_url: str) -> str:
    person = _fetch(base_image_url)
    garment = _fetch(garment_image_url)

    resp = _get_client().models.generate_content(
        model=settings.GEMINI_IMAGE_MODEL,
        contents=[
            types.Part.from_bytes(data=person, mime_type="image/jpeg"),
            types.Part.from_bytes(data=garment, mime_type="image/jpeg"),
            PROMPT,
        ],
    )

    image_bytes = None
    for part in resp.candidates[0].content.parts:
        inline = getattr(part, "inline_data", None)
        if inline and inline.data:
            image_bytes = inline.data
            break
    if not image_bytes:
        raise RuntimeError("Gemini returned no image (it may have refused or hit a limit)")

    path = f"results/{uuid.uuid4()}.png"
    storage.upload_bytes(path, image_bytes, "image/png")
    return storage.signed_read_url(path)