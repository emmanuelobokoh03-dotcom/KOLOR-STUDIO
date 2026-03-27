"""
Iteration 101 Tests: Quick Actions Panel + Industry Language Utility
Tests for:
1. Backend: POST /api/auth/signup accepts industry field
2. Backend: GET /api/auth/me returns industry, businessName, speciality
3. Backend: POST /api/auth/login returns industry field
4. Backend: GET /api/activities/recent returns activities data
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

class TestAuthSignupWithIndustry:
    """Test signup endpoint accepts and stores industry field"""
    
    def test_signup_with_design_industry(self):
        """POST /api/auth/signup should accept industry field and store it"""
        unique_email = f"test_101_design_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Designer",
            "email": unique_email,
            "password": "password123",
            "industry": "DESIGN"
        })
        
        print(f"Signup response status: {response.status_code}")
        print(f"Signup response: {response.json()}")
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == unique_email.lower()
        assert data["user"]["industry"] == "DESIGN", f"Expected DESIGN, got {data['user'].get('industry')}"
    
    def test_signup_with_photography_industry(self):
        """POST /api/auth/signup should accept PHOTOGRAPHY industry"""
        unique_email = f"test_101_photo_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Photographer",
            "email": unique_email,
            "password": "password123",
            "industry": "PHOTOGRAPHY"
        })
        
        print(f"Signup response status: {response.status_code}")
        print(f"Signup response: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["industry"] == "PHOTOGRAPHY"
    
    def test_signup_with_fine_art_industry(self):
        """POST /api/auth/signup should accept FINE_ART industry"""
        unique_email = f"test_101_art_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Artist",
            "email": unique_email,
            "password": "password123",
            "industry": "FINE_ART"
        })
        
        print(f"Signup response status: {response.status_code}")
        print(f"Signup response: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["industry"] == "FINE_ART"
    
    def test_signup_without_industry_defaults_to_photography(self):
        """POST /api/auth/signup without industry should default to PHOTOGRAPHY"""
        unique_email = f"test_101_default_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "firstName": "Test",
            "lastName": "Default",
            "email": unique_email,
            "password": "password123"
        })
        
        print(f"Signup response status: {response.status_code}")
        print(f"Signup response: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        # Should default to PHOTOGRAPHY
        assert data["user"]["industry"] == "PHOTOGRAPHY"


class TestAuthLoginReturnsIndustry:
    """Test login endpoint returns industry field"""
    
    def test_login_returns_industry_field(self):
        """POST /api/auth/login should return industry in user object"""
        # Use existing test credentials
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingtest@test.com",
            "password": "password123"
        })
        
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "user" in data
        # industry field should be present (may be null or a valid value)
        assert "industry" in data["user"], "industry field missing from login response"
        print(f"User industry: {data['user'].get('industry')}")


class TestAuthMeReturnsIndustryFields:
    """Test /api/auth/me returns industry, businessName, speciality"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingtest@test.com",
            "password": "password123"
        })
        if response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        return session
    
    def test_me_returns_industry_fields(self, auth_session):
        """GET /api/auth/me should return industry, businessName, speciality"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        
        print(f"Me response status: {response.status_code}")
        print(f"Me response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        user = data["user"]
        
        # Check that these fields exist in the response
        assert "industry" in user, "industry field missing from /api/auth/me"
        assert "businessName" in user, "businessName field missing from /api/auth/me"
        assert "speciality" in user, "speciality field missing from /api/auth/me"
        
        print(f"industry: {user.get('industry')}")
        print(f"businessName: {user.get('businessName')}")
        print(f"speciality: {user.get('speciality')}")


class TestActivitiesRecentEndpoint:
    """Test /api/activities/recent endpoint"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingtest@test.com",
            "password": "password123"
        })
        if response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        return session
    
    def test_activities_recent_returns_data(self, auth_session):
        """GET /api/activities/recent should return activities data"""
        response = auth_session.get(f"{BASE_URL}/api/activities/recent")
        
        print(f"Activities response status: {response.status_code}")
        print(f"Activities response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Should have activities array
        assert "activities" in data, "activities field missing from response"
        assert isinstance(data["activities"], list), "activities should be a list"
        
        # If there are activities, check structure
        if len(data["activities"]) > 0:
            activity = data["activities"][0]
            print(f"Sample activity: {activity}")
            # Check expected fields
            assert "id" in activity
            assert "type" in activity
            assert "description" in activity


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
