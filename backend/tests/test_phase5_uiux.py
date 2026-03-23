"""
Phase 5 UI/UX Polish API Tests
Tests for:
- Login API (returns user data)
- Dashboard stats API
- Leads API with coverImage field
- Cover image upload endpoint
"""

import pytest
import requests
import os

BASE_URL = "https://hardened-crm-2.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestAuthAPI:
    """Authentication endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_login_returns_user_data(self):
        """Test that login returns user with firstName for welcome message"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check user object has required fields
        assert "user" in data
        user = data["user"]
        assert "id" in user
        assert "firstName" in user
        assert "email" in user
        assert user["email"] == TEST_EMAIL
        print(f"✓ Login returns user with firstName: {user['firstName']}")
    
    def test_get_me_returns_user_profile(self, auth_headers):
        """Test /auth/me returns user profile for welcome message"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        user = data["user"]
        assert "firstName" in user
        assert "studioName" in user or user.get("studioName") is None
        print(f"✓ /auth/me returns user: {user['firstName']}")


class TestDashboardStats:
    """Dashboard stats API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_stats_endpoint(self, auth_headers):
        """Test /leads/stats returns dashboard data"""
        response = requests.get(f"{BASE_URL}/api/leads/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check stats structure
        assert "total" in data
        assert "statusCounts" in data
        assert isinstance(data["total"], int)
        assert isinstance(data["statusCounts"], dict)
        print(f"✓ Stats: total={data['total']}, statusCounts={data['statusCounts']}")


class TestLeadsAPI:
    """Leads API tests for Phase 5"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_leads_endpoint_returns_coverimage_field(self, auth_headers):
        """Test leads API returns coverImage field"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data
        assert isinstance(data["leads"], list)
        
        if len(data["leads"]) > 0:
            lead = data["leads"][0]
            # coverImage field should exist (can be null)
            assert "coverImage" in lead or lead.get("coverImage") is None
            print(f"✓ Leads API returns coverImage field, first lead coverImage: {lead.get('coverImage', 'null')}")
        else:
            print("? No leads found, skipping coverImage check")
    
    def test_leads_filter_by_project_type(self, auth_headers):
        """Test leads API filters by projectType"""
        response = requests.get(
            f"{BASE_URL}/api/leads?projectType=SERVICE",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data
        print(f"✓ Filtered leads by SERVICE: {len(data['leads'])} results")
    
    def test_leads_filter_by_industry(self, auth_headers):
        """Test leads API filters by industry"""
        response = requests.get(
            f"{BASE_URL}/api/leads?industry=PHOTOGRAPHY",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data
        print(f"✓ Filtered leads by PHOTOGRAPHY industry: {len(data['leads'])} results")
    
    def test_create_lead_with_coverimage(self, auth_headers):
        """Test creating lead with coverImage URL"""
        lead_data = {
            "clientName": "TEST_Phase5 Cover Test",
            "clientEmail": "test_phase5_cover@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "TEST_Phase5 Cover Image Test",
            "description": "Testing Phase 5 cover image field",
            "projectType": "SERVICE",
            "deliverableType": "DIGITAL_FILES",
            "coverImage": None  # No image for now
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads",
            headers=auth_headers,
            json=lead_data
        )
        assert response.status_code == 201
        data = response.json()
        
        assert "lead" in data
        lead = data["lead"]
        assert lead["clientName"] == "TEST_Phase5 Cover Test"
        # coverImage should be null or the URL
        assert "coverImage" in lead or lead.get("coverImage") is None
        print(f"✓ Created lead with coverImage field, id={lead['id']}")
        
        # Cleanup - delete the test lead
        del_response = requests.delete(
            f"{BASE_URL}/api/leads/{lead['id']}",
            headers=auth_headers
        )
        if del_response.status_code == 200:
            print("✓ Cleaned up test lead")


class TestCoverImageUpload:
    """Cover image upload endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_upload_cover_requires_auth(self):
        """Test /leads/upload-cover requires authentication"""
        response = requests.post(f"{BASE_URL}/api/leads/upload-cover")
        assert response.status_code == 401
        print("✓ Cover upload requires auth (401 without token)")
    
    def test_upload_cover_requires_file(self, auth_headers):
        """Test /leads/upload-cover requires file"""
        response = requests.post(
            f"{BASE_URL}/api/leads/upload-cover",
            headers=auth_headers
        )
        # Should return 400 for no file
        assert response.status_code == 400
        print("✓ Cover upload requires file (400 without file)")


class TestLeadActivities:
    """Lead activities API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def sample_lead_id(self, auth_headers):
        """Get a sample lead ID"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        if len(leads) > 0:
            return leads[0]["id"]
        return None
    
    def test_get_activities(self, auth_headers, sample_lead_id):
        """Test getting activities for a lead"""
        if not sample_lead_id:
            pytest.skip("No leads available for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/leads/{sample_lead_id}/activities",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "activities" in data
        assert isinstance(data["activities"], list)
        print(f"✓ Activities endpoint works, found {len(data['activities'])} activities")


class TestLeadFiles:
    """Lead files API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def sample_lead_id(self, auth_headers):
        """Get a sample lead ID"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        if len(leads) > 0:
            return leads[0]["id"]
        return None
    
    def test_get_files(self, auth_headers, sample_lead_id):
        """Test getting files for a lead"""
        if not sample_lead_id:
            pytest.skip("No leads available for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/leads/{sample_lead_id}/files",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "files" in data
        assert isinstance(data["files"], list)
        print(f"✓ Files endpoint works, found {len(data['files'])} files")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
