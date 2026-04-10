import pytest
from auth.utils import get_password_hash, verify_password


class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_hash_password(self):
        """Test that password hashing works"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        # Hash should be different from original password
        assert hashed != password

        # Hash should be a string
        assert isinstance(hashed, str)

        # Hash should have reasonable length (bcrypt hashes are typically 60 chars)
        assert len(hashed) > 50

    def test_verify_correct_password(self):
        """Test verification of correct password"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        # Correct password should verify successfully
        assert verify_password(password, hashed) is True

    def test_verify_incorrect_password(self):
        """Test verification of incorrect password"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        # Incorrect password should fail verification
        assert verify_password("WrongPassword!", hashed) is False

    def test_same_password_different_hashes(self):
        """Test that same password produces different hashes (due to salt)"""
        password = "TestPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to random salt
        assert hash1 != hash2

        # But both should verify the original password
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_empty_password(self):
        """Test handling of empty password"""
        password = ""
        hashed = get_password_hash(password)

        # Should still hash empty password
        assert hashed != ""
        assert verify_password("", hashed) is True
        assert verify_password("not empty", hashed) is False
