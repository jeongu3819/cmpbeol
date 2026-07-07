import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models  # noqa: F401  (Base.metadata 등록용)
from .config import AUTO_CREATE_TABLES, settings
from .database import Base, engine
from .routers import guides, import_router

app = FastAPI(
    title="트러블슈팅 가이드 관리 API",
    description="설비모델별 알람/인터락 조치 가이드(Step Flow) 지식관리 MVP",
    version="2.0.0",
)

# 기존 HeidiSQL cmpbeol DB/테이블을 그대로 사용한다.
# AUTO_CREATE_TABLES=true 일 때만, 없는 테이블을 생성한다. (기존 테이블/데이터는 건드리지 않음)
if AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 이미지 정적 서빙
os.makedirs(settings.upload_steps_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_root), name="uploads")

app.include_router(guides.router)
app.include_router(import_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
