"""
Dashboard Premium Upgrade - Backend API Tests
Tests for the new /api/activities/recent endpoint and related dashboard features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✅ Health check passed: {data['message']}")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✅ Login successful for {TEST_EMAIL}")
        return response.cookies


class TestRecentActivitiesEndpoint:
    """Tests for GET /api/activities/recent endpoint"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_recent_activities_requires_auth(self):
        """Test that endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/activities/recent")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ /api/activities/recent correctly requires authentication")
    
    def test_recent_activities_returns_data(self, auth_session):
        """Test that endpoint returns activities with proper structure"""
        response = auth_session.get(f"{BASE_URL}/api/activities/recent?limit=10")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "activities" in data, "Response should contain 'activities' key"
        assert isinstance(data["activities"], list), "Activities should be a list"
        print(f"✅ /api/activities/recent returned {len(data['activities'])} activities")
        
        # If there are activities, validate structure
        if len(data["activities"]) > 0:
            activity = data["activities"][0]
            assert "id" in activity, "Activity should have 'id'"
            assert "type" in activity, "Activity should have 'type'"
            assert "description" in activity, "Activity should have 'description'"
            assert "createdAt" in activity, "Activity should have 'createdAt'"
            print(f"✅ Activity structure validated: type={activity['type']}")
            
            # Check lead data if present
            if activity.get("lead"):
                lead = activity["lead"]
                assert "id" in lead, "Lead should have 'id'"
                assert "clientName" in lead, "Lead should have 'clientName'"
                assert "projectTitle" in lead, "Lead should have 'projectTitle'"
                assert "status" in lead, "Lead should have 'status'"
                print(f"✅ Lead data included: {lead['clientName']}")
            
            # Check user data if present
            if activity.get("user"):
                user = activity["user"]
                assert "id" in user, "User should have 'id'"
                assert "firstName" in user, "User should have 'firstName'"
                assert "lastName" in user, "User should have 'lastName'"
                print(f"✅ User data included: {user['firstName']} {user['lastName']}")
    
    def test_recent_activities_limit_parameter(self, auth_session):
        """Test that limit parameter works correctly"""
        # Test with limit=5
        response = auth_session.get(f"{BASE_URL}/api/activities/recent?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["activities"]) <= 5, "Should respect limit parameter"
        print(f"✅ Limit parameter works: requested 5, got {len(data['activities'])}")
        
        # Test with limit=50 (max)
        response = auth_session.get(f"{BASE_URL}/api/activities/recent?limit=100")
        assert response.status_code == 200
        data = response.json()
        assert len(data["activities"]) <= 50, "Should cap at max limit of 50"
        print(f"✅ Max limit enforced: requested 100, got {len(data['activities'])} (max 50)")


class TestLeadsEndpoint:
    """Tests for leads endpoint to verify stale leads data for SmartNudgeBanner"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_leads_have_updated_at_field(self, auth_session):
        """Test that leads include updatedAt field for stale lead detection"""
        response = auth_session.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data, "Response should contain 'leads' key"
        
        if len(data["leads"]) > 0:
            lead = data["leads"][0]
            assert "updatedAt" in lead, "Lead should have 'updatedAt' field"
            assert "status" in lead, "Lead should have 'status' field"
            print(f"✅ Lead has updatedAt field: {lead['updatedAt']}")
        else:
            print("⚠️ No leads found to verify updatedAt field")


class TestStatsEndpoint:
    """Tests for stats endpoint used in sidebar badge"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_stats_returns_total_count(self, auth_session):
        """Test that stats endpoint returns total lead count for sidebar badge"""
        response = auth_session.get(f"{BASE_URL}/api/leads/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data, "Stats should include 'total' count"
        assert "statusCounts" in data, "Stats should include 'statusCounts'"
        assert isinstance(data["total"], int), "Total should be an integer"
        print(f"✅ Stats endpoint returns total: {data['total']}")
        print(f"✅ Status counts: {data['statusCounts']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
