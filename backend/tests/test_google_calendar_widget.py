"""
Test Google Calendar Widget API endpoints
Tests for the new dashboard Calendar Connection Widget feature
"""
import pytest
import requests

BASE_URL = "https://hardened-crm-2.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestGoogleCalendarStatus:
    """Test /api/google-calendar/status endpoint"""
    
    def test_status_requires_auth(self):
        """Status endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/status")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_status_returns_connection_info(self, auth_headers):
        """Status endpoint should return connection status"""
        response = requests.get(
            f"{BASE_URL}/api/google-calendar/status",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Status check failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "connected" in data, "Response should have 'connected' field"
        assert isinstance(data["connected"], bool), "'connected' should be boolean"
        
        # For test user, calendar is likely not connected
        if not data["connected"]:
            assert data.get("provider") is None or data.get("provider") is None
        else:
            assert "provider" in data


class TestGoogleCalendarAuthUrl:
    """Test /api/google-calendar/auth-url endpoint"""
    
    def test_auth_url_requires_auth(self):
        """Auth URL endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/auth-url")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_auth_url_returns_valid_url(self, auth_headers):
        """Auth URL endpoint should return a valid Google OAuth URL"""
        response = requests.get(
            f"{BASE_URL}/api/google-calendar/auth-url",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Auth URL request failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "authUrl" in data, "Response should have 'authUrl' field"
        auth_url = data["authUrl"]
        
        # Verify it's a Google OAuth URL
        assert auth_url.startswith("https://accounts.google.com/"), f"Expected Google OAuth URL, got: {auth_url[:100]}"
        assert "oauth2" in auth_url.lower() or "auth" in auth_url.lower(), "URL should contain oauth2 or auth"
        assert "client_id" in auth_url or "response_type" in auth_url, "URL should have OAuth parameters"


class TestGoogleCalendarDisconnect:
    """Test /api/google-calendar/disconnect endpoint"""
    
    def test_disconnect_requires_auth(self):
        """Disconnect endpoint should require authentication"""
        response = requests.delete(f"{BASE_URL}/api/google-calendar/disconnect")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_disconnect_returns_success(self, auth_headers):
        """Disconnect endpoint should return success even if not connected"""
        response = requests.delete(
            f"{BASE_URL}/api/google-calendar/disconnect",
            headers=auth_headers
        )
        # Should succeed even if not connected (idempotent)
        assert response.status_code == 200, f"Disconnect failed: {response.text}"
        data = response.json()
        assert data.get("success"), "Response should indicate success"


class TestCalendarWidgetIntegration:
    """Integration tests for the Calendar Widget flow"""
    
    def test_full_widget_flow(self, auth_headers):
        """Test the complete widget flow: check status -> get auth URL"""
        # Step 1: Check initial status
        status_response = requests.get(
            f"{BASE_URL}/api/google-calendar/status",
            headers=auth_headers
        )
        assert status_response.status_code == 200
        status_data = status_response.json()
        initial_connected = status_data.get("connected", False)
        
        # Step 2: Get auth URL (simulating Connect button click)
        auth_response = requests.get(
            f"{BASE_URL}/api/google-calendar/auth-url",
            headers=auth_headers
        )
        assert auth_response.status_code == 200
        auth_data = auth_response.json()
        assert "authUrl" in auth_data
        
        # Step 3: Verify auth URL contains required OAuth parameters
        auth_url = auth_data["authUrl"]
        assert "scope" in auth_url, "Auth URL should have scope parameter"
        assert "redirect_uri" in auth_url, "Auth URL should have redirect_uri parameter"
        
        print(f"Initial connected status: {initial_connected}")
        print(f"Auth URL generated successfully: {auth_url[:80]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
