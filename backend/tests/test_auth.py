import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database.database import Base, get_db
from models.user import User
from auth.utils import get_password_hash

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override the database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with overridden database"""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


class TestUserRegistration:
    """Test user registration endpoints"""

    def test_register_new_user(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "id" in data

    def test_register_duplicate_username(self, client):
        """Test registration with duplicate username fails"""
        # Register first user
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test1@example.com",
                "password": "TestPass123!",
            },
        )

        # Try to register with same username
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test2@example.com",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]

    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email fails"""
        # Register first user
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser1",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )

        # Try to register with same email
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser2",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "invalid-email",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test user login endpoints"""

    def test_login_success(self, client):
        """Test successful login"""
        # Register a user first
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )

        # Try to login
        response = client.post(
            "/api/auth/login",
            data={
                "username": "testuser",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        """Test login with wrong password fails"""
        # Register a user first
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )

        # Try to login with wrong password
        response = client.post(
            "/api/auth/login",
            data={
                "username": "testuser",
                "password": "WrongPassword123!",
            },
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user fails"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""

    def test_get_current_user(self, client):
        """Test getting current user info"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )

        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "testuser",
                "password": "TestPass123!",
            },
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"

    def test_get_current_user_without_token(self, client):
        """Test getting current user without token fails"""
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token fails"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401
