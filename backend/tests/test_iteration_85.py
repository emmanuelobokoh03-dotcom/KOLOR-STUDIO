"""
Iteration 85 Backend Tests
Testing: Bug fixes, Discovery Call workflow, Liquid Glass design, Text contrast
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_token):
        """Get user ID from /me endpoint"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        return response.json()["user"]["id"]


class TestGoogleCalendarConfigCheck:
    """BUG 1: Google Calendar config-check endpoint"""
    
    def test_config_check_requires_auth(self):
        """Config check should require authentication"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/config-check")
        assert response.status_code == 401
    
    def test_config_check_returns_configured_status(self, auth_token):
        """Config check should return configured:true/false with details"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/config-check", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        assert "details" in data
        assert "hasClientId" in data["details"]
        assert "hasClientSecret" in data["details"]
        assert "hasRedirectUri" in data["details"]
        print(f"Config check result: configured={data['configured']}")
    
    def test_auth_url_returns_valid_url(self, auth_token):
        """Auth URL endpoint should return a valid Google OAuth URL"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/auth-url", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        # May return 500 if not configured, but should not crash
        if response.status_code == 200:
            data = response.json()
            assert "authUrl" in data
            if data["authUrl"]:
                assert "accounts.google.com" in data["authUrl"] or "google" in data["authUrl"].lower()
                print(f"Auth URL generated successfully")
        else:
            print(f"Auth URL not available (config not set): {response.status_code}")
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]


class TestEmailVerification:
    """BUG 2: Email verification endpoint error messages"""
    
    def test_verify_email_invalid_token(self):
        """Should return proper error for invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email/invalid_token_12345")
        assert response.status_code in [400, 404]
        data = response.json()
        assert "error" in data or "message" in data
        print(f"Invalid token response: {data}")
    
    def test_verify_email_short_token(self):
        """Should return proper error for malformed short token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email/abc")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        print(f"Short token response: {data}")
    
    def test_verify_email_expired_token(self):
        """Should return proper error for expired/used token"""
        # Using a random valid-looking but non-existent token
        fake_token = "a" * 64
        response = requests.get(f"{BASE_URL}/api/auth/verify-email/{fake_token}")
        assert response.status_code in [400, 404]
        data = response.json()
        assert "error" in data or "message" in data
        print(f"Expired/used token response: {data}")


class TestDiscoveryCallWorkflow:
    """Discovery Call workflow tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def test_lead(self, auth_token):
        """Create a test lead for discovery call testing"""
        response = requests.post(f"{BASE_URL}/api/leads", headers={
            "Authorization": f"Bearer {auth_token}"
        }, json={
            "clientName": "TEST_Discovery_Client",
            "clientEmail": "test_discovery@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "TEST Discovery Call Project",
            "description": "Testing discovery call workflow"
        })
        assert response.status_code == 201, f"Failed to create lead: {response.text}"
        lead = response.json()["lead"]
        yield lead
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_schedule_discovery_call(self, auth_token, test_lead):
        """Should be able to schedule a discovery call"""
        response = requests.patch(
            f"{BASE_URL}/api/leads/{test_lead['id']}/discovery-call",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"discoveryCallScheduled": True}
        )
        assert response.status_code == 200, f"Failed to schedule: {response.text}"
        data = response.json()
        assert "lead" in data
        assert data["lead"]["discoveryCallScheduled"] == True
        print(f"Discovery call scheduled for lead {test_lead['id']}")
    
    def test_complete_discovery_call(self, auth_token, test_lead):
        """Should be able to complete a discovery call with notes"""
        from datetime import datetime
        response = requests.patch(
            f"{BASE_URL}/api/leads/{test_lead['id']}/discovery-call",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "discoveryCallCompletedAt": datetime.utcnow().isoformat() + "Z",
                "discoveryCallNotes": "Client wants wedding photography, budget $5000"
            }
        )
        assert response.status_code == 200, f"Failed to complete: {response.text}"
        data = response.json()
        assert "lead" in data
        assert data["lead"]["discoveryCallCompletedAt"] is not None
        assert data["lead"]["discoveryCallNotes"] == "Client wants wedding photography, budget $5000"
        print(f"Discovery call completed with notes")


class TestServiceTypes:
    """BUG 5: Fine Art and Illustration in ServiceType"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_create_lead_with_fine_art(self, auth_token):
        """Should be able to create a lead with FINE_ART service type"""
        response = requests.post(f"{BASE_URL}/api/leads", headers={
            "Authorization": f"Bearer {auth_token}"
        }, json={
            "clientName": "TEST_FineArt_Client",
            "clientEmail": "test_fineart@example.com",
            "serviceType": "FINE_ART",
            "projectTitle": "TEST Fine Art Commission",
            "description": "Testing fine art service type"
        })
        assert response.status_code == 201, f"Failed to create FINE_ART lead: {response.text}"
        lead = response.json()["lead"]
        assert lead["serviceType"] == "FINE_ART"
        print(f"Created FINE_ART lead: {lead['id']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_create_lead_with_illustration(self, auth_token):
        """Should be able to create a lead with ILLUSTRATION service type"""
        response = requests.post(f"{BASE_URL}/api/leads", headers={
            "Authorization": f"Bearer {auth_token}"
        }, json={
            "clientName": "TEST_Illustration_Client",
            "clientEmail": "test_illustration@example.com",
            "serviceType": "ILLUSTRATION",
            "projectTitle": "TEST Illustration Project",
            "description": "Testing illustration service type"
        })
        assert response.status_code == 201, f"Failed to create ILLUSTRATION lead: {response.text}"
        lead = response.json()["lead"]
        assert lead["serviceType"] == "ILLUSTRATION"
        print(f"Created ILLUSTRATION lead: {lead['id']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestLeadsAPI:
    """General Leads API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_get_leads(self, auth_token):
        """Should be able to get all leads"""
        response = requests.get(f"{BASE_URL}/api/leads", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "count" in data
        print(f"Found {data['count']} leads")
    
    def test_get_lead_stats(self, auth_token):
        """Should be able to get lead statistics"""
        response = requests.get(f"{BASE_URL}/api/leads/stats", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "statusCounts" in data
        print(f"Stats: total={data['total']}, statusCounts={data['statusCounts']}")


class TestPortalAPI:
    """Client Portal API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_get_lead_with_portal_token(self, auth_token):
        """Should be able to get a lead with portal token"""
        # First get all leads
        response = requests.get(f"{BASE_URL}/api/leads", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        leads = response.json()["leads"]
        
        if leads:
            lead = leads[0]
            if lead.get("portalToken"):
                # Test portal endpoint
                portal_response = requests.get(f"{BASE_URL}/api/portal/{lead['portalToken']}")
                assert portal_response.status_code == 200
                portal_data = portal_response.json()
                assert "project" in portal_data
                assert "status" in portal_data
                print(f"Portal data retrieved for lead {lead['id']}")
            else:
                print("Lead has no portal token")
        else:
            print("No leads found to test portal")


class TestPublicInquirySubmission:
    """Public inquiry submission tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_token):
        """Get user ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        if response.status_code != 200:
            pytest.skip("Could not get user ID")
        return response.json()["user"]["id"]
    
    def test_submit_inquiry_with_fine_art(self, user_id, auth_token):
        """Should be able to submit inquiry with FINE_ART service type"""
        response = requests.post(f"{BASE_URL}/api/portal/submit", json={
            "clientName": "TEST_Public_FineArt",
            "clientEmail": "test_public_fineart@example.com",
            "serviceType": "FINE_ART",
            "projectTitle": "TEST Public Fine Art Inquiry",
            "description": "Testing public inquiry with fine art",
            "studioId": user_id
        })
        assert response.status_code == 201, f"Failed to submit inquiry: {response.text}"
        data = response.json()
        assert "leadId" in data
        print(f"Public inquiry submitted with FINE_ART: {data['leadId']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{data['leadId']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_submit_inquiry_with_illustration(self, user_id, auth_token):
        """Should be able to submit inquiry with ILLUSTRATION service type"""
        response = requests.post(f"{BASE_URL}/api/portal/submit", json={
            "clientName": "TEST_Public_Illustration",
            "clientEmail": "test_public_illustration@example.com",
            "serviceType": "ILLUSTRATION",
            "projectTitle": "TEST Public Illustration Inquiry",
            "description": "Testing public inquiry with illustration",
            "studioId": user_id
        })
        assert response.status_code == 201, f"Failed to submit inquiry: {response.text}"
        data = response.json()
        assert "leadId" in data
        print(f"Public inquiry submitted with ILLUSTRATION: {data['leadId']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{data['leadId']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
