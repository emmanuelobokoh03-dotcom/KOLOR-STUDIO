"""
Test contract workflow fixes:
1. Quote acceptance auto-generates contract as DRAFT (not SENT)
2. Auto-generated contract should NOT have sentAt set
3. GET /api/contracts/pending returns DRAFT contracts
4. POST /api/contracts/:id/send manually sends contract (changes to SENT)
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://calendar-file-mgmt.preview.emergentagent.com').rstrip('/')

class TestContractWorkflowFixes:
    """Tests for the 3 contract workflow fixes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "emailtest@test.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        yield
    
    def test_01_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("PASS: Health check successful")
    
    def test_02_create_lead_for_contract_test(self):
        """Create a test lead for the contract workflow"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "clientName": f"Contract Workflow Test {unique_id}",
            "clientEmail": "emmanuelobokoh03@gmail.com",  # Use owner email for email delivery
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"Contract Draft Test {unique_id}",
            "description": "Testing contract workflow - contract should be DRAFT after quote accept",
            "budget": "$1000-2000"
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=self.headers)
        assert response.status_code == 201, f"Create lead failed: {response.text}"
        self.lead_id = response.json()["lead"]["id"]
        self.lead = response.json()["lead"]
        print(f"PASS: Created test lead: {self.lead_id}")
        return self.lead_id
    
    def test_03_create_and_send_quote(self):
        """Create and send a quote to the lead"""
        # First create the lead
        lead_id = self.test_02_create_lead_for_contract_test()
        
        # Create quote
        quote_data = {
            "lineItems": [{"description": "Contract Test Service", "quantity": 1, "price": 500}],
            "tax": 10,
            "paymentTerms": "DEPOSIT_50"
        }
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/quotes", json=quote_data, headers=self.headers)
        assert response.status_code == 201, f"Create quote failed: {response.text}"
        quote = response.json()["quote"]
        self.quote_id = quote["id"]
        self.quote_token = quote["quoteToken"]
        assert quote["status"] == "DRAFT", f"Quote status should be DRAFT, got {quote['status']}"
        print(f"PASS: Created quote {quote['quoteNumber']} (ID: {self.quote_id})")
        
        # Send quote
        response = requests.post(f"{BASE_URL}/api/quotes/{self.quote_id}/send", headers=self.headers)
        assert response.status_code == 200, f"Send quote failed: {response.text}"
        print(f"PASS: Sent quote to client")
        
        return self.quote_token
    
    def test_04_accept_quote_creates_draft_contract(self):
        """
        KEY FIX TEST: Quote acceptance should create contract as DRAFT (not SENT)
        """
        # Create and send quote
        quote_token = self.test_03_create_and_send_quote()
        
        # Accept quote (public endpoint - no auth needed)
        response = requests.post(f"{BASE_URL}/api/quotes/public/{quote_token}/accept")
        assert response.status_code == 200, f"Accept quote failed: {response.text}"
        print("PASS: Quote accepted by client")
        
        # Wait for contract auto-generation
        print("Waiting 5 seconds for contract auto-generation...")
        time.sleep(5)
        
        # Check contracts for the lead
        response = requests.get(f"{BASE_URL}/api/leads/{self.lead_id}/contracts", headers=self.headers)
        assert response.status_code == 200, f"Get contracts failed: {response.text}"
        contracts = response.json().get("contracts", [])
        
        assert len(contracts) > 0, "No contracts found after quote acceptance"
        contract = contracts[0]
        
        # KEY ASSERTIONS: Contract should be DRAFT, not SENT
        assert contract["status"] == "DRAFT", f"Auto-generated contract should be DRAFT, got {contract['status']}"
        assert contract.get("sentAt") is None, f"Auto-generated contract should NOT have sentAt, got {contract.get('sentAt')}"
        
        self.contract_id = contract["id"]
        print(f"PASS: Auto-generated contract {self.contract_id} has status DRAFT (not SENT)")
        print(f"PASS: sentAt is None (contract email NOT sent to client)")
        
        return self.contract_id
    
    def test_05_pending_endpoint_returns_draft_contracts(self):
        """
        NEW ENDPOINT TEST: GET /api/contracts/pending returns DRAFT contracts
        """
        # First create a draft contract
        self.test_04_accept_quote_creates_draft_contract()
        
        # Call pending endpoint
        response = requests.get(f"{BASE_URL}/api/contracts/pending", headers=self.headers)
        assert response.status_code == 200, f"Pending endpoint failed: {response.text}"
        
        data = response.json()
        contracts = data.get("contracts", [])
        
        # Should have at least 1 pending contract
        assert len(contracts) >= 1, f"Expected at least 1 pending contract, got {len(contracts)}"
        
        # All contracts should be DRAFT
        for contract in contracts:
            assert contract["status"] == "DRAFT", f"Pending contract should be DRAFT, got {contract['status']}"
            # Should include lead info
            assert "lead" in contract, "Contract should include lead info"
            assert "clientName" in contract["lead"], "Contract lead should include clientName"
        
        print(f"PASS: GET /api/contracts/pending returns {len(contracts)} DRAFT contract(s)")
        print(f"PASS: First pending contract has lead clientName: {contracts[0]['lead']['clientName']}")
        
        return contracts
    
    def test_06_manual_send_changes_to_sent(self):
        """
        Manual contract send should change status to SENT and set sentAt
        """
        # Create a draft contract first
        contract_id = self.test_04_accept_quote_creates_draft_contract()
        
        # Manually send the contract
        response = requests.post(f"{BASE_URL}/api/contracts/{contract_id}/send", headers=self.headers)
        assert response.status_code == 200, f"Manual send failed: {response.text}"
        
        data = response.json()
        contract = data.get("contract", {})
        
        # Verify status changed to SENT
        assert contract["status"] == "SENT", f"After manual send, status should be SENT, got {contract['status']}"
        assert contract.get("sentAt") is not None, "After manual send, sentAt should be set"
        
        # Verify emailSent field
        print(f"Email sent: {data.get('emailSent', 'not returned')}")
        
        print(f"PASS: Manual send changed contract to SENT")
        print(f"PASS: sentAt is now set: {contract['sentAt']}")
        
        return contract
    
    def test_07_pending_endpoint_excludes_sent_contracts(self):
        """
        After manually sending, contract should NOT appear in pending
        """
        # Create draft and send it
        self.test_06_manual_send_changes_to_sent()
        
        # Check pending - should not include our sent contract
        response = requests.get(f"{BASE_URL}/api/contracts/pending", headers=self.headers)
        assert response.status_code == 200
        
        contracts = response.json().get("contracts", [])
        
        # Our sent contract should not be in pending
        for contract in contracts:
            assert contract["id"] != self.contract_id, "Sent contract should not appear in pending"
            assert contract["status"] == "DRAFT", f"Pending should only have DRAFT, got {contract['status']}"
        
        print(f"PASS: Sent contract not in pending endpoint")
        print(f"PASS: Pending endpoint returns only DRAFT contracts")


class TestContractPendingEndpoint:
    """Focused tests for the new /api/contracts/pending endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "emailtest@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        yield
    
    def test_pending_endpoint_exists(self):
        """Verify /api/contracts/pending endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/contracts/pending", headers=self.headers)
        assert response.status_code == 200, f"Pending endpoint should exist, got {response.status_code}"
        assert "contracts" in response.json(), "Response should have contracts array"
        print("PASS: GET /api/contracts/pending endpoint exists and returns contracts array")
    
    def test_pending_endpoint_requires_auth(self):
        """Verify pending endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/contracts/pending")
        assert response.status_code in [401, 403], f"Pending endpoint should require auth, got {response.status_code}"
        print("PASS: GET /api/contracts/pending requires authentication")
    
    def test_pending_returns_lead_info(self):
        """Verify pending contracts include lead information"""
        response = requests.get(f"{BASE_URL}/api/contracts/pending", headers=self.headers)
        assert response.status_code == 200
        
        contracts = response.json().get("contracts", [])
        if len(contracts) > 0:
            contract = contracts[0]
            assert "lead" in contract, "Contract should include lead"
            lead = contract["lead"]
            expected_fields = ["id", "clientName", "projectTitle"]
            for field in expected_fields:
                assert field in lead, f"Lead should have {field}"
            print(f"PASS: Pending contracts include lead info with fields: {list(lead.keys())}")
        else:
            print("INFO: No pending contracts to verify lead info (test still passes)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
