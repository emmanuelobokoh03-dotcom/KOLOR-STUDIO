"""
Contracts API Tests - Phase 6B: Basic Contracts & Consent System
Tests contract creation from templates, editing, sending, and client agreement flow.
"""

import pytest
import requests
import os
import time

BASE_URL = "https://availability-sync-5.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
TEST_LEAD_ID = "8fa6a719-5299-4425-ac17-636c6d49ebb3"
TEST_PORTAL_TOKEN = "efa5b345-d8df-4aa4-ab2c-a87b4ac65a58"
EXISTING_AGREED_CONTRACT_ID = "cmmbauxox0001rt1ogj2gtmgz"
EXISTING_SENT_CONTRACT_ID = "cmmbavxn90003rt1o38bf43jn"


@pytest.fixture(scope="module")
def auth_token():
    """Login and get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestContractTemplates:
    """Tests for GET /api/contracts/templates/list"""
    
    def test_get_templates_requires_auth(self):
        """Templates endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/contracts/templates/list")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Templates endpoint requires auth")
    
    def test_get_templates_success(self, auth_headers):
        """Get list of 6 contract templates"""
        response = requests.get(f"{BASE_URL}/api/contracts/templates/list", headers=auth_headers)
        assert response.status_code == 200, f"Get templates failed: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Response missing 'templates' key"
        
        templates = data["templates"]
        assert len(templates) == 6, f"Expected 6 templates, got {len(templates)}"
        
        # Verify expected template types
        expected_types = ["PHOTOGRAPHY_SHOOT", "PORTRAIT_COMMISSION", "LOGO_DESIGN", "WEB_DESIGN", "GENERAL_SERVICE", "CUSTOM"]
        actual_types = [t["type"] for t in templates]
        for exp_type in expected_types:
            assert exp_type in actual_types, f"Missing template type: {exp_type}"
        
        # Verify template structure
        for template in templates:
            assert "type" in template
            assert "title" in template
            assert "label" in template
        
        print(f"✓ Got {len(templates)} templates: {actual_types}")


class TestCreateContract:
    """Tests for POST /api/leads/:leadId/contracts"""
    
    def test_create_contract_requires_auth(self):
        """Create contract requires authentication"""
        response = requests.post(f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts", json={
            "templateType": "PHOTOGRAPHY_SHOOT"
        })
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Create contract requires auth")
    
    def test_create_contract_invalid_template(self, auth_headers):
        """Create contract fails with invalid template type"""
        response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "INVALID_TYPE"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid template, got {response.status_code}"
        print("✓ Invalid template type returns 400")
    
    def test_create_contract_success(self, auth_headers):
        """Create contract from template successfully"""
        response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "PHOTOGRAPHY_SHOOT"}
        )
        assert response.status_code == 201, f"Create contract failed: {response.text}"
        
        data = response.json()
        assert "contract" in data, "Response missing 'contract' key"
        
        contract = data["contract"]
        assert contract["status"] == "DRAFT", f"Expected DRAFT status, got {contract['status']}"
        assert contract["templateType"] == "PHOTOGRAPHY_SHOOT"
        assert "id" in contract
        assert "title" in contract
        assert "content" in contract
        assert contract["leadId"] == TEST_LEAD_ID
        
        print(f"✓ Created contract {contract['id']} with DRAFT status")
        
        # Store contract ID for later tests
        pytest.created_contract_id = contract["id"]
        return contract["id"]
    
    def test_create_contract_custom_template(self, auth_headers):
        """Create contract from CUSTOM template"""
        response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "CUSTOM"}
        )
        assert response.status_code == 201, f"Create custom contract failed: {response.text}"
        
        contract = response.json()["contract"]
        assert contract["templateType"] == "CUSTOM"
        assert contract["status"] == "DRAFT"
        print(f"✓ Created CUSTOM contract {contract['id']}")
        
        pytest.custom_contract_id = contract["id"]


class TestGetContracts:
    """Tests for GET /api/leads/:leadId/contracts and GET /api/contracts/:id"""
    
    def test_get_contracts_for_lead(self, auth_headers):
        """Get all contracts for a lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get contracts failed: {response.text}"
        
        data = response.json()
        assert "contracts" in data, "Response missing 'contracts' key"
        
        contracts = data["contracts"]
        assert len(contracts) >= 2, f"Expected at least 2 contracts, got {len(contracts)}"
        
        print(f"✓ Got {len(contracts)} contracts for lead")
    
    def test_get_single_contract(self, auth_headers):
        """Get single contract by ID"""
        # Use existing SENT contract
        response = requests.get(
            f"{BASE_URL}/api/contracts/{EXISTING_SENT_CONTRACT_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get contract failed: {response.text}"
        
        data = response.json()
        assert "contract" in data
        
        contract = data["contract"]
        assert contract["id"] == EXISTING_SENT_CONTRACT_ID
        assert "title" in contract
        assert "content" in contract
        assert "status" in contract
        
        print(f"✓ Got contract {contract['id']} with status {contract['status']}")
    
    def test_get_nonexistent_contract(self, auth_headers):
        """Get non-existent contract returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/contracts/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent contract returns 404")


class TestEditContract:
    """Tests for PATCH /api/contracts/:id (DRAFT only)"""
    
    def test_edit_draft_contract(self, auth_headers):
        """Edit title and content of DRAFT contract"""
        # First create a new contract to edit
        create_response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "GENERAL_SERVICE"}
        )
        assert create_response.status_code == 201
        contract_id = create_response.json()["contract"]["id"]
        
        # Edit the contract
        new_title = "Edited Test Contract Title"
        new_content = "<h2>Edited Content</h2><p>This is edited content.</p>"
        
        response = requests.patch(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=auth_headers,
            json={"title": new_title, "content": new_content}
        )
        assert response.status_code == 200, f"Edit contract failed: {response.text}"
        
        contract = response.json()["contract"]
        assert contract["title"] == new_title, f"Title not updated: {contract['title']}"
        assert contract["content"] == new_content, "Content not updated"
        assert contract["status"] == "DRAFT", "Status should remain DRAFT"
        
        print(f"✓ Edited DRAFT contract {contract_id}")
        
        # Store for cleanup
        pytest.editable_contract_id = contract_id
    
    def test_edit_sent_contract_fails(self, auth_headers):
        """Cannot edit SENT contract"""
        response = requests.patch(
            f"{BASE_URL}/api/contracts/{EXISTING_SENT_CONTRACT_ID}",
            headers=auth_headers,
            json={"title": "Should Not Change"}
        )
        assert response.status_code == 400, f"Expected 400 for editing SENT contract, got {response.status_code}"
        print("✓ Cannot edit SENT contract")
    
    def test_edit_agreed_contract_fails(self, auth_headers):
        """Cannot edit AGREED contract"""
        response = requests.patch(
            f"{BASE_URL}/api/contracts/{EXISTING_AGREED_CONTRACT_ID}",
            headers=auth_headers,
            json={"title": "Should Not Change"}
        )
        assert response.status_code == 400, f"Expected 400 for editing AGREED contract, got {response.status_code}"
        print("✓ Cannot edit AGREED contract")


class TestDeleteContract:
    """Tests for DELETE /api/contracts/:id (DRAFT only)"""
    
    def test_delete_sent_contract_fails(self, auth_headers):
        """Cannot delete SENT contract"""
        response = requests.delete(
            f"{BASE_URL}/api/contracts/{EXISTING_SENT_CONTRACT_ID}",
            headers=auth_headers
        )
        assert response.status_code == 400, f"Expected 400 for deleting SENT contract, got {response.status_code}"
        print("✓ Cannot delete SENT contract")
    
    def test_delete_agreed_contract_fails(self, auth_headers):
        """Cannot delete AGREED contract"""
        response = requests.delete(
            f"{BASE_URL}/api/contracts/{EXISTING_AGREED_CONTRACT_ID}",
            headers=auth_headers
        )
        assert response.status_code == 400, f"Expected 400 for deleting AGREED contract, got {response.status_code}"
        print("✓ Cannot delete AGREED contract")
    
    def test_delete_draft_contract(self, auth_headers):
        """Delete DRAFT contract successfully"""
        # Create a contract to delete
        create_response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "CUSTOM"}
        )
        assert create_response.status_code == 201
        contract_id = create_response.json()["contract"]["id"]
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete contract failed: {response.text}"
        
        # Verify it's gone
        get_response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404, "Contract should be deleted"
        
        print(f"✓ Deleted DRAFT contract {contract_id}")


class TestSendContract:
    """Tests for POST /api/contracts/:id/send"""
    
    def test_send_contract(self, auth_headers):
        """Send contract to client, status changes to SENT"""
        # Create a new contract to send
        create_response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "WEB_DESIGN"}
        )
        assert create_response.status_code == 201
        contract_id = create_response.json()["contract"]["id"]
        
        # Send the contract
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Send contract failed: {response.text}"
        
        contract = response.json()["contract"]
        assert contract["status"] == "SENT", f"Expected SENT status, got {contract['status']}"
        assert contract["sentAt"] is not None, "sentAt should be set"
        
        print(f"✓ Sent contract {contract_id}, status: SENT")
        
        # Store for agree test
        pytest.sent_contract_id = contract_id
    
    def test_send_already_agreed_fails(self, auth_headers):
        """Cannot send already AGREED contract"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{EXISTING_AGREED_CONTRACT_ID}/send",
            headers=auth_headers
        )
        assert response.status_code == 400, f"Expected 400 for sending AGREED contract, got {response.status_code}"
        print("✓ Cannot send already AGREED contract")


class TestAgreeContract:
    """Tests for POST /api/contracts/:id/agree (public endpoint)"""
    
    def test_agree_requires_portal_token(self):
        """Agree endpoint requires portalToken in body"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{EXISTING_SENT_CONTRACT_ID}/agree",
            json={}
        )
        assert response.status_code == 400, f"Expected 400 without portalToken, got {response.status_code}"
        print("✓ Agree requires portalToken")
    
    def test_agree_invalid_token_fails(self):
        """Agree fails with invalid portalToken"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{EXISTING_SENT_CONTRACT_ID}/agree",
            json={"portalToken": "invalid-token-12345"}
        )
        assert response.status_code == 404, f"Expected 404 with invalid token, got {response.status_code}"
        print("✓ Invalid portalToken returns 404")
    
    def test_agree_already_agreed_fails(self):
        """Cannot agree to already AGREED contract"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{EXISTING_AGREED_CONTRACT_ID}/agree",
            json={"portalToken": TEST_PORTAL_TOKEN}
        )
        assert response.status_code == 400, f"Expected 400 for already agreed, got {response.status_code}"
        print("✓ Cannot agree to already AGREED contract")
    
    def test_agree_contract_success(self, auth_headers):
        """Client agrees to contract, status changes to AGREED"""
        # Create and send a new contract first
        create_response = requests.post(
            f"{BASE_URL}/api/leads/{TEST_LEAD_ID}/contracts",
            headers=auth_headers,
            json={"templateType": "LOGO_DESIGN"}
        )
        assert create_response.status_code == 201
        contract_id = create_response.json()["contract"]["id"]
        
        # Send it
        send_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=auth_headers
        )
        assert send_response.status_code == 200
        
        # Now agree (public endpoint - no auth header)
        agree_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/agree",
            json={"portalToken": TEST_PORTAL_TOKEN}
        )
        assert agree_response.status_code == 200, f"Agree failed: {agree_response.text}"
        
        result = agree_response.json()
        assert "contract" in result
        assert result["contract"]["status"] == "AGREED"
        assert result["contract"]["clientAgreedAt"] is not None
        
        print(f"✓ Client agreed to contract {contract_id}, status: AGREED")


class TestPortalContracts:
    """Tests for GET /api/portal/:token (includes contracts)"""
    
    def test_portal_includes_contracts(self):
        """Portal endpoint returns contracts with SENT/VIEWED/AGREED status"""
        response = requests.get(f"{BASE_URL}/api/portal/{TEST_PORTAL_TOKEN}")
        assert response.status_code == 200, f"Portal fetch failed: {response.text}"
        
        data = response.json()
        assert "contracts" in data, "Portal response missing 'contracts' key"
        
        contracts = data["contracts"]
        assert len(contracts) >= 2, f"Expected at least 2 contracts, got {len(contracts)}"
        
        # Check contract structure
        for contract in contracts:
            assert "id" in contract
            assert "title" in contract
            assert "content" in contract
            assert "status" in contract
            assert contract["status"] in ["SENT", "VIEWED", "AGREED"], f"Unexpected status: {contract['status']}"
        
        # Verify we have both SENT and AGREED contracts
        statuses = [c["status"] for c in contracts]
        assert "AGREED" in statuses, "Expected at least one AGREED contract"
        assert "SENT" in statuses, "Expected at least one SENT contract"
        
        print(f"✓ Portal returns {len(contracts)} contracts with statuses: {statuses}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
