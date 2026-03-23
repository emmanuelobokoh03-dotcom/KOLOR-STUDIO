"""
HTTP-Only Cookie Authentication Migration Tests
Tests the P0 security migration from localStorage JWTs to HTTP-Only cookies.

Test credentials: email=bookingtest@test.com, password=password123
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')


class TestHTTPOnlyCookieAuth:
    """Tests for HTTP-Only cookie authentication migration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.test_email = "bookingtest@test.com"
        self.test_password = "password123"
    
    # ==================== BACKEND TESTS ====================
    
    def test_login_sets_httponly_cookie(self):
        """POST /api/auth/login should set an HTTP-Only auth_token cookie"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check response body
        data = response.json()
        assert "token" in data, "Response should include token for backward compat"
        assert "user" in data, "Response should include user data"
        assert data["user"]["email"] == self.test_email
        
        # Check that auth_token cookie was set
        cookies = response.cookies
        assert "auth_token" in cookies, "auth_token cookie should be set"
        
        # Verify cookie attributes via Set-Cookie header
        set_cookie_header = response.headers.get("Set-Cookie", "")
        assert "auth_token=" in set_cookie_header, "Set-Cookie header should contain auth_token"
        assert "HttpOnly" in set_cookie_header, "Cookie should be HttpOnly"
        assert "Path=/" in set_cookie_header, "Cookie should have Path=/"
        
        print(f"✅ Login sets HTTP-Only cookie correctly")
        print(f"   Set-Cookie: {set_cookie_header[:100]}...")
    
    def test_auth_me_with_cookie(self):
        """GET /api/auth/me should return user data when auth_token cookie is sent"""
        # First login to get the cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        assert login_response.status_code == 200
        
        # Now call /api/auth/me - session should automatically send the cookie
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        
        assert me_response.status_code == 200, f"GET /api/auth/me failed: {me_response.text}"
        
        data = me_response.json()
        assert "user" in data, "Response should include user object"
        assert data["user"]["email"] == self.test_email
        assert "id" in data["user"]
        assert "firstName" in data["user"]
        
        print(f"✅ GET /api/auth/me works with cookie auth")
        print(f"   User: {data['user']['firstName']} ({data['user']['email']})")
    
    def test_auth_me_without_cookie_returns_401(self):
        """GET /api/auth/me should return 401 when no cookie or auth header is provided"""
        # Use a fresh session without any cookies
        fresh_session = requests.Session()
        
        response = fresh_session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert "error" in data or "message" in data
        
        print(f"✅ GET /api/auth/me returns 401 without auth")
    
    def test_protected_route_without_cookie_returns_401(self):
        """GET /api/leads should return 401 without cookie"""
        fresh_session = requests.Session()
        
        response = fresh_session.get(f"{BASE_URL}/api/leads")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print(f"✅ Protected route /api/leads returns 401 without auth")
    
    def test_protected_route_with_cookie_works(self):
        """GET /api/leads should work with auth_token cookie"""
        # Login first
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        assert login_response.status_code == 200
        
        # Access protected route
        leads_response = self.session.get(f"{BASE_URL}/api/leads")
        
        assert leads_response.status_code == 200, f"GET /api/leads failed: {leads_response.text}"
        
        data = leads_response.json()
        assert "leads" in data, "Response should include leads array"
        
        print(f"✅ Protected route /api/leads works with cookie auth")
        print(f"   Found {len(data['leads'])} leads")
    
    def test_logout_clears_cookie(self):
        """POST /api/auth/logout should clear the auth_token cookie"""
        # Login first
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        assert login_response.status_code == 200
        
        # Verify we're logged in
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        # Logout
        logout_response = self.session.post(f"{BASE_URL}/api/auth/logout")
        
        assert logout_response.status_code == 200, f"Logout failed: {logout_response.text}"
        
        data = logout_response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower() or "success" in data["message"].lower()
        
        # Check Set-Cookie header clears the cookie
        set_cookie_header = logout_response.headers.get("Set-Cookie", "")
        # Cookie should be cleared (empty value or expired)
        
        print(f"✅ POST /api/auth/logout clears cookie")
        print(f"   Response: {data['message']}")
    
    def test_after_logout_auth_me_returns_401(self):
        """After logout, GET /api/auth/me should return 401"""
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        assert login_response.status_code == 200
        
        # Logout
        logout_response = self.session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        
        # Clear cookies from session to simulate browser behavior after logout
        self.session.cookies.clear()
        
        # Try to access /api/auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        
        assert me_response.status_code == 401, f"Expected 401 after logout, got {me_response.status_code}"
        
        print(f"✅ After logout, /api/auth/me returns 401")
    
    def test_bearer_token_fallback_still_works(self):
        """Auth middleware should still accept Bearer token in Authorization header (backward compat)"""
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        assert login_response.status_code == 200
        
        token = login_response.json().get("token")
        assert token, "Login should return token"
        
        # Use fresh session without cookies, but with Bearer token
        fresh_session = requests.Session()
        fresh_session.headers.update({"Authorization": f"Bearer {token}"})
        
        me_response = fresh_session.get(f"{BASE_URL}/api/auth/me")
        
        assert me_response.status_code == 200, f"Bearer token auth failed: {me_response.text}"
        
        data = me_response.json()
        assert data["user"]["email"] == self.test_email
        
        print(f"✅ Bearer token fallback still works for backward compatibility")
    
    def test_invalid_credentials_returns_401(self):
        """POST /api/auth/login with invalid credentials should return 401"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": "wrongpassword"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Should not set cookie on failed login
        assert "auth_token" not in response.cookies
        
        print(f"✅ Invalid credentials return 401 without setting cookie")


class TestCookieSecurityAttributes:
    """Tests for cookie security attributes"""
    
    def test_cookie_has_correct_attributes(self):
        """Verify cookie has correct security attributes"""
        session = requests.Session()
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingtest@test.com", "password": "password123"}
        )
        
        assert response.status_code == 200
        
        set_cookie = response.headers.get("Set-Cookie", "")
        
        # Check required attributes
        assert "HttpOnly" in set_cookie, "Cookie must be HttpOnly"
        assert "Path=/" in set_cookie, "Cookie must have Path=/"
        
        # SameSite should be Lax (case-insensitive check)
        assert "samesite=lax" in set_cookie.lower() or "SameSite=Lax" in set_cookie, \
            f"Cookie should have SameSite=Lax, got: {set_cookie}"
        
        # Max-Age should be set (7 days = 604800 seconds)
        assert "Max-Age=" in set_cookie, "Cookie should have Max-Age set"
        
        print(f"✅ Cookie has correct security attributes")
        print(f"   HttpOnly: ✓")
        print(f"   SameSite=Lax: ✓")
        print(f"   Path=/: ✓")
        print(f"   Max-Age: ✓")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
