"""
Async SQLAlchemy engine + session factory + Supabase client.
Uses asyncpg driver for PostgreSQL.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from supabase import AsyncClient, acreate_client

from app.config import settings

logger = logging.getLogger(__name__)

# ─── SQLAlchemy ─────────────────────────────────────────────────────────────────

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency – yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (for dev/testing only; production uses Alembic)."""
    async with engine.begin() as conn:
        # Import all models so Base.metadata knows about them
        from app.models import (  # noqa: F401
            campaign,
            donation,
            milestone,
            notification,
            report,
            user,
            validation,
            vendor,
        )
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")


# ─── Supabase ───────────────────────────────────────────────────────────────────

_supabase_client: AsyncClient | None = None


async def get_supabase() -> AsyncClient:
    """Return a cached Supabase async client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = await acreate_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
        )
        logger.info("Supabase async client initialized.")
    return _supabase_client


async def close_supabase() -> None:
    """Close Supabase client on app shutdown."""
    global _supabase_client
    if _supabase_client is not None:
        await _supabase_client.auth.sign_out()
        _supabase_client = None
        logger.info("Supabase client closed.")
