import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment (Render provides this)
# If DATABASE_URL is not set, use SQLite for local development (zero setup)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render/production provides DATABASE_URL (PostgreSQL)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
else:
    # Local development to use SQLite (no PostgreSQL install needed)
    SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{SQLITE_PATH}"
    print(f"📦 Using SQLite database at: {SQLITE_PATH}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Needed for multi-threaded access
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
