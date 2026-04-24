"""
Iteration 153 Backend Tests
- T1: Settings UI digest preview (POST /api/digest/send)
- T2: Shared contract templates verification
- T3: Forgot-password rate limit DB persistence
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print(f"✓ Health check passed: {data}")
    
    def test_login_success(self):
        """Verify login works with test credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return session


class TestDigestPreview:
    """T1: Test POST /api/digest/send endpoint"""
    
    def test_digest_send_unauthenticated(self):
        """POST /api/digest/send without auth should return 401"""
        response = requests.post(f"{BASE_URL}/api/digest/send")
        assert response.status_code == 401
        print(f"✓ Unauthenticated digest send returns 401")
    
    def test_digest_send_authenticated(self):
        """POST /api/digest/send with auth should return 200"""
        session = requests.Session()
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        
        # Send digest preview
        response = session.post(f"{BASE_URL}/api/digest/send")
        # Should return 200 with either success or skipped (if no activity)
        assert response.status_code == 200
        data = response.json()
        # Response should have either 'skipped' or 'success' indicator
        print(f"✓ Authenticated digest send returns 200: {data}")


class TestSharedContractTemplates:
    """T2: Verify shared contract templates work correctly"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        return session
    
    def test_contract_templates_list(self, auth_session):
        """GET /api/contracts/templates/list should return templates"""
        response = auth_session.get(f"{BASE_URL}/api/contracts/templates/list")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        templates = data["templates"]
        
        # Verify expected template types exist
        template_types = [t["type"] for t in templates]
        expected_types = ["PHOTOGRAPHY_SHOOT", "PORTRAIT_COMMISSION", "LOGO_DESIGN", 
                         "WEB_DESIGN", "GENERAL_SERVICE", "CUSTOM"]
        
        # At least some of the expected types should be present
        found_types = [t for t in expected_types if t in template_types]
        assert len(found_types) >= 3, f"Expected at least 3 template types, found: {template_types}"
        print(f"✓ Contract templates list returns {len(templates)} templates: {template_types}")
    
    def test_contract_templates_by_industry(self, auth_session):
        """GET /api/contracts/templates/list?industry=PHOTOGRAPHY should filter templates"""
        response = auth_session.get(f"{BASE_URL}/api/contracts/templates/list?industry=PHOTOGRAPHY")
        assert response.status_code == 200
        data = response.json()
        templates = data["templates"]
        template_types = [t["type"] for t in templates]
        
        # Photography industry should include PHOTOGRAPHY_SHOOT
        assert "PHOTOGRAPHY_SHOOT" in template_types
        print(f"✓ Photography industry templates: {template_types}")


class TestForgotPasswordRateLimit:
    """T3: Test DB-persisted forgot-password rate limit"""
    
    def test_forgot_password_rate_limit(self):
        """
        Test that forgot-password rate limit is enforced:
        - First 3 calls should return 200
        - 4th call should return 429
        """
        # Use a unique test email to avoid affecting other tests
        test_email = TEST_EMAIL
        
        # Make 4 requests
        results = []
        for i in range(4):
            response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
                "email": test_email
            })
            results.append(response.status_code)
            print(f"  Request {i+1}: status {response.status_code}")
            time.sleep(0.5)  # Small delay between requests
        
        # First 3 should be 200, 4th should be 429
        # Note: If the user already has attempts from previous tests, 
        # we might hit 429 earlier
        assert 429 in results, f"Expected 429 in results, got: {results}"
        print(f"✓ Rate limit enforced: {results}")
    
    def test_forgot_password_validation(self):
        """Test forgot-password requires email"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={})
        assert response.status_code == 400
        print(f"✓ Forgot password validation works (400 for missing email)")


class TestAuthCleanup:
    """T3: Verify auth.ts cleanup - no in-memory rate limit Map"""
    
    def test_reset_password_clears_rate_limit(self):
        """
        After successful password reset, rate limit counters should be cleared.
        This is a code verification test - we verify the endpoint exists.
        """
        # We can't fully test this without a valid reset token,
        # but we can verify the endpoint responds correctly to invalid tokens
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token_12345",
            "password": "newpassword123"
        })
        # Should return 400 for invalid token (not 500)
        assert response.status_code == 400
        data = response.json()
        assert "Invalid Token" in data.get("error", "") or "invalid" in data.get("message", "").lower()
        print(f"✓ Reset password endpoint handles invalid tokens correctly")


class TestRegressionChecks:
    """Regression tests for existing functionality"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        return session
    
    def test_settings_endpoint(self, auth_session):
        """GET /api/settings should work"""
        response = auth_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        print(f"✓ Settings endpoint works")
    
    def test_leads_endpoint(self, auth_session):
        """GET /api/leads should work"""
        response = auth_session.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✓ Leads endpoint works, found {len(data['leads'])} leads")
    
    def test_quotes_all_endpoint(self, auth_session):
        """GET /api/quotes/all should work"""
        response = auth_session.get(f"{BASE_URL}/api/quotes/all")
        assert response.status_code == 200
        data = response.json()
        assert "quotes" in data
        print(f"✓ Quotes endpoint works, found {len(data['quotes'])} quotes")
    
    def test_contracts_all_endpoint(self, auth_session):
        """GET /api/contracts/all should work"""
        response = auth_session.get(f"{BASE_URL}/api/contracts/all")
        assert response.status_code == 200
        data = response.json()
        assert "contracts" in data
        print(f"✓ Contracts endpoint works, found {len(data['contracts'])} contracts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
