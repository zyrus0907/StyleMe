from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    FAL_KEY: str = ""
    VTON_MODEL: str = "fal-ai/kling/v1-5/kolors-virtual-try-on"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    STORAGE_BUCKET: str = "fashion"

    PER_USER_MONTHLY_TRYON_CAP: int = 100

    class Config:
        env_file = ".env"


settings = Settings()
