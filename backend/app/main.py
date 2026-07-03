from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import alarm_guides, import_router, interlock_guides

app = FastAPI(
    title="설비 알람/인터락 조치 가이드 관리 API",
    description="CMP 설비 알람/인터락 조치방법 지식관리 MVP",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alarm_guides.router)
app.include_router(interlock_guides.router)
app.include_router(import_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
