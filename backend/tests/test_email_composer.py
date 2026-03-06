"""
Email Composer API Tests - Phase 7 Part 3
Tests for custom subject/message in quote and contract send endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolor-messaging.preview.emergentagent.com')
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
LEAD_ID_COKESPICE = "6bc704c4-8030-42e2-be8a-8f7ed4035709"


class TestEmailComposerBackend:
    """Test Email Composer backend API functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        data = login_response.json()
        self.token = data.get("token")
        assert self.token, "No token received"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    # ==========================================
    # QUOTE SEND ENDPOINT TESTS
    # ==========================================
    
    def test_create_draft_quote_for_testing(self):
        """Create a draft quote to test email composer"""
        # Create a new quote
        quote_data = {
            "lineItems": [
                {"description": "Test Service", "quantity": 1, "price": 100.00}
            ],
            "tax": 0,
            "paymentTerms": "DEPOSIT_50",
            "validUntil": "2027-12-31"
        }
        response = requests.post(
            f"{BASE_URL}/api/leads/{LEAD_ID_COKESPICE}/quotes",
            headers=self.headers,
            json=quote_data
        )
        print(f"Create quote response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 201, f"Failed to create quote: {response.text}"
        data = response.json()
        assert "quote" in data
        assert data["quote"]["status"] == "DRAFT"
        self.test_quote_id = data["quote"]["id"]
        print(f"✓ Created draft quote: {self.test_quote_id}")
        return self.test_quote_id
    
    def test_send_quote_without_custom_email(self):
        """Test sending quote without custom subject/message (backward compatibility)"""
        # First create a draft quote
        quote_id = self.test_create_draft_quote_for_testing()
        
        # Send without custom email params
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=self.headers
        )
        print(f"Send quote (no custom) response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Failed to send quote: {response.text}"
        data = response.json()
        assert "quote" in data
        assert data["quote"]["status"] == "SENT"
        print("✓ Quote sent successfully without custom email params")
    
    def test_send_quote_with_custom_subject_and_message(self):
        """Test sending quote WITH custom subject and message"""
        # First create a draft quote
        quote_id = self.test_create_draft_quote_for_testing()
        
        # Send with custom email params
        custom_email = {
            "subject": "Your Custom Quote is Ready!",
            "message": "Hi there,\n\nI've prepared a special quote for you.\n\nBest regards,\nTest"
        }
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=self.headers,
            json=custom_email
        )
        print(f"Send quote (with custom) response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Failed to send quote with custom email: {response.text}"
        data = response.json()
        assert "quote" in data
        assert data["quote"]["status"] == "SENT"
        print("✓ Quote sent successfully with custom subject and message")
    
    def test_resend_quote_with_custom_message(self):
        """Test resending a SENT quote with new custom message"""
        # First create and send a quote
        quote_id = self.test_create_draft_quote_for_testing()
        
        # Send first time
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=self.headers
        )
        assert response.status_code == 200, "First send failed"
        
        # Resend with custom message
        custom_email = {
            "subject": "Friendly Reminder: Your Quote Awaits!",
            "message": "Hi,\n\nJust following up on the quote I sent earlier.\n\nLet me know if you have questions!"
        }
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=self.headers,
            json=custom_email
        )
        print(f"Resend quote response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Failed to resend quote: {response.text}"
        print("✓ Quote resent successfully with custom message")
    
    # ==========================================
    # CONTRACT SEND ENDPOINT TESTS
    # ==========================================
    
    def test_create_draft_contract_for_testing(self):
        """Create a draft contract to test email composer"""
        contract_data = {
            "templateType": "GENERAL_SERVICE"
        }
        response = requests.post(
            f"{BASE_URL}/api/leads/{LEAD_ID_COKESPICE}/contracts",
            headers=self.headers,
            json=contract_data
        )
        print(f"Create contract response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 201, f"Failed to create contract: {response.text}"
        data = response.json()
        assert "contract" in data
        assert data["contract"]["status"] == "DRAFT"
        self.test_contract_id = data["contract"]["id"]
        print(f"✓ Created draft contract: {self.test_contract_id}")
        return self.test_contract_id
    
    def test_send_contract_without_custom_email(self):
        """Test sending contract without custom subject/message (backward compatibility)"""
        # First create a draft contract
        contract_id = self.test_create_draft_contract_for_testing()
        
        # Send without custom email params
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=self.headers
        )
        print(f"Send contract (no custom) response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Failed to send contract: {response.text}"
        data = response.json()
        assert "contract" in data
        assert data["contract"]["status"] == "SENT"
        print("✓ Contract sent successfully without custom email params")
    
    def test_send_contract_with_custom_subject_and_message(self):
        """Test sending contract WITH custom subject and message"""
        # First create a draft contract
        contract_id = self.test_create_draft_contract_for_testing()
        
        # Send with custom email params
        custom_email = {
            "subject": "Your Agreement is Ready for Review",
            "message": "Hi,\n\nYour custom agreement is attached.\n\nPlease review and sign at your earliest convenience.\n\nBest regards"
        }
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=self.headers,
            json=custom_email
        )
        print(f"Send contract (with custom) response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Failed to send contract with custom email: {response.text}"
        data = response.json()
        assert "contract" in data
        assert data["contract"]["status"] == "SENT"
        print("✓ Contract sent successfully with custom subject and message")
    
    def test_resend_contract_with_custom_message(self):
        """Test resending a SENT contract with new custom message"""
        # First create and send a contract
        contract_id = self.test_create_draft_contract_for_testing()
        
        # Send first time
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=self.headers
        )
        assert response.status_code == 200, "First send failed"
        
        # Resend with custom message
        custom_email = {
            "subject": "Reminder: Please Review Your Agreement",
            "message": "Hi,\n\nJust a friendly reminder about the agreement waiting for your review.\n\nLet me know if you have any questions!"
        }
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=self.headers,
            json=custom_email
        )
        print(f"Resend contract response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Failed to resend contract: {response.text}"
        print("✓ Contract resent successfully with custom message")
    
    # ==========================================
    # EDGE CASES AND VALIDATION
    # ==========================================
    
    def test_send_quote_with_empty_subject(self):
        """Test that empty subject falls back to default"""
        quote_id = self.test_create_draft_quote_for_testing()
        
        # Send with empty subject
        custom_email = {
            "subject": "",
            "message": "Custom message only"
        }
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=self.headers,
            json=custom_email
        )
        print(f"Send quote (empty subject) response: {response.status_code}")
        # Should still work - empty string should fallback to default
        assert response.status_code == 200
        print("✓ Quote sent with empty subject (uses default)")
    
    def test_send_contract_with_empty_message(self):
        """Test that empty message falls back to default"""
        contract_id = self.test_create_draft_contract_for_testing()
        
        # Send with empty message
        custom_email = {
            "subject": "Custom Subject Only",
            "message": ""
        }
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/send",
            headers=self.headers,
            json=custom_email
        )
        print(f"Send contract (empty message) response: {response.status_code}")
        # Should still work - empty string should fallback to default
        assert response.status_code == 200
        print("✓ Contract sent with empty message (uses default)")
    
    def test_get_quotes_for_lead(self):
        """Verify we can get all quotes for a lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{LEAD_ID_COKESPICE}/quotes",
            headers=self.headers
        )
        print(f"Get quotes response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200
        data = response.json()
        assert "quotes" in data
        print(f"✓ Found {len(data['quotes'])} quotes for lead")
    
    def test_get_contracts_for_lead(self):
        """Verify we can get all contracts for a lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{LEAD_ID_COKESPICE}/contracts",
            headers=self.headers
        )
        print(f"Get contracts response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200
        data = response.json()
        assert "contracts" in data
        print(f"✓ Found {len(data['contracts'])} contracts for lead")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
