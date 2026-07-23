from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, EmailStr, validator
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "TRYVIA"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "development-secret-key-replace-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "tryvia"
    POSTGRES_PORT: str = "5432"
    
    @property
    def sync_database_uri(self) -> str:
        return "sqlite:///./tryvia.db"
        
    @property
    def async_database_uri(self) -> str:
        return "sqlite+aiosqlite:///./tryvia.db"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
