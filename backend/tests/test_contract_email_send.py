"""
Contract Email Send Tests - Testing Contract Email Delivery (P0 Bug Fix)

Tests the following features:
1. Login flow
2. Create lead (with verified owner email)
3. Create contract for lead
4. Send contract email - verify emailSent field in response
5. Contract send endpoint response structure
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://email-preview-7.preview.emergentagent.com').rstrip('/')

# Test credentials and verified owner email
TEST_EMAIL = "emailtest@test.com"
TEST_PASSWORD = "password123"
OWNER_EMAIL = "emmanuelobokoh03@gmail.com"  # Resend verified email - only this can receive emails

class TestContractEmailSend:
    """Test contract email send functionality"""

    @pytest.fixture(autouse=True)
    def setup(self, api_client):
        """Setup test data - login and create lead"""
        self.api_client = api_client
        
        # Login
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_resp.status_code != 200:
            pytest.skip(f"Login failed with status {login_resp.status_code}: {login_resp.text}")
        
        login_data = login_resp.json()
        self.token = login_data.get('token')
        self.user = login_data.get('user')
        
        if not self.token:
            pytest.skip("No token returned from login")
        
        api_client.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Create a lead with the owner email (verified in Resend)
        lead_resp = api_client.post(f"{BASE_URL}/api/leads", json={
            "clientName": "Contract Test Client",
            "clientEmail": OWNER_EMAIL,  # Use verified email for email delivery
            "projectTitle": f"Contract Email Test {int(time.time())}",
            "description": "Testing contract email delivery",
            "serviceType": "PHOTOGRAPHY",
            "source": "WEBSITE"
        })
        
        if lead_resp.status_code != 201:
            pytest.skip(f"Failed to create lead: {lead_resp.status_code} - {lead_resp.text}")
        
        lead_data = lead_resp.json()
        self.lead_id = lead_data.get('lead', {}).get('id')
        
        if not self.lead_id:
            pytest.skip("No lead ID returned")

    def test_login_works(self, api_client):
        """Test that login flow works"""
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        data = login_resp.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        print(f"✓ Login successful for {TEST_EMAIL}")

    def test_create_lead_works(self, api_client):
        """Test that lead creation works"""
        # First login
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_resp.json().get('token')
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        
        # Create lead
        lead_resp = api_client.post(f"{BASE_URL}/api/leads", json={
            "clientName": "Test Lead Client",
            "clientEmail": OWNER_EMAIL,
            "projectTitle": f"Test Lead {int(time.time())}",
            "description": "Testing lead creation",
            "serviceType": "PHOTOGRAPHY",
            "source": "WEBSITE"
        })
        
        assert lead_resp.status_code == 201, f"Lead creation failed: {lead_resp.text}"
        data = lead_resp.json()
        assert "lead" in data, "No lead in response"
        assert data['lead'].get('id'), "No lead ID"
        print(f"✓ Lead created successfully with ID: {data['lead']['id']}")

    def test_create_contract_works(self, api_client):
        """Test that contract creation works"""
        assert self.lead_id, "No lead ID for contract creation"
        
        # Create contract
        contract_resp = api_client.post(f"{BASE_URL}/api/leads/{self.lead_id}/contracts", json={
            "templateType": "PHOTOGRAPHY_SHOOT",
            "title": f"Test Contract {int(time.time())}"
        })
        
        assert contract_resp.status_code == 201, f"Contract creation failed: {contract_resp.text}"
        data = contract_resp.json()
        assert "contract" in data, "No contract in response"
        assert data['contract'].get('id'), "No contract ID"
        assert data['contract'].get('status') == 'DRAFT', "Contract should be in DRAFT status"
        print(f"✓ Contract created successfully with ID: {data['contract']['id']}")

    def test_send_contract_returns_emailsent_true(self, api_client):
        """Test that contract send to verified owner email returns emailSent: true"""
        assert self.lead_id, "No lead ID for contract test"
        
        # Create contract
        contract_resp = api_client.post(f"{BASE_URL}/api/leads/{self.lead_id}/contracts", json={
            "templateType": "PHOTOGRAPHY_SHOOT",
            "title": f"Email Test Contract {int(time.time())}"
        })
        
        assert contract_resp.status_code == 201, f"Contract creation failed: {contract_resp.text}"
        contract_id = contract_resp.json().get('contract', {}).get('id')
        assert contract_id, "No contract ID returned"
        
        # Send contract
        send_resp = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/send", json={})
        
        assert send_resp.status_code == 200, f"Contract send failed: {send_resp.text}"
        data = send_resp.json()
        
        # Verify response structure
        assert "contract" in data, "No contract in send response"
        assert "emailSent" in data, "No emailSent field in response - BUG!"
        assert "message" in data, "No message field in response"
        
        # Verify contract status updated
        assert data['contract'].get('status') == 'SENT', f"Contract status should be SENT, got: {data['contract'].get('status')}"
        
        # Verify email was sent to verified owner email
        print(f"emailSent: {data['emailSent']}")
        print(f"message: {data['message']}")
        
        # Since we're using the verified owner email (emmanuelobokoh03@gmail.com),
        # emailSent should be True
        assert data['emailSent'] == True, f"emailSent should be True for verified owner email, got: {data['emailSent']}"
        print(f"✓ Contract email sent successfully - emailSent: {data['emailSent']}")

    def test_send_contract_response_structure(self, api_client):
        """Test that contract send response has correct structure with emailSent field"""
        assert self.lead_id, "No lead ID for contract test"
        
        # Create contract
        contract_resp = api_client.post(f"{BASE_URL}/api/leads/{self.lead_id}/contracts", json={
            "templateType": "GENERAL_SERVICE",
            "title": f"Structure Test Contract {int(time.time())}"
        })
        
        assert contract_resp.status_code == 201
        contract_id = contract_resp.json().get('contract', {}).get('id')
        
        # Send contract
        send_resp = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/send")
        
        assert send_resp.status_code == 200
        data = send_resp.json()
        
        # Check required fields
        required_fields = ['contract', 'emailSent', 'message']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Check emailSent is boolean
        assert isinstance(data['emailSent'], bool), f"emailSent should be boolean, got: {type(data['emailSent'])}"
        
        # Check contract has expected fields
        contract = data['contract']
        assert contract.get('id'), "Contract missing id"
        assert contract.get('status') == 'SENT', "Contract status should be SENT"
        assert contract.get('sentAt'), "Contract missing sentAt timestamp"
        
        print(f"✓ Contract send response structure is correct")
        print(f"  - emailSent: {data['emailSent']} (boolean)")
        print(f"  - message: {data['message']}")
        print(f"  - contract.status: {contract.get('status')}")

    def test_send_contract_with_external_email_returns_emailsent_false(self, api_client):
        """Test that contract send to external (non-verified) email returns emailSent: false"""
        # First login
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_resp.json().get('token')
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        
        # Create lead with external email (not verified in Resend)
        external_email = f"external_test_{int(time.time())}@example.com"
        lead_resp = api_client.post(f"{BASE_URL}/api/leads", json={
            "clientName": "External Email Client",
            "clientEmail": external_email,
            "projectTitle": f"External Email Test {int(time.time())}",
            "description": "Testing with external email",
            "serviceType": "WEB_DESIGN",
            "source": "WEBSITE"
        })
        
        assert lead_resp.status_code == 201
        lead_id = lead_resp.json().get('lead', {}).get('id')
        
        # Create contract
        contract_resp = api_client.post(f"{BASE_URL}/api/leads/{lead_id}/contracts", json={
            "templateType": "WEB_DESIGN",
            "title": f"External Email Contract {int(time.time())}"
        })
        
        assert contract_resp.status_code == 201
        contract_id = contract_resp.json().get('contract', {}).get('id')
        
        # Send contract
        send_resp = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/send")
        
        assert send_resp.status_code == 200
        data = send_resp.json()
        
        # Verify emailSent is False for external email (Resend sandbox limitation)
        assert "emailSent" in data, "No emailSent field in response"
        assert data['emailSent'] == False, f"emailSent should be False for external email, got: {data['emailSent']}"
        
        # Contract should still be marked as SENT
        assert data['contract'].get('status') == 'SENT'
        
        print(f"✓ External email correctly returns emailSent: False")
        print(f"  - Recipient: {external_email}")
        print(f"  - message: {data['message']}")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
