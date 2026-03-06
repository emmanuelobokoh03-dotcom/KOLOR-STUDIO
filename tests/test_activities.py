#!/usr/bin/env python3
"""
KOLOR STUDIO Activity Logging System Tests
Tests for:
- Activity timeline retrieval (GET /api/leads/:leadId/activities)
- Note creation (POST /api/leads/:leadId/notes)
- Status change activity logging
- Activity data validation
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Test Configuration
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://client-comms-1.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestActivityLoggingSystem:
    """Activity Logging System API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{API_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.user = data.get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"✅ Authenticated as: {self.user.get('firstName')} {self.user.get('lastName')}")
        else:
            pytest.skip("Authentication failed - cannot run activity tests")
            
    # ==== GET /api/leads/:leadId/activities ====
    
    def test_get_activities_requires_auth(self):
        """Test that activities endpoint requires authentication"""
        # Use session without auth header
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{API_URL}/leads/some-id/activities")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Activities endpoint correctly requires authentication")
    
    def test_get_activities_returns_404_for_invalid_lead(self):
        """Test that activities returns 404 for non-existent lead"""
        fake_id = str(uuid.uuid4())
        response = self.session.get(f"{API_URL}/leads/{fake_id}/activities")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Returns 404 for invalid lead ID")
    
    def test_get_activities_for_valid_lead(self):
        """Test getting activities for a valid lead"""
        # First get a lead to use
        leads_response = self.session.get(f"{API_URL}/leads")
        assert leads_response.status_code == 200
        
        leads = leads_response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads available for testing")
            
        lead_id = leads[0]["id"]
        print(f"Testing activities for lead: {lead_id}")
        
        # Get activities
        response = self.session.get(f"{API_URL}/leads/{lead_id}/activities")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Validate response structure
        assert "activities" in data, "Response should contain 'activities' key"
        assert isinstance(data["activities"], list), "Activities should be a list"
        
        print(f"✅ Retrieved {len(data['activities'])} activities for lead")
        
        # If there are activities, validate structure
        if data["activities"]:
            activity = data["activities"][0]
            assert "id" in activity, "Activity should have 'id'"
            assert "type" in activity, "Activity should have 'type'"
            assert "description" in activity, "Activity should have 'description'"
            assert "createdAt" in activity, "Activity should have 'createdAt'"
            print(f"✅ Activity structure validated: type={activity['type']}")
        
        return lead_id  # Return for use in other tests
    
    # ==== POST /api/leads/:leadId/notes ====
    
    def test_add_note_requires_auth(self):
        """Test that add note endpoint requires authentication"""
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(
            f"{API_URL}/leads/some-id/notes",
            json={"content": "Test note"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Add note endpoint correctly requires authentication")
    
    def test_add_note_returns_404_for_invalid_lead(self):
        """Test that add note returns 404 for non-existent lead"""
        fake_id = str(uuid.uuid4())
        response = self.session.post(
            f"{API_URL}/leads/{fake_id}/notes",
            json={"content": "Test note"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Returns 404 for invalid lead ID when adding note")
    
    def test_add_note_requires_content(self):
        """Test that add note requires content field"""
        # Get a valid lead first
        leads_response = self.session.get(f"{API_URL}/leads")
        leads = leads_response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads available for testing")
        
        lead_id = leads[0]["id"]
        
        # Test empty content
        response = self.session.post(
            f"{API_URL}/leads/{lead_id}/notes",
            json={"content": ""}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Correctly rejects empty note content")
        
        # Test missing content
        response = self.session.post(
            f"{API_URL}/leads/{lead_id}/notes",
            json={}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Correctly rejects missing note content")
    
    def test_add_note_creates_activity(self):
        """Test that adding a note creates an activity in the timeline"""
        # Get a valid lead first
        leads_response = self.session.get(f"{API_URL}/leads")
        leads = leads_response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads available for testing")
        
        lead_id = leads[0]["id"]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        note_content = f"TEST_NOTE_{timestamp}: This is an automated test note for activity logging system"
        
        # Add note
        response = self.session.post(
            f"{API_URL}/leads/{lead_id}/notes",
            json={"content": note_content}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        data = response.json()
        
        # Validate response
        assert "activity" in data, "Response should contain 'activity'"
        assert "message" in data, "Response should contain success message"
        
        activity = data["activity"]
        assert activity["type"] == "NOTE_ADDED", f"Activity type should be NOTE_ADDED, got {activity['type']}"
        assert activity["description"] == note_content, "Activity description should match note content"
        assert "id" in activity, "Activity should have an ID"
        assert "createdAt" in activity, "Activity should have createdAt timestamp"
        
        print(f"✅ Note created successfully with activity ID: {activity['id']}")
        
        # Verify the note appears in the activity timeline
        activities_response = self.session.get(f"{API_URL}/leads/{lead_id}/activities")
        assert activities_response.status_code == 200
        
        activities = activities_response.json().get("activities", [])
        note_found = any(a["description"] == note_content for a in activities)
        assert note_found, "Created note should appear in activity timeline"
        
        print("✅ Note verified in activity timeline")
        
        return activity["id"]
    
    def test_note_includes_user_info(self):
        """Test that note activity includes user information"""
        # Get a valid lead first
        leads_response = self.session.get(f"{API_URL}/leads")
        leads = leads_response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads available for testing")
        
        lead_id = leads[0]["id"]
        
        # Add note
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        response = self.session.post(
            f"{API_URL}/leads/{lead_id}/notes",
            json={"content": f"TEST_USER_INFO_{timestamp}: Testing user info in activity"}
        )
        
        assert response.status_code == 201
        activity = response.json()["activity"]
        
        # Check user info is included
        assert "user" in activity, "Activity should include user information"
        if activity["user"]:
            assert "firstName" in activity["user"], "User should have firstName"
            assert "lastName" in activity["user"], "User should have lastName"
            print(f"✅ Activity includes user: {activity['user']['firstName']} {activity['user']['lastName']}")
        else:
            print("⚠️ User info is null (may be expected for some activities)")
    
    # ==== Status Change Activity Logging ====
    
    def test_status_change_logs_activity(self):
        """Test that changing lead status creates an activity log"""
        # First create a test lead
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        create_response = self.session.post(f"{API_URL}/leads", json={
            "clientName": f"TEST_STATUS_{timestamp}",
            "clientEmail": f"test_status_{unique_id}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"Status Test Project {timestamp}",
            "description": "Testing status change activity logging"
        })
        
        assert create_response.status_code == 201, f"Failed to create lead: {create_response.text}"
        lead_id = create_response.json()["lead"]["id"]
        print(f"✅ Created test lead: {lead_id}")
        
        # Change status from NEW to CONTACTED
        status_response = self.session.patch(
            f"{API_URL}/leads/{lead_id}/status",
            json={"status": "CONTACTED"}
        )
        
        assert status_response.status_code == 200, f"Failed to update status: {status_response.text}"
        updated_lead = status_response.json()["lead"]
        assert updated_lead["status"] == "CONTACTED", "Status should be updated to CONTACTED"
        print("✅ Lead status updated to CONTACTED")
        
        # Check that status change was logged in activities
        activities_response = self.session.get(f"{API_URL}/leads/{lead_id}/activities")
        assert activities_response.status_code == 200
        
        activities = activities_response.json()["activities"]
        
        # Look for STATUS_CHANGED activity
        status_activity = next(
            (a for a in activities if a["type"] == "STATUS_CHANGED"),
            None
        )
        
        assert status_activity is not None, "Status change should be logged in activities"
        assert "NEW" in status_activity["description"] or "CONTACTED" in status_activity["description"], \
            "Activity should mention the status change"
        
        print(f"✅ Status change logged: {status_activity['description']}")
        
        # Cleanup - delete test lead
        delete_response = self.session.delete(f"{API_URL}/leads/{lead_id}")
        assert delete_response.status_code == 200
        print("✅ Test lead cleaned up")
    
    def test_multiple_status_changes_log_multiple_activities(self):
        """Test that multiple status changes create multiple activity logs"""
        # Create test lead
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        create_response = self.session.post(f"{API_URL}/leads", json={
            "clientName": f"TEST_MULTI_STATUS_{timestamp}",
            "clientEmail": f"test_multi_{unique_id}@example.com",
            "serviceType": "VIDEOGRAPHY",
            "projectTitle": f"Multi Status Test {timestamp}",
            "description": "Testing multiple status changes"
        })
        
        assert create_response.status_code == 201
        lead_id = create_response.json()["lead"]["id"]
        
        # Make multiple status changes
        status_sequence = ["CONTACTED", "QUOTED", "NEGOTIATING"]
        
        for new_status in status_sequence:
            response = self.session.patch(
                f"{API_URL}/leads/{lead_id}/status",
                json={"status": new_status}
            )
            assert response.status_code == 200, f"Failed to update to {new_status}"
            print(f"  → Status changed to: {new_status}")
        
        # Check activities
        activities_response = self.session.get(f"{API_URL}/leads/{lead_id}/activities")
        activities = activities_response.json()["activities"]
        
        status_changes = [a for a in activities if a["type"] == "STATUS_CHANGED"]
        
        # Should have 3 status change activities
        assert len(status_changes) >= 3, f"Expected 3+ status change activities, got {len(status_changes)}"
        print(f"✅ {len(status_changes)} status change activities logged")
        
        # Cleanup
        self.session.delete(f"{API_URL}/leads/{lead_id}")
        print("✅ Test lead cleaned up")
    
    # ==== Activity Timeline Order ====
    
    def test_activities_ordered_by_newest_first(self):
        """Test that activities are returned in descending order (newest first)"""
        # Get a lead with activities
        leads_response = self.session.get(f"{API_URL}/leads")
        leads = leads_response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads available for testing")
        
        lead_id = leads[0]["id"]
        
        # Get activities
        response = self.session.get(f"{API_URL}/leads/{lead_id}/activities")
        activities = response.json()["activities"]
        
        if len(activities) < 2:
            print("⚠️ Not enough activities to verify ordering, skipping")
            return
        
        # Check ordering
        timestamps = [a["createdAt"] for a in activities]
        for i in range(len(timestamps) - 1):
            assert timestamps[i] >= timestamps[i + 1], \
                "Activities should be ordered by newest first"
        
        print("✅ Activities correctly ordered by newest first")


class TestActivityAPIIntegration:
    """Integration tests for Activity API with other features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{API_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_lead_creation_logs_activity(self):
        """Test that creating a lead logs an activity"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        # Create lead
        response = self.session.post(f"{API_URL}/leads", json={
            "clientName": f"TEST_CREATE_ACTIVITY_{timestamp}",
            "clientEmail": f"test_create_{unique_id}@example.com",
            "serviceType": "BRANDING",
            "projectTitle": f"Create Activity Test {timestamp}",
            "description": "Testing lead creation activity logging"
        })
        
        assert response.status_code == 201
        lead_id = response.json()["lead"]["id"]
        
        # Check activities
        activities_response = self.session.get(f"{API_URL}/leads/{lead_id}/activities")
        activities = activities_response.json()["activities"]
        
        # Should have at least one activity (creation)
        assert len(activities) >= 1, "Lead creation should log an activity"
        
        # First activity should mention creation
        creation_activity = next(
            (a for a in activities if "created" in a["description"].lower()),
            None
        )
        
        if creation_activity:
            print(f"✅ Lead creation logged: {creation_activity['description']}")
        else:
            print("⚠️ No explicit creation activity, but activities exist")
        
        # Cleanup
        self.session.delete(f"{API_URL}/leads/{lead_id}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
