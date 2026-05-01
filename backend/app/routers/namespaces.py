from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/namespaces")
async def list_namespaces(request: Request):
    k8s = request.app.state.k8s
    namespaces = k8s.list_namespaces()
    return {"namespaces": namespaces}
