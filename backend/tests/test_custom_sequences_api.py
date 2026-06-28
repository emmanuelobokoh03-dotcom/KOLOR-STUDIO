"""
Test Custom Email Sequences API - Iteration 128
Tests CRUD operations for custom sequences and steps
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


class TestCustomSequencesAPI:
    """Test custom sequences CRUD operations"""
    
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
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"✓ Login successful")
        
        yield
        
        # Cleanup: Delete any test sequences created
        try:
            list_response = self.session.get(f"{BASE_URL}/api/sequences/")
            if list_response.status_code == 200:
                sequences = list_response.json().get('sequences', [])
                for seq in sequences:
                    if seq.get('name', '').startswith('TEST_'):
                        self.session.delete(f"{BASE_URL}/api/sequences/{seq['id']}")
                        print(f"  Cleaned up test sequence: {seq['name']}")
        except Exception as e:
            print(f"  Cleanup warning: {e}")
    
    def test_list_custom_sequences(self):
        """GET /api/sequences/ - List custom sequences"""
        response = self.session.get(f"{BASE_URL}/api/sequences/")
        assert response.status_code == 200, f"List failed: {response.text}"
        
        data = response.json()
        assert 'sequences' in data, "Response should contain 'sequences' key"
        assert isinstance(data['sequences'], list), "Sequences should be a list"
        print(f"✓ List custom sequences: {len(data['sequences'])} sequences found")
    
    def test_create_custom_sequence(self):
        """POST /api/sequences/ - Create a new custom sequence"""
        payload = {
            "name": "TEST_New Sequence",
            "description": "Test sequence description",
            "trigger": "QUOTE_SENT",
            "steps": []
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/sequences/",
            json=payload
        )
        assert response.status_code == 201, f"Create failed: {response.text}"
        
        data = response.json()
        assert 'sequence' in data, "Response should contain 'sequence' key"
        
        seq = data['sequence']
        assert seq['name'] == payload['name'], "Name should match"
        assert seq['description'] == payload['description'], "Description should match"
        assert seq['trigger'] == payload['trigger'], "Trigger should match"
        assert seq['active'] == True, "New sequence should be active by default"
        assert 'id' in seq, "Sequence should have an ID"
        assert 'steps' in seq, "Sequence should have steps array"
        
        print(f"✓ Create custom sequence: ID={seq['id']}")
        
        # Verify persistence with GET
        get_response = self.session.get(f"{BASE_URL}/api/sequences/{seq['id']}")
        assert get_response.status_code == 200, f"GET after create failed: {get_response.text}"
        
        fetched = get_response.json()['sequence']
        assert fetched['name'] == payload['name'], "Persisted name should match"
        print(f"✓ Verified sequence persistence")
        
        return seq['id']
    
    def test_create_sequence_validation(self):
        """POST /api/sequences/ - Validation for required fields"""
        # Missing name
        response = self.session.post(
            f"{BASE_URL}/api/sequences/",
            json={"trigger": "QUOTE_SENT"}
        )
        assert response.status_code == 400, "Should fail without name"
        print(f"✓ Validation: Missing name returns 400")
        
        # Missing trigger
        response = self.session.post(
            f"{BASE_URL}/api/sequences/",
            json={"name": "TEST_No Trigger"}
        )
        assert response.status_code == 400, "Should fail without trigger"
        print(f"✓ Validation: Missing trigger returns 400")
    
    def test_update_custom_sequence(self):
        """PATCH /api/sequences/:id - Update sequence metadata"""
        # First create a sequence
        create_response = self.session.post(
            f"{BASE_URL}/api/sequences/",
            json={"name": "TEST_Update Sequence", "trigger": "CONTRACT_SENT"}
        )
        assert create_response.status_code == 201
        seq_id = create_response.json()['sequence']['id']
        
        # Update the sequence
        update_payload = {
            "name": "TEST_Updated Name",
            "description": "Updated description",
            "active": False
        }
        
        response = self.session.patch(
            f"{BASE_URL}/api/sequences/{seq_id}",
            json=update_payload
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        updated = response.json()['sequence']
        assert updated['name'] == update_payload['name'], "Name should be updated"
        assert updated['description'] == update_payload['description'], "Description should be updated"
        assert updated['active'] == False, "Active status should be updated"
        
        print(f"✓ Update custom sequence: {seq_id}")
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/sequences/{seq_id}")
        fetched = get_response.json()['sequence']
        assert fetched['name'] == update_payload['name'], "Updated name should persist"
        assert fetched['active'] == False, "Updated active status should persist"
        print(f"✓ Verified update persistence")
    
    def test_delete_custom_sequence(self):
        """DELETE /api/sequences/:id - Delete a sequence"""
        # First create a sequence
        create_response = self.session.post(
            f"{BASE_URL}/api/sequences/",
            json={"name": "TEST_Delete Sequence", "trigger": "PROJECT_CREATED"}
        )
        assert create_response.status_code == 201
        seq_id = create_response.json()['sequence']['id']
        
        # Delete the sequence
        response = self.session.delete(f"{BASE_URL}/api/sequences/{seq_id}")
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        data = response.json()
        assert 'message' in data, "Should return success message"
        print(f"✓ Delete custom sequence: {seq_id}")
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/sequences/{seq_id}")
        assert get_response.status_code == 404, "Deleted sequence should return 404"
        print(f"✓ Verified sequence deletion")


class TestSequenceStepsAPI:
    """Test sequence steps CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication and create a test sequence"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Create a test sequence for step tests
        create_response = self.session.post(
            f"{BASE_URL}/api/sequences/",
            json={"name": "TEST_Steps Sequence", "trigger": "QUOTE_SENT"}
        )
        assert create_response.status_code == 201
        self.sequence_id = create_response.json()['sequence']['id']
        print(f"✓ Created test sequence: {self.sequence_id}")
        
        yield
        
        # Cleanup
        try:
            self.session.delete(f"{BASE_URL}/api/sequences/{self.sequence_id}")
            print(f"  Cleaned up test sequence")
        except:
            pass
    
    def test_add_step_to_sequence(self):
        """POST /api/sequences/:id/steps - Add a step"""
        step_payload = {
            "subject": "Test Email Subject",
            "body": "Hello {clientName}, this is a test email.",
            "delayDays": 3,
            "order": 0
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/sequences/{self.sequence_id}/steps",
            json=step_payload
        )
        assert response.status_code == 201, f"Add step failed: {response.text}"
        
        data = response.json()
        assert 'step' in data, "Response should contain 'step' key"
        
        step = data['step']
        assert step['subject'] == step_payload['subject'], "Subject should match"
        assert step['body'] == step_payload['body'], "Body should match"
        assert step['delayDays'] == step_payload['delayDays'], "DelayDays should match"
        assert 'id' in step, "Step should have an ID"
        
        print(f"✓ Add step to sequence: Step ID={step['id']}")
        
        # Verify step appears in sequence
        get_response = self.session.get(f"{BASE_URL}/api/sequences/{self.sequence_id}")
        seq = get_response.json()['sequence']
        assert len(seq['steps']) >= 1, "Sequence should have at least 1 step"
        print(f"✓ Verified step in sequence")
        
        return step['id']
    
    def test_update_step(self):
        """PATCH /api/sequences/steps/:stepId - Update a step"""
        # First add a step
        add_response = self.session.post(
            f"{BASE_URL}/api/sequences/{self.sequence_id}/steps",
            json={"subject": "Original Subject", "body": "Original body", "delayDays": 1, "order": 0}
        )
        assert add_response.status_code == 201
        step_id = add_response.json()['step']['id']
        
        # Update the step
        update_payload = {
            "subject": "Updated Subject",
            "body": "Updated body content",
            "delayDays": 5
        }
        
        response = self.session.patch(
            f"{BASE_URL}/api/sequences/steps/{step_id}",
            json=update_payload
        )
        assert response.status_code == 200, f"Update step failed: {response.text}"
        
        updated = response.json()['step']
        assert updated['subject'] == update_payload['subject'], "Subject should be updated"
        assert updated['body'] == update_payload['body'], "Body should be updated"
        assert updated['delayDays'] == update_payload['delayDays'], "DelayDays should be updated"
        
        print(f"✓ Update step: {step_id}")
    
    def test_delete_step(self):
        """DELETE /api/sequences/steps/:stepId - Delete a step"""
        # First add a step
        add_response = self.session.post(
            f"{BASE_URL}/api/sequences/{self.sequence_id}/steps",
            json={"subject": "To Delete", "body": "Delete me", "delayDays": 1, "order": 0}
        )
        assert add_response.status_code == 201
        step_id = add_response.json()['step']['id']
        
        # Delete the step
        response = self.session.delete(f"{BASE_URL}/api/sequences/steps/{step_id}")
        assert response.status_code == 200, f"Delete step failed: {response.text}"
        
        print(f"✓ Delete step: {step_id}")
        
        # Verify step is removed from sequence
        get_response = self.session.get(f"{BASE_URL}/api/sequences/{self.sequence_id}")
        seq = get_response.json()['sequence']
        step_ids = [s['id'] for s in seq['steps']]
        assert step_id not in step_ids, "Deleted step should not be in sequence"
        print(f"✓ Verified step deletion")


class TestDashboardEndpoints:
    """Test dashboard-related endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        yield
    
    def test_dashboard_sequences(self):
        """GET /api/sequences/dashboard - Get built-in sequences"""
        response = self.session.get(f"{BASE_URL}/api/sequences/dashboard")
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        
        data = response.json()
        assert 'sequences' in data, "Response should contain 'sequences'"
        
        sequences = data['sequences']
        assert len(sequences) >= 2, "Should have at least 2 built-in sequences"
        
        # Check for expected built-in sequences
        seq_ids = [s['id'] for s in sequences]
        assert 'client-onboarding' in seq_ids, "Should have client-onboarding sequence"
        assert 'quote-followup' in seq_ids, "Should have quote-followup sequence"
        
        # Verify structure
        for seq in sequences:
            assert 'name' in seq, "Sequence should have name"
            assert 'type' in seq, "Sequence should have type"
            assert 'steps' in seq, "Sequence should have steps"
            assert 'stats' in seq, "Sequence should have stats"
        
        print(f"✓ Dashboard sequences: {len(sequences)} sequences")
    
    def test_dashboard_stats(self):
        """GET /api/sequences/dashboard/stats - Get stats"""
        response = self.session.get(f"{BASE_URL}/api/sequences/dashboard/stats")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        
        data = response.json()
        assert 'totalSequences' in data, "Should have totalSequences"
        assert 'activeSequences' in data, "Should have activeSequences"
        assert 'emailsSentThisWeek' in data, "Should have emailsSentThisWeek"
        assert 'totalEnrolled' in data, "Should have totalEnrolled"
        
        print(f"✓ Dashboard stats: {data}")
    
    def test_email_log(self):
        """GET /api/sequences/email-log - Get email send log"""
        response = self.session.get(f"{BASE_URL}/api/sequences/email-log?page=1")
        assert response.status_code == 200, f"Email log failed: {response.text}"
        
        data = response.json()
        assert 'logs' in data, "Should have logs"
        assert 'total' in data, "Should have total"
        assert 'page' in data, "Should have page"
        assert 'totalPages' in data, "Should have totalPages"
        
        print(f"✓ Email log: {data['total']} total emails, page {data['page']}/{data['totalPages']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
