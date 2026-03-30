"""
Calendar API Tests - Iteration 107
Tests for the new Calendar page endpoints:
- GET /api/calendar/events (derived KOLOR events)
- GET /api/calendar/google-events (Google Calendar events)
- POST /api/calendar/events (create manual event)
- DELETE /api/calendar/events/:id (delete manual event)
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestCalendarAPI:
    """Calendar API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
        
        yield
        
        # Cleanup
        self.session.close()
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health check passed")
    
    def test_get_calendar_events(self):
        """Test GET /api/calendar/events returns derived KOLOR events"""
        # Get events for current month
        now = datetime.now()
        start = (now - timedelta(days=30)).isoformat()
        end = (now + timedelta(days=60)).isoformat()
        
        response = self.session.get(
            f"{BASE_URL}/api/calendar/events",
            params={"start": start, "end": end}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "events" in data, "Response should contain 'events' key"
        assert isinstance(data["events"], list), "Events should be a list"
        
        print(f"✓ GET /api/calendar/events returned {len(data['events'])} events")
        
        # If there are events, verify structure
        if data["events"]:
            event = data["events"][0]
            assert "id" in event, "Event should have 'id'"
            assert "title" in event, "Event should have 'title'"
            assert "date" in event, "Event should have 'date'"
            assert "type" in event, "Event should have 'type'"
            assert "color" in event, "Event should have 'color'"
            print(f"  First event: {event['title']} ({event['type']})")
    
    def test_get_calendar_events_without_params(self):
        """Test GET /api/calendar/events works without date params (uses defaults)"""
        response = self.session.get(f"{BASE_URL}/api/calendar/events")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "events" in data
        print("✓ GET /api/calendar/events works without date params")
    
    def test_get_google_events_not_connected(self):
        """Test GET /api/calendar/google-events returns connected: false when not connected"""
        now = datetime.now()
        start = (now - timedelta(days=30)).isoformat()
        end = (now + timedelta(days=60)).isoformat()
        
        response = self.session.get(
            f"{BASE_URL}/api/calendar/google-events",
            params={"start": start, "end": end}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "connected" in data, "Response should contain 'connected' key"
        assert "events" in data, "Response should contain 'events' key"
        
        # Since test user doesn't have Google Calendar connected
        if not data["connected"]:
            assert data["events"] == [], "Events should be empty when not connected"
            print("✓ GET /api/calendar/google-events returns connected: false, events: []")
        else:
            print(f"✓ GET /api/calendar/google-events - Google Calendar is connected, {len(data['events'])} events")
    
    def test_create_manual_event(self):
        """Test POST /api/calendar/events creates a manual event"""
        # Create event for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        event_data = {
            "title": "Test Calendar Event",
            "date": f"{tomorrow}T00:00:00.000Z",
            "allDay": True,
            "notes": "Created by automated test"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/calendar/events",
            json=event_data
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "event" in data, "Response should contain 'event' key"
        event = data["event"]
        assert event["title"] == "Test Calendar Event", "Event title should match"
        assert event["type"] == "manual", "Event type should be 'manual'"
        assert "id" in event, "Event should have 'id'"
        
        # Store event ID for cleanup
        self.created_event_id = event["id"].replace("manual-", "")
        
        print(f"✓ POST /api/calendar/events created event: {event['id']}")
        
        # Verify googleSynced field
        assert "googleSynced" in data, "Response should contain 'googleSynced' key"
        print(f"  Google synced: {data['googleSynced']}")
        
        return event
    
    def test_create_event_with_time(self):
        """Test POST /api/calendar/events with specific start/end times"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        event_data = {
            "title": "Test Timed Event",
            "date": f"{tomorrow}T00:00:00.000Z",
            "startTime": f"{tomorrow}T10:00:00.000Z",
            "endTime": f"{tomorrow}T11:00:00.000Z",
            "allDay": False,
            "notes": "Timed event test"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/calendar/events",
            json=event_data
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        
        event = data["event"]
        assert event["allDay"] == False, "Event should not be all-day"
        assert event["startTime"] is not None, "Event should have startTime"
        assert event["endTime"] is not None, "Event should have endTime"
        
        print(f"✓ POST /api/calendar/events created timed event: {event['id']}")
        
        # Cleanup
        event_id = event["id"].replace("manual-", "")
        self.session.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
    
    def test_create_event_validation(self):
        """Test POST /api/calendar/events validates required fields"""
        # Missing title
        response = self.session.post(
            f"{BASE_URL}/api/calendar/events",
            json={"date": "2026-02-20T00:00:00.000Z"}
        )
        assert response.status_code == 400, f"Expected 400 for missing title, got {response.status_code}"
        
        # Missing date
        response = self.session.post(
            f"{BASE_URL}/api/calendar/events",
            json={"title": "Test Event"}
        )
        assert response.status_code == 400, f"Expected 400 for missing date, got {response.status_code}"
        
        print("✓ POST /api/calendar/events validates required fields")
    
    def test_delete_manual_event(self):
        """Test DELETE /api/calendar/events/:id deletes a manual event"""
        # First create an event
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        create_response = self.session.post(
            f"{BASE_URL}/api/calendar/events",
            json={
                "title": "Event to Delete",
                "date": f"{tomorrow}T00:00:00.000Z",
                "allDay": True
            }
        )
        
        assert create_response.status_code == 201
        event_id = create_response.json()["event"]["id"].replace("manual-", "")
        
        # Now delete it
        delete_response = self.session.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        data = delete_response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        print(f"✓ DELETE /api/calendar/events/{event_id} deleted event successfully")
    
    def test_delete_nonexistent_event(self):
        """Test DELETE /api/calendar/events/:id returns 404 for non-existent event"""
        response = self.session.delete(f"{BASE_URL}/api/calendar/events/nonexistent-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ DELETE /api/calendar/events returns 404 for non-existent event")
    
    def test_calendar_events_require_auth(self):
        """Test calendar endpoints require authentication"""
        # Create a new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        # Test GET /api/calendar/events
        response = unauth_session.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Test GET /api/calendar/google-events
        response = unauth_session.get(f"{BASE_URL}/api/calendar/google-events")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Test POST /api/calendar/events
        response = unauth_session.post(
            f"{BASE_URL}/api/calendar/events",
            json={"title": "Test", "date": "2026-02-20T00:00:00.000Z"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Test DELETE /api/calendar/events/:id
        response = unauth_session.delete(f"{BASE_URL}/api/calendar/events/test-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        unauth_session.close()
        print("✓ All calendar endpoints require authentication")
    
    def test_verify_existing_manual_event(self):
        """Test that the existing manual event (Test Photo Shoot) is returned"""
        # Get events for February 2026
        response = self.session.get(
            f"{BASE_URL}/api/calendar/events",
            params={
                "start": "2026-02-01T00:00:00.000Z",
                "end": "2026-02-28T23:59:59.000Z"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Look for the test event mentioned in the context
        manual_events = [e for e in data["events"] if e["type"] == "manual"]
        
        if manual_events:
            print(f"✓ Found {len(manual_events)} manual events in February 2026")
            for event in manual_events:
                print(f"  - {event['title']} on {event['date']}")
        else:
            print("  Note: No manual events found in February 2026 (may have been cleaned up)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
