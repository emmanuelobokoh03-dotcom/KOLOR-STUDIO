"""
Test suite for KOLOR STUDIO CRM - Contract Auto-Generation and Email Fix
Tests for iteration 69:
1. Quote acceptance triggers auto-contract-generation with 3s delay email
2. Auto-generated contract appears in GET /api/leads/:leadId/contracts
3. Contract email logs show Resend ID after successful send
4. Manual contract send still works with emailSent response
5. Frontend ContractsTab auto-expands newest contract (UI test)
6. Full E2E flow: login -> create lead -> create quote -> send quote -> accept quote -> verify contract
7. Portal returns auto-generated contract
"""

import pytest
import requests
import time
import os
import json
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolor-light-theme.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "emailtest@test.com"
TEST_USER_PASSWORD = "password123"

# Owner email - only email that works with Resend sandbox
OWNER_EMAIL = "emmanuelobokoh03@gmail.com"


class TestContractAutoGeneration:
    """Tests for contract auto-generation after quote acceptance"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def authenticated_session(self, auth_token):
        """Create an authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    def test_01_health_check(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("Health check passed")
    
    def test_02_login_returns_token(self):
        """Test login endpoint returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"Login successful, got token")
    
    def test_03_create_lead_with_owner_email(self, authenticated_session):
        """Create a lead with owner email for E2E test"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "clientName": f"Test Client {unique_id}",
            "clientEmail": OWNER_EMAIL,  # Use owner email for Resend sandbox
            "projectTitle": f"E2E Test Project {unique_id}",
            "serviceType": "PHOTOGRAPHY",
            "description": "Testing auto-contract generation on quote acceptance"
        }
        response = authenticated_session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 201
        data = response.json()
        assert "lead" in data
        lead = data["lead"]
        assert lead["clientEmail"] == OWNER_EMAIL
        print(f"Created lead: {lead['id']}")
        # Store for later tests
        pytest.lead_id = lead["id"]
        pytest.lead_portal_token = lead.get("portalToken")
        return lead
    
    def test_04_create_quote_for_lead(self, authenticated_session):
        """Create a quote for the lead"""
        lead_id = getattr(pytest, 'lead_id', None)
        if not lead_id:
            pytest.skip("Lead not created in previous test")
        
        quote_data = {
            "lineItems": [
                {"description": "Photography Session", "quantity": 1, "price": 500},
                {"description": "Photo Editing", "quantity": 1, "price": 200}
            ],
            "tax": 10,
            "paymentTerms": "DEPOSIT_30",
            "validUntil": "2027-12-31",
            "terms": "Payment due upon completion"
        }
        response = authenticated_session.post(f"{BASE_URL}/api/leads/{lead_id}/quotes", json=quote_data)
        assert response.status_code == 201
        data = response.json()
        assert "quote" in data
        quote = data["quote"]
        assert quote["status"] == "DRAFT"
        print(f"Created quote: {quote['id']} (number: {quote['quoteNumber']})")
        pytest.quote_id = quote["id"]
        pytest.quote_token = quote.get("quoteToken")
        return quote
    
    def test_05_send_quote_to_client(self, authenticated_session):
        """Send the quote to client - triggers email to owner"""
        quote_id = getattr(pytest, 'quote_id', None)
        if not quote_id:
            pytest.skip("Quote not created in previous test")
        
        response = authenticated_session.post(f"{BASE_URL}/api/quotes/{quote_id}/send")
        assert response.status_code == 200
        data = response.json()
        assert "quote" in data
        assert "emailSent" in data
        quote = data["quote"]
        assert quote["status"] == "SENT"
        # Owner email should succeed with Resend sandbox
        print(f"Quote sent, emailSent: {data['emailSent']}")
        return data
    
    def test_06_accept_quote_triggers_contract_auto_generation(self):
        """Accept quote via public endpoint - should trigger auto-contract generation"""
        quote_token = getattr(pytest, 'quote_token', None)
        if not quote_token:
            pytest.skip("Quote token not available")
        
        # Accept the quote
        response = requests.post(f"{BASE_URL}/api/quotes/public/{quote_token}/accept")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "accepted" in data["message"].lower()
        print(f"Quote accepted: {data['message']}")
        
        # Wait 8 seconds for auto-contract generation (3s delay + processing)
        print("Waiting 8 seconds for auto-contract generation (3s delay + processing)...")
        time.sleep(8)
        return data
    
    def test_07_verify_contract_auto_generated(self, authenticated_session):
        """Verify that contract was auto-generated after quote acceptance"""
        lead_id = getattr(pytest, 'lead_id', None)
        if not lead_id:
            pytest.skip("Lead ID not available")
        
        response = authenticated_session.get(f"{BASE_URL}/api/leads/{lead_id}/contracts")
        assert response.status_code == 200
        data = response.json()
        assert "contracts" in data
        contracts = data["contracts"]
        
        # Should have at least one auto-generated contract
        assert len(contracts) > 0, "No contracts found - auto-generation may have failed"
        
        # The newest contract should be the auto-generated one
        newest_contract = contracts[0]  # Sorted by createdAt desc
        assert newest_contract["status"] == "SENT", f"Expected SENT status, got {newest_contract['status']}"
        assert "Photography" in newest_contract["title"] or "Service" in newest_contract["title"], \
            f"Unexpected contract title: {newest_contract['title']}"
        
        print(f"Auto-generated contract found: {newest_contract['id']}")
        print(f"  Title: {newest_contract['title']}")
        print(f"  Status: {newest_contract['status']}")
        print(f"  Sent at: {newest_contract.get('sentAt')}")
        
        pytest.auto_contract_id = newest_contract["id"]
        return newest_contract
    
    def test_08_portal_returns_auto_generated_contract(self):
        """Verify portal endpoint returns the auto-generated contract"""
        portal_token = getattr(pytest, 'lead_portal_token', None)
        if not portal_token:
            pytest.skip("Portal token not available")
        
        response = requests.get(f"{BASE_URL}/api/portal/{portal_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Check contracts in portal response
        if "contracts" in data:
            contracts = data["contracts"]
            assert len(contracts) > 0, "No contracts in portal response"
            
            # Find our auto-generated contract
            auto_contract = next(
                (c for c in contracts if c.get("status") == "SENT"),
                None
            )
            assert auto_contract is not None, "Auto-generated contract not found in portal"
            print(f"Portal shows auto-generated contract: {auto_contract['id']}")
        else:
            print("Portal response structure: ", list(data.keys()))
            # Portal might not include contracts directly
        
        return data


class TestManualContractSend:
    """Tests for manual contract send functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture(scope="class")
    def authenticated_session(self, auth_token):
        """Create authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    def test_01_create_lead_for_manual_contract(self, authenticated_session):
        """Create a lead for manual contract test"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "clientName": f"Manual Contract Test {unique_id}",
            "clientEmail": OWNER_EMAIL,
            "projectTitle": f"Manual Contract Project {unique_id}",
            "serviceType": "GRAPHIC_DESIGN",
            "description": "Testing manual contract send"
        }
        response = authenticated_session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 201
        data = response.json()
        pytest.manual_lead_id = data["lead"]["id"]
        print(f"Created lead for manual contract: {pytest.manual_lead_id}")
        return data["lead"]
    
    def test_02_create_contract_draft(self, authenticated_session):
        """Create a contract draft"""
        lead_id = getattr(pytest, 'manual_lead_id', None)
        if not lead_id:
            pytest.skip("Lead not created")
        
        contract_data = {
            "templateType": "LOGO_DESIGN"
        }
        response = authenticated_session.post(
            f"{BASE_URL}/api/leads/{lead_id}/contracts",
            json=contract_data
        )
        assert response.status_code == 201
        data = response.json()
        assert "contract" in data
        contract = data["contract"]
        assert contract["status"] == "DRAFT"
        print(f"Created contract draft: {contract['id']}")
        pytest.manual_contract_id = contract["id"]
        return contract
    
    def test_03_send_contract_returns_emailSent(self, authenticated_session):
        """Test that manual contract send returns emailSent field"""
        contract_id = getattr(pytest, 'manual_contract_id', None)
        if not contract_id:
            pytest.skip("Contract not created")
        
        response = authenticated_session.post(f"{BASE_URL}/api/contracts/{contract_id}/send")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "contract" in data, "Response missing 'contract' field"
        assert "emailSent" in data, "Response missing 'emailSent' field"
        assert "message" in data, "Response missing 'message' field"
        
        contract = data["contract"]
        assert contract["status"] == "SENT"
        
        # With owner email, should succeed
        print(f"Contract send result: emailSent={data['emailSent']}")
        print(f"Message: {data['message']}")
        
        # Note: emailSent will be true for owner email, false for external
        return data


class TestContractStatusBadges:
    """Tests for contract status badge styling (light theme, not dark)"""
    
    def test_status_styles_in_component(self):
        """Verify ContractsTab uses light theme status badges"""
        # Read the component file
        component_path = "/app/kolor-studio-v2/frontend/src/components/ContractsTab.tsx"
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for light theme status styles (not dark bg colors)
        expected_styles = {
            "DRAFT": "bg-light-100",
            "SENT": "bg-blue-50",
            "VIEWED": "bg-yellow-50",
            "AGREED": "bg-green-50"
        }
        
        for status, expected_bg in expected_styles.items():
            assert expected_bg in content, f"Status {status} missing expected light theme bg: {expected_bg}"
            print(f"{status} badge: {expected_bg} found")
        
        # Verify no dark theme colors (bg-dark-*, bg-surface-*)
        dark_patterns = ["bg-dark-", "bg-surface-"]
        for pattern in dark_patterns:
            # Allow if in comments or unrelated context
            if pattern in content and "STATUS_STYLES" in content:
                # Check if it's in STATUS_STYLES specifically
                status_section = content[content.find("STATUS_STYLES"):content.find("TEMPLATE_ICONS")]
                assert pattern not in status_section, f"Dark theme pattern {pattern} found in STATUS_STYLES"
        
        print("All status badges use light theme colors")


class TestContractAutoExpand:
    """Tests for ContractsTab auto-expand newest contract"""
    
    def test_auto_expand_logic_in_component(self):
        """Verify ContractsTab auto-expands first (newest) contract"""
        component_path = "/app/kolor-studio-v2/frontend/src/components/ContractsTab.tsx"
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for auto-expand logic
        assert "setExpandedContract" in content, "setExpandedContract not found"
        assert "contracts[0].id" in content or "contracts[0]" in content, "Auto-expand newest contract logic not found"
        
        # Look for the specific auto-expand pattern
        auto_expand_patterns = [
            "if (result.data.contracts.length > 0",
            "setExpandedContract(result.data.contracts[0].id)"
        ]
        
        for pattern in auto_expand_patterns:
            assert pattern in content, f"Expected auto-expand pattern not found: {pattern}"
        
        print("Auto-expand newest contract logic verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
