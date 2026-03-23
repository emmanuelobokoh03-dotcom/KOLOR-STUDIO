"""
Test suite for OnboardingChecklist API endpoints
Tests the 4 endpoints used by the OnboardingChecklist component:
- /api/google-calendar/status
- /api/meeting-types
- /api/availability
- /api/leads
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

class TestOnboardingChecklistAPIs:
    """Tests for OnboardingChecklist API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - login and get token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"},
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_google_calendar_status_endpoint(self):
        """Test /api/google-calendar/status returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/google-calendar/status",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "connected" in data, "Response should have 'connected' field"
        assert isinstance(data["connected"], bool), "'connected' should be boolean"
        
        # For a fresh user, calendar should not be connected
        print(f"Google Calendar connected: {data['connected']}")
    
    def test_meeting_types_endpoint(self):
        """Test /api/meeting-types returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/meeting-types",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "meetingTypes" in data, "Response should have 'meetingTypes' field"
        assert isinstance(data["meetingTypes"], list), "'meetingTypes' should be a list"
        
        print(f"Meeting types count: {len(data['meetingTypes'])}")
    
    def test_availability_endpoint(self):
        """Test /api/availability returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/availability",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "availability" in data, "Response should have 'availability' field"
        assert isinstance(data["availability"], list), "'availability' should be a list"
        
        print(f"Availability slots count: {len(data['availability'])}")
    
    def test_leads_endpoint(self):
        """Test /api/leads returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "leads" in data, "Response should have 'leads' field"
        assert isinstance(data["leads"], list), "'leads' should be a list"
        
        # Check lead structure if leads exist
        if len(data["leads"]) > 0:
            lead = data["leads"][0]
            assert "id" in lead, "Lead should have 'id'"
            assert "clientName" in lead, "Lead should have 'clientName'"
            assert "quotesCount" in lead, "Lead should have 'quotesCount' for checklist"
        
        print(f"Leads count: {len(data['leads'])}")
    
    def test_onboarding_progress_calculation(self):
        """Test that progress can be calculated from API responses"""
        # Fetch all 4 endpoints
        cal_response = requests.get(f"{BASE_URL}/api/google-calendar/status", headers=self.headers)
        mt_response = requests.get(f"{BASE_URL}/api/meeting-types", headers=self.headers)
        avail_response = requests.get(f"{BASE_URL}/api/availability", headers=self.headers)
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=self.headers)
        
        # All should return 200
        assert cal_response.status_code == 200
        assert mt_response.status_code == 200
        assert avail_response.status_code == 200
        assert leads_response.status_code == 200
        
        # Calculate progress
        completed = 1  # Account is always completed
        
        cal_data = cal_response.json()
        if cal_data.get("connected"):
            completed += 1
        
        mt_data = mt_response.json()
        if len(mt_data.get("meetingTypes", [])) > 0:
            completed += 1
        
        avail_data = avail_response.json()
        availability = avail_data.get("availability", [])
        if isinstance(availability, list) and len(availability) > 0:
            completed += 1
        elif isinstance(availability, dict) and availability.get("schedule"):
            completed += 1
        
        leads_data = leads_response.json()
        leads = leads_data.get("leads", [])
        has_quotes = any((lead.get("quotesCount", 0) > 0) for lead in leads)
        if has_quotes:
            completed += 1
        
        total = 5
        progress_pct = round((completed / total) * 100)
        
        print(f"Onboarding progress: {completed}/{total} ({progress_pct}%)")
        
        # For test user, should be 1/5 (20%)
        assert completed >= 1, "At least account creation should be complete"
        assert progress_pct >= 20, "Progress should be at least 20%"


class TestOnboardingChecklistUnauthorized:
    """Test that endpoints require authentication"""
    
    def test_google_calendar_status_requires_auth(self):
        """Test /api/google-calendar/status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/status")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_meeting_types_requires_auth(self):
        """Test /api/meeting-types requires authentication"""
        response = requests.get(f"{BASE_URL}/api/meeting-types")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_availability_requires_auth(self):
        """Test /api/availability requires authentication"""
        response = requests.get(f"{BASE_URL}/api/availability")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_leads_requires_auth(self):
        """Test /api/leads requires authentication"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
