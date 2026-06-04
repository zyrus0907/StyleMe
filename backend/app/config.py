from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VTON_PROVIDER: str = "fal"  # "fal" or "gemini"

    FAL_KEY: str = ""
    VTON_MODEL: str = "fal-ai/kling/v1-5/kolors-virtual-try-on"

    GEMINI_API_KEY: str = ""
    GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    STORAGE_BUCKET: str = "fashion"

    PER_USER_MONTHLY_TRYON_CAP: int = 100

    class Config:
        env_file = ".env"


settings = Settings()