import os
import secrets
import logging
from pydantic import model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger("commilk.config")

class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    API_VERSION: str = "v1"
    SECRET_KEY: str  # No default, forces setting in .env
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    ADMIN_EMAIL: str  # Used to auto-assign malik role

    # Supabase (No defaults)
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_ANON_KEY: str

    # LLM
    GROQ_API_KEY: str = ""
    TOGETHER_API_KEY: str = ""

    # Email (Resend)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@commilk.com"
    FRONTEND_URL: str = "http://localhost:5173"

    @model_validator(mode="after")
    def validate_security(self):
        WEAK_KEYS = {
            "generate-a-strong-random-key-and-put-it-here",
            "super_secret_key_change_me_in_prod",
            "secret",
            "changeme",
            "",
        }
        if self.SECRET_KEY in WEAK_KEYS or len(self.SECRET_KEY) < 32:
            if self.ENVIRONMENT == "production":
                raise ValueError("SECRET_KEY is weak or placeholder. Set a strong 32+ char key in .env")
            else:
                logger.warning(
                    "[SECURITY] SECRET_KEY is weak! Run: "
                    "python -c \"import secrets; print(secrets.token_hex(32))\" "
                    "and update .env"
                )
        if self.ADMIN_EMAIL.lower() in {"admin@example.com", "", "your_admin@gmail.com"}:
            logger.warning("[SECURITY] ADMIN_EMAIL looks like a placeholder. Update .env")
        return self

    class Config:
        env_file = ".env"

settings = Settings()
