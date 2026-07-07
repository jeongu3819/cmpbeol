import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env 를 로드 (config.py 기준 상위 backend 디렉터리)
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))

# DB 접속 URL 은 코드에 하드코딩하지 않고 .env 에서 읽는다.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Please check backend/.env")

# 앱 실행 시 없는 테이블만 생성할지 여부 (기본 false: 기존 DB/테이블 그대로 사용)
AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "false").lower() == "true"


class Settings(BaseSettings):
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: str = "uploads"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def upload_root(self) -> str:
        # 프로젝트 backend 디렉터리 기준 절대경로
        return (
            self.upload_dir
            if os.path.isabs(self.upload_dir)
            else os.path.join(_BACKEND_DIR, self.upload_dir)
        )

    @property
    def upload_steps_dir(self) -> str:
        return os.path.join(self.upload_root, "steps")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
