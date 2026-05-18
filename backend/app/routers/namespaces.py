from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/namespaces")
async def list_namespaces(request: Request):
    k8s = request.app.state.k8s
    try:
        namespaces = k8s.list_namespaces()
        return {"namespaces": namespaces}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
