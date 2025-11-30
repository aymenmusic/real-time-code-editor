import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment (Render provides this)
# If DATABASE_URL is not set, construct from individual parameters (for local dev)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render provides DATABASE_URL
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
else:
    # Local development - construct from individual parameters
    DB_USER = os.getenv("DB_USER", "code_editor_user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password123")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "code_editor_db")
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
