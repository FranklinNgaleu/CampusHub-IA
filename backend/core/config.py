from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Configuration de l'application."""
    
    # Base de données
    DATABASE_URL: str = "sqlite+aiosqlite:///./campushub.db"
    
    # Sécurité
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Application
    DEBUG: bool = True
    ENV: str = "development"
    
    # Email (optionnel)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    SEED_ON_STARTUP: bool = True

    model_config = SettingsConfigDict(
        env_file="../.env",  # ⚠️ Changement ici : cherche .env à la racine
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()