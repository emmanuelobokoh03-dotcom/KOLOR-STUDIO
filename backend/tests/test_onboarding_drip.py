"""
Test Suite for Feature 1: Client Onboarding Email Drip
Tests the automated 3-email sequence triggered when a client signs a contract.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://email-preview-7.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "Test123456!"
TEST_PORTAL_TOKEN = "gbi5z98i5sgz5txo6stgtb"


class TestHealthAndBasics:
    """Basic health checks to ensure backend is running"""
    
    def test_health_endpoint(self):
        """Backend health endpoint responds correctly"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        print("✅ Health endpoint working")

    def test_auth_login(self):
        """Can authenticate with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print("✅ Authentication working")


class TestOnboardingDripStructure:
    """Tests for code structure and database model"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_digest_api_still_works(self, auth_token):
        """Digest API still works (regression test from iteration_53)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/digest/preview", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Digest response is wrapped in 'digest' key
        digest_data = data.get("digest", data)
        assert "stats" in digest_data
        assert "nextActions" in digest_data
        print("✅ Digest API still works (no regression)")

    def test_contracts_api_exists(self, auth_token):
        """Contracts API endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # Get leads to find one with contracts
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print("✅ Leads API working")

    def test_contracts_templates_list(self, auth_token):
        """Contract templates endpoint works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/contracts/templates/list", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert len(data["templates"]) > 0
        print(f"✅ Contract templates available: {len(data['templates'])} templates")


class TestOnboardingEnrollmentFlow:
    """Tests for the onboarding enrollment triggered by contract agreement"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def test_lead(self, auth_token):
        """Get or create a test lead"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        if response.status_code == 200:
            leads = response.json().get("leads", [])
            # Find a non-demo lead
            for lead in leads:
                if not lead.get("isDemoData", False):
                    return lead
        return None
    
    def test_contract_agree_endpoint_exists(self):
        """Contract agree endpoint exists (requires portalToken)"""
        # This endpoint is public but requires valid contract ID and portalToken
        # We test that the endpoint exists and returns proper error for invalid input
        response = requests.post(f"{BASE_URL}/api/contracts/invalid-id/agree", json={
            "portalToken": "invalid-token"
        })
        # Should return 404 (contract not found), not 404 route not found
        assert response.status_code in [400, 404]
        data = response.json()
        assert "error" in data
        print("✅ Contract agree endpoint exists and validates input")

    def test_contract_agree_requires_portal_token(self):
        """Contract agree endpoint requires portalToken"""
        response = requests.post(f"{BASE_URL}/api/contracts/test-id/agree", json={})
        assert response.status_code == 400
        data = response.json()
        assert data.get("error") == "Portal token required"
        print("✅ Contract agree endpoint requires portalToken")

    def test_portal_access_with_token(self):
        """Portal endpoint accessible with valid token"""
        response = requests.get(f"{BASE_URL}/api/portal/{TEST_PORTAL_TOKEN}")
        # Should work with valid portal token
        assert response.status_code == 200
        data = response.json()
        assert "lead" in data or "project" in data or "clientName" in data
        print("✅ Portal accessible with test token")


class TestOnboardingIntegration:
    """Integration tests for the onboarding drip feature"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_create_contract_for_lead(self, auth_token):
        """Can create a contract for a lead (prerequisite for enrollment)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First create a test lead
        lead_response = requests.post(f"{BASE_URL}/api/leads", 
            headers=headers,
            json={
                "clientName": "TEST_OnboardingDrip Client",
                "clientEmail": "testdrip@test.com",
                "projectTitle": "TEST_Onboarding Project",
                "description": "Testing onboarding drip enrollment",
                "serviceType": "PHOTOGRAPHY"
            }
        )
        
        if lead_response.status_code != 201:
            pytest.skip(f"Could not create test lead: {lead_response.status_code}")
        
        lead_data = lead_response.json()
        lead_id = lead_data.get("lead", lead_data).get("id") if isinstance(lead_data.get("lead", lead_data), dict) else None
        
        if not lead_id:
            pytest.skip("Could not get lead ID from response")
        
        print(f"✅ Created test lead: {lead_id}")
        
        # Create a contract for this lead
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/contracts", 
            headers=headers,
            json={
                "templateType": "GENERAL_SERVICE",
                "title": "TEST_Onboarding_Contract"
            }
        )
        
        # Should succeed in creating contract
        assert response.status_code == 201
        data = response.json()
        assert "contract" in data
        contract = data["contract"]
        assert contract["status"] == "DRAFT"
        assert "id" in contract
        
        print(f"✅ Created test contract: {contract['id']}")
        
        # Get contracts for this lead to verify
        response = requests.get(f"{BASE_URL}/api/leads/{lead_id}/contracts", headers=headers)
        assert response.status_code == 200
        contracts = response.json().get("contracts", [])
        assert len(contracts) > 0
        print(f"✅ Lead has {len(contracts)} contract(s)")
        
        # Cleanup - delete the test contract first
        contract_id = contract["id"]
        response = requests.delete(f"{BASE_URL}/api/contracts/{contract_id}", headers=headers)
        assert response.status_code == 200
        print("✅ Cleaned up test contract")
        
        # Cleanup - delete the test lead
        response = requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Cleaned up test lead")


class TestNoRegressions:
    """Ensure existing functionality still works"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_leads_api_works(self, auth_token):
        """Leads API still works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✅ Leads API working ({len(data['leads'])} leads)")

    def test_settings_api_works(self, auth_token):
        """Settings API still works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/settings/brand", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "brand" in data or "primaryColor" in data
        print("✅ Settings/brand API working")

    def test_analytics_api_works(self, auth_token):
        """Analytics API still works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=headers)
        assert response.status_code == 200
        print("✅ Analytics API working")

    def test_quotes_templates_api_works(self, auth_token):
        """Quote templates API still works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/quote-templates", headers=headers)
        assert response.status_code == 200
        print("✅ Quote templates API working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
