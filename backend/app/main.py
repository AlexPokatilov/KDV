import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import graph, health, namespaces
from app.services.k8s_client import KubernetesClient

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.k8s = KubernetesClient(settings)
    yield


app = FastAPI(title="KDV - Kubernetes Dependency Viewer", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(namespaces.router, prefix="/api")
app.include_router(graph.router, prefix="/api")

static_dir = Path(settings.static_dir)
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
    logger.info("Serving static files from %s", static_dir)
else:
    logger.info("Static dir %s not found — frontend served separately", static_dir)
