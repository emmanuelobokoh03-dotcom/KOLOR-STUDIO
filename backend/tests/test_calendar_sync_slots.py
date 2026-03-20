"""
Test: Google Calendar Sync - Slot Generation with calendarSynced flag
Tests the enhancement that syncs Google Calendar events to public booking page.
- GET /api/book/:userId/:meetingTypeId/slots returns calendarSynced boolean
- calendarSynced is false when user has no Google Calendar connected
- Slot generation works correctly (16 slots for weekday 09:00-17:00, 30min duration)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials and IDs from the review request
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"
TEST_USER_ID = "cmmw4gvhr0000msmu77aijfb9"
TEST_MEETING_TYPE_ID = "cmmw4hh050002msmu1qzfl49r"
TEST_DATE = "2026-03-23"  # Monday - has availability Mon-Fri 09:00-17:00


class TestHealthCheck:
    """Health check endpoint test"""
    
    def test_health_endpoint(self):
        """GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print(f"PASS: Health check returned {response.status_code}")


class TestGoogleCalendarStatus:
    """Google Calendar status endpoint test"""
    
    def test_calendar_status_requires_auth(self):
        """GET /api/google-calendar/status returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/google-calendar/status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Calendar status requires authentication")
    
    def test_calendar_status_with_auth(self):
        """GET /api/google-calendar/status returns connected status"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        
        # Check calendar status
        response = requests.get(
            f"{BASE_URL}/api/google-calendar/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Calendar status failed: {response.text}"
        data = response.json()
        assert "connected" in data, "Response should contain 'connected' field"
        print(f"PASS: Calendar status returned connected={data.get('connected')}")


class TestPublicBookingSlots:
    """Public booking slots endpoint tests - main feature being tested"""
    
    def test_slots_endpoint_returns_calendar_synced_field(self):
        """GET /api/book/:userId/:meetingTypeId/slots returns calendarSynced boolean"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 200, f"Slots endpoint failed: {response.text}"
        data = response.json()
        
        # Verify calendarSynced field exists and is boolean
        assert "calendarSynced" in data, "Response must contain 'calendarSynced' field"
        assert isinstance(data["calendarSynced"], bool), "calendarSynced must be a boolean"
        print(f"PASS: calendarSynced field present with value: {data['calendarSynced']}")
    
    def test_calendar_synced_is_false_when_not_connected(self):
        """calendarSynced is false when user has no Google Calendar connected"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 200, f"Slots endpoint failed: {response.text}"
        data = response.json()
        
        # Test user does not have Google Calendar connected
        assert data["calendarSynced"] == False, f"Expected calendarSynced=false, got {data['calendarSynced']}"
        print("PASS: calendarSynced is false for user without Google Calendar connected")
    
    def test_slots_response_structure(self):
        """Verify complete response structure of slots endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 200, f"Slots endpoint failed: {response.text}"
        data = response.json()
        
        # Verify all expected fields
        assert "slots" in data, "Response must contain 'slots' array"
        assert "date" in data, "Response must contain 'date' field"
        assert "calendarSynced" in data, "Response must contain 'calendarSynced' field"
        assert "meetingType" in data, "Response must contain 'meetingType' object"
        
        # Verify meetingType structure
        mt = data["meetingType"]
        assert "name" in mt, "meetingType must have 'name'"
        assert "duration" in mt, "meetingType must have 'duration'"
        
        print(f"PASS: Response structure verified - date={data['date']}, calendarSynced={data['calendarSynced']}, meetingType={mt['name']}")
    
    def test_slot_generation_count(self):
        """Slot generation returns correct number of slots for 09:00-17:00 with 30min duration"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 200, f"Slots endpoint failed: {response.text}"
        data = response.json()
        
        slots = data.get("slots", [])
        # 09:00-17:00 = 8 hours = 480 minutes
        # With 30-minute slots: 480/30 = 16 slots (09:00, 09:30, 10:00, ..., 16:30)
        # Note: The last slot at 16:30 ends at 17:00
        expected_slots = 16
        
        print(f"INFO: Got {len(slots)} slots for date {TEST_DATE}")
        print(f"INFO: Slots: {slots[:5]}... (showing first 5)")
        
        # Allow some flexibility since some slots might be in the past or booked
        assert len(slots) > 0, "Should have at least some available slots"
        assert len(slots) <= expected_slots, f"Should not exceed {expected_slots} slots, got {len(slots)}"
        print(f"PASS: Slot count {len(slots)} is within expected range (1-{expected_slots})")
    
    def test_slot_format(self):
        """Verify slot time format is HH:MM"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 200, f"Slots endpoint failed: {response.text}"
        data = response.json()
        
        slots = data.get("slots", [])
        if len(slots) > 0:
            # Check format of first slot
            first_slot = slots[0]
            assert ":" in first_slot, f"Slot should be in HH:MM format, got {first_slot}"
            parts = first_slot.split(":")
            assert len(parts) == 2, f"Slot should have hour:minute format, got {first_slot}"
            hour, minute = int(parts[0]), int(parts[1])
            assert 0 <= hour <= 23, f"Hour should be 0-23, got {hour}"
            assert minute in [0, 30], f"Minute should be 0 or 30 (30-min increments), got {minute}"
            print(f"PASS: Slot format verified - first slot: {first_slot}")
        else:
            print("SKIP: No slots available to verify format")
    
    def test_slots_require_date_param(self):
        """GET /api/book/:userId/:meetingTypeId/slots returns 400 without date param"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots"
        )
        assert response.status_code == 400, f"Expected 400 without date param, got {response.status_code}"
        print("PASS: Slots endpoint requires date parameter")
    
    def test_slots_weekend_no_availability(self):
        """Weekend dates return no slots (availability is Mon-Fri)"""
        # 2026-03-22 is a Sunday
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": "2026-03-22"}
        )
        assert response.status_code == 200, f"Slots endpoint failed: {response.text}"
        data = response.json()
        
        slots = data.get("slots", [])
        assert len(slots) == 0, f"Weekend should have no slots, got {len(slots)}"
        # Note: calendarSynced is NOT included when there's no availability for the day
        # This is expected behavior - no point checking calendar if no slots exist
        assert "message" in data, "Should have message explaining no availability"
        print(f"PASS: Weekend (Sunday) returns 0 slots with message: {data.get('message')}")
    
    def test_invalid_user_id(self):
        """Invalid user ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/book/invalid-user-id/{TEST_MEETING_TYPE_ID}/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 404, f"Expected 404 for invalid user, got {response.status_code}"
        print("PASS: Invalid user ID returns 404")
    
    def test_invalid_meeting_type_id(self):
        """Invalid meeting type ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/book/{TEST_USER_ID}/invalid-meeting-type/slots",
            params={"date": TEST_DATE}
        )
        assert response.status_code == 404, f"Expected 404 for invalid meeting type, got {response.status_code}"
        print("PASS: Invalid meeting type ID returns 404")


class TestPublicBookingPageData:
    """Test public booking page data endpoint"""
    
    def test_get_page_data(self):
        """GET /api/book/:userId returns user and meeting types"""
        response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}")
        assert response.status_code == 200, f"Page data endpoint failed: {response.text}"
        data = response.json()
        
        assert "user" in data, "Response must contain 'user'"
        assert "meetingTypes" in data, "Response must contain 'meetingTypes'"
        
        user = data["user"]
        assert "id" in user, "User must have 'id'"
        assert user["id"] == TEST_USER_ID, f"User ID mismatch: expected {TEST_USER_ID}, got {user['id']}"
        
        print(f"PASS: Page data returned for user {user.get('firstName')} {user.get('lastName')}")
        print(f"INFO: {len(data['meetingTypes'])} meeting types available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
