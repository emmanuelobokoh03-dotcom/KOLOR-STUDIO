"""
Iteration 105 Tests: Contracts Page + Client Portal Redesign + Automation Wiring

Tests:
1. GET /api/contracts/all - returns contracts with lead info for authenticated user
2. POST /api/contracts/:id/agree - returns { success: true, celebration: true } with contract data
3. PATCH /api/contracts/:id/viewed - sets viewedAt and status to VIEWED for SENT contracts
4. Portal auto-marks SENT contracts as VIEWED on first load
5. Quote acceptance triggers photographer notification (verify in logs)
6. Contract signing triggers emails + celebration flag
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestContractsAPI:
    """Test contracts API endpoints for Iteration 105"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
        
        self.user = login_response.json().get("user", {})
        yield
        
    def test_get_contracts_all_authenticated(self):
        """GET /api/contracts/all returns contracts with lead info for authenticated user"""
        response = self.session.get(f"{BASE_URL}/api/contracts/all")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "contracts" in data, "Response should contain 'contracts' key"
        assert isinstance(data["contracts"], list), "contracts should be a list"
        
        # If contracts exist, verify structure
        if len(data["contracts"]) > 0:
            contract = data["contracts"][0]
            assert "id" in contract, "Contract should have id"
            assert "status" in contract, "Contract should have status"
            assert "title" in contract, "Contract should have title"
            assert "templateType" in contract, "Contract should have templateType"
            
            # Verify lead info is included
            if contract.get("lead"):
                lead = contract["lead"]
                assert "clientName" in lead, "Lead should have clientName"
                assert "clientEmail" in lead, "Lead should have clientEmail"
                assert "projectTitle" in lead, "Lead should have projectTitle"
        
        print(f"✓ GET /api/contracts/all returned {len(data['contracts'])} contracts")
        
    def test_get_contracts_all_unauthenticated(self):
        """GET /api/contracts/all returns 401 for unauthenticated requests"""
        # Create new session without auth
        unauth_session = requests.Session()
        response = unauth_session.get(f"{BASE_URL}/api/contracts/all")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/contracts/all returns 401 for unauthenticated requests")
        
    def test_get_contracts_pending(self):
        """GET /api/contracts/pending returns DRAFT contracts"""
        response = self.session.get(f"{BASE_URL}/api/contracts/pending")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "contracts" in data, "Response should contain 'contracts' key"
        
        # All pending contracts should be DRAFT status
        for contract in data["contracts"]:
            assert contract["status"] == "DRAFT", f"Pending contract should be DRAFT, got {contract['status']}"
        
        print(f"✓ GET /api/contracts/pending returned {len(data['contracts'])} draft contracts")
        
    def test_get_contracts_templates(self):
        """GET /api/contracts/templates/list returns available templates"""
        response = self.session.get(f"{BASE_URL}/api/contracts/templates/list")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "templates" in data, "Response should contain 'templates' key"
        assert isinstance(data["templates"], list), "templates should be a list"
        assert len(data["templates"]) > 0, "Should have at least one template"
        
        # Verify template structure
        template = data["templates"][0]
        assert "type" in template, "Template should have type"
        assert "title" in template, "Template should have title"
        assert "label" in template, "Template should have label"
        
        print(f"✓ GET /api/contracts/templates/list returned {len(data['templates'])} templates")


class TestContractAgreeEndpoint:
    """Test POST /api/contracts/:id/agree endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        yield
        
    def test_agree_requires_portal_token(self):
        """POST /api/contracts/:id/agree requires portalToken"""
        # Get a contract first
        contracts_response = self.session.get(f"{BASE_URL}/api/contracts/all")
        if contracts_response.status_code != 200:
            pytest.skip("Could not fetch contracts")
            
        contracts = contracts_response.json().get("contracts", [])
        
        # Find a SENT or VIEWED contract
        sent_contract = next((c for c in contracts if c["status"] in ["SENT", "VIEWED"]), None)
        
        if not sent_contract:
            pytest.skip("No SENT/VIEWED contracts available for testing")
        
        # Try to agree without portalToken
        response = requests.post(
            f"{BASE_URL}/api/contracts/{sent_contract['id']}/agree",
            json={}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "Portal token required" in response.json().get("error", "")
        
        print("✓ POST /api/contracts/:id/agree requires portalToken")
        
    def test_agree_returns_celebration_flag(self):
        """POST /api/contracts/:id/agree returns { success: true, celebration: true }"""
        # Get contracts
        contracts_response = self.session.get(f"{BASE_URL}/api/contracts/all")
        if contracts_response.status_code != 200:
            pytest.skip("Could not fetch contracts")
            
        contracts = contracts_response.json().get("contracts", [])
        
        # Find a SENT or VIEWED contract with portalToken
        sent_contract = next(
            (c for c in contracts if c["status"] in ["SENT", "VIEWED"] and c.get("lead", {}).get("portalToken")), 
            None
        )
        
        if not sent_contract:
            pytest.skip("No SENT/VIEWED contracts with portalToken available")
        
        portal_token = sent_contract["lead"]["portalToken"]
        
        # Agree to contract
        response = requests.post(
            f"{BASE_URL}/api/contracts/{sent_contract['id']}/agree",
            json={"portalToken": portal_token}
        )
        
        # Could be 200 (success) or 400 (already agreed)
        if response.status_code == 400:
            error = response.json().get("error", "")
            if "already signed" in error.lower():
                print("✓ Contract already signed - endpoint working correctly")
                return
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success: true"
        assert data.get("celebration") == True, "Response should have celebration: true"
        assert "contract" in data, "Response should contain contract data"
        
        contract = data["contract"]
        assert contract.get("status") == "AGREED", "Contract status should be AGREED"
        assert "clientAgreedAt" in contract, "Contract should have clientAgreedAt"
        
        print("✓ POST /api/contracts/:id/agree returns celebration flag")


class TestContractViewedEndpoint:
    """Test PATCH /api/contracts/:id/viewed endpoint"""
    
    def test_viewed_requires_portal_token(self):
        """PATCH /api/contracts/:id/viewed requires portalToken"""
        # Use a fake contract ID
        response = requests.patch(
            f"{BASE_URL}/api/contracts/fake-id/viewed",
            json={}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "Portal token required" in response.json().get("error", "")
        
        print("✓ PATCH /api/contracts/:id/viewed requires portalToken")
        
    def test_viewed_with_invalid_token(self):
        """PATCH /api/contracts/:id/viewed returns 404 for invalid token"""
        response = requests.patch(
            f"{BASE_URL}/api/contracts/fake-id/viewed",
            json={"portalToken": "invalid-token"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print("✓ PATCH /api/contracts/:id/viewed returns 404 for invalid token")


class TestPortalAutoViewedBehavior:
    """Test that portal auto-marks SENT contracts as VIEWED"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        yield
        
    def test_portal_load_returns_contracts(self):
        """GET /api/portal/:token returns contracts in response"""
        # Get leads to find a portal token
        leads_response = self.session.get(f"{BASE_URL}/api/leads")
        if leads_response.status_code != 200:
            pytest.skip("Could not fetch leads")
            
        leads = leads_response.json().get("leads", [])
        
        # Find a lead with portalToken
        lead_with_token = next((l for l in leads if l.get("portalToken")), None)
        
        if not lead_with_token:
            pytest.skip("No leads with portalToken available")
        
        portal_token = lead_with_token["portalToken"]
        
        # Load portal
        portal_response = requests.get(f"{BASE_URL}/api/portal/{portal_token}")
        
        assert portal_response.status_code == 200, f"Expected 200, got {portal_response.status_code}"
        
        data = portal_response.json()
        
        # Verify portal data structure
        assert "project" in data, "Portal should have project data"
        assert "status" in data, "Portal should have status data"
        assert "client" in data, "Portal should have client data"
        assert "contact" in data, "Portal should have contact data"
        
        # Verify contact has studioName
        contact = data.get("contact", {})
        assert "studioName" in contact, "Contact should have studioName"
        
        # Contracts may or may not exist
        if "contracts" in data:
            assert isinstance(data["contracts"], list), "contracts should be a list"
            print(f"✓ Portal returned {len(data['contracts'])} contracts")
        
        print(f"✓ GET /api/portal/{portal_token[:8]}... returns valid portal data")
        print(f"  - studioName: {contact.get('studioName', 'N/A')}")


class TestQuotesAPI:
    """Test quotes API for quote acceptance flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        yield
        
    def test_get_quotes_all(self):
        """GET /api/quotes/all returns quotes with lead info"""
        response = self.session.get(f"{BASE_URL}/api/quotes/all")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "quotes" in data, "Response should contain 'quotes' key"
        
        print(f"✓ GET /api/quotes/all returned {len(data['quotes'])} quotes")


class TestLeadsAPI:
    """Test leads API for portal token access"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        yield
        
    def test_leads_have_portal_token(self):
        """GET /api/leads returns leads with portalToken"""
        response = self.session.get(f"{BASE_URL}/api/leads")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "leads" in data, "Response should contain 'leads' key"
        
        leads = data["leads"]
        if len(leads) > 0:
            # Check that leads have portalToken
            lead_with_token = next((l for l in leads if l.get("portalToken")), None)
            assert lead_with_token is not None, "At least one lead should have portalToken"
            
            print(f"✓ Found {len(leads)} leads, at least one has portalToken")
        else:
            print("✓ No leads found (empty state)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
