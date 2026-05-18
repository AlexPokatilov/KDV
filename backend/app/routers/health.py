from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    try:
        k8s = request.app.state.k8s
        k8s.ping()
        return {"status": "ok"}
    except Exception as exc:
        reason = getattr(exc, "detail", None) or str(exc)
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "reason": reason},
        )
