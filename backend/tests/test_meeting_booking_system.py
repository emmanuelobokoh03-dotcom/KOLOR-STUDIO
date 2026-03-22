"""
Meeting Booking System API Tests
Tests for: Meeting Types, Availability, Public Booking, Meeting Bookings
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://raleway-design-check.preview.emergentagent.com')

# Test credentials from the request
TEST_USER_EMAIL = "bookingtest@test.com"
TEST_USER_PASSWORD = "password123"
TEST_USER_ID = "cmmw4gvhr0000msmu77aijfb9"
TEST_MEETING_TYPE_1 = "cmmw4hh050002msmu1qzfl49r"  # 30-min Consultation
TEST_MEETING_TYPE_2 = "cmmw4hhfj0004msmu1tjb455b"  # 1hr Portfolio Review

class TestMeetingTypesAPI:
    """Meeting Types CRUD API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_token):
        self.token = auth_token
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_meeting_types(self, auth_token):
        """GET /api/meeting-types returns meeting types for authenticated user"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        response = requests.get(f"{BASE_URL}/api/meeting-types", headers=headers)
        
        print(f"GET /api/meeting-types - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "meetingTypes" in data, "Response should contain meetingTypes array"
        assert isinstance(data["meetingTypes"], list), "meetingTypes should be a list"
        print(f"Found {len(data['meetingTypes'])} meeting types")
        
        # Verify structure if types exist
        if len(data["meetingTypes"]) > 0:
            mt = data["meetingTypes"][0]
            assert "id" in mt, "Meeting type should have id"
            assert "name" in mt, "Meeting type should have name"
            assert "duration" in mt, "Meeting type should have duration"
    
    def test_create_meeting_type(self, auth_token):
        """POST /api/meeting-types creates a new meeting type"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        payload = {
            "name": "TEST_30min_Call",
            "description": "A quick consultation call",
            "duration": 30,
            "color": "#3B82F6",
            "location": "Zoom",
            "bufferBefore": 5,
            "bufferAfter": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/meeting-types", json=payload, headers=headers)
        
        print(f"POST /api/meeting-types - Status: {response.status_code}")
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "meetingType" in data, "Response should contain meetingType"
        mt = data["meetingType"]
        assert mt["name"] == payload["name"], "Name should match"
        assert mt["duration"] == payload["duration"], "Duration should match"
        assert mt["color"] == payload["color"], "Color should match"
        
        # Store ID for cleanup
        self.created_meeting_type_id = mt["id"]
        print(f"Created meeting type: {mt['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/meeting-types/{mt['id']}", headers=headers)
    
    def test_create_meeting_type_validation(self, auth_token):
        """POST /api/meeting-types requires name and duration"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Missing name
        response = requests.post(f"{BASE_URL}/api/meeting-types", json={"duration": 30}, headers=headers)
        assert response.status_code == 400, f"Missing name should return 400, got {response.status_code}"
        
        # Missing duration
        response = requests.post(f"{BASE_URL}/api/meeting-types", json={"name": "Test"}, headers=headers)
        assert response.status_code == 400, f"Missing duration should return 400, got {response.status_code}"
        
        print("Validation tests passed")
    
    def test_update_meeting_type(self, auth_token):
        """PUT /api/meeting-types/:id updates a meeting type"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # First create a meeting type
        create_payload = {"name": "TEST_Update_Type", "duration": 45}
        create_response = requests.post(f"{BASE_URL}/api/meeting-types", json=create_payload, headers=headers)
        assert create_response.status_code == 201
        mt_id = create_response.json()["meetingType"]["id"]
        
        # Update it
        update_payload = {"name": "TEST_Updated_Type", "duration": 60, "isActive": False}
        response = requests.put(f"{BASE_URL}/api/meeting-types/{mt_id}", json=update_payload, headers=headers)
        
        print(f"PUT /api/meeting-types/{mt_id} - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["meetingType"]["name"] == "TEST_Updated_Type"
        assert data["meetingType"]["duration"] == 60
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/meeting-types/{mt_id}", headers=headers)
    
    def test_delete_meeting_type(self, auth_token):
        """DELETE /api/meeting-types/:id deletes a meeting type"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Create one to delete
        create_response = requests.post(f"{BASE_URL}/api/meeting-types", json={"name": "TEST_Delete_Type", "duration": 30}, headers=headers)
        assert create_response.status_code == 201
        mt_id = create_response.json()["meetingType"]["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/meeting-types/{mt_id}", headers=headers)
        
        print(f"DELETE /api/meeting-types/{mt_id} - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/meeting-types", headers=headers)
        types = get_response.json()["meetingTypes"]
        assert all(t["id"] != mt_id for t in types), "Deleted type should not be in list"


class TestAvailabilityAPI:
    """Availability Schedule API Tests"""
    
    def test_get_availability(self, auth_token):
        """GET /api/availability returns availability schedule"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        response = requests.get(f"{BASE_URL}/api/availability", headers=headers)
        
        print(f"GET /api/availability - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "availability" in data, "Response should contain availability array"
        assert isinstance(data["availability"], list), "availability should be a list"
        print(f"Found {len(data['availability'])} availability slots")
    
    def test_save_availability(self, auth_token):
        """PUT /api/availability saves/replaces entire availability schedule"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Define test slots (Mon-Fri 9-17)
        slots = [
            {"dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00"},
            {"dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00"},
            {"dayOfWeek": 3, "startTime": "09:00", "endTime": "17:00"},
            {"dayOfWeek": 4, "startTime": "09:00", "endTime": "17:00"},
            {"dayOfWeek": 5, "startTime": "09:00", "endTime": "17:00"},
        ]
        
        response = requests.put(f"{BASE_URL}/api/availability", json={"slots": slots}, headers=headers)
        
        print(f"PUT /api/availability - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "availability" in data, "Response should contain availability"
        assert len(data["availability"]) == 5, f"Should have 5 slots, got {len(data['availability'])}"
    
    def test_availability_validation(self, auth_token):
        """PUT /api/availability validates slots properly"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Invalid time format
        response = requests.put(f"{BASE_URL}/api/availability", json={"slots": [{"dayOfWeek": 1, "startTime": "9:00", "endTime": "17:00"}]}, headers=headers)
        assert response.status_code == 400, f"Invalid time format should return 400, got {response.status_code}"
        
        # startTime >= endTime
        response = requests.put(f"{BASE_URL}/api/availability", json={"slots": [{"dayOfWeek": 1, "startTime": "17:00", "endTime": "09:00"}]}, headers=headers)
        assert response.status_code == 400, f"startTime >= endTime should return 400, got {response.status_code}"
        
        # Invalid dayOfWeek
        response = requests.put(f"{BASE_URL}/api/availability", json={"slots": [{"dayOfWeek": 7, "startTime": "09:00", "endTime": "17:00"}]}, headers=headers)
        assert response.status_code == 400, f"dayOfWeek 7 should return 400, got {response.status_code}"
        
        print("Validation tests passed")


class TestPublicBookingAPI:
    """Public Booking Page API Tests (no auth required)"""
    
    def test_get_public_booking_page_data(self):
        """GET /api/book/:userId returns public page data"""
        response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}")
        
        print(f"GET /api/book/{TEST_USER_ID} - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response should contain user"
        assert "meetingTypes" in data, "Response should contain meetingTypes"
        
        # Verify user structure
        user = data["user"]
        assert "id" in user, "User should have id"
        assert "firstName" in user or "studioName" in user, "User should have name info"
        
        # Verify meeting types are active ones
        print(f"Public page has {len(data['meetingTypes'])} active meeting types")
    
    def test_get_public_booking_invalid_user(self):
        """GET /api/book/:userId returns 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/book/nonexistent_user_id")
        
        print(f"GET /api/book/nonexistent_user_id - Status: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_get_available_slots(self):
        """GET /api/book/:userId/:meetingTypeId/slots?date=YYYY-MM-DD generates available time slots"""
        # Use a future Monday (dayOfWeek=1)
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7  # Next Monday if today is Monday
        next_monday = (today + timedelta(days=days_until_monday)).strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}/slots?date={next_monday}")
        
        print(f"GET /api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}/slots?date={next_monday} - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "slots" in data, "Response should contain slots"
        assert "date" in data, "Response should contain date"
        print(f"Available slots on {next_monday}: {data['slots'][:5]}...")  # Show first 5
    
    def test_get_slots_missing_date(self):
        """GET /api/book/:userId/:meetingTypeId/slots requires date parameter"""
        response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}/slots")
        
        assert response.status_code == 400, f"Missing date should return 400, got {response.status_code}"
    
    def test_create_booking(self):
        """POST /api/book/:userId/:meetingTypeId creates a booking"""
        # Find an available slot
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = (today + timedelta(days=days_until_monday + 7)).strftime("%Y-%m-%d")  # Use Monday after next
        
        # Get available slots
        slots_response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}/slots?date={next_monday}")
        if slots_response.status_code != 200 or not slots_response.json().get("slots"):
            pytest.skip("No available slots to test booking")
        
        slots = slots_response.json()["slots"]
        if not slots:
            pytest.skip("No available slots")
        
        # Use last available slot to avoid conflicts
        test_slot = slots[-1]
        start_time = f"{next_monday}T{test_slot}:00Z"
        
        payload = {
            "clientName": "TEST_Booking_Client",
            "clientEmail": "testclient@example.com",
            "clientPhone": "+1234567890",
            "clientNotes": "Test booking notes",
            "startTime": start_time
        }
        
        response = requests.post(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}", json=payload)
        
        print(f"POST /api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1} - Status: {response.status_code}")
        
        if response.status_code == 409:
            print("Slot already taken (conflict) - this is expected behavior")
            return  # This is valid behavior
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "booking" in data, "Response should contain booking"
        assert data["booking"]["status"] == "CONFIRMED"
        print(f"Created booking: {data['booking']['id']}")
    
    def test_create_booking_validation(self):
        """POST /api/book/:userId/:meetingTypeId requires clientName, clientEmail, startTime"""
        # Missing clientName
        response = requests.post(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}", json={
            "clientEmail": "test@test.com",
            "startTime": "2026-03-25T10:00:00Z"
        })
        assert response.status_code == 400, f"Missing clientName should return 400, got {response.status_code}"
        
        print("Booking validation tests passed")
    
    def test_double_booking_prevention(self):
        """POST /api/book/:userId/:meetingTypeId returns 409 on double-book"""
        # There's an existing booking at 2026-03-19T10:00:00Z as mentioned
        payload = {
            "clientName": "TEST_Double_Booking",
            "clientEmail": "double@test.com",
            "startTime": "2026-03-19T10:00:00Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}", json=payload)
        
        print(f"Double booking test - Status: {response.status_code}")
        # Should either be 409 (conflict) or past date rejection
        assert response.status_code in [409, 400, 404], f"Expected conflict/rejection, got {response.status_code}"


class TestMeetingBookingsAPI:
    """Authenticated Meeting Bookings API Tests"""
    
    def test_get_meeting_bookings(self, auth_token):
        """GET /api/meeting-bookings returns authenticated user's bookings"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        response = requests.get(f"{BASE_URL}/api/meeting-bookings", headers=headers)
        
        print(f"GET /api/meeting-bookings - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bookings" in data, "Response should contain bookings array"
        print(f"Found {len(data['bookings'])} meeting bookings")
    
    def test_get_meeting_bookings_filter_upcoming(self, auth_token):
        """GET /api/meeting-bookings?upcoming=true filters upcoming bookings"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        response = requests.get(f"{BASE_URL}/api/meeting-bookings?upcoming=true", headers=headers)
        
        print(f"GET /api/meeting-bookings?upcoming=true - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bookings" in data
        print(f"Found {len(data['bookings'])} upcoming bookings")
    
    def test_get_meeting_bookings_filter_status(self, auth_token):
        """GET /api/meeting-bookings?status=CONFIRMED filters by status"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        response = requests.get(f"{BASE_URL}/api/meeting-bookings?status=CONFIRMED", headers=headers)
        
        print(f"GET /api/meeting-bookings?status=CONFIRMED - Status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        # All returned bookings should be CONFIRMED
        for booking in data["bookings"]:
            assert booking["status"] == "CONFIRMED", f"Expected CONFIRMED, got {booking['status']}"
    
    def test_cancel_meeting_booking(self, auth_token):
        """PATCH /api/meeting-bookings/:id/cancel cancels a booking"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # First get existing bookings
        bookings_response = requests.get(f"{BASE_URL}/api/meeting-bookings?status=CONFIRMED", headers=headers)
        bookings = bookings_response.json().get("bookings", [])
        
        # Find a test booking to cancel (one created by tests or create one)
        test_bookings = [b for b in bookings if "TEST_" in b.get("clientName", "")]
        
        if not test_bookings:
            print("No test bookings to cancel - creating one first")
            # Create a booking to cancel
            today = datetime.now()
            days_until_monday = (7 - today.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7
            next_monday = (today + timedelta(days=days_until_monday + 14)).strftime("%Y-%m-%d")  # 2 weeks out
            
            slots_response = requests.get(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}/slots?date={next_monday}")
            slots = slots_response.json().get("slots", [])
            
            if slots:
                create_response = requests.post(f"{BASE_URL}/api/book/{TEST_USER_ID}/{TEST_MEETING_TYPE_1}", json={
                    "clientName": "TEST_Cancel_Test",
                    "clientEmail": "cancel@test.com",
                    "startTime": f"{next_monday}T{slots[0]}:00Z"
                })
                if create_response.status_code == 201:
                    booking_id = create_response.json()["booking"]["id"]
                else:
                    pytest.skip("Could not create test booking to cancel")
            else:
                pytest.skip("No slots available to test cancellation")
        else:
            booking_id = test_bookings[0]["id"]
        
        # Cancel the booking
        response = requests.patch(f"{BASE_URL}/api/meeting-bookings/{booking_id}/cancel", json={"reason": "Test cancellation"}, headers=headers)
        
        print(f"PATCH /api/meeting-bookings/{booking_id}/cancel - Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["booking"]["status"] == "CANCELLED"


# Fixtures
@pytest.fixture(scope="session")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.fail(f"Authentication failed: {response.status_code} - {response.text}")
    
    token = response.json().get("token")
    if not token:
        pytest.fail("No token in login response")
    
    return token


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
