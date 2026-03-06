"""
Test suite for Project Timeline & Milestones feature (Phase 7, Part 5)
Tests: GET/POST/PATCH/DELETE milestones, GET/PATCH timeline, Portal timeline endpoint
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://client-comms-1.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
LEAD_ID = "6bc704c4-8030-42e2-be8a-8f7ed4035709"
PORTAL_TOKEN = "7571cca7-ccda-461c-99c6-6ab2ea8170e5"
EXISTING_MILESTONE_COMPLETED = "8443ecda-ec80-4e59-9fa1-de2c6337c301"
EXISTING_MILESTONE_PENDING = "982f94ae-b67f-4da7-970d-8359a6533b75"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestMilestonesRead:
    """Test GET endpoints for milestones"""

    def test_get_milestones_requires_auth(self, api_client):
        """GET /api/leads/:id/milestones without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/leads/{LEAD_ID}/milestones")
        assert response.status_code in [401, 403], "Should require authentication"

    def test_get_milestones_with_auth(self, authenticated_client):
        """GET /api/leads/:id/milestones returns timeline and milestones"""
        response = authenticated_client.get(f"{BASE_URL}/api/leads/{LEAD_ID}/milestones")
        assert response.status_code == 200
        
        data = response.json()
        # Verify timeline key dates
        assert "shootingDate" in data
        assert "editingDeadline" in data
        assert "deliveryDate" in data
        assert "milestones" in data
        assert isinstance(data["milestones"], list)
        
        # Verify at least one milestone exists
        assert len(data["milestones"]) >= 1
        
        # Verify milestone structure
        milestone = data["milestones"][0]
        assert "id" in milestone
        assert "name" in milestone
        assert "dueDate" in milestone
        assert "completed" in milestone
        print(f"Found {len(data['milestones'])} milestones")

    def test_portal_timeline_public_access(self, api_client):
        """GET /api/portal/:token/timeline is public (no auth required)"""
        response = api_client.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/timeline")
        assert response.status_code == 200
        
        data = response.json()
        assert "shootingDate" in data
        assert "editingDeadline" in data
        assert "deliveryDate" in data
        assert "milestones" in data
        print(f"Portal timeline: {len(data['milestones'])} milestones visible to client")

    def test_portal_timeline_invalid_token(self, api_client):
        """GET /api/portal/:token/timeline with invalid token returns 404"""
        response = api_client.get(f"{BASE_URL}/api/portal/invalid-token-123/timeline")
        assert response.status_code == 404


class TestMilestonesCRUD:
    """Test CREATE, UPDATE, DELETE for milestones"""

    def test_create_milestone(self, authenticated_client):
        """POST /api/leads/:id/milestones creates a new milestone"""
        unique_name = f"TEST_Milestone_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": unique_name,
            "description": "Test milestone for pytest",
            "dueDate": "2026-06-01T00:00:00.000Z",
            "order": 99
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/leads/{LEAD_ID}/milestones",
            json=payload
        )
        assert response.status_code == 201, f"Create failed: {response.text}"
        
        data = response.json()
        assert "milestone" in data
        milestone = data["milestone"]
        assert milestone["name"] == unique_name
        assert milestone["description"] == "Test milestone for pytest"
        assert milestone["completed"] == False
        assert milestone["completedAt"] is None
        
        # Store for cleanup
        self.__class__.created_milestone_id = milestone["id"]
        print(f"Created milestone: {milestone['id']}")

    def test_create_milestone_requires_name_and_date(self, authenticated_client):
        """POST /api/leads/:id/milestones requires name and dueDate"""
        # Missing name
        response = authenticated_client.post(
            f"{BASE_URL}/api/leads/{LEAD_ID}/milestones",
            json={"dueDate": "2026-06-01T00:00:00.000Z"}
        )
        assert response.status_code == 400
        
        # Missing dueDate
        response = authenticated_client.post(
            f"{BASE_URL}/api/leads/{LEAD_ID}/milestones",
            json={"name": "Test"}
        )
        assert response.status_code == 400

    def test_update_milestone_mark_complete(self, authenticated_client):
        """PATCH /api/leads/milestones/:id can mark milestone complete"""
        milestone_id = getattr(self.__class__, 'created_milestone_id', None)
        if not milestone_id:
            pytest.skip("No milestone created in previous test")
        
        response = authenticated_client.patch(
            f"{BASE_URL}/api/leads/milestones/{milestone_id}",
            json={"completed": True}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["milestone"]["completed"] == True
        assert data["milestone"]["completedAt"] is not None
        print(f"Milestone marked complete at {data['milestone']['completedAt']}")

    def test_update_milestone_undo_complete(self, authenticated_client):
        """PATCH /api/leads/milestones/:id can undo completion"""
        milestone_id = getattr(self.__class__, 'created_milestone_id', None)
        if not milestone_id:
            pytest.skip("No milestone created in previous test")
        
        response = authenticated_client.patch(
            f"{BASE_URL}/api/leads/milestones/{milestone_id}",
            json={"completed": False}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["milestone"]["completed"] == False
        assert data["milestone"]["completedAt"] is None
        print("Milestone completion undone")

    def test_update_milestone_name_and_description(self, authenticated_client):
        """PATCH /api/leads/milestones/:id can update name/description"""
        milestone_id = getattr(self.__class__, 'created_milestone_id', None)
        if not milestone_id:
            pytest.skip("No milestone created in previous test")
        
        new_name = f"UPDATED_Milestone_{uuid.uuid4().hex[:4]}"
        response = authenticated_client.patch(
            f"{BASE_URL}/api/leads/milestones/{milestone_id}",
            json={"name": new_name, "description": "Updated description"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["milestone"]["name"] == new_name
        assert data["milestone"]["description"] == "Updated description"
        print(f"Milestone updated to: {new_name}")

    def test_delete_milestone(self, authenticated_client):
        """DELETE /api/leads/milestones/:id deletes a milestone"""
        milestone_id = getattr(self.__class__, 'created_milestone_id', None)
        if not milestone_id:
            pytest.skip("No milestone created in previous test")
        
        response = authenticated_client.delete(
            f"{BASE_URL}/api/leads/milestones/{milestone_id}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Milestone deleted"
        print(f"Milestone {milestone_id} deleted")
        
        # Verify deletion
        response = authenticated_client.get(f"{BASE_URL}/api/leads/{LEAD_ID}/milestones")
        milestones = response.json().get("milestones", [])
        ids = [m["id"] for m in milestones]
        assert milestone_id not in ids, "Milestone should not exist after deletion"

    def test_delete_nonexistent_milestone(self, authenticated_client):
        """DELETE /api/leads/milestones/:id with invalid ID returns 404"""
        response = authenticated_client.delete(
            f"{BASE_URL}/api/leads/milestones/nonexistent-milestone-id"
        )
        assert response.status_code == 404


class TestTimelineKeyDates:
    """Test timeline key dates (shooting/editing/delivery) updates"""

    def test_update_timeline_dates(self, authenticated_client):
        """PATCH /api/leads/:id/timeline updates key dates"""
        payload = {
            "shootingDate": "2026-04-15T00:00:00.000Z",
            "editingDeadline": "2026-04-25T00:00:00.000Z",
            "deliveryDate": "2026-05-05T00:00:00.000Z"
        }
        
        response = authenticated_client.patch(
            f"{BASE_URL}/api/leads/{LEAD_ID}/timeline",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "shootingDate" in data
        assert "editingDeadline" in data
        assert "deliveryDate" in data
        print(f"Timeline updated: shoot={data['shootingDate']}, edit={data['editingDeadline']}, deliver={data['deliveryDate']}")

    def test_update_timeline_partial(self, authenticated_client):
        """PATCH /api/leads/:id/timeline can update single date"""
        response = authenticated_client.patch(
            f"{BASE_URL}/api/leads/{LEAD_ID}/timeline",
            json={"shootingDate": "2026-04-16T00:00:00.000Z"}
        )
        assert response.status_code == 200
        
        # Restore original
        authenticated_client.patch(
            f"{BASE_URL}/api/leads/{LEAD_ID}/timeline",
            json={"shootingDate": "2026-04-15T00:00:00.000Z"}
        )

    def test_timeline_requires_auth(self):
        """PATCH /api/leads/:id/timeline requires authentication"""
        # Use fresh requests without auth header
        response = requests.patch(
            f"{BASE_URL}/api/leads/{LEAD_ID}/timeline",
            json={"shootingDate": "2026-04-15T00:00:00.000Z"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [401, 403], f"Got {response.status_code}, expected 401/403"


class TestExistingMilestones:
    """Test operations on pre-existing milestones"""

    def test_existing_completed_milestone(self, authenticated_client):
        """Verify existing completed milestone has correct fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/leads/{LEAD_ID}/milestones")
        assert response.status_code == 200
        
        milestones = response.json()["milestones"]
        completed = next((m for m in milestones if m["id"] == EXISTING_MILESTONE_COMPLETED), None)
        
        if completed:
            assert completed["name"] == "First Look Preview"
            assert completed["completed"] == True
            assert completed["completedAt"] is not None
            print(f"Verified completed milestone: {completed['name']}")
        else:
            print(f"Warning: Expected completed milestone {EXISTING_MILESTONE_COMPLETED} not found")

    def test_existing_pending_milestone(self, authenticated_client):
        """Verify existing pending milestone has correct fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/leads/{LEAD_ID}/milestones")
        assert response.status_code == 200
        
        milestones = response.json()["milestones"]
        pending = next((m for m in milestones if m["id"] == EXISTING_MILESTONE_PENDING), None)
        
        if pending:
            assert pending["name"] == "Album Design"
            assert pending["completed"] == False
            assert pending["completedAt"] is None
            print(f"Verified pending milestone: {pending['name']}")
        else:
            print(f"Warning: Expected pending milestone {EXISTING_MILESTONE_PENDING} not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
