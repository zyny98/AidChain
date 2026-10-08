"""
AIDCHAIN — Proof of Aid
FastAPI backend application
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, campaigns, donations, milestones, ai_validation, admin

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AIDCHAIN backend starting — Proof of Aid Platform")
    yield
    logger.info("🛑 AIDCHAIN backend shutting down")


app = FastAPI(
    title="AIDCHAIN — Proof of Aid API",
    description="""
    Blockchain platform for transparent humanitarian aid tracking.
    Supply chain: Donor → NGO → Supplier → Distributor → Beneficiary.
    AI verifies procurement receipts, delivery notes and distribution reports.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(donations.router)
app.include_router(milestones.router)
app.include_router(ai_validation.router)
app.include_router(admin.router)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": "AIDCHAIN — Proof of Aid",
        "version": "1.0.0",
    }
