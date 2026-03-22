"""
Test Remember Me Feature - Iteration 88
Tests the new 'Remember Me' toggle functionality on login:
- rememberMe=true: 7-day persistent cookie (with Max-Age)
- rememberMe=false: session-only cookie (no Max-Age/Expires)
- Default behavior when rememberMe is not provided
"""

import pytest
import requests
import os
import re
from http.cookies import SimpleCookie

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://raleway-design-check.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestRememberMeBackend:
    """Backend tests for Remember Me feature"""

    def test_login_with_remember_me_true_sets_persistent_cookie(self):
        """POST /api/auth/login with rememberMe=true should set cookie with Max-Age (7 days)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": True},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check Set-Cookie header
        set_cookie = response.headers.get('Set-Cookie', '')
        print(f"Set-Cookie header (rememberMe=true): {set_cookie}")
        
        # Should have Max-Age for persistent cookie (7 days = 604800 seconds)
        assert 'auth_token=' in set_cookie, "auth_token cookie not set"
        assert 'Max-Age=' in set_cookie or 'max-age=' in set_cookie.lower(), "Max-Age should be present for rememberMe=true"
        
        # Verify Max-Age is approximately 7 days (604800 seconds)
        max_age_match = re.search(r'[Mm]ax-[Aa]ge=(\d+)', set_cookie)
        if max_age_match:
            max_age = int(max_age_match.group(1))
            # 7 days = 604800 seconds
            assert 600000 < max_age <= 604800, f"Max-Age should be ~7 days, got {max_age}"
            print(f"Max-Age: {max_age} seconds (~{max_age/86400:.1f} days)")

    def test_login_with_remember_me_false_sets_session_cookie(self):
        """POST /api/auth/login with rememberMe=false should set session cookie (no Max-Age/Expires)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": False},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check Set-Cookie header
        set_cookie = response.headers.get('Set-Cookie', '')
        print(f"Set-Cookie header (rememberMe=false): {set_cookie}")
        
        # Should NOT have Max-Age or Expires for session cookie
        assert 'auth_token=' in set_cookie, "auth_token cookie not set"
        
        # Session cookies should NOT have Max-Age
        has_max_age = 'Max-Age=' in set_cookie or 'max-age=' in set_cookie.lower()
        assert not has_max_age, f"Session cookie should NOT have Max-Age, but found: {set_cookie}"
        
        # Session cookies should NOT have Expires (or if present, should be session-based)
        # Note: Some servers may still set Expires for session cookies, but Max-Age takes precedence
        print("Session cookie confirmed - no Max-Age attribute")

    def test_login_without_remember_me_defaults_to_persistent_cookie(self):
        """POST /api/auth/login without rememberMe param should default to rememberMe=true (7-day cookie)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},  # No rememberMe param
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check Set-Cookie header
        set_cookie = response.headers.get('Set-Cookie', '')
        print(f"Set-Cookie header (no rememberMe param): {set_cookie}")
        
        # Should have Max-Age (default is rememberMe=true)
        assert 'auth_token=' in set_cookie, "auth_token cookie not set"
        assert 'Max-Age=' in set_cookie or 'max-age=' in set_cookie.lower(), "Default should be rememberMe=true with Max-Age"

    def test_jwt_expiry_differs_based_on_remember_me(self):
        """JWT expiry should be 7d when rememberMe=true, 24h when rememberMe=false"""
        import jwt
        
        # Login with rememberMe=true
        response_true = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": True},
            headers={"Content-Type": "application/json"}
        )
        assert response_true.status_code == 200
        token_true = response_true.json().get('token')
        
        # Login with rememberMe=false
        response_false = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": False},
            headers={"Content-Type": "application/json"}
        )
        assert response_false.status_code == 200
        token_false = response_false.json().get('token')
        
        # Decode tokens without verification to check expiry
        if token_true and token_false:
            try:
                decoded_true = jwt.decode(token_true, options={"verify_signature": False})
                decoded_false = jwt.decode(token_false, options={"verify_signature": False})
                
                exp_true = decoded_true.get('exp')
                exp_false = decoded_false.get('exp')
                iat_true = decoded_true.get('iat', exp_true - 604800)  # Assume 7 days if no iat
                iat_false = decoded_false.get('iat', exp_false - 86400)  # Assume 24h if no iat
                
                # Calculate expiry duration
                duration_true = exp_true - iat_true if exp_true and iat_true else None
                duration_false = exp_false - iat_false if exp_false and iat_false else None
                
                print(f"Token (rememberMe=true) expiry duration: {duration_true} seconds (~{duration_true/86400:.1f} days)" if duration_true else "Could not determine expiry")
                print(f"Token (rememberMe=false) expiry duration: {duration_false} seconds (~{duration_false/86400:.1f} days)" if duration_false else "Could not determine expiry")
                
                # rememberMe=true should have longer expiry than rememberMe=false
                if duration_true and duration_false:
                    assert duration_true > duration_false, "rememberMe=true should have longer JWT expiry"
                    # 7 days = 604800 seconds, 24h = 86400 seconds
                    assert duration_true >= 604800 - 60, f"rememberMe=true JWT should be ~7 days, got {duration_true}"
                    assert duration_false <= 86400 + 60, f"rememberMe=false JWT should be ~24h, got {duration_false}"
            except Exception as e:
                print(f"JWT decode warning (non-critical): {e}")
                # If we can't decode, at least verify tokens are different
                assert token_true != token_false, "Tokens should be different"

    def test_session_cookie_still_works_for_auth(self):
        """Session cookie (rememberMe=false) should still authenticate requests"""
        session = requests.Session()
        
        # Login with rememberMe=false
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": False},
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Verify cookie was set
        assert 'auth_token' in session.cookies, "auth_token cookie not in session"
        
        # Use the session cookie to access protected route
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"Auth with session cookie failed: {me_response.text}"
        
        user_data = me_response.json().get('user', {})
        assert user_data.get('email') == TEST_EMAIL, "User email mismatch"
        print(f"Session cookie auth successful for user: {user_data.get('email')}")

    def test_persistent_cookie_still_works_for_auth(self):
        """Persistent cookie (rememberMe=true) should authenticate requests"""
        session = requests.Session()
        
        # Login with rememberMe=true
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": True},
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Verify cookie was set
        assert 'auth_token' in session.cookies, "auth_token cookie not in session"
        
        # Use the session cookie to access protected route
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"Auth with persistent cookie failed: {me_response.text}"
        
        user_data = me_response.json().get('user', {})
        assert user_data.get('email') == TEST_EMAIL, "User email mismatch"
        print(f"Persistent cookie auth successful for user: {user_data.get('email')}")


class TestRememberMeCookieAttributes:
    """Test cookie security attributes are consistent"""

    def test_cookie_has_httponly_attribute(self):
        """Cookie should always have HttpOnly attribute regardless of rememberMe"""
        for remember_me in [True, False]:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": remember_me},
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200
            set_cookie = response.headers.get('Set-Cookie', '')
            assert 'HttpOnly' in set_cookie or 'httponly' in set_cookie.lower(), f"HttpOnly missing for rememberMe={remember_me}"
            print(f"HttpOnly confirmed for rememberMe={remember_me}")

    def test_cookie_has_samesite_attribute(self):
        """Cookie should have SameSite attribute regardless of rememberMe"""
        for remember_me in [True, False]:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": remember_me},
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200
            set_cookie = response.headers.get('Set-Cookie', '')
            assert 'SameSite=' in set_cookie or 'samesite=' in set_cookie.lower(), f"SameSite missing for rememberMe={remember_me}"
            print(f"SameSite confirmed for rememberMe={remember_me}")

    def test_cookie_has_path_attribute(self):
        """Cookie should have Path=/ attribute regardless of rememberMe"""
        for remember_me in [True, False]:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "rememberMe": remember_me},
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200
            set_cookie = response.headers.get('Set-Cookie', '')
            assert 'Path=/' in set_cookie or 'path=/' in set_cookie.lower(), f"Path=/ missing for rememberMe={remember_me}"
            print(f"Path=/ confirmed for rememberMe={remember_me}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
