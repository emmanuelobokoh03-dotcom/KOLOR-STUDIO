"""
Backend Tests for Password Reset Feature
Tests: forgot-password and reset-password endpoints
"""
import pytest
import requests
import os
import time
import hashlib

BASE_URL = "https://crm-ready-go.preview.emergentagent.com"

# Test user credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestForgotPassword:
    """Tests for POST /api/auth/forgot-password endpoint"""
    
    def test_forgot_password_success_existing_email(self):
        """Test forgot password returns success message for existing email (prevents enumeration)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": TEST_EMAIL}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert "receive" in data["message"].lower() or "reset" in data["message"].lower()
        print(f"✓ Forgot password returns success: {data['message']}")
    
    def test_forgot_password_success_nonexistent_email(self):
        """Test forgot password returns same success message for non-existent email (prevents enumeration)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent_user_test_12345@example.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        # Should return the same message to prevent email enumeration
        assert "receive" in data["message"].lower() or "reset" in data["message"].lower()
        print(f"✓ Non-existent email returns same success message (prevents enumeration)")
    
    def test_forgot_password_empty_email(self):
        """Test forgot password rejects empty email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ""}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data or "message" in data
        print(f"✓ Empty email returns 400 with error")
    
    def test_forgot_password_missing_email(self):
        """Test forgot password rejects missing email field"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data or "message" in data
        print(f"✓ Missing email field returns 400")
    
    def test_forgot_password_rate_limiting(self):
        """Test rate limiting: 4th request should be blocked within 1 hour window"""
        # Use a unique test email for rate limiting test
        test_email = f"rate_limit_test_{int(time.time())}@example.com"
        
        # Send 3 requests (should succeed)
        for i in range(3):
            response = requests.post(
                f"{BASE_URL}/api/auth/forgot-password",
                json={"email": test_email}
            )
            assert response.status_code == 200, f"Request {i+1} failed: {response.status_code}"
            print(f"  Request {i+1}/3: Success (200)")
        
        # 4th request should be rate limited (429)
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": test_email}
        )
        assert response.status_code == 429, f"Expected 429 (rate limited), got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data or "message" in data
        assert "too many" in data.get("message", "").lower() or "too many" in data.get("error", "").lower()
        print(f"✓ Rate limiting works: 4th request blocked with 429")


class TestResetPassword:
    """Tests for POST /api/auth/reset-password endpoint"""
    
    def test_reset_password_invalid_token(self):
        """Test reset password rejects invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "invalid_token_12345",
                "password": "NewPassword123!"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data or "message" in data
        assert "invalid" in data.get("message", "").lower() or "expired" in data.get("message", "").lower()
        print(f"✓ Invalid token returns 400: {data.get('message')}")
    
    def test_reset_password_expired_token(self):
        """Test reset password rejects expired/non-existent token"""
        # Use a random-looking token that doesn't exist
        fake_token = hashlib.sha256(b"nonexistent_token").hexdigest()
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": fake_token,
                "password": "NewPassword123!"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "invalid" in data.get("message", "").lower() or "expired" in data.get("message", "").lower()
        print(f"✓ Non-existent token returns 400: {data.get('message')}")
    
    def test_reset_password_short_password(self):
        """Test reset password rejects passwords shorter than 8 characters"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "some_token_value",
                "password": "short"  # Only 5 characters
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "8 characters" in data.get("message", "").lower() or "password" in data.get("message", "").lower()
        print(f"✓ Short password (<8 chars) returns 400: {data.get('message')}")
    
    def test_reset_password_missing_token(self):
        """Test reset password rejects missing token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "password": "ValidPassword123!"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data.get("message", "").lower() or "required" in data.get("message", "").lower()
        print(f"✓ Missing token returns 400: {data.get('message')}")
    
    def test_reset_password_missing_password(self):
        """Test reset password rejects missing password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "some_token_value"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "password" in data.get("message", "").lower() or "required" in data.get("message", "").lower()
        print(f"✓ Missing password returns 400: {data.get('message')}")


class TestLoginIntegration:
    """Test login still works after password reset feature implementation"""
    
    def test_login_existing_user(self):
        """Test login with existing user still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL.lower()
        print(f"✓ Login still works after password reset feature")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
