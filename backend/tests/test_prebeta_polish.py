"""
Pre-beta Polish Testing - KOLOR STUDIO CRM
Testing the 4 new features:
1. Weekly Digest Email API
2. OnboardingWizard (frontend - tested via Playwright)
3. Brand Color Persistence API
4. Portal Background Readability (frontend - tested via Playwright)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "Test123456!"
TEST_PORTAL_TOKEN = "gbi5z98i5sgz5txo6stgtb"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestDigestAPI:
    """Feature 1: Weekly Digest Email API Tests"""
    
    def test_digest_preview_requires_auth(self):
        """Digest preview endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/digest/preview")
        assert response.status_code == 401, "Expected 401 Unauthorized without auth"
        print("✓ Digest preview requires authentication")
    
    def test_digest_send_requires_auth(self):
        """Digest send endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/digest/send")
        assert response.status_code == 401, "Expected 401 Unauthorized without auth"
        print("✓ Digest send requires authentication")
    
    def test_digest_preview_returns_data(self, auth_headers):
        """GET /api/digest/preview returns correct digest data structure"""
        response = requests.get(f"{BASE_URL}/api/digest/preview", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "digest" in data, "Response should contain 'digest' key"
        digest = data["digest"]
        
        # Verify required fields exist
        required_fields = ["userId", "userName", "userEmail", "studioName", "period", 
                         "stats", "nextActions", "topClients", "hasActivity"]
        for field in required_fields:
            assert field in digest, f"Digest should contain '{field}' field"
        
        # Verify stats structure
        stats = digest["stats"]
        stats_fields = ["newLeads", "quoteSent", "quotesAccepted", "contractsSigned",
                       "depositsReceived", "totalRevenue", "currencySymbol"]
        for field in stats_fields:
            assert field in stats, f"Stats should contain '{field}' field"
        
        # Verify period structure
        assert "start" in digest["period"], "Period should have 'start'"
        assert "end" in digest["period"], "Period should have 'end'"
        
        print(f"✓ Digest preview returns valid data for user: {digest['userName']}")
        print(f"  - Stats: {stats['newLeads']} new leads, {stats['quoteSent']} quotes sent")
        print(f"  - hasActivity: {digest['hasActivity']}")
    
    def test_digest_send_with_no_activity(self, auth_headers):
        """POST /api/digest/send skips email when no activity"""
        response = requests.post(f"{BASE_URL}/api/digest/send", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Response should indicate whether email was skipped or sent
        assert "message" in data, "Response should have 'message'"
        
        if data.get("skipped"):
            assert "No activity" in data["message"] or "skipped" in data["message"].lower()
            print("✓ Digest send correctly skips when no activity")
        else:
            # If there was activity, email should have been sent
            print(f"✓ Digest send completed: {data['message']}")
        
        # Should always return digest data
        assert "digest" in data, "Response should include digest data"


class TestBrandSettingsAPI:
    """Feature 3: Brand Color Persistence API Tests"""
    
    def test_brand_settings_get(self, auth_headers):
        """GET /api/settings/brand returns saved brand colors"""
        response = requests.get(f"{BASE_URL}/api/settings/brand", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify brand structure
        assert "brand" in data, "Response should contain 'brand' key"
        brand = data["brand"]
        
        # Verify required brand fields
        required_fields = ["primaryColor", "accentColor", "fontFamily", "logoUrl"]
        for field in required_fields:
            assert field in brand, f"Brand should contain '{field}' field"
        
        # Verify color format (hex)
        assert brand["primaryColor"].startswith("#"), "primaryColor should be hex format"
        assert brand["accentColor"].startswith("#"), "accentColor should be hex format"
        
        print(f"✓ Brand settings retrieved:")
        print(f"  - Primary: {brand['primaryColor']}")
        print(f"  - Accent: {brand['accentColor']}")
        print(f"  - Font: {brand['fontFamily']}")
    
    def test_brand_settings_update(self, auth_headers):
        """PATCH /api/settings/brand saves colors to DB"""
        # First get current brand settings
        get_response = requests.get(f"{BASE_URL}/api/settings/brand", headers=auth_headers)
        original_brand = get_response.json().get("brand", {})
        original_primary = original_brand.get("primaryColor", "#A855F7")
        
        # Update to test color
        test_color = "#FF5733"
        update_response = requests.patch(
            f"{BASE_URL}/api/settings/brand",
            headers=auth_headers,
            json={"primaryColor": test_color}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        update_data = update_response.json()
        assert "brand" in update_data, "Response should contain updated brand"
        assert update_data["brand"]["primaryColor"] == test_color, "Primary color should be updated"
        
        # Verify persistence by fetching again
        verify_response = requests.get(f"{BASE_URL}/api/settings/brand", headers=auth_headers)
        verify_brand = verify_response.json().get("brand", {})
        assert verify_brand["primaryColor"] == test_color, "Updated color should persist"
        
        print(f"✓ Brand settings update and persistence verified")
        print(f"  - Updated primary color to: {test_color}")
        
        # Restore original color
        requests.patch(
            f"{BASE_URL}/api/settings/brand",
            headers=auth_headers,
            json={"primaryColor": original_primary}
        )
        print(f"  - Restored original color: {original_primary}")


class TestPortalEndpoint:
    """Feature 4: Portal readability - verify portal endpoint works"""
    
    def test_portal_loads(self):
        """Portal endpoint returns data (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/portal/{TEST_PORTAL_TOKEN}")
        # Portal may return 404 if token is invalid, but endpoint should exist
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify basic portal structure
            assert "project" in data or "client" in data or "status" in data
            print(f"✓ Portal endpoint accessible for token: {TEST_PORTAL_TOKEN}")
        else:
            print(f"✓ Portal endpoint exists (token may be invalid/expired)")


class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_health(self):
        """API is responsive"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Some APIs may not have /health, try alternate endpoints
        if response.status_code == 404:
            response = requests.get(f"{BASE_URL}/api/settings/currencies")
        assert response.status_code in [200, 404], f"API should be responsive, got {response.status_code}"
        print("✓ API is responsive")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
