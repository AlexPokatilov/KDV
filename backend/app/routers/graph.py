import re

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.graph import GraphResponse
from app.services.dependency_resolver import build_graph

router = APIRouter()

_NS_RE = re.compile(r"^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$")


@router.get("/graph", response_model=GraphResponse)
async def get_graph(
    request: Request,
    namespace: str = Query(default="default", description="Kubernetes namespace"),
):
    if not _NS_RE.match(namespace):
        raise HTTPException(status_code=422, detail="Invalid namespace name")
    k8s = request.app.state.k8s
    try:
        return build_graph(namespace=namespace, k8s=k8s)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc
