"""
Test: P2 Feature 2 - Sequences Dashboard API Endpoints
Tests the new dashboard endpoints for viewing and managing email sequences.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com').rstrip('/')
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "Test123456!"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate and get JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Auth failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in auth response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


class TestSequencesDashboard:
    """Test GET /api/sequences/dashboard - List all sequences for dashboard"""
    
    def test_dashboard_returns_sequences(self, auth_headers):
        """Dashboard endpoint returns array of sequences"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "sequences" in data, "Response missing 'sequences' key"
        assert isinstance(data["sequences"], list), "sequences should be an array"
    
    def test_dashboard_has_two_builtin_sequences(self, auth_headers):
        """Dashboard returns exactly 2 built-in sequences"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        data = response.json()
        sequences = data["sequences"]
        assert len(sequences) == 2, f"Expected 2 sequences, got {len(sequences)}"
    
    def test_client_onboarding_sequence_structure(self, auth_headers):
        """Client onboarding sequence has correct structure"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        data = response.json()
        
        # Find client-onboarding sequence
        onboarding = next((s for s in data["sequences"] if s["id"] == "client-onboarding"), None)
        assert onboarding is not None, "client-onboarding sequence not found"
        
        # Check required fields
        assert onboarding["name"] == "Client Onboarding", f"Expected 'Client Onboarding', got {onboarding['name']}"
        assert onboarding["type"] == "built-in", "type should be 'built-in'"
        assert onboarding["trigger"] == "When contract is signed", f"Wrong trigger: {onboarding.get('trigger')}"
        assert onboarding["active"] == True, "Client onboarding should be active"
        
        # Check steps
        assert "steps" in onboarding, "Missing steps array"
        assert len(onboarding["steps"]) == 3, f"Expected 3 steps, got {len(onboarding['steps'])}"
        
        # Check stats
        assert "stats" in onboarding, "Missing stats object"
        stats = onboarding["stats"]
        assert "enrolled" in stats, "stats missing 'enrolled'"
        assert "completed" in stats, "stats missing 'completed'"
        assert "active" in stats, "stats missing 'active'"
    
    def test_quote_followup_sequence_structure(self, auth_headers):
        """Quote follow-up sequence has correct structure"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        data = response.json()
        
        # Find quote-followup sequence
        followup = next((s for s in data["sequences"] if s["id"] == "quote-followup"), None)
        assert followup is not None, "quote-followup sequence not found"
        
        # Check required fields
        assert followup["name"] == "Quote Follow-Up", f"Expected 'Quote Follow-Up', got {followup['name']}"
        assert followup["type"] == "built-in", "type should be 'built-in'"
        assert followup["trigger"] == "When quote is sent", f"Wrong trigger: {followup.get('trigger')}"
        assert followup["active"] == False, "Quote follow-up should be inactive (paused)"
        
        # Check steps
        assert len(followup["steps"]) == 3, f"Expected 3 steps, got {len(followup['steps'])}"
    
    def test_sequence_step_fields(self, auth_headers):
        """Each step has required fields"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        data = response.json()
        
        for seq in data["sequences"]:
            for step in seq["steps"]:
                assert "stepNumber" in step, f"Step missing 'stepNumber' in {seq['id']}"
                assert "name" in step, f"Step missing 'name' in {seq['id']}"
                assert "delay" in step, f"Step missing 'delay' in {seq['id']}"
                assert "subject" in step, f"Step missing 'subject' in {seq['id']}"
                assert "sentCount" in step, f"Step missing 'sentCount' in {seq['id']}"


class TestSequencesDashboardStats:
    """Test GET /api/sequences/dashboard/stats - Stats overview"""
    
    def test_stats_returns_required_fields(self, auth_headers):
        """Stats endpoint returns all 4 required metrics"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "totalSequences" in data, "Missing 'totalSequences'"
        assert "activeSequences" in data, "Missing 'activeSequences'"
        assert "emailsSentThisWeek" in data, "Missing 'emailsSentThisWeek'"
        assert "totalEnrolled" in data, "Missing 'totalEnrolled'"
    
    def test_stats_correct_sequence_counts(self, auth_headers):
        """Stats shows correct total and active sequence counts"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats", headers=auth_headers)
        data = response.json()
        
        assert data["totalSequences"] == 2, f"Expected 2 total sequences, got {data['totalSequences']}"
        assert data["activeSequences"] == 1, f"Expected 1 active sequence, got {data['activeSequences']}"
    
    def test_stats_values_are_numbers(self, auth_headers):
        """All stats values are numeric"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats", headers=auth_headers)
        data = response.json()
        
        assert isinstance(data["totalSequences"], int), "totalSequences should be int"
        assert isinstance(data["activeSequences"], int), "activeSequences should be int"
        assert isinstance(data["emailsSentThisWeek"], int), "emailsSentThisWeek should be int"
        assert isinstance(data["totalEnrolled"], int), "totalEnrolled should be int"


class TestSequenceToggle:
    """Test PATCH /api/sequences/dashboard/:id/toggle - Toggle active/inactive"""
    
    def test_toggle_client_onboarding_accepts_request(self, auth_headers):
        """Toggle endpoint accepts PATCH for client-onboarding"""
        response = requests.patch(
            f"{BASE_URL}/api/sequences/dashboard/client-onboarding/toggle",
            headers=auth_headers,
            json={"active": True}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success: true, got {data}"
    
    def test_toggle_with_false_value(self, auth_headers):
        """Toggle endpoint accepts active: false"""
        response = requests.patch(
            f"{BASE_URL}/api/sequences/dashboard/client-onboarding/toggle",
            headers=auth_headers,
            json={"active": False}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
    
    def test_toggle_invalid_sequence_returns_400(self, auth_headers):
        """Toggle endpoint returns 400 for invalid sequence ID"""
        response = requests.patch(
            f"{BASE_URL}/api/sequences/dashboard/invalid-sequence/toggle",
            headers=auth_headers,
            json={"active": True}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestSequenceEnrollments:
    """Test GET /api/sequences/:seqId/enrollments - View enrolled clients"""
    
    def test_client_onboarding_enrollments_returns_array(self, auth_headers):
        """Enrollments endpoint returns array for client-onboarding"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/client-onboarding/enrollments",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "enrollments" in data, "Response missing 'enrollments' key"
        assert isinstance(data["enrollments"], list), "enrollments should be an array"
    
    def test_quote_followup_enrollments_returns_empty(self, auth_headers):
        """Quote followup returns empty enrollments (not implemented)"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/quote-followup/enrollments",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["enrollments"] == [], "Quote followup should return empty enrollments"


class TestEmailPreview:
    """Test GET /api/sequences/:seqId/steps/:stepNumber/preview - Email preview"""
    
    def test_step_1_preview_welcome_email(self, auth_headers):
        """Step 1 returns welcome email preview"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/client-onboarding/steps/1/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "subject" in data, "Preview missing 'subject'"
        assert "html" in data, "Preview missing 'html'"
        assert "Welcome" in data["subject"], f"Subject should contain 'Welcome': {data['subject']}"
        assert len(data["html"]) > 100, "HTML content should be substantial"
    
    def test_step_2_preview_portal_guide(self, auth_headers):
        """Step 2 returns portal guide email preview"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/client-onboarding/steps/2/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "subject" in data, "Preview missing 'subject'"
        assert "html" in data, "Preview missing 'html'"
        assert "Portal" in data["subject"], f"Subject should contain 'Portal': {data['subject']}"
    
    def test_step_3_preview_update_reminder(self, auth_headers):
        """Step 3 returns update reminder email preview"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/client-onboarding/steps/3/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "subject" in data, "Preview missing 'subject'"
        assert "html" in data, "Preview missing 'html'"
        assert "Progress" in data["subject"], f"Subject should contain 'Progress': {data['subject']}"
    
    def test_invalid_step_returns_404(self, auth_headers):
        """Invalid step number returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/client-onboarding/steps/99/preview",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_invalid_sequence_preview_returns_404(self, auth_headers):
        """Preview for invalid sequence returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/invalid-seq/steps/1/preview",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestAuthRequired:
    """Test that all endpoints require authentication"""
    
    def test_dashboard_requires_auth(self):
        """Dashboard endpoint requires auth token"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_stats_requires_auth(self):
        """Stats endpoint requires auth token"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_toggle_requires_auth(self):
        """Toggle endpoint requires auth token"""
        response = requests.patch(
            f"{BASE_URL}/api/sequences/dashboard/client-onboarding/toggle",
            json={"active": True}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_enrollments_requires_auth(self):
        """Enrollments endpoint requires auth token"""
        response = requests.get(f"{BASE_URL}/api/sequences/client-onboarding/enrollments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_preview_requires_auth(self):
        """Preview endpoint requires auth token"""
        response = requests.get(f"{BASE_URL}/api/sequences/client-onboarding/steps/1/preview")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
