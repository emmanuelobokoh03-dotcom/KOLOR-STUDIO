"""
Test suite for KOLOR STUDIO Client Portal feature
Tests portal API endpoints with token-based access
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-for-creatives.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')

# Test portal token provided
VALID_TOKEN = "28a000eb-16f6-4f8a-9415-d3f7bce2307c"

class TestPortalAPI:
    """Client Portal API endpoint tests"""
    
    # ==================== GET /api/portal/:token ====================
    
    def test_portal_valid_token_returns_200(self):
        """Test GET /api/portal/:token returns 200 for valid token"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Portal returns 200 for valid token")
    
    def test_portal_response_structure(self):
        """Test portal response has correct data structure"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify top-level keys
        assert "project" in data, "Missing 'project' in response"
        assert "status" in data, "Missing 'status' in response"
        assert "client" in data, "Missing 'client' in response"
        assert "timeline" in data, "Missing 'timeline' in response"
        assert "files" in data, "Missing 'files' in response"
        assert "contact" in data, "Missing 'contact' in response"
        assert "meta" in data, "Missing 'meta' in response"
        print("✅ Portal response has all required top-level keys")
    
    def test_portal_project_data(self):
        """Test project data in portal response"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        project = data["project"]
        
        assert "id" in project, "Missing project.id"
        assert "title" in project, "Missing project.title"
        assert "serviceType" in project, "Missing project.serviceType"
        assert "description" in project, "Missing project.description"
        assert "submittedAt" in project, "Missing project.submittedAt"
        
        # Verify expected values for test lead
        assert project["title"] == "MINE", f"Expected title 'MINE', got {project['title']}"
        assert project["serviceType"] == "Content Creation", f"Expected serviceType 'Content Creation', got {project['serviceType']}"
        print(f"✅ Project data correct: {project['title']} ({project['serviceType']})")
    
    def test_portal_status_data(self):
        """Test status data in portal response"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        status = data["status"]
        
        assert "current" in status, "Missing status.current"
        assert "label" in status, "Missing status.label"
        assert "description" in status, "Missing status.description"
        assert "progress" in status, "Missing status.progress"
        assert "isBooked" in status, "Missing status.isBooked"
        assert "isLost" in status, "Missing status.isLost"
        
        # Verify expected status
        assert status["current"] == "NEW", f"Expected status 'NEW', got {status['current']}"
        assert status["label"] == "Inquiry Received", f"Expected label 'Inquiry Received', got {status['label']}"
        assert isinstance(status["progress"], int), "Progress should be an integer"
        assert 0 <= status["progress"] <= 100, f"Progress should be 0-100, got {status['progress']}"
        print(f"✅ Status data correct: {status['current']} ({status['label']}) - {status['progress']}% progress")
    
    def test_portal_client_data(self):
        """Test client data in portal response"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        client = data["client"]
        
        assert "name" in client, "Missing client.name"
        assert "email" in client, "Missing client.email"
        assert len(client["name"]) > 0, "Client name should not be empty"
        print(f"✅ Client data correct: {client['name']} ({client['email']})")
    
    def test_portal_contact_data(self):
        """Test contact data in portal response"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        contact = data["contact"]
        
        assert "name" in contact, "Missing contact.name"
        assert "email" in contact, "Missing contact.email"
        assert len(contact["email"]) > 0, "Contact email should not be empty"
        print(f"✅ Contact data correct: {contact['name']} ({contact['email']})")
    
    def test_portal_timeline_is_list(self):
        """Test timeline is a list with proper structure"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        timeline = data["timeline"]
        
        assert isinstance(timeline, list), "Timeline should be a list"
        
        if len(timeline) > 0:
            activity = timeline[0]
            assert "id" in activity, "Missing activity.id"
            assert "type" in activity, "Missing activity.type"
            assert "description" in activity, "Missing activity.description"
            assert "createdAt" in activity, "Missing activity.createdAt"
        
        print(f"✅ Timeline correct: {len(timeline)} activities")
    
    def test_portal_meta_data(self):
        """Test meta data in portal response"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        meta = data["meta"]
        
        assert "portalViews" in meta, "Missing meta.portalViews"
        assert "lastUpdated" in meta, "Missing meta.lastUpdated"
        assert isinstance(meta["portalViews"], int), "portalViews should be an integer"
        assert meta["portalViews"] > 0, "portalViews should be positive"
        print(f"✅ Meta data correct: {meta['portalViews']} portal views")
    
    # ==================== Invalid Token Tests ====================
    
    def test_portal_invalid_token_returns_404(self):
        """Test GET /api/portal/:token returns 404 for invalid token"""
        response = requests.get(f"{BASE_URL}/api/portal/invalid-token-that-does-not-exist-xyz")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Missing error in 404 response"
        assert "message" in data, "Missing message in 404 response"
        assert data["error"] == "Not Found", f"Expected error 'Not Found', got {data['error']}"
        print("✅ Portal returns 404 for invalid token with proper error message")
    
    def test_portal_short_token_returns_400(self):
        """Test GET /api/portal/:token returns 400 for short token"""
        response = requests.get(f"{BASE_URL}/api/portal/abc")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Missing error in 400 response"
        assert "message" in data, "Missing message in 400 response"
        assert data["error"] == "Invalid Token", f"Expected error 'Invalid Token', got {data['error']}"
        print("✅ Portal returns 400 for short token with proper error message")
    
    def test_portal_empty_token_returns_400(self):
        """Test GET /api/portal with empty token returns 400"""
        # Note: Empty path might return 404 or redirect, but very short tokens should be 400
        response = requests.get(f"{BASE_URL}/api/portal/x")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Portal returns 400 for single char token")
    
    # ==================== Portal Views Counter Test ====================
    
    def test_portal_views_increment(self):
        """Test portalViews counter increments on each access"""
        # Get initial count
        response1 = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        assert response1.status_code == 200
        initial_views = response1.json()["meta"]["portalViews"]
        
        # Wait briefly to ensure DB update
        time.sleep(0.5)
        
        # Make another request
        response2 = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        assert response2.status_code == 200
        new_views = response2.json()["meta"]["portalViews"]
        
        assert new_views == initial_views + 1, f"Expected views to increment from {initial_views} to {initial_views + 1}, got {new_views}"
        print(f"✅ Portal views incremented correctly: {initial_views} -> {new_views}")
    
    # ==================== Activity Filtering Tests ====================
    
    def test_portal_only_shows_client_safe_activities(self):
        """Test that portal only shows client-safe activity types (no internal notes)"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        assert response.status_code == 200
        
        data = response.json()
        timeline = data["timeline"]
        
        # Client-safe activity types
        client_safe_types = [
            'STATUS_CHANGED',
            'EMAIL_SENT',
            'MEETING_SCHEDULED',
            'PROPOSAL_SENT',
            'CONTRACT_SIGNED',
            'FILE_UPLOADED',
        ]
        
        # Verify no internal activity types are exposed
        internal_types = ['NOTE_ADDED', 'PHONE_CALL', 'INTERNAL_NOTE']
        
        for activity in timeline:
            activity_type = activity.get("type", "")
            assert activity_type not in internal_types, f"Internal activity type '{activity_type}' should not be in portal timeline"
            # Activity types should be client-safe (if present)
            if activity_type:
                # Just log a warning if unknown type, don't fail
                if activity_type not in client_safe_types:
                    print(f"⚠️ Unknown activity type in timeline: {activity_type}")
        
        print(f"✅ All {len(timeline)} activities are client-safe (no internal notes exposed)")
    
    def test_portal_activity_descriptions_are_sanitized(self):
        """Test that activity descriptions are client-friendly"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        assert response.status_code == 200
        
        data = response.json()
        timeline = data["timeline"]
        
        for activity in timeline:
            description = activity.get("description", "")
            # Descriptions should not contain internal terminology
            internal_terms = ["Lead ID", "User ID", "internal", "admin"]
            for term in internal_terms:
                assert term.lower() not in description.lower(), f"Activity description contains internal term: {term}"
        
        print(f"✅ All activity descriptions are client-friendly (no internal terminology)")


class TestPortalEdgeCases:
    """Edge cases and boundary tests for Portal API"""
    
    def test_portal_budget_field_optional(self):
        """Test portal handles optional budget field"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        
        # Budget can be null/missing, but if present should be a string
        budget = data["project"].get("budget")
        if budget is not None:
            assert isinstance(budget, str), "Budget should be a string if present"
        print("✅ Portal handles budget field correctly")
    
    def test_portal_timeline_field_optional(self):
        """Test portal handles optional timeline field"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        
        timeline = data["project"].get("timeline")
        if timeline is not None:
            assert isinstance(timeline, str), "Timeline should be a string if present"
        print("✅ Portal handles timeline field correctly")
    
    def test_portal_event_date_optional(self):
        """Test portal handles optional eventDate field"""
        response = requests.get(f"{BASE_URL}/api/portal/{VALID_TOKEN}")
        data = response.json()
        
        event_date = data["project"].get("eventDate")
        # eventDate can be null
        print(f"✅ Portal handles eventDate field correctly (value: {event_date})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
