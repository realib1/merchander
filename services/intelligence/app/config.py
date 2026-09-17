from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    INTELLIGENCE_SERVICE_API_KEY: str = ""
    ALLOWED_ORIGINS: list[str] | str = ["http://localhost:3000"]

    # Supabase Database & PostgREST configuration
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # LLM Provider settings
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_PROVIDER: str = "gemini"  # "gemini" | "openai" | "offline"
    LLM_MODEL: str = "gemini-2.5-flash"

    # Redis & Celery Task Queue
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""

    @property
    def effective_celery_broker(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL

    @property
    def effective_celery_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    @field_validator("INTELLIGENCE_SERVICE_API_KEY")
    @classmethod
    def validate_api_key(cls, value: str, info) -> str:
        normalized = (value or "").strip()
        if info.data.get("ENVIRONMENT", "development").lower() == "production":
            if not normalized or normalized in {
                "dev_secret_key_change_in_production",
                "changeme",
                "change-me",
                "test_api_key_secret_123",
            }:
                raise ValueError(
                    "INTELLIGENCE_SERVICE_API_KEY must be set to a production secret value"
                )
        return normalized

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def has_llm_key(self) -> bool:
        return bool(self.GEMINI_API_KEY or self.OPENAI_API_KEY)


settings = Settings()
