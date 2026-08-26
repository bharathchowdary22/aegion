from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aegion API"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://user:password@postgres:5432/aegion"
    
    # Cache Configuration
    REDIS_URL: str = "redis://redis:6379/0"
    
    # AI API Keys
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-5.6-luna"
    
    # Supabase / Auth Configuration
    SUPABASE_URL: str = ""
    SUPABASE_AUDIENCE: str = "authenticated"
    
    # Frontend Configuration
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
