"""
Industry Dashboard Widgets - Backend API Tests
Tests the /api/auth/me endpoint for primaryIndustry field
and related APIs used by PhotographyWidgets, FineArtWidgets, DesignWidgets
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolor-growth-engine.preview.emergentagent.com')
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


@pytest.fixture(scope="module")
def auth_token():
    """Login and get auth token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in response"
    assert "user" in data, "No user in response"
    assert data["user"]["primaryIndustry"] == "WEB_DESIGN", f"Expected WEB_DESIGN, got {data['user']['primaryIndustry']}"
    return data["token"]


class TestAuthMeEndpoint:
    """Tests for GET /api/auth/me - primaryIndustry field"""
    
    def test_auth_me_returns_primary_industry(self, auth_token):
        """GET /api/auth/me should return user with primaryIndustry field"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        data = response.json()
        
        # Verify user object exists
        assert "user" in data, "No user object in response"
        user = data["user"]
        
        # Verify primaryIndustry field exists and has valid value
        assert "primaryIndustry" in user, "No primaryIndustry field in user"
        assert user["primaryIndustry"] is not None, "primaryIndustry is null"
        
        # Verify it's a valid IndustryType
        valid_industries = [
            "PHOTOGRAPHY", "VIDEOGRAPHY", "GRAPHIC_DESIGN", "WEB_DESIGN",
            "ILLUSTRATION", "FINE_ART", "SCULPTURE", "BRANDING",
            "CONTENT_CREATION", "OTHER"
        ]
        assert user["primaryIndustry"] in valid_industries, f"Invalid industry: {user['primaryIndustry']}"
        
        # Current user should be WEB_DESIGN (for DesignWidgets)
        assert user["primaryIndustry"] == "WEB_DESIGN", f"Expected WEB_DESIGN, got {user['primaryIndustry']}"


class TestLeadsStatsEndpoint:
    """Tests for GET /api/leads/stats - used by DesignWidgets, FineArtWidgets"""
    
    def test_leads_stats_returns_status_counts(self, auth_token):
        """GET /api/leads/stats should return statusCounts for widgets"""
        response = requests.get(
            f"{BASE_URL}/api/leads/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Leads stats failed: {response.text}"
        data = response.json()
        
        # Verify total and statusCounts
        assert "total" in data, "No total in response"
        assert "statusCounts" in data, "No statusCounts in response"
        assert isinstance(data["statusCounts"], dict), "statusCounts should be a dict"
        
        # Verify statusCounts has expected keys
        valid_statuses = ["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "QUOTED", "NEGOTIATING", "BOOKED", "LOST"]
        for status in data["statusCounts"].keys():
            assert status in valid_statuses, f"Invalid status in statusCounts: {status}"


class TestLeadsListEndpoint:
    """Tests for GET /api/leads - used by all widgets"""
    
    def test_leads_list_returns_leads(self, auth_token):
        """GET /api/leads should return leads array"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Leads list failed: {response.text}"
        data = response.json()
        
        # Verify leads array
        assert "leads" in data, "No leads array in response"
        assert isinstance(data["leads"], list), "leads should be an array"
        
        # Verify lead structure (if leads exist)
        if len(data["leads"]) > 0:
            lead = data["leads"][0]
            required_fields = ["id", "clientName", "projectTitle", "status", "serviceType"]
            for field in required_fields:
                assert field in lead, f"Missing field in lead: {field}"


class TestBookingsEndpoint:
    """Tests for GET /api/bookings - used by PhotographyWidgets"""
    
    def test_bookings_list_with_date_range(self, auth_token):
        """GET /api/bookings with start/end params for upcoming shoots"""
        now = datetime.utcnow()
        week_end = now + timedelta(days=7)
        
        params = {
            "start": now.isoformat() + "Z",
            "end": week_end.isoformat() + "Z",
            "status": "CONFIRMED"
        }
        
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {auth_token}"},
            params=params
        )
        assert response.status_code == 200, f"Bookings list failed: {response.text}"
        data = response.json()
        
        # Verify bookings array
        assert "bookings" in data, "No bookings array in response"
        assert isinstance(data["bookings"], list), "bookings should be an array"


class TestQuotesEndpoint:
    """Tests for GET /api/leads/:leadId/quotes - used by FineArtWidgets"""
    
    def test_quotes_endpoint_exists(self, auth_token):
        """Test that quotes endpoint is accessible (even with empty leadId)"""
        # First get a lead ID
        leads_response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert leads_response.status_code == 200
        leads_data = leads_response.json()
        
        if len(leads_data.get("leads", [])) > 0:
            lead_id = leads_data["leads"][0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/leads/{lead_id}/quotes",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200, f"Quotes for lead failed: {response.text}"
            data = response.json()
            assert "quotes" in data, "No quotes array in response"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
