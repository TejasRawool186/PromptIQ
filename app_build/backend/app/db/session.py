import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

logger = logging.getLogger("promptiq.db")
settings = get_settings()

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# SQLite/PostgreSQL unified engine setup
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency injector yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all relational tables defined in SQLAlchemy metadata and seed defaults."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas initialized successfully")
        
        # Seed default developer user for CLI/IDE usage
        from app.db.models import User
        db = SessionLocal()
        try:
            default_user = db.query(User).filter(User.id == "default_user").first()
            if not default_user:
                default_user = User(
                    id="default_user",
                    email="developer@promptiq.dev",
                    name="Default Developer",
                    picture="https://lh3.googleusercontent.com/a/default-user"
                )
                db.add(default_user)
                db.commit()
                logger.info("Seeded default developer user account")
        finally:
            db.close()
            
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", exc)
