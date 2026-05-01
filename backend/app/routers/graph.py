from fastapi import APIRouter, Query, Request

from app.models.graph import GraphResponse
from app.services.dependency_resolver import build_graph

router = APIRouter()


@router.get("/graph", response_model=GraphResponse)
async def get_graph(
    request: Request,
    namespace: str = Query(default="default", description="Kubernetes namespace"),
):
    k8s = request.app.state.k8s
    return build_graph(namespace=namespace, k8s=k8s)
