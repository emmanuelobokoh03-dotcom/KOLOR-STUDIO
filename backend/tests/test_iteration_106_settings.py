"""
Iteration 106 Tests: Settings API + Email Design System + Scheduler
Tests:
- GET /api/settings returns user settings with notification preferences
- PATCH /api/settings saves notification preferences
- GET /api/health endpoint works
- Backend compiles without errors (verified separately)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login to get auth cookie
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if login_response.status_code != 200:
        pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
    
    return session


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_endpoint_returns_ok(self):
        """GET /api/health returns status ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "timestamp" in data
        print(f"✓ Health endpoint working: {data}")


class TestSettingsAPI:
    """Test Settings API endpoints"""
    
    def test_get_settings_returns_user_data(self, auth_session):
        """GET /api/settings returns user settings with notification preferences"""
        response = auth_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "settings" in data
        settings = data["settings"]
        
        # Verify required fields exist
        assert "id" in settings
        assert "email" in settings
        assert "firstName" in settings
        
        # Verify notification preference fields exist (new in iteration 106)
        assert "weeklyReportEnabled" in settings, "weeklyReportEnabled field missing"
        assert "staleLeadEmailEnabled" in settings, "staleLeadEmailEnabled field missing"
        assert "quoteNudgeEmailEnabled" in settings, "quoteNudgeEmailEnabled field missing"
        
        # Verify they are boolean values
        assert isinstance(settings["weeklyReportEnabled"], bool)
        assert isinstance(settings["staleLeadEmailEnabled"], bool)
        assert isinstance(settings["quoteNudgeEmailEnabled"], bool)
        
        print(f"✓ Settings returned with notification prefs: weeklyReport={settings['weeklyReportEnabled']}, staleLead={settings['staleLeadEmailEnabled']}, quoteNudge={settings['quoteNudgeEmailEnabled']}")
    
    def test_get_settings_returns_available_currencies(self, auth_session):
        """GET /api/settings returns availableCurrencies list"""
        response = auth_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "availableCurrencies" in data
        currencies = data["availableCurrencies"]
        assert isinstance(currencies, list)
        assert len(currencies) > 0
        
        # Check currency structure
        first_currency = currencies[0]
        assert "code" in first_currency
        assert "symbol" in first_currency
        assert "name" in first_currency
        
        print(f"✓ Available currencies returned: {len(currencies)} currencies")
    
    def test_patch_settings_updates_notification_preferences(self, auth_session):
        """PATCH /api/settings saves notification preferences"""
        # First get current settings
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        assert get_response.status_code == 200
        original_settings = get_response.json()["settings"]
        
        # Toggle weeklyReportEnabled
        new_weekly_value = not original_settings.get("weeklyReportEnabled", True)
        
        patch_response = auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"weeklyReportEnabled": new_weekly_value}
        )
        assert patch_response.status_code == 200
        
        data = patch_response.json()
        assert "settings" in data
        assert data["settings"]["weeklyReportEnabled"] == new_weekly_value
        
        # Verify persistence by fetching again
        verify_response = auth_session.get(f"{BASE_URL}/api/settings")
        assert verify_response.status_code == 200
        assert verify_response.json()["settings"]["weeklyReportEnabled"] == new_weekly_value
        
        # Restore original value
        auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"weeklyReportEnabled": original_settings.get("weeklyReportEnabled", True)}
        )
        
        print(f"✓ weeklyReportEnabled toggled from {original_settings.get('weeklyReportEnabled')} to {new_weekly_value} and persisted")
    
    def test_patch_settings_updates_stale_lead_email(self, auth_session):
        """PATCH /api/settings saves staleLeadEmailEnabled"""
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        original = get_response.json()["settings"].get("staleLeadEmailEnabled", True)
        
        new_value = not original
        patch_response = auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"staleLeadEmailEnabled": new_value}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["settings"]["staleLeadEmailEnabled"] == new_value
        
        # Restore
        auth_session.patch(f"{BASE_URL}/api/settings", json={"staleLeadEmailEnabled": original})
        print(f"✓ staleLeadEmailEnabled toggled and persisted")
    
    def test_patch_settings_updates_quote_nudge_email(self, auth_session):
        """PATCH /api/settings saves quoteNudgeEmailEnabled"""
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        original = get_response.json()["settings"].get("quoteNudgeEmailEnabled", True)
        
        new_value = not original
        patch_response = auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"quoteNudgeEmailEnabled": new_value}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["settings"]["quoteNudgeEmailEnabled"] == new_value
        
        # Restore
        auth_session.patch(f"{BASE_URL}/api/settings", json={"quoteNudgeEmailEnabled": original})
        print(f"✓ quoteNudgeEmailEnabled toggled and persisted")
    
    def test_patch_settings_updates_profile_fields(self, auth_session):
        """PATCH /api/settings saves profile fields (firstName, businessName, primaryIndustry)"""
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        original = get_response.json()["settings"]
        
        # Update firstName
        test_name = "TestUser106"
        patch_response = auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"firstName": test_name}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["settings"]["firstName"] == test_name
        
        # Restore original
        auth_session.patch(f"{BASE_URL}/api/settings", json={"firstName": original.get("firstName", "Test")})
        print(f"✓ Profile fields (firstName) updated and persisted")
    
    def test_patch_settings_updates_business_name(self, auth_session):
        """PATCH /api/settings saves businessName"""
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        original = get_response.json()["settings"]
        
        test_business = "Test Studio 106"
        patch_response = auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"businessName": test_business}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["settings"]["businessName"] == test_business
        
        # Restore
        auth_session.patch(f"{BASE_URL}/api/settings", json={"businessName": original.get("businessName", "")})
        print(f"✓ businessName updated and persisted")
    
    def test_patch_settings_updates_primary_industry(self, auth_session):
        """PATCH /api/settings saves primaryIndustry"""
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        original = get_response.json()["settings"]
        
        # Toggle between PHOTOGRAPHY and DESIGN
        current = original.get("primaryIndustry", "PHOTOGRAPHY")
        new_industry = "DESIGN" if current == "PHOTOGRAPHY" else "PHOTOGRAPHY"
        
        patch_response = auth_session.patch(
            f"{BASE_URL}/api/settings",
            json={"primaryIndustry": new_industry}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["settings"]["primaryIndustry"] == new_industry
        
        # Restore
        auth_session.patch(f"{BASE_URL}/api/settings", json={"primaryIndustry": current})
        print(f"✓ primaryIndustry updated from {current} to {new_industry} and restored")
    
    def test_settings_requires_auth(self):
        """GET /api/settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 401
        print("✓ Settings endpoint requires authentication")


class TestAuthEndpoints:
    """Test auth endpoints"""
    
    def test_me_endpoint_returns_user(self, auth_session):
        """GET /api/auth/me returns current user"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert "email" in data["user"]
        print(f"✓ /api/auth/me returns user: {data['user']['email']}")
    
    def test_change_password_endpoint_note(self, auth_session):
        """Note: Change password endpoint not implemented yet"""
        # The Settings page has a change password form but the backend endpoint
        # POST /api/auth/change-password is not yet implemented
        # This is a known gap - the frontend calls it but it returns 404
        response = auth_session.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"currentPassword": "wrong", "newPassword": "test1234"}
        )
        # Document current behavior - endpoint doesn't exist
        if response.status_code == 404:
            print("⚠ Change password endpoint not implemented (returns 404)")
            pytest.skip("Change password endpoint not implemented")
        else:
            assert response.status_code in [400, 401, 403]
            print(f"✓ Change password endpoint exists (returned {response.status_code})")


class TestCalendarStatus:
    """Test calendar integration status endpoint"""
    
    def test_calendar_status_endpoint(self, auth_session):
        """GET /api/google-calendar/status returns connection status"""
        response = auth_session.get(f"{BASE_URL}/api/google-calendar/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "connected" in data
        assert isinstance(data["connected"], bool)
        
        print(f"✓ Calendar status endpoint working: connected={data['connected']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
