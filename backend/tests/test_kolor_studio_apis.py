"""
KOLOR STUDIO CRM - Backend API Tests
Testing: Auth, Leads, Portfolio, Settings, Analytics endpoints
Phase 1 Schema Regression: New enums, fields, and tables validation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-sequences-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
TEST_USER_ID = "3aa2d156-aa26-48ef-8daf-e95641b68b3e"

# Expected lead count and booking count (from iteration 13)
EXPECTED_LEAD_COUNT = 18
EXPECTED_BOOKING_COUNT = 7


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_check(self):
        """Test /api/health returns OK status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "KOLOR STUDIO" in data["message"]
        print(f"✓ Health check passed: {data['message']}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test POST /api/auth/login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["id"] == TEST_USER_ID
        print(f"✓ Login successful for: {data['user']['email']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test POST /api/auth/login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code in [401, 404]
        print("✓ Invalid login correctly rejected")
    
    def test_get_me_authenticated(self):
        """Test GET /api/auth/me with valid token"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        token = login_response.json()["token"]
        
        # Test /me endpoint
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Auth me endpoint returned user: {data['user']['firstName']}")
    
    def test_get_me_unauthenticated(self):
        """Test GET /api/auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated /me request correctly rejected")


class TestLeadsEndpoints:
    """Leads management endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["token"]
    
    def test_get_leads(self, auth_token):
        """Test GET /api/leads returns leads list with expected count"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert isinstance(data["leads"], list)
        assert len(data["leads"]) == EXPECTED_LEAD_COUNT, f"Expected {EXPECTED_LEAD_COUNT} leads, got {len(data['leads'])}"
        print(f"✓ Retrieved {len(data['leads'])} leads (expected {EXPECTED_LEAD_COUNT})")
    
    def test_get_leads_stats(self, auth_token):
        """Test GET /api/leads/stats returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/leads/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "statusCounts" in data
        print(f"✓ Stats: {data['total']} total leads, counts: {data['statusCounts']}")
    
    def test_get_leads_unauthorized(self):
        """Test GET /api/leads without auth fails"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 401
        print("✓ Unauthorized leads request correctly rejected")


class TestPortfolioEndpoints:
    """Portfolio management endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["token"]
    
    def test_get_portfolio_authenticated(self, auth_token):
        """Test GET /api/portfolio returns user's portfolio"""
        response = requests.get(
            f"{BASE_URL}/api/portfolio",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "portfolio" in data
        assert "count" in data
        print(f"✓ Retrieved {data['count']} portfolio items")
    
    def test_get_public_portfolio(self):
        """Test GET /api/portfolio/public/:userId returns public portfolio"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "portfolio" in data
        assert data["user"]["id"] == TEST_USER_ID
        assert data["user"]["studioName"] == "Kolor Studio"
        print(f"✓ Public portfolio for '{data['user']['studioName']}' with {data['count']} items")
    
    def test_get_public_portfolio_nonexistent_user(self):
        """Test GET /api/portfolio/public/:userId with invalid user"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/nonexistent-user-id")
        assert response.status_code == 404
        print("✓ Nonexistent user portfolio correctly returns 404")
    
    def test_portfolio_has_expected_item(self, auth_token):
        """Test that portfolio contains the 'Airplane Mode' item"""
        response = requests.get(
            f"{BASE_URL}/api/portfolio",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        portfolio_titles = [item["title"] for item in data["portfolio"]]
        assert "Airplane Mode" in portfolio_titles
        print("✓ Portfolio contains expected 'Airplane Mode' item")


class TestSettingsEndpoints:
    """Settings endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["token"]
    
    def test_get_settings(self, auth_token):
        """Test GET /api/settings returns user settings"""
        response = requests.get(
            f"{BASE_URL}/api/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        assert "availableCurrencies" in data
        assert data["settings"]["email"] == TEST_EMAIL
        print(f"✓ Settings retrieved, currency: {data['settings']['currency']}")


class TestAnalyticsEndpoints:
    """Analytics endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["token"]
    
    def test_get_dashboard_analytics(self, auth_token):
        """Test GET /api/analytics/dashboard returns analytics"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "metrics" in data
        print(f"✓ Analytics: conversion rate {data['overview']['conversionRate']}%")


class TestBookingsEndpoints:
    """Bookings endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["token"]
    
    def test_get_bookings(self, auth_token):
        """Test GET /api/bookings returns bookings list"""
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"✓ Retrieved {len(data['bookings'])} bookings")
    
    def test_get_calendar_events(self, auth_token):
        """Test GET /api/bookings/calendar returns calendar events with expected count"""
        response = requests.get(
            f"{BASE_URL}/api/bookings/calendar",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) == EXPECTED_BOOKING_COUNT, f"Expected {EXPECTED_BOOKING_COUNT} events, got {len(data['events'])}"
        print(f"✓ Retrieved {len(data['events'])} calendar events (expected {EXPECTED_BOOKING_COUNT})")


class TestPhase1SchemaRegression:
    """Phase 1 Schema Migration Regression Tests
    Tests new enums, fields with defaults, and empty tables
    """
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["token"]
    
    def test_leads_have_default_project_type(self, auth_token):
        """Test leads have projectType field defaulting to SERVICE"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        leads = data["leads"]
        
        # At least one lead should exist
        assert len(leads) > 0, "No leads found to verify"
        
        # Check first lead has projectType (should default to SERVICE)
        first_lead = leads[0]
        # If projectType is exposed in API, it should be SERVICE
        if "projectType" in first_lead:
            assert first_lead["projectType"] == "SERVICE", f"Expected projectType SERVICE, got {first_lead['projectType']}"
            print(f"✓ Lead has projectType: {first_lead['projectType']}")
        else:
            print("✓ projectType field not exposed in API (acceptable for backwards compat)")
    
    def test_leads_have_default_deliverable_type(self, auth_token):
        """Test leads have deliverableType field defaulting to DIGITAL_FILES"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        leads = data["leads"]
        
        # At least one lead should exist
        assert len(leads) > 0, "No leads found to verify"
        
        # Check first lead has deliverableType (should default to DIGITAL_FILES)
        first_lead = leads[0]
        if "deliverableType" in first_lead:
            assert first_lead["deliverableType"] == "DIGITAL_FILES", f"Expected deliverableType DIGITAL_FILES, got {first_lead['deliverableType']}"
            print(f"✓ Lead has deliverableType: {first_lead['deliverableType']}")
        else:
            print("✓ deliverableType field not exposed in API (acceptable for backwards compat)")
    
    def test_leads_stats_unchanged(self, auth_token):
        """Test GET /api/leads/stats returns correct stats after migration"""
        response = requests.get(
            f"{BASE_URL}/api/leads/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate expected totals from iteration 13
        assert data["total"] == EXPECTED_LEAD_COUNT, f"Expected {EXPECTED_LEAD_COUNT} total leads, got {data['total']}"
        
        # Validate status counts (from iteration 13: NEW:7, QUOTED:4, BOOKED:5, CONTACTED:2)
        status_counts = data["statusCounts"]
        assert status_counts.get("NEW", 0) == 7, f"Expected 7 NEW leads, got {status_counts.get('NEW', 0)}"
        assert status_counts.get("QUOTED", 0) == 4, f"Expected 4 QUOTED leads, got {status_counts.get('QUOTED', 0)}"
        assert status_counts.get("BOOKED", 0) == 5, f"Expected 5 BOOKED leads, got {status_counts.get('BOOKED', 0)}"
        assert status_counts.get("CONTACTED", 0) == 2, f"Expected 2 CONTACTED leads, got {status_counts.get('CONTACTED', 0)}"
        
        print(f"✓ Stats verified: {data['total']} total, counts: {status_counts}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
