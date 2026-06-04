"""VTON dispatcher: routes to fal.ai or Gemini based on VTON_PROVIDER."""
import os
from typing import Optional

import fal_client

from ..config import settings

if settings.FAL_KEY:
    os.environ["FAL_KEY"] = settings.FAL_KEY


def _fal(base_image_url: str, garment_image_url: str, cloth_type: Optional[str]) -> str:
    arguments = {"human_image_url": base_image_url, "garment_image_url": garment_image_url}
    if cloth_type and "cat-vton" in settings.VTON_MODEL:
        arguments["cloth_type"] = cloth_type
    result = fal_client.subscribe(settings.VTON_MODEL, arguments=arguments, with_logs=False)
    image = result.get("image") or {}
    url = image.get("url")
    if not url:
        raise RuntimeError(f"VTON returned no image: {result}")
    return url


def generate_tryon(base_image_url: str, garment_image_url: str, cloth_type: Optional[str] = None) -> str:
    if settings.VTON_PROVIDER == "gemini":
        from .vton_gemini import generate_tryon_gemini
        return generate_tryon_gemini(base_image_url, garment_image_url)
    return _fal(base_image_url, garment_image_url, cloth_type)