"""
Iteration 109 Tests: Brand Settings Tab + Public Booking Page Brand Integration
Tests:
- PATCH /api/settings accepts brandPrimaryColor, brandAccentColor, brandFontFamily, brandLogoUrl
- GET /api/book/:userId returns brand fields for public booking page
- Settings page Brand tab functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('VITE_API_URL', 'https://hardened-crm-2.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"
TEST_USER_ID = "cmn0umxwx0000k8sy48g5le5u"


class TestBrandSettingsAPI:
    """Test PATCH /api/settings with brand fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_res = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        yield
        self.session.close()
    
    def test_get_settings_returns_brand_fields(self):
        """GET /api/settings should return brand fields"""
        res = self.session.get(f"{BASE_URL}/api/settings")
        assert res.status_code == 200, f"GET settings failed: {res.text}"
        
        data = res.json()
        settings = data.get('settings', {})
        
        # Verify brand fields exist in response
        assert 'brandPrimaryColor' in settings, "brandPrimaryColor missing from settings"
        assert 'brandAccentColor' in settings, "brandAccentColor missing from settings"
        assert 'brandFontFamily' in settings, "brandFontFamily missing from settings"
        assert 'brandLogoUrl' in settings, "brandLogoUrl missing from settings"
        
        print(f"Brand settings: primary={settings.get('brandPrimaryColor')}, accent={settings.get('brandAccentColor')}, font={settings.get('brandFontFamily')}")
    
    def test_patch_settings_brand_primary_color(self):
        """PATCH /api/settings should accept brandPrimaryColor"""
        test_color = "#FF5733"
        
        res = self.session.patch(
            f"{BASE_URL}/api/settings",
            json={"brandPrimaryColor": test_color}
        )
        assert res.status_code == 200, f"PATCH settings failed: {res.text}"
        
        data = res.json()
        settings = data.get('settings', {})
        assert settings.get('brandPrimaryColor') == test_color, f"brandPrimaryColor not updated: {settings.get('brandPrimaryColor')}"
        
        # Restore original
        self.session.patch(f"{BASE_URL}/api/settings", json={"brandPrimaryColor": "#6C2EDB"})
        print("PATCH brandPrimaryColor: PASSED")
    
    def test_patch_settings_brand_accent_color(self):
        """PATCH /api/settings should accept brandAccentColor"""
        test_color = "#33FF57"
        
        res = self.session.patch(
            f"{BASE_URL}/api/settings",
            json={"brandAccentColor": test_color}
        )
        assert res.status_code == 200, f"PATCH settings failed: {res.text}"
        
        data = res.json()
        settings = data.get('settings', {})
        assert settings.get('brandAccentColor') == test_color, f"brandAccentColor not updated: {settings.get('brandAccentColor')}"
        
        # Restore original
        self.session.patch(f"{BASE_URL}/api/settings", json={"brandAccentColor": "#E8891A"})
        print("PATCH brandAccentColor: PASSED")
    
    def test_patch_settings_brand_font_family(self):
        """PATCH /api/settings should accept brandFontFamily"""
        test_font = "Playfair Display"
        
        res = self.session.patch(
            f"{BASE_URL}/api/settings",
            json={"brandFontFamily": test_font}
        )
        assert res.status_code == 200, f"PATCH settings failed: {res.text}"
        
        data = res.json()
        settings = data.get('settings', {})
        assert settings.get('brandFontFamily') == test_font, f"brandFontFamily not updated: {settings.get('brandFontFamily')}"
        
        # Restore original
        self.session.patch(f"{BASE_URL}/api/settings", json={"brandFontFamily": "Inter"})
        print("PATCH brandFontFamily: PASSED")
    
    def test_patch_settings_brand_logo_url(self):
        """PATCH /api/settings should accept brandLogoUrl"""
        test_url = "https://example.com/test-logo.png"
        
        res = self.session.patch(
            f"{BASE_URL}/api/settings",
            json={"brandLogoUrl": test_url}
        )
        assert res.status_code == 200, f"PATCH settings failed: {res.text}"
        
        data = res.json()
        settings = data.get('settings', {})
        assert settings.get('brandLogoUrl') == test_url, f"brandLogoUrl not updated: {settings.get('brandLogoUrl')}"
        
        # Restore original (null)
        self.session.patch(f"{BASE_URL}/api/settings", json={"brandLogoUrl": None})
        print("PATCH brandLogoUrl: PASSED")
    
    def test_patch_settings_multiple_brand_fields(self):
        """PATCH /api/settings should accept multiple brand fields at once"""
        brand_data = {
            "brandPrimaryColor": "#123456",
            "brandAccentColor": "#654321",
            "brandFontFamily": "Montserrat",
            "brandLogoUrl": "https://example.com/multi-test.png"
        }
        
        res = self.session.patch(f"{BASE_URL}/api/settings", json=brand_data)
        assert res.status_code == 200, f"PATCH settings failed: {res.text}"
        
        data = res.json()
        settings = data.get('settings', {})
        
        assert settings.get('brandPrimaryColor') == brand_data['brandPrimaryColor']
        assert settings.get('brandAccentColor') == brand_data['brandAccentColor']
        assert settings.get('brandFontFamily') == brand_data['brandFontFamily']
        assert settings.get('brandLogoUrl') == brand_data['brandLogoUrl']
        
        # Restore original
        self.session.patch(f"{BASE_URL}/api/settings", json={
            "brandPrimaryColor": "#6C2EDB",
            "brandAccentColor": "#E8891A",
            "brandFontFamily": "Inter",
            "brandLogoUrl": None
        })
        print("PATCH multiple brand fields: PASSED")


class TestPublicBookingPageAPI:
    """Test public booking page API returns brand fields"""
    
    def test_get_booking_page_data_returns_brand_fields(self):
        """GET /api/book/:userId should return user brand info"""
        res = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}")
        assert res.status_code == 200, f"GET booking page data failed: {res.text}"
        
        data = res.json()
        user = data.get('user', {})
        
        # Verify brand fields exist
        assert 'brandPrimaryColor' in user, "brandPrimaryColor missing from booking page user data"
        assert 'brandAccentColor' in user, "brandAccentColor missing from booking page user data"
        assert 'brandLogoUrl' in user, "brandLogoUrl missing from booking page user data"
        assert 'studioName' in user, "studioName missing from booking page user data"
        assert 'timezone' in user, "timezone missing from booking page user data"
        
        print(f"Booking page user data: studioName={user.get('studioName')}, primary={user.get('brandPrimaryColor')}")
    
    def test_get_booking_page_data_invalid_user(self):
        """GET /api/book/:userId should return 404 for invalid user"""
        res = requests.get(f"{BASE_URL}/api/book/invalid-user-id-12345")
        assert res.status_code == 404, f"Expected 404 for invalid user, got {res.status_code}"
        print("Invalid user returns 404: PASSED")


class TestBrandSettingsEndpoint:
    """Test dedicated brand settings endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_res = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        yield
        self.session.close()
    
    def test_get_brand_settings(self):
        """GET /api/settings/brand should return brand settings"""
        res = self.session.get(f"{BASE_URL}/api/settings/brand")
        assert res.status_code == 200, f"GET brand settings failed: {res.text}"
        
        data = res.json()
        brand = data.get('brand', {})
        
        assert 'primaryColor' in brand, "primaryColor missing from brand settings"
        assert 'accentColor' in brand, "accentColor missing from brand settings"
        assert 'fontFamily' in brand, "fontFamily missing from brand settings"
        assert 'logoUrl' in brand, "logoUrl missing from brand settings"
        
        print(f"Brand settings: {brand}")
    
    def test_patch_brand_settings(self):
        """PATCH /api/settings/brand should update brand settings"""
        test_data = {
            "primaryColor": "#AABBCC",
            "accentColor": "#CCBBAA",
            "fontFamily": "Libre Baskerville"
        }
        
        res = self.session.patch(f"{BASE_URL}/api/settings/brand", json=test_data)
        assert res.status_code == 200, f"PATCH brand settings failed: {res.text}"
        
        data = res.json()
        brand = data.get('brand', {})
        
        assert brand.get('primaryColor') == test_data['primaryColor']
        assert brand.get('accentColor') == test_data['accentColor']
        assert brand.get('fontFamily') == test_data['fontFamily']
        
        # Restore original
        self.session.patch(f"{BASE_URL}/api/settings/brand", json={
            "primaryColor": "#6C2EDB",
            "accentColor": "#E8891A",
            "fontFamily": "Inter"
        })
        print("PATCH brand settings: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
