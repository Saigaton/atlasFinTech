from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "sua-chave-secreta-troque-em-producao-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
