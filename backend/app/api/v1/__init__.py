from fastapi import APIRouter
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.clients import router as clients_router
from backend.app.api.v1.projects import router as projects_router
from backend.app.api.v1.discovery import router as discovery_router
from backend.app.api.v1.packages import router as packages_router
from backend.app.api.v1.templates import router as templates_router
from backend.app.api.v1.proposals import router as proposals_router
from backend.app.api.v1.questions import router as questions_router
from backend.app.api.v1.system import router as system_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(clients_router, prefix="/clients", tags=["Clients"])
api_router.include_router(projects_router, prefix="/projects", tags=["Projects"])
api_router.include_router(discovery_router, prefix="/projects", tags=["Discovery & Ingestion"])
api_router.include_router(packages_router, prefix="/packages", tags=["Service Packages Catalog"])
api_router.include_router(templates_router, prefix="/templates", tags=["Proposal Templates"])
api_router.include_router(proposals_router, prefix="/proposals", tags=["Proposals & SOW"])
api_router.include_router(questions_router, prefix="/proposals", tags=["Confirmation Questions"])
api_router.include_router(system_router, prefix="/system", tags=["System & Health"])

