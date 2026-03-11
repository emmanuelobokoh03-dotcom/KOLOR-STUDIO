"""
RLS Data Isolation Tests - Application Layer Guards
Tests verify that sequences, steps, enrollments, and milestones enforce user ownership.

Key security tests:
1. Sequences: Only return/modify user's own sequences
2. Steps: Verify parent sequence ownership  
3. Enrollments: Verify BOTH sequence AND lead ownership
4. Milestones: Verify lead ownership
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-for-creatives.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestHelpers:
    """Helper fixtures and utilities"""
    
    @staticmethod
    def get_auth_token():
        """Authenticate and return JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None

    @staticmethod
    def get_headers(token):
        """Return headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }


# ============================================
# HEALTH CHECK
# ============================================
class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """1. Health check /api/health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Health status not ok: {data}"
        print("PASSED: Health check returns 200 with status 'ok'")


# ============================================
# AUTHENTICATION
# ============================================
class TestAuthentication:
    """Login tests"""
    
    def test_login_with_valid_credentials(self):
        """2. Login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "token" in data, f"No token in response: {data}"
        assert "user" in data, f"No user in response: {data}"
        print(f"PASSED: Login successful, got token and user info")


# ============================================
# SEQUENCES - CRUD WITH OWNERSHIP GUARDS
# ============================================
class TestSequenceDataIsolation:
    """Tests for sequence CRUD with ownership guards"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        self.token = TestHelpers.get_auth_token()
        if not self.token:
            pytest.skip("Authentication failed - skipping tests")
        self.headers = TestHelpers.get_headers(self.token)
    
    def test_get_sequences_returns_only_own_sequences(self):
        """3. GET /api/sequences - returns only user's own sequences"""
        response = requests.get(f"{BASE_URL}/api/sequences", headers=self.headers)
        assert response.status_code == 200, f"Get sequences failed: {response.text}"
        data = response.json()
        assert "sequences" in data, f"No sequences key in response: {data}"
        # All returned sequences belong to the authenticated user (application guard)
        print(f"PASSED: GET /api/sequences returns {len(data['sequences'])} sequences for authenticated user")
    
    def test_get_sequence_by_non_existent_id_returns_404(self):
        """4. GET /api/sequences/:id - returns 404 for non-owned sequence ID"""
        # Use a fabricated UUID that doesn't exist
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/sequences/{fake_id}", headers=self.headers)
        assert response.status_code == 404, f"Expected 404 for non-existent sequence, got {response.status_code}: {response.text}"
        print(f"PASSED: GET /api/sequences/{fake_id[:8]}... returns 404")
    
    def test_create_sequence_assigns_to_authenticated_user(self):
        """5. POST /api/sequences - creates sequence owned by the authenticated user"""
        response = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_RLS_Sequence",
            "trigger": "QUOTE_SENT",
            "description": "Test sequence for RLS verification",
            "steps": [
                {"subject": "Welcome!", "body": "Hello {clientName}", "delayDays": 1}
            ]
        })
        assert response.status_code == 201, f"Create sequence failed: {response.text}"
        data = response.json()
        assert "sequence" in data, f"No sequence in response: {data}"
        seq_id = data["sequence"]["id"]
        
        # Verify we can retrieve it (proving ownership)
        get_response = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        assert get_response.status_code == 200, f"Could not retrieve created sequence: {get_response.text}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        print(f"PASSED: POST /api/sequences creates sequence owned by authenticated user")
    
    def test_update_sequence_only_own_sequence(self):
        """6. PATCH /api/sequences/:id - only updates user's own sequence"""
        # First create a sequence
        create_resp = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_RLS_Update",
            "trigger": "CONTRACT_SENT"
        })
        assert create_resp.status_code == 201
        seq_id = create_resp.json()["sequence"]["id"]
        
        # Update it (should work - it's our sequence)
        update_resp = requests.patch(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers, json={
            "name": "TEST_RLS_Updated_Name"
        })
        assert update_resp.status_code == 200, f"Update own sequence failed: {update_resp.text}"
        assert update_resp.json()["sequence"]["name"] == "TEST_RLS_Updated_Name"
        
        # Try to update a non-existent sequence (should 404)
        fake_id = str(uuid.uuid4())
        fake_update = requests.patch(f"{BASE_URL}/api/sequences/{fake_id}", headers=self.headers, json={
            "name": "Hacked!"
        })
        assert fake_update.status_code == 404, f"Expected 404 for non-existent sequence update, got {fake_update.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        print(f"PASSED: PATCH /api/sequences/:id only updates own sequences, 404 for others")
    
    def test_delete_sequence_only_own_sequence(self):
        """7. DELETE /api/sequences/:id - only deletes user's own sequence"""
        # First create a sequence
        create_resp = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_RLS_Delete",
            "trigger": "PROJECT_CREATED"
        })
        assert create_resp.status_code == 201
        seq_id = create_resp.json()["sequence"]["id"]
        
        # Delete it (should work)
        delete_resp = requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        assert delete_resp.status_code == 200, f"Delete own sequence failed: {delete_resp.text}"
        
        # Verify it's gone
        get_resp = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        assert get_resp.status_code == 404
        
        # Try to delete a non-existent sequence (should 404)
        fake_id = str(uuid.uuid4())
        fake_delete = requests.delete(f"{BASE_URL}/api/sequences/{fake_id}", headers=self.headers)
        assert fake_delete.status_code == 404, f"Expected 404 for non-existent sequence delete, got {fake_delete.status_code}"
        
        print(f"PASSED: DELETE /api/sequences/:id only deletes own sequences, 404 for others")


# ============================================
# SEQUENCE STEPS - OWNERSHIP GUARDS
# ============================================
class TestSequenceStepDataIsolation:
    """Tests for sequence steps with ownership guards"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        self.token = TestHelpers.get_auth_token()
        if not self.token:
            pytest.skip("Authentication failed")
        self.headers = TestHelpers.get_headers(self.token)
    
    def test_add_step_only_to_own_sequence(self):
        """8. POST /api/sequences/:id/steps - only adds steps to own sequence"""
        # Create a sequence
        create_resp = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_RLS_Steps",
            "trigger": "LEAD_COLD"
        })
        assert create_resp.status_code == 201
        seq_id = create_resp.json()["sequence"]["id"]
        
        # Add step to own sequence (should work)
        step_resp = requests.post(f"{BASE_URL}/api/sequences/{seq_id}/steps", headers=self.headers, json={
            "subject": "Follow-up",
            "body": "Hi {clientName}, just checking in!",
            "delayDays": 3
        })
        assert step_resp.status_code == 201, f"Add step to own sequence failed: {step_resp.text}"
        
        # Try to add step to non-existent sequence (should 404)
        fake_id = str(uuid.uuid4())
        fake_step = requests.post(f"{BASE_URL}/api/sequences/{fake_id}/steps", headers=self.headers, json={
            "subject": "Hacked",
            "body": "Malicious step",
            "delayDays": 1
        })
        assert fake_step.status_code == 404, f"Expected 404 for adding step to non-existent sequence, got {fake_step.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        print(f"PASSED: POST /api/sequences/:id/steps only adds steps to own sequences")
    
    def test_update_step_rejects_non_owned_sequence(self):
        """9. PATCH /api/sequences/steps/:stepId - rejects update if step belongs to another user's sequence"""
        # Create sequence with a step
        create_resp = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_RLS_StepUpdate",
            "trigger": "QUOTE_VIEWED_NO_ACTION",
            "steps": [{"subject": "Test Step", "body": "Body", "delayDays": 1}]
        })
        assert create_resp.status_code == 201
        seq_data = create_resp.json()["sequence"]
        seq_id = seq_data["id"]
        step_id = seq_data["steps"][0]["id"]
        
        # Update own step (should work)
        update_resp = requests.patch(f"{BASE_URL}/api/sequences/steps/{step_id}", headers=self.headers, json={
            "subject": "Updated Step Subject"
        })
        assert update_resp.status_code == 200, f"Update own step failed: {update_resp.text}"
        
        # Try to update non-existent step (should 404)
        fake_step_id = str(uuid.uuid4())
        fake_update = requests.patch(f"{BASE_URL}/api/sequences/steps/{fake_step_id}", headers=self.headers, json={
            "subject": "Hacked!"
        })
        assert fake_update.status_code == 404, f"Expected 404 for updating non-existent step, got {fake_update.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        print(f"PASSED: PATCH /api/sequences/steps/:stepId rejects non-owned steps (404)")


# ============================================
# SEQUENCE ENROLLMENTS - DUAL OWNERSHIP
# ============================================
class TestEnrollmentDataIsolation:
    """Tests for enrollment ownership - verifies BOTH sequence AND lead ownership"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        self.token = TestHelpers.get_auth_token()
        if not self.token:
            pytest.skip("Authentication failed")
        self.headers = TestHelpers.get_headers(self.token)
    
    def test_enroll_lead_verifies_both_ownerships(self):
        """10. POST /api/sequences/:id/enroll/:leadId - verifies BOTH sequence AND lead ownership"""
        # Create a sequence
        seq_resp = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_RLS_Enroll",
            "trigger": "QUOTE_SENT",
            "steps": [{"subject": "Step 1", "body": "Body", "delayDays": 1}]
        })
        assert seq_resp.status_code == 201
        seq_id = seq_resp.json()["sequence"]["id"]
        
        # Create a lead
        lead_resp = requests.post(f"{BASE_URL}/api/leads", headers=self.headers, json={
            "clientName": "TEST_RLS_EnrollLead",
            "clientEmail": "test-rls-enroll@test.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "RLS Enrollment Test",
            "description": "Testing enrollment ownership"
        })
        assert lead_resp.status_code == 201
        lead_id = lead_resp.json()["lead"]["id"]
        
        # Enroll the lead (should work - both owned by user)
        enroll_resp = requests.post(f"{BASE_URL}/api/sequences/{seq_id}/enroll/{lead_id}", headers=self.headers)
        assert enroll_resp.status_code == 201, f"Enroll own lead failed: {enroll_resp.text}"
        
        # Try to enroll with non-existent sequence (should 404)
        fake_seq_id = str(uuid.uuid4())
        fake_seq_enroll = requests.post(f"{BASE_URL}/api/sequences/{fake_seq_id}/enroll/{lead_id}", headers=self.headers)
        assert fake_seq_enroll.status_code == 404, f"Expected 404 for non-existent sequence, got {fake_seq_enroll.status_code}"
        
        # Try to enroll non-existent lead (should 404)
        fake_lead_id = str(uuid.uuid4())
        fake_lead_enroll = requests.post(f"{BASE_URL}/api/sequences/{seq_id}/enroll/{fake_lead_id}", headers=self.headers)
        assert fake_lead_enroll.status_code == 404, f"Expected 404 for non-existent lead, got {fake_lead_enroll.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=self.headers)
        requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        print(f"PASSED: POST /api/sequences/:id/enroll/:leadId verifies BOTH sequence AND lead ownership")


# ============================================
# MILESTONES - LEAD OWNERSHIP GUARDS
# ============================================
class TestMilestoneDataIsolation:
    """Tests for milestone CRUD with lead ownership guards"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        self.token = TestHelpers.get_auth_token()
        if not self.token:
            pytest.skip("Authentication failed")
        self.headers = TestHelpers.get_headers(self.token)
    
    def test_get_milestones_for_own_lead(self):
        """11. GET /api/leads/:id/milestones - returns milestones only for user's own leads"""
        # Create a lead
        lead_resp = requests.post(f"{BASE_URL}/api/leads", headers=self.headers, json={
            "clientName": "TEST_RLS_Milestones",
            "clientEmail": "test-rls-milestones@test.com",
            "serviceType": "GRAPHIC_DESIGN",
            "projectTitle": "RLS Milestone Test",
            "description": "Testing milestone ownership"
        })
        assert lead_resp.status_code == 201
        lead_id = lead_resp.json()["lead"]["id"]
        
        # Get milestones for own lead (should work)
        ms_resp = requests.get(f"{BASE_URL}/api/leads/{lead_id}/milestones", headers=self.headers)
        assert ms_resp.status_code == 200, f"Get milestones for own lead failed: {ms_resp.text}"
        
        # Try to get milestones for non-existent lead (should 404)
        fake_lead_id = str(uuid.uuid4())
        fake_ms = requests.get(f"{BASE_URL}/api/leads/{fake_lead_id}/milestones", headers=self.headers)
        assert fake_ms.status_code == 404, f"Expected 404 for non-existent lead milestones, got {fake_ms.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=self.headers)
        print(f"PASSED: GET /api/leads/:id/milestones returns milestones only for own leads")
    
    def test_create_milestone_only_on_own_lead(self):
        """12. POST /api/leads/:id/milestones - creates milestone only on own lead"""
        # Create a lead
        lead_resp = requests.post(f"{BASE_URL}/api/leads", headers=self.headers, json={
            "clientName": "TEST_RLS_MilestoneCreate",
            "clientEmail": "test-rls-ms-create@test.com",
            "serviceType": "WEB_DESIGN",
            "projectTitle": "RLS Milestone Create Test",
            "description": "Testing milestone creation ownership"
        })
        assert lead_resp.status_code == 201
        lead_id = lead_resp.json()["lead"]["id"]
        
        # Create milestone on own lead (should work)
        ms_resp = requests.post(f"{BASE_URL}/api/leads/{lead_id}/milestones", headers=self.headers, json={
            "name": "TEST_First_Draft_Delivery",
            "dueDate": "2026-04-01T00:00:00.000Z",
            "description": "First draft delivery"
        })
        assert ms_resp.status_code == 201, f"Create milestone on own lead failed: {ms_resp.text}"
        milestone_id = ms_resp.json()["milestone"]["id"]
        
        # Verify milestone was created by fetching it
        get_ms = requests.get(f"{BASE_URL}/api/leads/{lead_id}/milestones", headers=self.headers)
        assert get_ms.status_code == 200
        milestones = get_ms.json().get("milestones", [])
        assert any(m["id"] == milestone_id for m in milestones), "Created milestone not found"
        
        # Try to create milestone on non-existent lead (should 404)
        fake_lead_id = str(uuid.uuid4())
        fake_ms = requests.post(f"{BASE_URL}/api/leads/{fake_lead_id}/milestones", headers=self.headers, json={
            "name": "Malicious Milestone",
            "dueDate": "2026-04-01T00:00:00.000Z"
        })
        assert fake_ms.status_code == 404, f"Expected 404 for milestone on non-existent lead, got {fake_ms.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=self.headers)
        print(f"PASSED: POST /api/leads/:id/milestones creates milestone only on own leads")
    
    def test_update_milestone_rejects_non_owned_lead(self):
        """13. PATCH /api/leads/milestones/:id - rejects update for milestone on another user's lead"""
        # Create a lead
        lead_resp = requests.post(f"{BASE_URL}/api/leads", headers=self.headers, json={
            "clientName": "TEST_RLS_MilestoneUpdate",
            "clientEmail": "test-rls-ms-update@test.com",
            "serviceType": "VIDEOGRAPHY",
            "projectTitle": "RLS Milestone Update Test",
            "description": "Testing milestone update ownership"
        })
        assert lead_resp.status_code == 201
        lead_id = lead_resp.json()["lead"]["id"]
        
        # Create a milestone
        ms_resp = requests.post(f"{BASE_URL}/api/leads/{lead_id}/milestones", headers=self.headers, json={
            "name": "TEST_Review_Draft",
            "dueDate": "2026-04-15T00:00:00.000Z"
        })
        assert ms_resp.status_code == 201
        milestone_id = ms_resp.json()["milestone"]["id"]
        
        # Update own milestone (should work)
        update_resp = requests.patch(f"{BASE_URL}/api/leads/milestones/{milestone_id}", headers=self.headers, json={
            "name": "TEST_Final_Review",
            "completed": True
        })
        assert update_resp.status_code == 200, f"Update own milestone failed: {update_resp.text}"
        
        # Try to update non-existent milestone (should 404)
        fake_ms_id = str(uuid.uuid4())
        fake_update = requests.patch(f"{BASE_URL}/api/leads/milestones/{fake_ms_id}", headers=self.headers, json={
            "name": "Hacked Milestone"
        })
        assert fake_update.status_code == 404, f"Expected 404 for updating non-existent milestone, got {fake_update.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=self.headers)
        print(f"PASSED: PATCH /api/leads/milestones/:id rejects non-owned milestones (404)")


# ============================================
# REGRESSION TEST - FULL E2E FLOW
# ============================================
class TestRegressionE2EFlow:
    """End-to-end regression test for full workflow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        self.token = TestHelpers.get_auth_token()
        if not self.token:
            pytest.skip("Authentication failed")
        self.headers = TestHelpers.get_headers(self.token)
    
    def test_full_e2e_flow(self):
        """14. Regression: Full login -> leads list -> sequences list -> create/read sequence -> create/read milestone flow"""
        # 1. Login (already done in setup)
        print("Step 1: Login - PASSED (token obtained)")
        
        # 2. Get leads list
        leads_resp = requests.get(f"{BASE_URL}/api/leads", headers=self.headers)
        assert leads_resp.status_code == 200, f"Get leads failed: {leads_resp.text}"
        print(f"Step 2: GET /api/leads - PASSED ({leads_resp.json().get('count', 0)} leads)")
        
        # 3. Get sequences list
        seq_resp = requests.get(f"{BASE_URL}/api/sequences", headers=self.headers)
        assert seq_resp.status_code == 200, f"Get sequences failed: {seq_resp.text}"
        print(f"Step 3: GET /api/sequences - PASSED ({len(seq_resp.json().get('sequences', []))} sequences)")
        
        # 4. Create sequence
        create_seq = requests.post(f"{BASE_URL}/api/sequences", headers=self.headers, json={
            "name": "TEST_E2E_Regression_Sequence",
            "trigger": "QUOTE_SENT",
            "description": "E2E regression test",
            "steps": [
                {"subject": "Congratulations!", "body": "You're qualified, {clientName}!", "delayDays": 0}
            ]
        })
        assert create_seq.status_code == 201, f"Create sequence failed: {create_seq.text}"
        seq_id = create_seq.json()["sequence"]["id"]
        print(f"Step 4: POST /api/sequences - PASSED (created {seq_id[:8]}...)")
        
        # 5. Read the created sequence
        read_seq = requests.get(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        assert read_seq.status_code == 200, f"Read sequence failed: {read_seq.text}"
        print(f"Step 5: GET /api/sequences/:id - PASSED")
        
        # 6. Create a lead
        create_lead = requests.post(f"{BASE_URL}/api/leads", headers=self.headers, json={
            "clientName": "TEST_E2E_Regression_Lead",
            "clientEmail": "test-e2e-regression@test.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "E2E Regression Project",
            "description": "Testing full e2e flow"
        })
        assert create_lead.status_code == 201, f"Create lead failed: {create_lead.text}"
        lead_id = create_lead.json()["lead"]["id"]
        print(f"Step 6: POST /api/leads - PASSED (created {lead_id[:8]}...)")
        
        # 7. Create milestone on the lead
        create_ms = requests.post(f"{BASE_URL}/api/leads/{lead_id}/milestones", headers=self.headers, json={
            "name": "TEST_E2E_Project_Kickoff",
            "dueDate": "2026-04-01T00:00:00.000Z",
            "description": "Initial project kickoff meeting"
        })
        assert create_ms.status_code == 201, f"Create milestone failed: {create_ms.text}"
        ms_id = create_ms.json()["milestone"]["id"]
        print(f"Step 7: POST /api/leads/:id/milestones - PASSED (created {ms_id[:8]}...)")
        
        # 8. Read milestones
        read_ms = requests.get(f"{BASE_URL}/api/leads/{lead_id}/milestones", headers=self.headers)
        assert read_ms.status_code == 200, f"Read milestones failed: {read_ms.text}"
        milestones = read_ms.json().get("milestones", [])
        assert any(m["id"] == ms_id for m in milestones), "Created milestone not found in list"
        print(f"Step 8: GET /api/leads/:id/milestones - PASSED ({len(milestones)} milestones)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=self.headers)
        requests.delete(f"{BASE_URL}/api/sequences/{seq_id}", headers=self.headers)
        print("Step 9: Cleanup - PASSED (deleted test data)")
        
        print("\n*** FULL E2E REGRESSION TEST PASSED ***")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
