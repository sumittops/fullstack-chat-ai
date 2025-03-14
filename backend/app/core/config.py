# File with environment variables and general configuration logic.
# Env variables are combined in nested groups like "Security", "Database" etc.
# So environment variable (case-insensitive) for jwt_secret_key will be "security__jwt_secret_key"
#
# Pydantic priority ordering:
#
# 1. (Most important, will overwrite everything) - environment variables
# 2. `.env` file in root folder of project
# 3. Default values
#
# "sqlalchemy_database_uri" is computed field that will create valid database URL
#
# See https://pydantic-docs.helpmanual.io/usage/settings/
# Note, complex types like lists are read as json-encoded strings.


from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

from pydantic import BaseModel, SecretStr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import URL
from app.core.logger import get_logger


PROJECT_DIR = Path(__file__).parent.parent.parent
_logger = get_logger(__name__)


class Security(BaseModel):
    jwt_issuer: str = "meowwchat"
    jwt_secret_key: SecretStr
    jwt_access_token_expire_secs: int = 24 * 3600  # 1d
    refresh_token_expire_secs: int = 28 * 24 * 3600  # 28d
    password_bcrypt_rounds: int = 12
    allowed_hosts: list[str] = ["localhost", "127.0.0.1"]
    backend_cors_origins: list[str] = ["*"]


class Storage(BaseModel):
    source_bucket: str
    sink_bucket: str


class Database(BaseModel):
    hostname: str = "postgres"
    username: str = "postgres"
    password: SecretStr
    port: int = 5432
    db: str = "postgres"


class AppConfig(BaseModel):
    openai_api_key: SecretStr


class Settings(BaseSettings):
    security: Security
    appconfig: AppConfig
    database: Database
    # storage: Storage

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_uri(self) -> URL:
        uri = URL.create(
            drivername="postgresql+asyncpg",
            username=self.database.username,
            password=self.database.password.get_secret_value(),
            host=self.database.hostname,
            port=self.database.port,
            database=self.database.db,
        )
        _logger.info(f"connect to db {uri}")
        return uri

    @computed_field  # type: ignore[misc]
    @property
    def migrations_database_uri(self) -> str:
        password = quote(self.database.password.get_secret_value())
        db_uri = f"postgresql+asyncpg://{self.database.username}:password@/{self.database.db}?host={self.database.hostname}&port={self.database.port}&password={password}"
        return db_uri

    model_config = SettingsConfigDict(
        env_file=f"{PROJECT_DIR}/.env",
        case_sensitive=False,
        env_nested_delimiter="__",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore
