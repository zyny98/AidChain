"""
AIDCHAIN application configuration.
All secrets are loaded from environment variables or .env file.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "AIDCHAIN — Proof of Aid API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Security
    JWT_SECRET_KEY: str = "aidchain-demo-secret-key-change-in-production-32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h for demo

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Database (optional for demo — uses in-memory data)
    DATABASE_URL: str = "sqlite+aiosqlite:///./aidchain_demo.db"

    # AI
    OPENAI_API_KEY: str = ""

    # Oracle (ECDSA key for signing milestone decisions)
    ORACLE_PRIVATE_KEY: str = ""

    # Blockchain
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"
    MOCK_USDC_ADDRESS: str = "0x0000000000000000000000000000000000000001"
    RPC_URL: str = "http://localhost:8545"
    CHAIN_ID: int = 31337  # Hardhat local network

    # Supabase (optional)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
