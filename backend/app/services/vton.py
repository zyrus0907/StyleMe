"""Provider-agnostic Virtual Try-On adapter.

Default provider is fal.ai with Kling Kolors v1.5. The model id is a config
value, so you can swap to CatVTON (fal-ai/cat-vton) or another provider
without touching API/business logic.

fal.ai Kolors expects:
    human_image_url, garment_image_url
fal.ai CatVTON additionally expects:
    cloth_type: "upper" | "lower" | "overall"
"""
from typing import Optional
import fal_client

from ..config import settings


def generate_tryon(
    base_image_url: str,
    garment_image_url: str,
    cloth_type: Optional[str] = None,
) -> str:
    """Run a try-on and return the result image URL. Blocking call; run inside
    a BackgroundTask (MVP) or a worker (later)."""
    arguments = {
        "human_image_url": base_image_url,
        "garment_image_url": garment_image_url,
    }
    # CatVTON-style models need a cloth_type; Kolors ignores extras.
    if cloth_type and "cat-vton" in settings.VTON_MODEL:
        arguments["cloth_type"] = cloth_type

    result = fal_client.subscribe(
        settings.VTON_MODEL,
        arguments=arguments,
        with_logs=False,
    )
    # fal returns { "image": { "url": ... } } for these endpoints
    image = result.get("image") or {}
    url = image.get("url")
    if not url:
        raise RuntimeError(f"VTON returned no image: {result}")
    return url
