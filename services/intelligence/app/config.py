from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    INTELLIGENCE_SERVICE_API_KEY: str = "dev_secret_key_change_in_production"
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]

    # Supabase Database & PostgREST configuration
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # LLM Provider settings
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_PROVIDER: str = "gemini"  # "gemini" | "openai" | "offline"
    LLM_MODEL: str = "gemini-2.5-flash"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def has_llm_key(self) -> bool:
        return bool(self.GEMINI_API_KEY or self.OPENAI_API_KEY)


settings = Settings()
