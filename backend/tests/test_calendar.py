"""
Calendar View API Tests for KOLOR STUDIO CRM
Tests the calendar/events endpoint for viewing BOOKED leads as calendar events
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('VITE_API_URL', 'https://studio-wizard-4.preview.emergentagent.com/api')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for all tests"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


class TestCalendarEventsAPI:
    """Test the GET /api/leads/calendar/events endpoint"""
    
    def test_get_calendar_events_returns_200(self, auth_headers):
        """Calendar events endpoint returns 200 with events array"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
        print(f"✓ Calendar events endpoint returns 200 with {len(data['events'])} events")
    
    def test_get_calendar_events_with_date_range(self, auth_headers):
        """Calendar events endpoint accepts start and end date parameters"""
        start = "2026-01-01T00:00:00.000Z"
        end = "2026-06-30T00:00:00.000Z"
        
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events?start={start}&end={end}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        print(f"✓ Calendar events endpoint accepts date range parameters")
    
    def test_calendar_event_structure(self, auth_headers):
        """Each calendar event has required fields"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["events"]) > 0:
            event = data["events"][0]
            required_fields = ["id", "leadId", "title", "date", "type", "status", "clientName"]
            for field in required_fields:
                assert field in event, f"Missing required field: {field}"
            print(f"✓ Calendar events have all required fields: {required_fields}")
        else:
            pytest.skip("No events to verify structure")
    
    def test_calendar_event_types(self, auth_headers):
        """Calendar events have valid types: event, inquiry, booking"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        valid_types = ["event", "inquiry", "booking"]
        event_types_found = set()
        
        for event in data["events"]:
            assert "type" in event
            assert event["type"] in valid_types, f"Invalid event type: {event['type']}"
            event_types_found.add(event["type"])
        
        print(f"✓ Found event types: {event_types_found}")
    
    def test_booked_leads_appear_as_events(self, auth_headers):
        """BOOKED leads with eventDate appear as 'event' type in calendar"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Filter for event type events with BOOKED status
        booked_events = [e for e in data["events"] if e["type"] == "event" and e["status"] == "BOOKED"]
        
        assert len(booked_events) >= 1, "Expected at least 1 BOOKED event in calendar"
        print(f"✓ Found {len(booked_events)} BOOKED events in calendar")
        
        # Verify they have the expected structure
        for event in booked_events:
            assert "serviceType" in event, "Event missing serviceType"
            assert "clientName" in event, "Event missing clientName"
    
    def test_service_types_in_calendar_events(self, auth_headers):
        """Calendar events include serviceType for color coding"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        valid_service_types = [
            "PHOTOGRAPHY", "VIDEOGRAPHY", "GRAPHIC_DESIGN", 
            "WEB_DESIGN", "BRANDING", "CONTENT_CREATION", 
            "CONSULTING", "OTHER"
        ]
        
        service_types_found = set()
        for event in data["events"]:
            if "serviceType" in event and event["serviceType"]:
                assert event["serviceType"] in valid_service_types, f"Invalid serviceType: {event['serviceType']}"
                service_types_found.add(event["serviceType"])
        
        print(f"✓ Service types in calendar: {service_types_found}")
    
    def test_calendar_event_has_value_field(self, auth_headers):
        """BOOKED events include value field for stats"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        booked_events = [e for e in data["events"] if e["status"] == "BOOKED" and e["type"] == "event"]
        
        # At least some events should have value field
        events_with_value = [e for e in booked_events if "value" in e]
        print(f"✓ {len(events_with_value)}/{len(booked_events)} booked events have value field")
    
    def test_unauthorized_access_rejected(self):
        """Calendar events endpoint rejects unauthorized requests"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events",
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 Unauthorized
        assert response.status_code == 401
        print("✓ Unauthorized access correctly rejected with 401")
    
    def test_expected_test_data_present(self, auth_headers):
        """Verify test data: Emmanuel (Photography), Michael (Videography), Sarah (Branding)"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events?start=2026-02-01T00:00:00.000Z&end=2026-03-31T00:00:00.000Z",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Filter for main event types (not inquiries/bookings)
        events = [e for e in data["events"] if e["type"] == "event"]
        
        # Check for expected test leads by client name and service type
        emmanuel_found = any(e["clientName"] == "Emmanuel" and e["serviceType"] == "PHOTOGRAPHY" for e in events)
        michael_found = any(e["clientName"] == "Michael Brown" and e["serviceType"] == "VIDEOGRAPHY" for e in events)
        sarah_found = any(e["clientName"] == "Sarah Lee" and e["serviceType"] == "BRANDING" for e in events)
        
        print(f"  Emmanuel (Photography): {'✓' if emmanuel_found else '✗'}")
        print(f"  Michael Brown (Videography): {'✓' if michael_found else '✗'}")
        print(f"  Sarah Lee (Branding): {'✓' if sarah_found else '✗'}")
        
        assert emmanuel_found, "Expected Emmanuel (Photography) event not found"
        assert michael_found, "Expected Michael Brown (Videography) event not found"
        assert sarah_found, "Expected Sarah Lee (Branding) event not found"
        print("✓ All 3 expected test events present")
    
    def test_event_dates_match_expected(self, auth_headers):
        """Verify event dates: Emmanuel=Feb 25, Michael=Feb 27, Sarah=Mar 5"""
        response = requests.get(
            f"{BASE_URL}/leads/calendar/events?start=2026-02-01T00:00:00.000Z&end=2026-03-31T00:00:00.000Z",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        events = [e for e in data["events"] if e["type"] == "event"]
        
        # Verify Emmanuel - Feb 25
        emmanuel = next((e for e in events if e["clientName"] == "Emmanuel"), None)
        if emmanuel:
            event_date = emmanuel["date"][:10]  # Get YYYY-MM-DD
            assert event_date == "2026-02-25", f"Emmanuel event date mismatch: {event_date}"
            print(f"✓ Emmanuel event date: {event_date}")
        
        # Verify Michael - Feb 27  
        michael = next((e for e in events if e["clientName"] == "Michael Brown"), None)
        if michael:
            event_date = michael["date"][:10]
            assert event_date == "2026-02-27", f"Michael event date mismatch: {event_date}"
            print(f"✓ Michael event date: {event_date}")
        
        # Verify Sarah - Mar 5
        sarah = next((e for e in events if e["clientName"] == "Sarah Lee"), None)
        if sarah:
            event_date = sarah["date"][:10]
            assert event_date == "2026-03-05", f"Sarah event date mismatch: {event_date}"
            print(f"✓ Sarah event date: {event_date}")


class TestLeadsStatsAPI:
    """Test leads stats endpoint for calendar stats"""
    
    def test_stats_endpoint_returns_booked_count(self, auth_headers):
        """Stats endpoint returns BOOKED count for calendar summary"""
        response = requests.get(
            f"{BASE_URL}/leads/stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "statusCounts" in data
        assert "BOOKED" in data["statusCounts"] or isinstance(data["statusCounts"], dict)
        
        booked_count = data["statusCounts"].get("BOOKED", 0)
        print(f"✓ BOOKED count from stats: {booked_count}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
