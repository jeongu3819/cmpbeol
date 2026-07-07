import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "cmp_guide"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: str = "uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def upload_root(self) -> str:
        # 프로젝트 backend 디렉터리 기준 절대경로
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        return self.upload_dir if os.path.isabs(self.upload_dir) else os.path.join(base, self.upload_dir)

    @property
    def upload_steps_dir(self) -> str:
        return os.path.join(self.upload_root, "steps")

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
