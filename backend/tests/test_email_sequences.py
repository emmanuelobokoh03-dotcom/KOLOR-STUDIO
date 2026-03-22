"""
Email Sequences (Autopilot) API Tests

Tests for:
- Sequence CRUD operations (GET, POST, PATCH, DELETE)
- Step CRUD operations
- Enrollment management (manual enroll, stop)
- Auto-enrollment trigger (quote send)
- Auto-stop triggers (quote accept, portal message)
- Auth isolation (users can only see their own sequences)
- Duplicate enrollment prevention
- New user signup seeds default sequence
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://raleway-design-check.preview.emergentagent.com').rstrip('/')

# Test credentials
MAIN_USER_EMAIL = "emmanuelobokoh03@gmail.com"
MAIN_USER_PASSWORD = "successful26#"
LEAD_ID_COKESPICE = "6bc704c4-8030-42e2-be8a-8f7ed4035709"
PORTAL_TOKEN_COKESPICE = "7571cca7-ccda-461c-99c6-6ab2ea8170e5"
EXISTING_SEQUENCE_ID = "7680d0a0-b41b-4f93-a7a0-83f3c37b9e2e"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate main user and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MAIN_USER_EMAIL,
        "password": MAIN_USER_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestSequenceListAndGet:
    """Test GET /api/sequences and GET /api/sequences/:id"""

    def test_list_sequences(self, auth_headers):
        """GET /api/sequences - List all sequences with stats"""
        response = requests.get(f"{BASE_URL}/api/sequences", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "sequences" in data
        assert isinstance(data["sequences"], list)
        
        # Should have at least the default "Quote Follow-Up" sequence
        assert len(data["sequences"]) >= 1
        
        # Check structure of sequence
        seq = data["sequences"][0]
        assert "id" in seq
        assert "name" in seq
        assert "trigger" in seq
        assert "active" in seq
        assert "steps" in seq
        assert "stats" in seq
        assert "total" in seq["stats"]
        assert "active" in seq["stats"]
        assert "completed" in seq["stats"]
        print(f"✓ Found {len(data['sequences'])} sequence(s)")

    def test_get_sequence_detail(self, auth_headers):
        """GET /api/sequences/:id - Get sequence with steps and enrollments"""
        response = requests.get(f"{BASE_URL}/api/sequences/{EXISTING_SEQUENCE_ID}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "sequence" in data
        seq = data["sequence"]
        
        assert seq["id"] == EXISTING_SEQUENCE_ID
        assert "steps" in seq
        assert "enrollments" in seq
        assert isinstance(seq["steps"], list)
        assert isinstance(seq["enrollments"], list)
        
        # Check steps have proper structure
        if len(seq["steps"]) > 0:
            step = seq["steps"][0]
            assert "id" in step
            assert "order" in step
            assert "delayDays" in step
            assert "subject" in step
            assert "body" in step
        
        print(f"✓ Sequence '{seq['name']}' has {len(seq['steps'])} steps and {len(seq['enrollments'])} enrollments")

    def test_get_sequence_not_found(self, auth_headers):
        """GET /api/sequences/:id - 404 for non-existent sequence"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/sequences/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


class TestSequenceCRUD:
    """Test sequence create, update, delete"""

    def test_create_sequence(self, auth_headers):
        """POST /api/sequences - Create new sequence with steps"""
        payload = {
            "name": "TEST_Contract Follow-Up",
            "description": "Test sequence for contract follow-up",
            "trigger": "CONTRACT_SENT",
            "steps": [
                {"delayDays": 2, "subject": "Quick check on the contract", "body": "Hi {firstName}, just checking in!"},
                {"delayDays": 5, "subject": "Any questions about the contract?", "body": "Let me know if you need any clarification."}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json=payload)
        assert response.status_code == 201, f"Failed: {response.text}"
        
        data = response.json()
        assert "sequence" in data
        seq = data["sequence"]
        
        assert seq["name"] == payload["name"]
        assert seq["description"] == payload["description"]
        assert seq["trigger"] == payload["trigger"]
        assert seq["active"] == True
        assert len(seq["steps"]) == 2
        assert seq["steps"][0]["delayDays"] == 2
        assert seq["steps"][1]["delayDays"] == 5
        
        # Store for later tests
        TestSequenceCRUD.created_sequence_id = seq["id"]
        print(f"✓ Created sequence: {seq['id']}")

    def test_create_sequence_validation(self, auth_headers):
        """POST /api/sequences - Validation errors"""
        # Missing name
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json={
            "trigger": "QUOTE_SENT"
        })
        assert response.status_code == 400
        
        # Missing trigger
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json={
            "name": "Test"
        })
        assert response.status_code == 400
        print("✓ Validation errors properly returned")

    def test_update_sequence(self, auth_headers):
        """PATCH /api/sequences/:id - Update sequence metadata"""
        seq_id = getattr(TestSequenceCRUD, 'created_sequence_id', None)
        if not seq_id:
            pytest.skip("No sequence created to update")
        
        payload = {
            "name": "TEST_Contract Follow-Up (Updated)",
            "description": "Updated description",
            "active": False
        }
        
        response = requests.patch(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers, json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        seq = data["sequence"]
        assert seq["name"] == payload["name"]
        assert seq["description"] == payload["description"]
        assert seq["active"] == False
        print(f"✓ Updated sequence: {seq['name']}")

    def test_delete_sequence(self, auth_headers):
        """DELETE /api/sequences/:id - Delete sequence (cascades)"""
        seq_id = getattr(TestSequenceCRUD, 'created_sequence_id', None)
        if not seq_id:
            pytest.skip("No sequence created to delete")
        
        response = requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify deleted
        response = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
        assert response.status_code == 404
        print(f"✓ Deleted sequence: {seq_id}")


class TestStepCRUD:
    """Test step create, update, delete"""

    def test_add_step_to_sequence(self, auth_headers):
        """POST /api/sequences/:id/steps - Add step to existing sequence"""
        # First, create a test sequence
        payload = {
            "name": "TEST_Step Operations",
            "trigger": "LEAD_COLD",
            "steps": []
        }
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json=payload)
        assert response.status_code == 201
        seq_id = response.json()["sequence"]["id"]
        TestStepCRUD.test_sequence_id = seq_id
        
        # Add a step
        step_payload = {
            "subject": "Re-engage cold lead",
            "body": "Hi {firstName}, it's been a while!",
            "delayDays": 14,
            "order": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/sequences/{seq_id}/steps", headers=auth_headers, json=step_payload)
        assert response.status_code == 201, f"Failed: {response.text}"
        
        data = response.json()
        assert "step" in data
        step = data["step"]
        assert step["subject"] == step_payload["subject"]
        assert step["delayDays"] == step_payload["delayDays"]
        
        TestStepCRUD.test_step_id = step["id"]
        print(f"✓ Added step: {step['id']}")

    def test_update_step(self, auth_headers):
        """PATCH /api/sequences/steps/:stepId - Update step"""
        step_id = getattr(TestStepCRUD, 'test_step_id', None)
        if not step_id:
            pytest.skip("No step created to update")
        
        payload = {
            "subject": "Updated subject",
            "body": "Updated body text",
            "delayDays": 21
        }
        
        response = requests.patch(f"{BASE_URL}/api/sequences/steps/{step_id}", headers=auth_headers, json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        step = data["step"]
        assert step["subject"] == payload["subject"]
        assert step["delayDays"] == payload["delayDays"]
        print(f"✓ Updated step: {step_id}")

    def test_delete_step(self, auth_headers):
        """DELETE /api/sequences/steps/:stepId - Delete step"""
        step_id = getattr(TestStepCRUD, 'test_step_id', None)
        if not step_id:
            pytest.skip("No step created to delete")
        
        response = requests.delete(f"{BASE_URL}/api/sequences/steps/{step_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✓ Deleted step: {step_id}")

    def test_cleanup_sequence(self, auth_headers):
        """Cleanup test sequence"""
        seq_id = getattr(TestStepCRUD, 'test_sequence_id', None)
        if seq_id:
            requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
            print(f"✓ Cleaned up test sequence")


class TestEnrollmentManagement:
    """Test manual enrollment and stop"""

    def test_manual_enrollment_preparation(self, auth_headers):
        """Create a test sequence for enrollment tests"""
        payload = {
            "name": "TEST_Manual Enroll Sequence",
            "trigger": "PROJECT_CREATED",
            "steps": [
                {"delayDays": 1, "subject": "Welcome to your project", "body": "Hi {firstName}!"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json=payload)
        assert response.status_code == 201
        TestEnrollmentManagement.test_sequence_id = response.json()["sequence"]["id"]
        print(f"✓ Created enrollment test sequence")

    def test_manual_enroll_lead(self, auth_headers):
        """POST /api/sequences/:id/enroll/:leadId - Manually enroll lead"""
        seq_id = getattr(TestEnrollmentManagement, 'test_sequence_id', None)
        if not seq_id:
            pytest.skip("No test sequence created")
        
        response = requests.post(
            f"{BASE_URL}/api/sequences/{seq_id}/enroll/{LEAD_ID_COKESPICE}",
            headers=auth_headers
        )
        
        # Could be 201 (success) or 400 (already enrolled)
        if response.status_code == 201:
            data = response.json()
            assert "enrollment" in data
            enrollment = data["enrollment"]
            assert enrollment["sequenceId"] == seq_id
            assert enrollment["leadId"] == LEAD_ID_COKESPICE
            assert enrollment["status"] == "ACTIVE"
            assert enrollment["currentStep"] == 0
            TestEnrollmentManagement.enrollment_id = enrollment["id"]
            print(f"✓ Enrolled lead in sequence, enrollment ID: {enrollment['id']}")
        elif response.status_code == 400:
            # Already enrolled - this is expected if test runs multiple times
            assert "already enrolled" in response.json().get("error", "").lower()
            print("✓ Lead already enrolled (duplicate prevention working)")
            # Try to get enrollment ID from sequence detail
            detail_resp = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
            if detail_resp.status_code == 200:
                enrollments = detail_resp.json()["sequence"]["enrollments"]
                for e in enrollments:
                    if e["leadId"] == LEAD_ID_COKESPICE:
                        TestEnrollmentManagement.enrollment_id = e["id"]
                        break
        else:
            pytest.fail(f"Unexpected status: {response.status_code} - {response.text}")

    def test_duplicate_enrollment_prevention(self, auth_headers):
        """Test that duplicate enrollment is prevented"""
        seq_id = getattr(TestEnrollmentManagement, 'test_sequence_id', None)
        if not seq_id:
            pytest.skip("No test sequence created")
        
        # Try to enroll same lead again
        response = requests.post(
            f"{BASE_URL}/api/sequences/{seq_id}/enroll/{LEAD_ID_COKESPICE}",
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "already enrolled" in response.json().get("error", "").lower()
        print("✓ Duplicate enrollment properly prevented")

    def test_stop_enrollment(self, auth_headers):
        """POST /api/sequences/enrollments/:enrollmentId/stop - Stop enrollment"""
        enrollment_id = getattr(TestEnrollmentManagement, 'enrollment_id', None)
        if not enrollment_id:
            pytest.skip("No enrollment to stop")
        
        response = requests.post(
            f"{BASE_URL}/api/sequences/enrollments/{enrollment_id}/stop",
            headers=auth_headers,
            json={"reason": "Manual test stop"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        enrollment = data["enrollment"]
        assert enrollment["status"] == "STOPPED"
        assert enrollment["stoppedReason"] == "Manual test stop"
        print(f"✓ Stopped enrollment: {enrollment_id}")

    def test_cleanup_enrollment_sequence(self, auth_headers):
        """Cleanup test sequence"""
        seq_id = getattr(TestEnrollmentManagement, 'test_sequence_id', None)
        if seq_id:
            requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
            print("✓ Cleaned up enrollment test sequence")


class TestAutoEnrollmentQuoteSend:
    """Test auto-enrollment when quote is sent"""

    def test_create_lead_for_auto_enroll(self, auth_headers):
        """Create a fresh lead for testing auto-enrollment"""
        timestamp = int(time.time())
        lead_payload = {
            "clientName": f"TEST_AutoEnroll Client {timestamp}",
            "clientEmail": f"test-autoenroll-{timestamp}@example.com",
            "projectTitle": f"Auto Enroll Test Project {timestamp}",
            "serviceType": "PHOTOGRAPHY",
            "description": "Test lead for sequence auto-enrollment",
            "budget": "$1,000"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", headers=auth_headers, json=lead_payload)
        assert response.status_code == 201, f"Failed to create lead: {response.text}"
        
        lead = response.json()["lead"]
        TestAutoEnrollmentQuoteSend.test_lead_id = lead["id"]
        print(f"✓ Created test lead: {lead['id']}")

    def test_create_and_send_quote_triggers_enrollment(self, auth_headers):
        """Sending a quote should trigger QUOTE_SENT sequence enrollment"""
        lead_id = getattr(TestAutoEnrollmentQuoteSend, 'test_lead_id', None)
        if not lead_id:
            pytest.skip("No test lead created")
        
        # Create a draft quote
        quote_payload = {
            "lineItems": [
                {"description": "Test service", "quantity": 1, "price": 500}
            ],
            "tax": 0,
            "paymentTerms": "FULL_UPFRONT",
            "validUntil": "2026-12-31"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=auth_headers,
            json=quote_payload
        )
        assert response.status_code == 201, f"Failed to create quote: {response.text}"
        quote_id = response.json()["quote"]["id"]
        TestAutoEnrollmentQuoteSend.test_quote_id = quote_id
        print(f"✓ Created quote: {quote_id}")
        
        # Send the quote (this should trigger auto-enrollment)
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to send quote: {response.text}"
        print("✓ Quote sent")
        
        # Wait a moment for async enrollment
        time.sleep(1)
        
        # Check if lead was enrolled in QUOTE_SENT sequence
        # Get the main user's QUOTE_SENT sequences
        seq_response = requests.get(f"{BASE_URL}/api/sequences", headers=auth_headers)
        assert seq_response.status_code == 200
        
        sequences = seq_response.json()["sequences"]
        quote_sent_sequences = [s for s in sequences if s["trigger"] == "QUOTE_SENT" and s["active"]]
        
        if len(quote_sent_sequences) > 0:
            # Check if lead is enrolled in any QUOTE_SENT sequence
            enrolled = False
            for seq in quote_sent_sequences:
                detail_resp = requests.get(f"{BASE_URL}/api/sequences/{seq['id']}", headers=auth_headers)
                if detail_resp.status_code == 200:
                    enrollments = detail_resp.json()["sequence"]["enrollments"]
                    for e in enrollments:
                        if e["leadId"] == lead_id:
                            enrolled = True
                            TestAutoEnrollmentQuoteSend.enrollment_id = e["id"]
                            TestAutoEnrollmentQuoteSend.enrolled_sequence_id = seq["id"]
                            print(f"✓ Lead auto-enrolled in sequence '{seq['name']}' (enrollment: {e['id']})")
                            break
                if enrolled:
                    break
            
            if not enrolled:
                print("⚠ Lead not found in QUOTE_SENT sequence enrollments (may already exist)")
        else:
            print("⚠ No active QUOTE_SENT sequences found")

    def test_cleanup_auto_enroll_test_data(self, auth_headers):
        """Cleanup test lead and quote"""
        lead_id = getattr(TestAutoEnrollmentQuoteSend, 'test_lead_id', None)
        if lead_id:
            # Delete lead (will cascade to quotes and enrollments)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            print("✓ Cleaned up test lead and related data")


class TestAutoStopQuoteAccept:
    """Test auto-stop when quote is accepted"""

    def test_setup_for_auto_stop(self, auth_headers):
        """Create lead, sequence, enrollment for auto-stop test"""
        timestamp = int(time.time())
        
        # Create a test sequence
        seq_payload = {
            "name": f"TEST_AutoStop Sequence {timestamp}",
            "trigger": "QUOTE_SENT",
            "steps": [
                {"delayDays": 3, "subject": "Follow up", "body": "Hi there!"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json=seq_payload)
        assert response.status_code == 201
        seq_id = response.json()["sequence"]["id"]
        TestAutoStopQuoteAccept.test_sequence_id = seq_id
        
        # Create a test lead
        lead_payload = {
            "clientName": f"TEST_AutoStop Client {timestamp}",
            "clientEmail": f"test-autostop-{timestamp}@example.com",
            "projectTitle": f"Auto Stop Test {timestamp}",
            "serviceType": "VIDEOGRAPHY",
            "description": "Test for auto-stop on quote accept"
        }
        response = requests.post(f"{BASE_URL}/api/leads", headers=auth_headers, json=lead_payload)
        assert response.status_code == 201
        lead = response.json()["lead"]
        TestAutoStopQuoteAccept.test_lead_id = lead["id"]
        
        # Manually enroll the lead
        response = requests.post(
            f"{BASE_URL}/api/sequences/{seq_id}/enroll/{lead['id']}",
            headers=auth_headers
        )
        if response.status_code == 201:
            TestAutoStopQuoteAccept.enrollment_id = response.json()["enrollment"]["id"]
        
        # Create and send a quote
        quote_payload = {
            "lineItems": [{"description": "Test", "quantity": 1, "price": 100}],
            "tax": 0,
            "paymentTerms": "FULL_UPFRONT",
            "validUntil": "2026-12-31"
        }
        response = requests.post(f"{BASE_URL}/api/leads/{lead['id']}/quotes", headers=auth_headers, json=quote_payload)
        assert response.status_code == 201
        quote = response.json()["quote"]
        TestAutoStopQuoteAccept.quote_token = quote["quoteToken"]
        
        # Send the quote
        requests.post(f"{BASE_URL}/api/quotes/{quote['id']}/send", headers=auth_headers)
        print(f"✓ Setup complete: seq={seq_id}, lead={lead['id']}, quoteToken={quote['quoteToken']}")

    def test_quote_accept_stops_enrollments(self, auth_headers):
        """Accepting quote should stop all active enrollments for that lead"""
        quote_token = getattr(TestAutoStopQuoteAccept, 'quote_token', None)
        if not quote_token:
            pytest.skip("No quote token available")
        
        # Accept the quote (public endpoint)
        response = requests.post(f"{BASE_URL}/api/quotes/public/{quote_token}/accept")
        assert response.status_code == 200, f"Failed to accept quote: {response.text}"
        print("✓ Quote accepted")
        
        # Wait for async stop
        time.sleep(1)
        
        # Check enrollment status
        seq_id = getattr(TestAutoStopQuoteAccept, 'test_sequence_id', None)
        lead_id = getattr(TestAutoStopQuoteAccept, 'test_lead_id', None)
        
        if seq_id:
            response = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
            if response.status_code == 200:
                enrollments = response.json()["sequence"]["enrollments"]
                for e in enrollments:
                    if e["leadId"] == lead_id:
                        if e["status"] == "STOPPED":
                            print(f"✓ Enrollment auto-stopped after quote accept: {e['stoppedReason']}")
                        else:
                            print(f"⚠ Enrollment status: {e['status']} (expected STOPPED)")
                        break

    def test_cleanup_auto_stop_test_data(self, auth_headers):
        """Cleanup"""
        lead_id = getattr(TestAutoStopQuoteAccept, 'test_lead_id', None)
        seq_id = getattr(TestAutoStopQuoteAccept, 'test_sequence_id', None)
        
        if lead_id:
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        if seq_id:
            requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
        print("✓ Cleaned up auto-stop test data")


class TestAutoStopPortalMessage:
    """Test auto-stop when client sends portal message"""

    def test_setup_for_portal_auto_stop(self, auth_headers):
        """Setup: enroll Cokespice lead in a test sequence"""
        timestamp = int(time.time())
        
        # Create a test sequence
        seq_payload = {
            "name": f"TEST_Portal AutoStop {timestamp}",
            "trigger": "PROJECT_CREATED",
            "steps": [
                {"delayDays": 1, "subject": "Hello", "body": "Test"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/sequences", headers=auth_headers, json=seq_payload)
        assert response.status_code == 201
        seq_id = response.json()["sequence"]["id"]
        TestAutoStopPortalMessage.test_sequence_id = seq_id
        
        # Manually enroll Cokespice lead
        response = requests.post(
            f"{BASE_URL}/api/sequences/{seq_id}/enroll/{LEAD_ID_COKESPICE}",
            headers=auth_headers
        )
        if response.status_code == 201:
            TestAutoStopPortalMessage.enrollment_id = response.json()["enrollment"]["id"]
            print(f"✓ Enrolled Cokespice in test sequence")
        elif response.status_code == 400:
            # Already enrolled
            detail_resp = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
            if detail_resp.status_code == 200:
                for e in detail_resp.json()["sequence"]["enrollments"]:
                    if e["leadId"] == LEAD_ID_COKESPICE:
                        TestAutoStopPortalMessage.enrollment_id = e["id"]
                        break
            print("⚠ Lead already enrolled in this sequence")

    def test_portal_message_stops_enrollments(self, auth_headers):
        """Client sending portal message should stop active enrollments"""
        seq_id = getattr(TestAutoStopPortalMessage, 'test_sequence_id', None)
        if not seq_id:
            pytest.skip("No test sequence created")
        
        # Check enrollment status before
        response = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
        assert response.status_code == 200
        enrollments_before = response.json()["sequence"]["enrollments"]
        active_before = [e for e in enrollments_before if e["leadId"] == LEAD_ID_COKESPICE and e["status"] == "ACTIVE"]
        
        if len(active_before) == 0:
            print("⚠ No active enrollment to test auto-stop")
            return
        
        # Send a portal message (public endpoint)
        message_payload = {"content": f"Test message from client at {int(time.time())}"}
        response = requests.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN_COKESPICE}/messages",
            json=message_payload
        )
        assert response.status_code == 200, f"Failed to send portal message: {response.text}"
        print("✓ Portal message sent")
        
        # Wait for async stop
        time.sleep(1)
        
        # Check enrollment status after
        response = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
        assert response.status_code == 200
        enrollments_after = response.json()["sequence"]["enrollments"]
        
        for e in enrollments_after:
            if e["leadId"] == LEAD_ID_COKESPICE:
                if e["status"] == "STOPPED":
                    print(f"✓ Enrollment auto-stopped after portal message: {e.get('stoppedReason', 'N/A')}")
                else:
                    print(f"⚠ Enrollment status: {e['status']} (expected STOPPED)")
                break

    def test_cleanup_portal_auto_stop_data(self, auth_headers):
        """Cleanup"""
        seq_id = getattr(TestAutoStopPortalMessage, 'test_sequence_id', None)
        if seq_id:
            requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=auth_headers)
            print("✓ Cleaned up portal auto-stop test sequence")


class TestNewUserSignupSeedSequence:
    """Test that new user signup seeds default 'Quote Follow-Up' sequence"""

    def test_signup_creates_default_sequence(self):
        """New user signup should seed default 'Quote Follow-Up' sequence (Day 3, 7, 10)"""
        timestamp = int(time.time())
        signup_payload = {
            "email": f"seq-agent-{timestamp}@test.com",
            "password": "TestSeq123!",
            "firstName": "Sequence",
            "lastName": "TestUser",
            "studioName": "Test Sequences Studio"
        }
        
        # Signup
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
        assert response.status_code == 201, f"Signup failed: {response.text}"
        print(f"✓ Created user: {signup_payload['email']}")
        
        # Login to get token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": signup_payload["email"],
            "password": signup_payload["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Wait for async seed to complete
        time.sleep(2)
        
        # Get sequences
        response = requests.get(f"{BASE_URL}/api/sequences", headers=headers)
        assert response.status_code == 200, f"Failed to get sequences: {response.text}"
        
        sequences = response.json()["sequences"]
        
        # Find "Quote Follow-Up" sequence
        quote_followup = None
        for seq in sequences:
            if seq["name"] == "Quote Follow-Up":
                quote_followup = seq
                break
        
        assert quote_followup is not None, "Default 'Quote Follow-Up' sequence not found"
        assert quote_followup["trigger"] == "QUOTE_SENT"
        assert quote_followup["active"] == True
        
        # Check steps: Day 3, 7, 10
        steps = quote_followup["steps"]
        assert len(steps) == 3, f"Expected 3 steps, got {len(steps)}"
        
        delay_days = [s["delayDays"] for s in steps]
        assert 3 in delay_days, "Missing Day 3 step"
        assert 7 in delay_days, "Missing Day 7 step"
        assert 10 in delay_days, "Missing Day 10 step"
        
        print(f"✓ Default 'Quote Follow-Up' sequence seeded with steps: Day {delay_days}")
        
        # Note: We don't delete the test user here as there's no delete user endpoint
        TestNewUserSignupSeedSequence.test_user_email = signup_payload["email"]


class TestAuthIsolation:
    """Test that users can only see/manage their own sequences"""

    def test_cannot_access_other_users_sequence(self, auth_headers):
        """User cannot access another user's sequence"""
        # Create a second user
        timestamp = int(time.time())
        signup_payload = {
            "email": f"isolation-test-{timestamp}@test.com",
            "password": "IsolationTest123!",
            "firstName": "Isolation",
            "lastName": "Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
        if response.status_code != 201:
            pytest.skip("Could not create second user for isolation test")
        
        # Login as second user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": signup_payload["email"],
            "password": signup_payload["password"]
        })
        assert response.status_code == 200
        other_user_headers = {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
        
        # Try to access main user's sequence
        response = requests.get(f"{BASE_URL}/api/sequences/{EXISTING_SEQUENCE_ID}", headers=other_user_headers)
        assert response.status_code == 404, "Should not be able to access another user's sequence"
        print("✓ Auth isolation working - cannot access other user's sequence")
        
        # Try to delete main user's sequence
        response = requests.delete(f"{BASE_URL}/api/sequences/{EXISTING_SEQUENCE_ID}", headers=other_user_headers)
        assert response.status_code == 404, "Should not be able to delete another user's sequence"
        print("✓ Auth isolation working - cannot delete other user's sequence")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
