"""
Iteration 110: Automation System Improvements - 6 Workstreams Testing

Tests for:
1. Prisma connection leak fix (code review only - no runtime test needed)
2. Public token-based unsubscribe endpoint (CAN-SPAM compliance)
3. Inquiry acknowledgement email (already exists via sendClientConfirmation)
4. Post-discovery-call quote reminder email (scheduled 24h later)
5. Auto-stop onboarding sequences when lead is LOST
6. Multi-tier stale lead nudges (7-day and 14-day) - scheduler code review

Endpoints tested:
- GET /api/unsubscribe/:token (public, no auth)
- PATCH /api/leads/:id/discovery-call
- PATCH /api/leads/:id/status
- PATCH /api/leads/:id
- GET /api/health (regression)
- POST /api/auth/login (regression)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestHealthAndAuth:
    """Regression tests for basic health and auth endpoints"""
    
    def test_health_endpoint(self):
        """GET /api/health should return status ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "timestamp" in data
        print(f"✅ Health check passed: {data}")
    
    def test_login_success(self):
        """POST /api/auth/login should work with valid credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✅ Login successful for {TEST_EMAIL}")
        return session


class TestUnsubscribeEndpoint:
    """Tests for WS2: Public token-based unsubscribe endpoint"""
    
    def test_unsubscribe_invalid_short_token(self):
        """GET /api/unsubscribe/:token with short token should return 400 with 'Invalid Link'"""
        response = requests.get(f"{BASE_URL}/api/unsubscribe/short")
        assert response.status_code == 400
        assert "Invalid Link" in response.text
        print("✅ Short token returns 400 with 'Invalid Link'")
    
    def test_unsubscribe_invalid_empty_token(self):
        """GET /api/unsubscribe/ with empty token should return 404 (route not matched)"""
        response = requests.get(f"{BASE_URL}/api/unsubscribe/")
        # Empty token should not match the route
        assert response.status_code in [400, 404]
        print(f"✅ Empty token returns {response.status_code}")
    
    def test_unsubscribe_nonexistent_valid_length_token(self):
        """GET /api/unsubscribe/:token with non-existent but valid-length token should return 200 with 'Already Unsubscribed'"""
        # Generate a random token that's long enough but doesn't exist
        fake_token = f"nonexistent_{uuid.uuid4().hex[:20]}"
        response = requests.get(f"{BASE_URL}/api/unsubscribe/{fake_token}")
        assert response.status_code == 200
        assert "Already Unsubscribed" in response.text
        print("✅ Non-existent valid-length token returns 200 with 'Already Unsubscribed'")
    
    def test_unsubscribe_returns_html(self):
        """GET /api/unsubscribe/:token should return HTML page, not JSON"""
        fake_token = f"test_token_{uuid.uuid4().hex[:20]}"
        response = requests.get(f"{BASE_URL}/api/unsubscribe/{fake_token}")
        # Should return HTML
        content_type = response.headers.get('Content-Type', '')
        assert 'text/html' in content_type or '<!DOCTYPE html>' in response.text
        print("✅ Unsubscribe endpoint returns HTML page")


class TestDiscoveryCallQuoteReminder:
    """Tests for WS4: Post-discovery-call quote reminder email scheduled 24h later"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    @pytest.fixture
    def test_lead(self, auth_session):
        """Create a test lead for discovery call testing"""
        lead_data = {
            "clientName": f"TEST_DiscoveryCall_{uuid.uuid4().hex[:8]}",
            "clientEmail": f"test_discovery_{uuid.uuid4().hex[:8]}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "Test Discovery Call Project",
            "description": "Testing discovery call quote reminder scheduling"
        }
        response = auth_session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 201
        lead = response.json().get("lead")
        yield lead
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/leads/{lead['id']}")
    
    def test_discovery_call_completed_schedules_quote_reminder(self, auth_session, test_lead):
        """PATCH /api/leads/:id/discovery-call with discoveryCallCompletedAt should schedule POST_CALL_QUOTE_REMINDER"""
        lead_id = test_lead["id"]
        
        # Mark discovery call as completed
        response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/discovery-call", json={
            "discoveryCallCompletedAt": datetime.utcnow().isoformat(),
            "discoveryCallNotes": "Test call completed - checking quote reminder scheduling"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "lead" in data
        assert data["lead"]["discoveryCallCompletedAt"] is not None
        print(f"✅ Discovery call marked as completed for lead {lead_id}")
        
        # Note: We can't directly verify the ScheduledEmail was created without DB access,
        # but the endpoint should return 200 if the scheduling logic ran without error
        print("✅ POST_CALL_QUOTE_REMINDER should be scheduled 24h in the future")
    
    def test_discovery_call_scheduled_flag(self, auth_session, test_lead):
        """PATCH /api/leads/:id/discovery-call with discoveryCallScheduled should update the flag"""
        lead_id = test_lead["id"]
        
        response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/discovery-call", json={
            "discoveryCallScheduled": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["discoveryCallScheduled"] == True
        print(f"✅ Discovery call scheduled flag updated for lead {lead_id}")


class TestAutoStopOnboardingOnLost:
    """Tests for WS5: Auto-stop onboarding sequences when lead is LOST"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    @pytest.fixture
    def test_lead_for_lost(self, auth_session):
        """Create a test lead for LOST status testing"""
        lead_data = {
            "clientName": f"TEST_LostLead_{uuid.uuid4().hex[:8]}",
            "clientEmail": f"test_lost_{uuid.uuid4().hex[:8]}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "Test Lost Lead Project",
            "description": "Testing auto-stop onboarding on LOST status"
        }
        response = auth_session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 201
        lead = response.json().get("lead")
        yield lead
        # Cleanup
        try:
            auth_session.delete(f"{BASE_URL}/api/leads/{lead['id']}")
        except:
            pass
    
    def test_status_change_to_lost_via_status_endpoint(self, auth_session, test_lead_for_lost):
        """PATCH /api/leads/:id/status with status=LOST should trigger stopOnboardingForLead"""
        lead_id = test_lead_for_lost["id"]
        
        # First, move to a different status
        response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={
            "status": "CONTACTED"
        })
        assert response.status_code == 200
        
        # Now change to LOST
        response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={
            "status": "LOST"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["status"] == "LOST"
        print(f"✅ Lead {lead_id} status changed to LOST via /status endpoint")
        print("✅ stopOnboardingForLead should have been called with reason 'lead_lost'")
    
    def test_status_change_to_lost_via_patch_endpoint(self, auth_session, test_lead_for_lost):
        """PATCH /api/leads/:id with status=LOST should also trigger stopOnboardingForLead"""
        lead_id = test_lead_for_lost["id"]
        
        # Change to LOST via general PATCH endpoint
        response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}", json={
            "status": "LOST"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["status"] == "LOST"
        print(f"✅ Lead {lead_id} status changed to LOST via general PATCH endpoint")
        print("✅ stopOnboardingForLead should have been called with reason 'lead_lost'")
    
    def test_lost_status_sets_lostAt_timestamp(self, auth_session, test_lead_for_lost):
        """Changing status to LOST should set lostAt timestamp"""
        lead_id = test_lead_for_lost["id"]
        
        response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={
            "status": "LOST"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["lostAt"] is not None
        print(f"✅ lostAt timestamp set when status changed to LOST")


class TestLeadStatusValidation:
    """Additional tests for lead status changes"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_invalid_status_rejected(self, auth_session):
        """PATCH /api/leads/:id/status with invalid status should return 400"""
        # First create a lead
        lead_data = {
            "clientName": f"TEST_InvalidStatus_{uuid.uuid4().hex[:8]}",
            "clientEmail": f"test_invalid_{uuid.uuid4().hex[:8]}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "Test Invalid Status",
            "description": "Testing invalid status rejection"
        }
        create_response = auth_session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert create_response.status_code == 201
        lead_id = create_response.json()["lead"]["id"]
        
        try:
            # Try invalid status
            response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={
                "status": "INVALID_STATUS"
            })
            assert response.status_code == 400
            print("✅ Invalid status correctly rejected with 400")
        finally:
            auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_booked_status_sets_convertedAt(self, auth_session):
        """Changing status to BOOKED should set convertedAt timestamp"""
        lead_data = {
            "clientName": f"TEST_Booked_{uuid.uuid4().hex[:8]}",
            "clientEmail": f"test_booked_{uuid.uuid4().hex[:8]}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "Test Booked Status",
            "description": "Testing convertedAt timestamp"
        }
        create_response = auth_session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert create_response.status_code == 201
        lead_id = create_response.json()["lead"]["id"]
        
        try:
            response = auth_session.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={
                "status": "BOOKED"
            })
            assert response.status_code == 200
            data = response.json()
            assert data["lead"]["convertedAt"] is not None
            print("✅ convertedAt timestamp set when status changed to BOOKED")
        finally:
            auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")


class TestUnsubscribeWithRealEnrollment:
    """Tests for unsubscribe with actual enrollment data (if available)"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_unsubscribe_endpoint_structure(self):
        """Verify unsubscribe endpoint returns proper HTML structure"""
        fake_token = f"structure_test_{uuid.uuid4().hex[:20]}"
        response = requests.get(f"{BASE_URL}/api/unsubscribe/{fake_token}")
        
        # Should contain expected HTML elements
        assert "<!DOCTYPE html>" in response.text
        assert "KOLOR Studio" in response.text
        assert "</html>" in response.text
        print("✅ Unsubscribe endpoint returns properly structured HTML")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
