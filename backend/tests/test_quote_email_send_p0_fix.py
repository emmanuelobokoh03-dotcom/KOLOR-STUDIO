"""
P0 Bug Fix Tests: Quote emails not sending to clients
Root cause: Resend sandbox (onboarding@resend.dev) only allows sending to account owner email

This test verifies:
1. Health check works
2. Auth flow (signup/login)
3. Lead creation
4. Quote creation
5. Quote send - returns emailSent: false for non-owner emails (Resend sandbox limitation)
6. Quote send - returns emailSent: true for owner email (emmanuelobokoh03@gmail.com)
7. API response includes emailSent boolean and error details
8. Rate limiters don't cause ERR_ERL_PERMISSIVE_TRUST_PROXY error
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolor-light-theme.preview.emergentagent.com').rstrip('/')

# Test constants
OWNER_EMAIL = "emmanuelobokoh03@gmail.com"  # This is the account owner - emails should succeed
EXTERNAL_EMAIL = f"test-external-{uuid.uuid4().hex[:8]}@example.com"  # External email - should fail with Resend sandbox
TEST_PASSWORD = "TestPass123!"


class TestHealthCheck:
    """Verify API health and rate limiter fix"""
    
    def test_health_endpoint(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got {data}"
        assert "timestamp" in data
        print(f"✓ Health check passed: {data}")

    def test_multiple_requests_no_rate_limit_error(self):
        """Multiple requests should not cause ERR_ERL_PERMISSIVE_TRUST_PROXY"""
        for i in range(5):
            response = requests.get(f"{BASE_URL}/api/health")
            assert response.status_code == 200, f"Request {i+1} failed with {response.status_code}"
        print("✓ Multiple requests passed - no ERR_ERL_PERMISSIVE_TRUST_PROXY error")


class TestAuthFlow:
    """Test signup and login flow"""
    
    @pytest.fixture(scope="class")
    def test_user_email(self):
        return f"quote-test-{uuid.uuid4().hex[:8]}@test.com"
    
    def test_signup_success(self, test_user_email):
        """POST /api/auth/signup - Create new user"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": test_user_email,
            "password": TEST_PASSWORD,
            "firstName": "Quote",
            "lastName": "Tester"
        })
        # Accept 201 (created) or 200 (ok)
        assert response.status_code in [200, 201], f"Signup failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "token" in data or "user" in data, f"No token or user in response: {data}"
        print(f"✓ Signup success for {test_user_email}")
        return data
    
    def test_login_success(self, test_user_email):
        """POST /api/auth/login - Login with created user"""
        # First create the user
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": test_user_email,
            "password": TEST_PASSWORD,
            "firstName": "Quote",
            "lastName": "Tester"
        })
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_email,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "token" in data, f"No token in response: {data}"
        print(f"✓ Login success, token received")
        return data["token"]


class TestQuoteEmailSendP0Fix:
    """
    Core tests for P0 bug fix: Quote emails not sending
    Tests the Resend sandbox limitation handling
    """
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Create a test user and return auth token"""
        test_email = f"quote-e2e-{uuid.uuid4().hex[:8]}@test.com"
        
        # Signup
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": test_email,
            "password": TEST_PASSWORD,
            "firstName": "Quote",
            "lastName": "E2E"
        })
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.fail(f"Auth failed: {login_response.status_code} - {login_response.text}")
        
        token = login_response.json().get("token")
        print(f"✓ Auth token obtained for {test_email}")
        return token
    
    @pytest.fixture(scope="class")
    def lead_with_external_email(self, auth_token):
        """Create a lead with an external email (not owner email)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/leads", 
            headers=headers,
            json={
                "clientName": "External Client Test",
                "clientEmail": EXTERNAL_EMAIL,
                "projectTitle": "Test Project External",
                "serviceType": "PHOTOGRAPHY",
                "description": "Test lead for email send testing with external email"
            }
        )
        assert response.status_code in [200, 201], f"Lead creation failed: {response.status_code} - {response.text}"
        lead = response.json().get("lead")
        assert lead is not None, f"No lead in response: {response.json()}"
        print(f"✓ Lead created with external email: {lead.get('id')}")
        return lead
    
    @pytest.fixture(scope="class")
    def lead_with_owner_email(self, auth_token):
        """Create a lead with the owner email (should succeed in Resend sandbox)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/leads", 
            headers=headers,
            json={
                "clientName": "Owner Email Test",
                "clientEmail": OWNER_EMAIL,
                "projectTitle": "Test Project Owner",
                "serviceType": "PHOTOGRAPHY",
                "description": "Test lead for email send testing with owner email"
            }
        )
        assert response.status_code in [200, 201], f"Lead creation failed: {response.status_code} - {response.text}"
        lead = response.json().get("lead")
        assert lead is not None, f"No lead in response: {response.json()}"
        print(f"✓ Lead created with owner email: {lead.get('id')}")
        return lead
    
    @pytest.fixture(scope="class")
    def quote_for_external(self, auth_token, lead_with_external_email):
        """Create a quote for the lead with external email"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        lead_id = lead_with_external_email.get("id")
        
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=headers,
            json={
                "lineItems": [
                    {"description": "Photography Session", "quantity": 1, "price": 500},
                    {"description": "Editing", "quantity": 2, "price": 150}
                ],
                "tax": 10,
                "paymentTerms": "DEPOSIT_50",
                "validUntil": "2026-12-31",
                "terms": "Payment due within 14 days"
            }
        )
        assert response.status_code in [200, 201], f"Quote creation failed: {response.status_code} - {response.text}"
        quote = response.json().get("quote")
        assert quote is not None, f"No quote in response: {response.json()}"
        print(f"✓ Quote created for external email: {quote.get('id')}, number: {quote.get('quoteNumber')}")
        return quote
    
    @pytest.fixture(scope="class")
    def quote_for_owner(self, auth_token, lead_with_owner_email):
        """Create a quote for the lead with owner email"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        lead_id = lead_with_owner_email.get("id")
        
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=headers,
            json={
                "lineItems": [
                    {"description": "Photography Session", "quantity": 1, "price": 500},
                ],
                "tax": 0,
                "paymentTerms": "FULL_UPFRONT",
                "validUntil": "2026-12-31",
                "terms": "Full payment required"
            }
        )
        assert response.status_code in [200, 201], f"Quote creation failed: {response.status_code} - {response.text}"
        quote = response.json().get("quote")
        assert quote is not None, f"No quote in response: {response.json()}"
        print(f"✓ Quote created for owner email: {quote.get('id')}, number: {quote.get('quoteNumber')}")
        return quote
    
    def test_send_quote_external_email_returns_emailSent_false(self, auth_token, quote_for_external):
        """
        POST /api/quotes/:quoteId/send - External email should return emailSent: false
        Due to Resend sandbox limitation (only owner email allowed)
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        quote_id = quote_for_external.get("id")
        
        response = requests.post(f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=headers,
            json={}
        )
        
        # Should succeed (200) but with emailSent: false
        assert response.status_code == 200, f"Quote send failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure includes emailSent field
        assert "emailSent" in data, f"Response missing 'emailSent' field: {data}"
        
        # Email should NOT have been sent (Resend sandbox limitation)
        assert data.get("emailSent") == False, f"Expected emailSent: false, got: {data.get('emailSent')}"
        
        # Verify quote status was still updated
        assert "quote" in data, f"Response missing 'quote' field: {data}"
        assert data["quote"].get("status") == "SENT", f"Quote status should be SENT, got: {data['quote'].get('status')}"
        
        # Message should indicate email delivery failed
        assert "email delivery failed" in data.get("message", "").lower() or "email" in data.get("message", "").lower(), \
            f"Message should indicate email issue: {data.get('message')}"
        
        print(f"✓ Quote send to external email: emailSent={data.get('emailSent')}, message={data.get('message')}")
        print(f"  Quote status updated to: {data['quote'].get('status')}")
    
    def test_send_quote_owner_email_returns_emailSent_true(self, auth_token, quote_for_owner):
        """
        POST /api/quotes/:quoteId/send - Owner email should return emailSent: true
        This is the only email that works in Resend sandbox
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        quote_id = quote_for_owner.get("id")
        
        response = requests.post(f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=headers,
            json={}
        )
        
        # Should succeed (200) with emailSent: true
        assert response.status_code == 200, f"Quote send failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure includes emailSent field
        assert "emailSent" in data, f"Response missing 'emailSent' field: {data}"
        
        # Email SHOULD have been sent (owner email works in Resend sandbox)
        assert data.get("emailSent") == True, f"Expected emailSent: true for owner email, got: {data.get('emailSent')}"
        
        # Verify quote status was updated
        assert "quote" in data, f"Response missing 'quote' field: {data}"
        assert data["quote"].get("status") == "SENT", f"Quote status should be SENT, got: {data['quote'].get('status')}"
        
        # Message should indicate success
        assert "success" in data.get("message", "").lower(), \
            f"Message should indicate success: {data.get('message')}"
        
        print(f"✓ Quote send to owner email: emailSent={data.get('emailSent')}, message={data.get('message')}")
        print(f"  Quote status updated to: {data['quote'].get('status')}")
    
    def test_api_response_structure_includes_all_fields(self, auth_token, lead_with_external_email):
        """Verify API response includes emailSent boolean and appropriate message"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        lead_id = lead_with_external_email.get("id")
        
        # Create a new quote
        create_response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=headers,
            json={
                "lineItems": [{"description": "Test", "quantity": 1, "price": 100}],
                "tax": 0,
                "validUntil": "2026-12-31"
            }
        )
        quote = create_response.json().get("quote")
        quote_id = quote.get("id")
        
        # Send the quote
        send_response = requests.post(f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=headers,
            json={}
        )
        
        assert send_response.status_code == 200
        data = send_response.json()
        
        # Required fields check
        required_fields = ["message", "quote", "emailSent"]
        for field in required_fields:
            assert field in data, f"Missing required field '{field}' in response: {data}"
        
        # emailSent must be boolean
        assert isinstance(data["emailSent"], bool), f"emailSent should be boolean, got: {type(data['emailSent'])}"
        
        # Quote should have id and status
        assert "id" in data["quote"], f"Quote missing 'id': {data['quote']}"
        assert "status" in data["quote"], f"Quote missing 'status': {data['quote']}"
        
        print(f"✓ API response structure verified: {list(data.keys())}")


class TestLeadCreation:
    """Test lead creation endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        test_email = f"lead-test-{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": test_email,
            "password": TEST_PASSWORD,
            "firstName": "Lead",
            "lastName": "Tester"
        })
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": TEST_PASSWORD
        })
        return login_response.json().get("token")
    
    def test_create_lead_success(self, auth_token):
        """POST /api/leads - Create lead works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/leads",
            headers=headers,
            json={
                "clientName": "Test Client",
                "clientEmail": "client@test.com",
                "projectTitle": "Test Project",
                "serviceType": "PHOTOGRAPHY",
                "description": "Test description"
            }
        )
        
        assert response.status_code in [200, 201], f"Lead creation failed: {response.status_code}"
        data = response.json()
        assert "lead" in data, f"Response missing 'lead': {data}"
        assert data["lead"].get("clientName") == "Test Client"
        print(f"✓ Lead created: {data['lead'].get('id')}")


class TestQuoteCreation:
    """Test quote creation endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token_and_lead(self):
        test_email = f"quote-create-{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": test_email,
            "password": TEST_PASSWORD,
            "firstName": "Quote",
            "lastName": "Creator"
        })
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": TEST_PASSWORD
        })
        token = login_response.json().get("token")
        
        # Create lead
        headers = {"Authorization": f"Bearer {token}"}
        lead_response = requests.post(f"{BASE_URL}/api/leads",
            headers=headers,
            json={
                "clientName": "Quote Test Client",
                "clientEmail": "quote-client@test.com",
                "projectTitle": "Quote Test Project",
                "serviceType": "VIDEOGRAPHY",
                "description": "Testing quote creation"
            }
        )
        lead = lead_response.json().get("lead")
        
        return token, lead
    
    def test_create_quote_success(self, auth_token_and_lead):
        """POST /api/leads/:leadId/quotes - Create quote works"""
        token, lead = auth_token_and_lead
        headers = {"Authorization": f"Bearer {token}"}
        lead_id = lead.get("id")
        
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=headers,
            json={
                "lineItems": [
                    {"description": "Video Shoot", "quantity": 1, "price": 1000},
                    {"description": "Editing", "quantity": 5, "price": 100}
                ],
                "tax": 8.5,
                "paymentTerms": "DEPOSIT_50",
                "validUntil": "2026-12-31",
                "terms": "Standard terms"
            }
        )
        
        assert response.status_code in [200, 201], f"Quote creation failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "quote" in data, f"Response missing 'quote': {data}"
        
        quote = data["quote"]
        assert quote.get("quoteNumber") is not None
        assert quote.get("total") > 0
        assert quote.get("status") == "DRAFT"
        
        print(f"✓ Quote created: {quote.get('quoteNumber')}, total: {quote.get('total')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
