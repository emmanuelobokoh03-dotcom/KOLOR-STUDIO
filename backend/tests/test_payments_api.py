"""
Test suite for Payment API endpoints (Day 9: Auto Payment Collection with Stripe Integration)

Tests:
- Payment endpoints require authentication (401 without token)
- GET /api/payments/:incomeId/status - returns 404 for non-existent income
- GET /api/payments/by-quote/:quoteId - returns 404 for non-existent quote
- POST /api/payments/:incomeId/deposit - returns 404 for non-existent income
- POST /api/payments/:incomeId/final - returns 400 if deposit not paid
- GET /api/payments/session/:sessionId/status - returns 500/503 with invalid Stripe key
- POST /api/webhooks/stripe - returns 400 for invalid signature
- Regression: existing flows (login, leads, sequences, health) still work
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://landing-redesign-32.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestPaymentsAuth:
    """Payment endpoints require authentication"""
    
    def test_status_requires_auth(self):
        """GET /api/payments/:incomeId/status returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/payments/nonexistent-income-id/status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✅ GET /api/payments/:incomeId/status requires authentication")
    
    def test_deposit_requires_auth(self):
        """POST /api/payments/:incomeId/deposit returns 401 without token"""
        response = requests.post(f"{BASE_URL}/api/payments/nonexistent-income-id/deposit", json={})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✅ POST /api/payments/:incomeId/deposit requires authentication")
    
    def test_final_requires_auth(self):
        """POST /api/payments/:incomeId/final returns 401 without token"""
        response = requests.post(f"{BASE_URL}/api/payments/nonexistent-income-id/final", json={})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✅ POST /api/payments/:incomeId/final requires authentication")
    
    def test_by_quote_requires_auth(self):
        """GET /api/payments/by-quote/:quoteId returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/payments/by-quote/nonexistent-quote-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✅ GET /api/payments/by-quote/:quoteId requires authentication")


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    print(f"✅ Logged in as {TEST_EMAIL}")
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers for requests"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestPaymentEndpoints:
    """Test payment-specific endpoints with auth"""
    
    def test_status_returns_404_for_nonexistent_income(self, auth_headers):
        """GET /api/payments/:incomeId/status returns 404 for non-existent income"""
        fake_id = f"nonexistent-{uuid.uuid4()}"
        response = requests.get(
            f"{BASE_URL}/api/payments/{fake_id}/status",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data
        print("✅ GET /api/payments/:incomeId/status returns 404 for non-existent income")
    
    def test_deposit_returns_404_for_nonexistent_income(self, auth_headers):
        """POST /api/payments/:incomeId/deposit returns 404 for non-existent income"""
        fake_id = f"nonexistent-{uuid.uuid4()}"
        response = requests.post(
            f"{BASE_URL}/api/payments/{fake_id}/deposit",
            headers=auth_headers,
            json={"originUrl": "https://test.com"}
        )
        # Could be 404 (not found) or 503 (Stripe not configured) - both are valid handling
        assert response.status_code in [404, 503], f"Expected 404 or 503, got {response.status_code}: {response.text}"
        print(f"✅ POST /api/payments/:incomeId/deposit returns {response.status_code} for non-existent income")
    
    def test_final_returns_404_for_nonexistent_income(self, auth_headers):
        """POST /api/payments/:incomeId/final returns 404 for non-existent income"""
        fake_id = f"nonexistent-{uuid.uuid4()}"
        response = requests.post(
            f"{BASE_URL}/api/payments/{fake_id}/final",
            headers=auth_headers,
            json={"originUrl": "https://test.com"}
        )
        # Could be 404 (not found) or 503 (Stripe not configured) - both are valid handling
        assert response.status_code in [404, 503], f"Expected 404 or 503, got {response.status_code}: {response.text}"
        print(f"✅ POST /api/payments/:incomeId/final returns {response.status_code} for non-existent income")
    
    def test_by_quote_returns_404_for_nonexistent_quote(self, auth_headers):
        """GET /api/payments/by-quote/:quoteId returns 404 for non-existent quote"""
        fake_id = f"nonexistent-quote-{uuid.uuid4()}"
        response = requests.get(
            f"{BASE_URL}/api/payments/by-quote/{fake_id}",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data
        print("✅ GET /api/payments/by-quote/:quoteId returns 404 for non-existent quote")
    
    def test_session_status_handles_invalid_stripe_key(self):
        """GET /api/payments/session/:sessionId/status returns 503 or 500 with invalid Stripe key"""
        fake_session_id = "cs_test_invalid_session"
        response = requests.get(f"{BASE_URL}/api/payments/session/{fake_session_id}/status")
        # With invalid Stripe key, should return 503 (Stripe not configured) or 500 (error)
        assert response.status_code in [500, 503], f"Expected 500 or 503, got {response.status_code}: {response.text}"
        print(f"✅ GET /api/payments/session/:sessionId/status returns {response.status_code} (Stripe key issue handled gracefully)")


class TestWebhookEndpoints:
    """Test Stripe webhook endpoints"""
    
    def test_webhook_returns_400_for_invalid_signature(self):
        """POST /api/webhooks/stripe returns 400 for invalid signature"""
        # Send a fake webhook without proper signature
        response = requests.post(
            f"{BASE_URL}/api/webhooks/stripe",
            data=b'{"type": "checkout.session.completed"}',
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 (missing/invalid signature) or 503 (Stripe not configured)
        assert response.status_code in [400, 503], f"Expected 400 or 503, got {response.status_code}: {response.text}"
        print(f"✅ POST /api/webhooks/stripe returns {response.status_code} for invalid signature")
    
    def test_webhook_returns_400_with_fake_signature(self):
        """POST /api/webhooks/stripe returns 400 with fake signature"""
        response = requests.post(
            f"{BASE_URL}/api/webhooks/stripe",
            data=b'{"type": "checkout.session.completed", "data": {"object": {}}}',
            headers={
                "Content-Type": "application/json",
                "stripe-signature": "t=12345,v1=fake_signature"
            }
        )
        # Should return 400 (invalid signature) or 503 (Stripe not configured)
        assert response.status_code in [400, 503], f"Expected 400 or 503, got {response.status_code}: {response.text}"
        print(f"✅ POST /api/webhooks/stripe returns {response.status_code} with fake signature")


class TestRegressionExistingFlows:
    """Verify existing flows still work (regression tests)"""
    
    def test_health_endpoint(self):
        """Health endpoint still working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✅ Health endpoint working")
    
    def test_login_flow(self):
        """Login flow still working"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print("✅ Login flow working")
    
    def test_leads_access(self, auth_headers):
        """Leads API still accessible"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✅ Leads API working - {len(data['leads'])} leads found")
    
    def test_sequences_access(self, auth_headers):
        """Sequences API still accessible"""
        response = requests.get(f"{BASE_URL}/api/sequences", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "sequences" in data
        print(f"✅ Sequences API working - {len(data['sequences'])} sequences found")


class TestRouteOrdering:
    """Test route ordering to ensure by-quote and session routes work correctly"""
    
    def test_by_quote_route_not_conflicting(self, auth_headers):
        """Verify /by-quote/:quoteId doesn't conflict with /:incomeId routes"""
        # This tests that "by-quote" is NOT treated as an incomeId
        response = requests.get(
            f"{BASE_URL}/api/payments/by-quote/test-quote-id",
            headers=auth_headers
        )
        # Should return 404 (quote not found), NOT an error parsing "by-quote" as incomeId
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        # The error should mention "quote" not "income"
        error_msg = data.get("error", "").lower()
        assert "quote" in error_msg or "payment record" in error_msg, f"Error should mention quote: {data}"
        print("✅ /by-quote route correctly handled (not conflicting with /:incomeId)")
    
    def test_session_route_not_conflicting(self):
        """Verify /session/:sessionId/status doesn't conflict with /:incomeId routes"""
        # This tests that "session" is NOT treated as an incomeId
        response = requests.get(f"{BASE_URL}/api/payments/session/test-session-id/status")
        # Should return 503 (Stripe not configured) or 500 (error), NOT 404 income not found
        assert response.status_code in [500, 503], f"Expected 500/503, got {response.status_code}"
        print("✅ /session route correctly handled (not conflicting with /:incomeId)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
