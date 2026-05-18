from typing import Literal, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    kubeconfig_path: Optional[str] = None
    in_cluster: bool = False
    default_namespace: str = "default"
    static_dir: str = "/app/static"
    log_level: Literal["debug", "info", "warning", "error", "critical"] = "info"
    cors_origins: list[str] = ["*"]


settings = Settings()
