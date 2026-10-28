import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.core.exceptions import ProposalCraftException
from backend.app.api.v1 import api_router
from backend.app.seed import seed_initial_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and run safe dev seeds
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Run initial seed for default admin, starter template, and sample approved packages
    try:
        await seed_initial_data()
    except Exception as e:
        print(f"[Seed Notice] Initial seed encountered: {e}")

    yield

    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Proposal & SOW Drafting Assistant powered by NVIDIA NIM hosted inference with strict commercial integrity protection.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handling
@app.exception_handler(ProposalCraftException)
async def proposalcraft_exception_handler(request: Request, exc: ProposalCraftException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Mount REST API v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/system/health",
        "ai_status": "/api/v1/system/ai-status"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
