import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

# Decide which env file to load for local development.
# - APP_ENV=dev  -> .env
# - APP_ENV=prod -> prod.env
BASE_DIR = Path(__file__).resolve().parents[1]
raw_env = os.getenv("APP_ENV", "dev")
env_filename = ".env" if raw_env == "dev" else "prod.env"
ENV_PATH = BASE_DIR / env_filename
load_dotenv(dotenv_path=ENV_PATH)

class Settings:
    """
    Central app configuration loaded from environment variables.
    """

    def __init__(self) -> None:
        self.app_env: str = os.getenv("APP_ENV", "dev")

        # Database (Supabase – use transaction pooler URL for app traffic)
        self.database_url: str = os.getenv("DATABASE_URL", "")

        # Supabase project settings
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
        self.supabase_service_role_key: str = os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY", ""
        )
        self.supabase_storage_bucket: str = os.getenv(
            "SUPABASE_STORAGE_BUCKET", "profile-pictures"
        )
        self.supabase_media_bucket: str = os.getenv(
            "SUPABASE_MEDIA_BUCKET", "post-media"
        )

        # Auth
        self.supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")
        # Sentry (optional – init only when DSN is set)
        self.sentry_dsn: str = os.getenv("SENTRY_DSN", "")
        self.sentry_environment: str = os.getenv("SENTRY_ENVIRONMENT", self.app_env)

        # Basic safety check for critical vars in non-dev environments
        if self.app_env != "dev":
            missing = []
            if not self.database_url:
                missing.append("DATABASE_URL")
            if not self.supabase_jwt_secret:
                missing.append("SUPABASE_JWT_SECRET")
            if missing:
                raise RuntimeError(
                    f"Missing required environment variables in {self.app_env} "
                    f"environment: {', '.join(missing)}"
                )

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached Settings instance so env vars are only read once.
    """
    return Settings()
