"""
Iteration 104: Quote Builder Premium UI + Quotes List View Tests
Tests for GET /api/quotes/all endpoint and related quote functionality
"""
import pytest
import requests
import os

BASE_URL = "https://hardened-crm-2.preview.emergentagent.com"

class TestQuotesAPI:
    """Tests for the Quotes API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session"""
        self.session = requests.Session()
        # Login to get authenticated session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"Login successful: {login_response.json().get('message', 'OK')}")
        yield
        # Cleanup
        self.session.close()
    
    def test_get_all_quotes_endpoint_exists(self):
        """Test that GET /api/quotes/all endpoint exists and returns 200"""
        response = self.session.get(f"{BASE_URL}/api/quotes/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "quotes" in data, "Response should contain 'quotes' key"
        print(f"GET /api/quotes/all returned {len(data['quotes'])} quotes")
    
    def test_quotes_all_returns_array(self):
        """Test that quotes/all returns an array of quotes"""
        response = self.session.get(f"{BASE_URL}/api/quotes/all")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["quotes"], list), "quotes should be a list"
        print(f"Quotes array length: {len(data['quotes'])}")
    
    def test_quotes_include_lead_data(self):
        """Test that quotes include associated lead data"""
        response = self.session.get(f"{BASE_URL}/api/quotes/all")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["quotes"]) > 0:
            quote = data["quotes"][0]
            # Check quote has lead data
            if "lead" in quote and quote["lead"]:
                lead = quote["lead"]
                print(f"Quote {quote.get('quoteNumber', quote['id'])} has lead: {lead.get('clientName', 'N/A')}")
                # Verify lead fields
                assert "clientName" in lead or lead is None, "Lead should have clientName"
            else:
                print("Quote has no lead data (may be orphaned)")
        else:
            print("No quotes found - empty state expected")
    
    def test_quotes_have_required_fields(self):
        """Test that quotes have all required fields"""
        response = self.session.get(f"{BASE_URL}/api/quotes/all")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "quoteNumber", "status", "total", "createdAt"]
        
        for quote in data["quotes"]:
            for field in required_fields:
                assert field in quote, f"Quote missing required field: {field}"
            print(f"Quote {quote['quoteNumber']}: status={quote['status']}, total={quote['total']}")
    
    def test_get_leads_for_quote_creation(self):
        """Test that leads are available for quote creation"""
        response = self.session.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200, f"Failed to get leads: {response.text}"
        data = response.json()
        assert "leads" in data, "Response should contain 'leads' key"
        print(f"Found {len(data['leads'])} leads available for quote creation")
        
        if len(data["leads"]) > 0:
            lead = data["leads"][0]
            print(f"First lead: {lead['clientName']} - {lead['projectTitle']}")
    
    def test_auth_required_for_quotes_all(self):
        """Test that /api/quotes/all requires authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        response = unauth_session.get(f"{BASE_URL}/api/quotes/all")
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        print("Authentication correctly required for /api/quotes/all")
        unauth_session.close()


class TestQuoteTemplatesAPI:
    """Tests for Quote Templates API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        yield
        self.session.close()
    
    def test_get_quote_templates(self):
        """Test that quote templates endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/quote-templates")
        assert response.status_code == 200, f"Failed to get templates: {response.text}"
        data = response.json()
        assert "templates" in data, "Response should contain 'templates' key"
        print(f"Found {len(data['templates'])} quote templates")


class TestUserSettings:
    """Tests for user settings related to quotes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        yield
        self.session.close()
    
    def test_get_user_settings(self):
        """Test that user settings are available for currency formatting"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Failed to get user: {response.text}"
        data = response.json()
        assert "user" in data, "Response should contain 'user' key"
        user = data["user"]
        print(f"User: {user.get('firstName')} {user.get('lastName')}")
        print(f"Currency: {user.get('currencySymbol', '$')} ({user.get('currency', 'USD')})")
        print(f"Industry: {user.get('industry', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
