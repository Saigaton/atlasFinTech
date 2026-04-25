
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str 
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    RESEND_API_KEY: str

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
