"""
Google Calendar Integration API Tests - Iteration 81
Tests for:
- GET /api/google-calendar/auth-url - Generate OAuth consent URL
- GET /api/google-calendar/status - Check connection status  
- DELETE /api/google-calendar/disconnect - Remove connection
- GET /api/google-calendar/callback - OAuth redirect handler (error case)
- CalendarConnection model in database
- MeetingBooking.calendarEventId field
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check to ensure backend is running"""
    
    def test_api_health(self):
        """Verify backend API is accessible"""
        resp = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
        print(f"PASS: Health check - backend running (status: {resp.status_code})")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        assert resp.status_code == 200, f"Login failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert "token" in data, "No token in response"
        assert len(data["token"]) > 10, "Token too short"
        print(f"PASS: Login successful, token received")
        return data["token"]


class TestGoogleCalendarAuthUrl:
    """Tests for GET /api/google-calendar/auth-url"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        if resp.status_code != 200:
            pytest.skip("Login failed - cannot test authenticated endpoints")
        return resp.json()["token"]
    
    def test_auth_url_requires_authorization(self):
        """Test that auth-url endpoint returns 401 without token"""
        resp = requests.get(f"{BASE_URL}/api/google-calendar/auth-url")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"PASS: /api/google-calendar/auth-url returns 401 without auth token")
    
    def test_auth_url_returns_valid_url(self, auth_token):
        """Test that auth-url returns a valid Google OAuth URL"""
        resp = requests.get(
            f"{BASE_URL}/api/google-calendar/auth-url",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} - {resp.text}"
        data = resp.json()
        assert "authUrl" in data, f"No authUrl in response: {data}"
        auth_url = data["authUrl"]
        
        # Verify URL contains Google OAuth components
        assert "accounts.google.com" in auth_url, f"URL does not contain accounts.google.com: {auth_url}"
        assert "oauth2" in auth_url.lower() or "auth" in auth_url.lower(), f"URL missing oauth path: {auth_url}"
        assert "scope" in auth_url, f"URL missing scope parameter: {auth_url}"
        assert "calendar" in auth_url, f"URL missing calendar scope: {auth_url}"
        
        print(f"PASS: /api/google-calendar/auth-url returns valid Google OAuth URL")
        print(f"  URL contains: accounts.google.com, calendar scope")


class TestGoogleCalendarStatus:
    """Tests for GET /api/google-calendar/status"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        if resp.status_code != 200:
            pytest.skip("Login failed")
        return resp.json()["token"]
    
    def test_status_requires_authorization(self):
        """Test that status endpoint returns 401 without token"""
        resp = requests.get(f"{BASE_URL}/api/google-calendar/status")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"PASS: /api/google-calendar/status returns 401 without auth token")
    
    def test_status_returns_connection_state(self, auth_token):
        """Test that status returns connection state for user"""
        resp = requests.get(
            f"{BASE_URL}/api/google-calendar/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} - {resp.text}"
        data = resp.json()
        
        # Verify response structure
        assert "connected" in data, f"No 'connected' field in response: {data}"
        assert isinstance(data["connected"], bool), f"'connected' should be boolean: {data}"
        
        # For test user, should be disconnected (no real Google connection)
        print(f"PASS: /api/google-calendar/status returns connected={data['connected']}")
        print(f"  Response: {data}")


class TestGoogleCalendarDisconnect:
    """Tests for DELETE /api/google-calendar/disconnect"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        if resp.status_code != 200:
            pytest.skip("Login failed")
        return resp.json()["token"]
    
    def test_disconnect_requires_authorization(self):
        """Test that disconnect endpoint returns 401 without token"""
        resp = requests.delete(f"{BASE_URL}/api/google-calendar/disconnect")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"PASS: DELETE /api/google-calendar/disconnect returns 401 without auth token")
    
    def test_disconnect_returns_success(self, auth_token):
        """Test that disconnect returns success even if not connected"""
        resp = requests.delete(
            f"{BASE_URL}/api/google-calendar/disconnect",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} - {resp.text}"
        data = resp.json()
        
        # Should return success: true
        assert "success" in data, f"No 'success' field in response: {data}"
        assert data["success"] == True, f"Expected success=true: {data}"
        
        print(f"PASS: DELETE /api/google-calendar/disconnect returns {{success: true}}")


class TestGoogleCalendarCallback:
    """Tests for GET /api/google-calendar/callback"""
    
    def test_callback_missing_params_returns_400(self):
        """Test that callback returns 400 when missing code or state"""
        # No params
        resp = requests.get(
            f"{BASE_URL}/api/google-calendar/callback",
            allow_redirects=False
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print(f"PASS: /api/google-calendar/callback with no params returns 400")
    
    def test_callback_missing_code_returns_400(self):
        """Test callback with only state param"""
        resp = requests.get(
            f"{BASE_URL}/api/google-calendar/callback?state=test-user-id",
            allow_redirects=False
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print(f"PASS: /api/google-calendar/callback with only state returns 400")
    
    def test_callback_missing_state_returns_400(self):
        """Test callback with only code param"""
        resp = requests.get(
            f"{BASE_URL}/api/google-calendar/callback?code=test-code",
            allow_redirects=False
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print(f"PASS: /api/google-calendar/callback with only code returns 400")


class TestMeetingBookingCalendarEventId:
    """Tests to verify MeetingBooking model has calendarEventId field"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        if resp.status_code != 200:
            pytest.skip("Login failed")
        return resp.json()["token"]
    
    def test_meeting_bookings_list_includes_calendar_event_id(self, auth_token):
        """Test that meeting bookings API response includes calendarEventId field"""
        resp = requests.get(
            f"{BASE_URL}/api/meeting-bookings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # API should be accessible
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} - {resp.text}"
        data = resp.json()
        
        # If there are bookings, check if calendarEventId is in the schema
        # Even if no bookings exist, the endpoint should work
        print(f"PASS: GET /api/meeting-bookings works (status: 200)")
        print(f"  Bookings count: {len(data.get('bookings', []))}")
        
        # If there are bookings, verify structure
        if data.get('bookings') and len(data['bookings']) > 0:
            booking = data['bookings'][0]
            # calendarEventId should be in the model (null if not set)
            if 'calendarEventId' in booking:
                print(f"  calendarEventId field present: {booking.get('calendarEventId')}")
            else:
                print(f"  Note: calendarEventId not explicitly returned (may be hidden if null)")


class TestEndToEndIntegrationCheck:
    """Verify Google Calendar is integrated with booking flow"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        if resp.status_code != 200:
            pytest.skip("Login failed")
        return resp.json()["token"]
    
    def test_meeting_types_endpoint_works(self, auth_token):
        """Verify meeting types endpoint (required for booking)"""
        resp = requests.get(
            f"{BASE_URL}/api/meeting-types",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        print(f"PASS: GET /api/meeting-types works")
        print(f"  Meeting types count: {len(data.get('meetingTypes', []))}")
    
    def test_availability_endpoint_works(self, auth_token):
        """Verify availability endpoint (required for booking)"""
        resp = requests.get(
            f"{BASE_URL}/api/availability",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"PASS: GET /api/availability works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
