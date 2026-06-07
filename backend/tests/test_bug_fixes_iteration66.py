"""
Bug Fix Tests - Iteration 66
Tests for:
- Email Signature GET/PATCH API endpoints
- Settings API returns emailSignature field
- Portfolio page accessibility (not API related but verify endpoints)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "security@test.com"
TEST_PASSWORD = "TestPass123!"

class TestEmailSignatureAPI:
    """Test Email Signature settings GET/PATCH endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for API calls"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        return data["token"]
    
    def test_settings_get_returns_email_signature_field(self, auth_token):
        """GET /api/settings should include emailSignature in response"""
        response = requests.get(
            f"{BASE_URL}/api/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"GET settings failed: {response.text}"
        data = response.json()
        
        # Verify settings object exists
        assert "settings" in data, "settings key missing from response"
        settings = data["settings"]
        
        # Verify emailSignature field is present (can be null or string)
        assert "emailSignature" in settings, "emailSignature field missing from settings"
        print(f"Current emailSignature: {settings.get('emailSignature')}")
    
    def test_settings_patch_accepts_email_signature(self, auth_token):
        """PATCH /api/settings should accept and save emailSignature"""
        test_signature = "Best regards,\nTest User\nTest Studio\ntest@example.com"
        
        response = requests.patch(
            f"{BASE_URL}/api/settings",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"emailSignature": test_signature}
        )
        assert response.status_code == 200, f"PATCH settings failed: {response.text}"
        data = response.json()
        
        # Verify response contains updated settings
        assert "settings" in data, "settings key missing from response"
        assert data["settings"]["emailSignature"] == test_signature, "emailSignature was not updated"
        print("Email signature updated successfully")
    
    def test_settings_get_returns_updated_email_signature(self, auth_token):
        """Verify emailSignature persisted after PATCH"""
        test_signature = "Best regards,\nTest User\nTest Studio\ntest@example.com"
        
        # First update the signature
        requests.patch(
            f"{BASE_URL}/api/settings",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"emailSignature": test_signature}
        )
        
        # Then verify it persists
        response = requests.get(
            f"{BASE_URL}/api/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["settings"]["emailSignature"] == test_signature, \
            f"Expected '{test_signature}' but got '{data['settings']['emailSignature']}'"
        print("Email signature persisted correctly")
    
    def test_settings_clear_email_signature(self, auth_token):
        """Verify emailSignature can be cleared (set to empty string or null)"""
        response = requests.patch(
            f"{BASE_URL}/api/settings",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"emailSignature": ""}
        )
        assert response.status_code == 200, f"PATCH settings failed: {response.text}"
        print("Email signature cleared successfully")


class TestSettingsAPIStructure:
    """Test Settings API returns all expected fields"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for API calls"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_settings_contains_all_required_fields(self, auth_token):
        """Verify GET /api/settings returns all expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        settings = data.get("settings", {})
        
        # Required fields based on SETTINGS_SELECT in settings.ts
        expected_fields = [
            "id", "email", "firstName", "lastName", "studioName",
            "phone", "website", "timezone", "currency", "currencySymbol",
            "currencyPosition", "numberFormat", "defaultTaxRate",
            "brandPrimaryColor", "brandAccentColor", "brandLogoUrl",
            "brandFontFamily", "emailSignature"
        ]
        
        missing_fields = [f for f in expected_fields if f not in settings]
        assert not missing_fields, f"Missing fields in settings: {missing_fields}"
        print(f"All {len(expected_fields)} expected fields present in settings response")
    
    def test_available_currencies_returned(self, auth_token):
        """Verify available currencies are returned in settings response"""
        response = requests.get(
            f"{BASE_URL}/api/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "availableCurrencies" in data, "availableCurrencies missing from response"
        currencies = data["availableCurrencies"]
        assert len(currencies) > 0, "No currencies returned"
        
        # Verify currency structure
        first_currency = currencies[0]
        assert "code" in first_currency
        assert "symbol" in first_currency
        assert "name" in first_currency
        print(f"Found {len(currencies)} available currencies")


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Verify API health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("Health endpoint working")
    
    def test_login_with_valid_credentials(self):
        """Verify login works with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful for {TEST_EMAIL}")
    
    def test_settings_requires_auth(self):
        """Verify settings endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 401, "Settings should require auth"
        print("Settings endpoint properly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
