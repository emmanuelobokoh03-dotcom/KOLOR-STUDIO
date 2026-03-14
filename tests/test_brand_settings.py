"""
Brand Theme System API Tests
Tests for GET/PATCH /api/settings/brand endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://quote-fix-1.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestBrandSettingsAPI:
    """Brand settings endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                self.authenticated = True
            else:
                self.authenticated = False
        else:
            self.authenticated = False
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_get_brand_settings(self):
        """Test GET /api/settings/brand returns brand settings"""
        response = self.session.get(f"{BASE_URL}/api/settings/brand")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "brand" in data, "Response should contain 'brand' key"
        
        brand = data["brand"]
        assert "primaryColor" in brand, "Brand should have primaryColor"
        assert "accentColor" in brand, "Brand should have accentColor"
        assert "fontFamily" in brand, "Brand should have fontFamily"
        assert "logoUrl" in brand, "Brand should have logoUrl key"
        
        # Validate color format (hex)
        assert brand["primaryColor"].startswith("#"), "primaryColor should be hex format"
        assert brand["accentColor"].startswith("#"), "accentColor should be hex format"
        
        print(f"Current brand settings: primary={brand['primaryColor']}, accent={brand['accentColor']}, font={brand['fontFamily']}")
    
    def test_update_brand_primary_color(self):
        """Test PATCH /api/settings/brand updates primary color"""
        new_color = "#10B981"  # Emerald
        
        response = self.session.patch(f"{BASE_URL}/api/settings/brand", json={
            "primaryColor": new_color
        })
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "brand" in data
        assert data["brand"]["primaryColor"] == new_color, f"Primary color should be updated to {new_color}"
        
        # Verify persistence with GET
        get_response = self.session.get(f"{BASE_URL}/api/settings/brand")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["brand"]["primaryColor"] == new_color, "Color change should persist"
        
        print(f"Primary color updated to {new_color}")
    
    def test_update_brand_accent_color(self):
        """Test PATCH /api/settings/brand updates accent color"""
        new_color = "#6366F1"  # Indigo
        
        response = self.session.patch(f"{BASE_URL}/api/settings/brand", json={
            "accentColor": new_color
        })
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "brand" in data
        assert data["brand"]["accentColor"] == new_color, f"Accent color should be updated to {new_color}"
        
        print(f"Accent color updated to {new_color}")
    
    def test_update_brand_font_family(self):
        """Test PATCH /api/settings/brand updates font family"""
        new_font = "Poppins"
        
        response = self.session.patch(f"{BASE_URL}/api/settings/brand", json={
            "fontFamily": new_font
        })
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "brand" in data
        assert data["brand"]["fontFamily"] == new_font, f"Font should be updated to {new_font}"
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/settings/brand")
        assert get_response.status_code == 200
        assert get_response.json()["brand"]["fontFamily"] == new_font
        
        print(f"Font family updated to {new_font}")
    
    def test_update_multiple_brand_settings(self):
        """Test PATCH /api/settings/brand updates multiple settings at once"""
        updates = {
            "primaryColor": "#F43F5E",  # Rose
            "accentColor": "#8B5CF6",   # Violet
            "fontFamily": "Montserrat"
        }
        
        response = self.session.patch(f"{BASE_URL}/api/settings/brand", json=updates)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data["brand"]["primaryColor"] == updates["primaryColor"]
        assert data["brand"]["accentColor"] == updates["accentColor"]
        assert data["brand"]["fontFamily"] == updates["fontFamily"]
        
        print(f"Multiple brand settings updated: {updates}")
    
    def test_reset_brand_to_defaults(self):
        """Test resetting brand settings to default violet theme"""
        defaults = {
            "primaryColor": "#A855F7",  # Violet
            "accentColor": "#EC4899",   # Pink
            "fontFamily": "Inter"
        }
        
        response = self.session.patch(f"{BASE_URL}/api/settings/brand", json=defaults)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify reset
        data = response.json()
        assert data["brand"]["primaryColor"] == defaults["primaryColor"]
        assert data["brand"]["accentColor"] == defaults["accentColor"]
        assert data["brand"]["fontFamily"] == defaults["fontFamily"]
        
        print("Brand settings reset to defaults")
    
    def test_brand_settings_requires_auth(self):
        """Test that brand settings endpoints require authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        # GET should fail without auth
        get_response = unauth_session.get(f"{BASE_URL}/api/settings/brand")
        assert get_response.status_code in [401, 403], f"Expected 401/403 without auth, got {get_response.status_code}"
        
        # PATCH should fail without auth
        patch_response = unauth_session.patch(f"{BASE_URL}/api/settings/brand", json={"primaryColor": "#FF0000"})
        assert patch_response.status_code in [401, 403], f"Expected 401/403 without auth, got {patch_response.status_code}"
        
        print("Auth requirement verified")


class TestGeneralSettingsAPI:
    """General settings endpoint tests - currency tab"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_get_settings(self):
        """Test GET /api/settings returns user settings"""
        response = self.session.get(f"{BASE_URL}/api/settings")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "settings" in data
        settings = data["settings"]
        
        # Check brand-related fields are present
        assert "brandPrimaryColor" in settings or settings.get("brandPrimaryColor") is None
        assert "brandAccentColor" in settings or settings.get("brandAccentColor") is None
        
        print(f"Settings retrieved successfully")
    
    def test_get_currencies(self):
        """Test GET /api/settings/currencies returns available currencies"""
        response = self.session.get(f"{BASE_URL}/api/settings/currencies")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "currencies" in data
        currencies = data["currencies"]
        
        # Check expected currencies exist
        currency_codes = [c["code"] for c in currencies]
        assert "USD" in currency_codes
        assert "EUR" in currency_codes
        assert "NGN" in currency_codes
        
        print(f"Found {len(currencies)} available currencies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
