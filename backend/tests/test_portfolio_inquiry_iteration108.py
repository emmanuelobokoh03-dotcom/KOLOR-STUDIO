"""
Iteration 108: Public Portfolio Page + Inquiry Form Tests
Tests for brand-adaptive redesign of public-facing pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

# Test user credentials
TEST_USER_ID = "cmn0umxwx0000k8sy48g5le5u"
TEST_USER_EMAIL = "bookingtest@test.com"
TEST_USER_PASSWORD = "password123"


class TestPublicPortfolioAPI:
    """Tests for GET /api/portfolio/public/:userId endpoint"""
    
    def test_public_portfolio_returns_brand_fields(self):
        """Verify public portfolio endpoint returns all brand fields"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/{TEST_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify user object exists
        assert "user" in data
        user = data["user"]
        
        # Verify all required brand fields are present
        assert "id" in user
        assert "firstName" in user
        assert "lastName" in user
        assert "name" in user
        assert "studioName" in user
        assert "businessName" in user
        assert "speciality" in user
        assert "industry" in user
        assert "brandPrimaryColor" in user
        assert "brandAccentColor" in user
        assert "brandFontFamily" in user
        assert "brandLogoUrl" in user
        
        # Verify specific values for test user
        assert user["id"] == TEST_USER_ID
        assert user["industry"] == "PHOTOGRAPHY"
        assert user["brandPrimaryColor"] == "#A855F7"
        assert user["studioName"] == "KOLOR STUDIO"
        
        # Verify portfolio array exists
        assert "portfolio" in data
        assert "count" in data
        assert isinstance(data["portfolio"], list)
    
    def test_public_portfolio_404_for_invalid_user(self):
        """Verify 404 returned for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/invalid-user-id-12345")
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert data["error"] == "Not Found"


class TestPublicBookingAPI:
    """Tests for GET /api/book/:userId endpoint (meeting types check)"""
    
    def test_book_endpoint_returns_user_brand_info(self):
        """Verify booking page data includes brand info"""
        response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify user object with brand fields
        assert "user" in data
        user = data["user"]
        assert "brandPrimaryColor" in user
        assert "brandAccentColor" in user
        assert "brandLogoUrl" in user
        
        # Verify meeting types array
        assert "meetingTypes" in data
        assert isinstance(data["meetingTypes"], list)
    
    def test_book_endpoint_404_for_invalid_user(self):
        """Verify 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/book/invalid-user-id-12345")
        
        assert response.status_code == 404


class TestPublicTestimonialsAPI:
    """Tests for GET /api/testimonials/public/:userId endpoint"""
    
    def test_testimonials_endpoint_returns_array(self):
        """Verify testimonials endpoint returns array"""
        response = requests.get(f"{BASE_URL}/api/testimonials/public/{TEST_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "testimonials" in data
        assert isinstance(data["testimonials"], list)


class TestInquirySubmission:
    """Tests for POST /api/portal/submit endpoint (lead creation)"""
    
    def test_inquiry_submission_creates_lead(self):
        """Verify inquiry form submission creates a lead"""
        payload = {
            "clientName": "TEST_Inquiry User",
            "clientEmail": "test_inquiry@example.com",
            "clientPhone": "+1234567890",
            "serviceType": "PHOTOGRAPHY",
            "projectType": "SERVICE",
            "projectTitle": "Test Photography Inquiry",
            "description": "This is a test inquiry for photography services.",
            "budget": "$1,000 - $3,000",
            "timeline": "2026-04-15",
            "source": "WEBSITE",
            "studioId": TEST_USER_ID
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portal/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200 or response.status_code == 201
        data = response.json()
        
        # Verify lead was created
        assert "message" in data or "leadId" in data
        if "leadId" in data:
            assert isinstance(data["leadId"], str)
            assert len(data["leadId"]) > 0
    
    def test_inquiry_submission_validates_required_fields(self):
        """Verify inquiry submission validates required fields"""
        # Missing clientName
        payload = {
            "clientEmail": "test@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "Test",
            "description": "Test description"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portal/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 400 for missing required field
        assert response.status_code == 400
    
    def test_inquiry_submission_without_studio_id(self):
        """Verify inquiry can be submitted without studioId (generic form)"""
        payload = {
            "clientName": "TEST_Generic User",
            "clientEmail": "test_generic@example.com",
            "serviceType": "GRAPHIC_DESIGN",
            "projectType": "PROJECT",
            "projectTitle": "Generic Design Project",
            "description": "This is a generic inquiry without studio ID.",
            "source": "WEBSITE"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portal/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should succeed even without studioId
        assert response.status_code in [200, 201]


class TestBrandColorIntegration:
    """Tests to verify brand colors are correctly returned"""
    
    def test_brand_primary_color_format(self):
        """Verify brand color is in correct hex format"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/{TEST_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        brand_color = data["user"]["brandPrimaryColor"]
        # Should be hex format like #A855F7
        assert brand_color.startswith("#")
        assert len(brand_color) == 7
    
    def test_brand_font_family_present(self):
        """Verify brand font family is returned"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/{TEST_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        font_family = data["user"]["brandFontFamily"]
        assert font_family is not None
        assert isinstance(font_family, str)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
