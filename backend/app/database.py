from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.engine import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from .config import get_settings

settings = get_settings()

# Create a synchronous SQLAlchemy engine.
engine: Engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FastAPI dependency that provides a database session.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def db_session():
    """
    Context manager for ad-hoc scripts or health checks.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def db_health_check() -> bool:
    """
    Simple health check that attempts a trivial query.
    """
    try:
        with db_session() as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
