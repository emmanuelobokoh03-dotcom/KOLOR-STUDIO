"""
Iteration 114: Backend tests for 90-point audit fixes
Tests: Input max-length validation, health check, login flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint_returns_ok(self):
        """AUDIT: Backend health check still works"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'ok'
        print(f"✓ Health check passed: {data}")


class TestAuthFlow:
    """Authentication flow tests"""
    
    def test_login_with_valid_credentials(self):
        """AUDIT: Login flow still works with test credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingtest@test.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert 'user' in data, f"Missing user in response: {data}"
        assert data['user']['email'] == 'bookingtest@test.com'
        print(f"✓ Login successful for bookingtest@test.com")
        return session


class TestInputMaxLengthValidation:
    """MEDIUM-2: Backend input max-length validation tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingtest@test.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_leads_description_max_length_5000(self, auth_session):
        """POST /api/leads should reject description > 5000 chars"""
        # Create a description that exceeds 5000 characters
        long_description = "A" * 5001
        
        response = auth_session.post(
            f"{BASE_URL}/api/leads",
            json={
                "clientName": "Test Client",
                "clientEmail": "test@example.com",
                "serviceType": "Photography",
                "projectTitle": "Test Project",
                "description": long_description
            }
        )
        
        # Should return 400 for validation error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'description' in data.get('message', '').lower() or 'exceed' in data.get('message', '').lower() or '5000' in data.get('message', ''), f"Expected description validation error: {data}"
        print(f"✓ Leads description max-length validation works: {data.get('message')}")
    
    def test_leads_description_within_limit(self, auth_session):
        """POST /api/leads should accept description <= 5000 chars"""
        # Create a description within limit
        valid_description = "A" * 100  # Use smaller value to avoid creating too much test data
        
        response = auth_session.post(
            f"{BASE_URL}/api/leads",
            json={
                "clientName": "TEST_Client Valid",
                "clientEmail": "testvalid@example.com",
                "serviceType": "Photography",
                "projectTitle": "TEST_Project Valid",
                "description": valid_description
            }
        )
        
        # Should succeed (201) or at least not fail on validation
        assert response.status_code in [200, 201], f"Expected success, got {response.status_code}: {response.text}"
        print(f"✓ Leads description within limit accepted")
        
        # Cleanup - delete the test lead
        if response.status_code in [200, 201]:
            lead_id = response.json().get('lead', {}).get('id')
            if lead_id:
                auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}")
    
    def test_messages_content_max_length_2000(self, auth_session):
        """POST messages should reject content > 2000 chars"""
        # Get a lead to send message to
        leads_response = auth_session.get(f"{BASE_URL}/api/leads")
        
        if leads_response.status_code != 200 or not leads_response.json().get('leads'):
            pytest.skip("No leads available to test message endpoint")
        
        lead_id = leads_response.json()['leads'][0]['id']
        
        # Create a message that exceeds 2000 characters
        long_message = "B" * 2001
        
        response = auth_session.post(
            f"{BASE_URL}/api/leads/{lead_id}/messages",
            json={"content": long_message}
        )
        
        # Should return 400 for validation error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert '2000' in data.get('error', '') or 'exceed' in data.get('error', '').lower(), f"Expected message length validation error: {data}"
        print(f"✓ Messages content max-length validation works: {data.get('error')}")


class TestStaticFiles:
    """Tests for static files (robots.txt, sitemap.xml)"""
    
    def test_robots_txt_accessible(self):
        """MEDIUM-3: robots.txt should be accessible"""
        response = requests.get(f"{BASE_URL}/robots.txt")
        assert response.status_code == 200
        content = response.text
        # Check for required disallow rules
        assert 'Disallow: /dashboard' in content, "Missing /dashboard disallow"
        assert 'Disallow: /settings' in content, "Missing /settings disallow"
        assert 'Disallow: /portal/' in content, "Missing /portal/ disallow"
        assert 'Disallow: /api/' in content, "Missing /api/ disallow"
        print(f"✓ robots.txt accessible with correct disallow rules")
    
    def test_sitemap_xml_accessible(self):
        """MEDIUM-3: sitemap.xml should be accessible"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        assert '<?xml' in content, "Not valid XML"
        assert 'urlset' in content, "Missing urlset element"
        assert 'kolorstudio.app' in content, "Missing site URLs"
        print(f"✓ sitemap.xml accessible and valid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
