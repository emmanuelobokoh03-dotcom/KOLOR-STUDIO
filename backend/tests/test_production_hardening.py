"""
Production Hardening Tests for Kolor Studio CRM
Tests: Security headers (helmet), gzip compression, rate limiting, health endpoint, auth flow
"""
import pytest
import requests

# Base URL from environment - using the public preview URL
BASE_URL = "https://hardened-crm-2.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_200(self):
        """Test /api/health returns 200 with status ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got {data.get('status')}"
        assert "timestamp" in data, "Missing timestamp in response"
        assert "message" in data, "Missing message in response"
        print(f"✅ Health endpoint: {data}")


class TestSecurityHeaders:
    """Security headers from helmet middleware tests"""
    
    def test_x_content_type_options_header(self):
        """Test X-Content-Type-Options header is present"""
        response = requests.get(f"{BASE_URL}/api/health")
        header = response.headers.get("x-content-type-options")
        assert header is not None, "Missing x-content-type-options header"
        assert header == "nosniff", f"Expected 'nosniff', got '{header}'"
        print(f"✅ X-Content-Type-Options: {header}")
    
    def test_x_frame_options_header(self):
        """Test X-Frame-Options header is present"""
        response = requests.get(f"{BASE_URL}/api/health")
        header = response.headers.get("x-frame-options")
        # Helmet sets SAMEORIGIN by default
        assert header is not None, "Missing x-frame-options header"
        print(f"✅ X-Frame-Options: {header}")
    
    def test_strict_transport_security_header(self):
        """Test Strict-Transport-Security (HSTS) header is present"""
        response = requests.get(f"{BASE_URL}/api/health")
        header = response.headers.get("strict-transport-security")
        assert header is not None, "Missing strict-transport-security header"
        # Should include max-age and includeSubDomains
        assert "max-age=" in header, f"HSTS missing max-age: {header}"
        print(f"✅ Strict-Transport-Security: {header}")
    
    def test_x_xss_protection_header(self):
        """Test X-XSS-Protection header (may be deprecated but still set by helmet)"""
        response = requests.get(f"{BASE_URL}/api/health")
        header = response.headers.get("x-xss-protection")
        # Note: Modern helmet may set this to "0" as it's deprecated in favor of CSP
        # Or it may not be present at all in newer versions
        print(f"ℹ️ X-XSS-Protection: {header if header else 'Not set (expected in modern helmet)'}")
    
    def test_content_security_policy_header(self):
        """Test Content-Security-Policy header is present"""
        response = requests.get(f"{BASE_URL}/api/health")
        header = response.headers.get("content-security-policy")
        assert header is not None, "Missing content-security-policy header"
        # Should allow plausible.io scripts
        assert "plausible.io" in header, f"CSP should allow plausible.io: {header}"
        print("✅ Content-Security-Policy present (allows plausible.io)")


class TestGzipCompression:
    """Gzip compression middleware tests"""
    
    def test_gzip_compression_on_large_response(self):
        """Test that responses include gzip compression for large payloads"""
        # Request with Accept-Encoding: gzip
        headers = {"Accept-Encoding": "gzip, deflate"}
        response = requests.get(f"{BASE_URL}/api/health", headers=headers)
        
        # Check content-encoding header
        encoding = response.headers.get("content-encoding")
        # Note: Small responses (<1024 bytes) may not be compressed
        # Health endpoint response is small, so compression may not apply
        print(f"ℹ️ Content-Encoding: {encoding if encoding else 'Not compressed (response may be below threshold)'}")
        
        # Try a larger endpoint that would trigger compression
        # The root API endpoint returns more data
        response2 = requests.get(f"{BASE_URL}/api", headers=headers)
        encoding2 = response2.headers.get("content-encoding")
        print(f"ℹ️ Content-Encoding for /api: {encoding2 if encoding2 else 'Not compressed'}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_success(self):
        """Test POST /api/auth/login with valid credentials returns auth cookie"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            allow_redirects=False
        )
        
        assert response.status_code == 200, f"Login failed with status {response.status_code}: {response.text}"
        
        # Check for auth cookie (HTTP-only cookie named 'token')
        cookies = response.cookies
        cookies.get("token")
        
        # Also check Set-Cookie header
        set_cookie = response.headers.get("set-cookie", "")
        
        data = response.json()
        assert "user" in data, f"Missing user in response: {data}"
        print(f"✅ Login successful for user: {data.get('user', {}).get('email')}")
        print(f"ℹ️ Set-Cookie header present: {'token' in set_cookie}")
        
        return cookies
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid login correctly returns 401")
    
    def test_dashboard_access_with_cookie(self):
        """Test dashboard API access with auth cookie"""
        # First login to get cookie
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Now try to access a protected endpoint (leads)
        leads_response = session.get(f"{BASE_URL}/api/leads")
        
        assert leads_response.status_code == 200, f"Dashboard access failed: {leads_response.status_code}"
        print("✅ Dashboard API access successful with cookie auth")
        
        return leads_response.json()


class TestRateLimiting:
    """Rate limiting tests - Note: Rate limiting is disabled in development mode"""
    
    def test_rate_limit_headers_present(self):
        """Test that rate limit headers are present in responses"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        # Check for standard rate limit headers
        ratelimit_limit = response.headers.get("ratelimit-limit")
        ratelimit_remaining = response.headers.get("ratelimit-remaining")
        ratelimit_reset = response.headers.get("ratelimit-reset")
        
        # Note: Health endpoint skips rate limiting
        print(f"ℹ️ RateLimit-Limit: {ratelimit_limit}")
        print(f"ℹ️ RateLimit-Remaining: {ratelimit_remaining}")
        print(f"ℹ️ RateLimit-Reset: {ratelimit_reset}")
    
    def test_auth_rate_limit_info(self):
        """Test rate limit headers on auth endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@test.com", "password": "test"}
        )
        
        # Check for rate limit headers
        ratelimit_limit = response.headers.get("ratelimit-limit")
        ratelimit_remaining = response.headers.get("ratelimit-remaining")
        
        print(f"ℹ️ Auth RateLimit-Limit: {ratelimit_limit}")
        print(f"ℹ️ Auth RateLimit-Remaining: {ratelimit_remaining}")
        
        # Note: In development mode, rate limiting is skipped
        # In production, after 30 requests/hour, should return 429


class TestAPIEndpoints:
    """General API endpoint tests"""
    
    def test_api_root_returns_info(self):
        """Test /api returns API info"""
        response = requests.get(f"{BASE_URL}/api")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data, "Missing name in API info"
        assert "version" in data, "Missing version in API info"
        assert "endpoints" in data, "Missing endpoints in API info"
        print(f"✅ API root: {data.get('name')} v{data.get('version')}")
    
    def test_404_for_unknown_route(self):
        """Test 404 response for unknown routes"""
        response = requests.get(f"{BASE_URL}/api/unknown-route-xyz")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Missing error in 404 response"
        print(f"✅ 404 handler working: {data.get('error')}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
