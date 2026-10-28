import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "ProposalCraft AI"
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./proposalcraft.db"
    
    # JWT
    JWT_SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-12345678"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # NVIDIA NIM LLM Integration
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    # Tested, active NVIDIA hosted models
    NVIDIA_MODEL: str = "meta/llama-3.3-70b-instruct"
    NVIDIA_TIMEOUT_SECONDS: int = 90
    NVIDIA_MAX_RETRIES: int = 3
    
    # URLs and CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]
    
    # File Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    UPLOAD_MAX_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["txt", "pdf", "docx"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
