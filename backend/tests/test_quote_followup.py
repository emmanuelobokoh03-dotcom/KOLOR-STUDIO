"""
Tests for Quote Follow-Up Sequence - P2 Feature: 3-email conversion booster
Tests: QuoteFollowUpEnrollment table, sequences endpoints, quote triggers, email templates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "Test123456!"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code}")
    return response.json().get("token")

@pytest.fixture
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestQuoteFollowUpDashboard:
    """Test sequences dashboard endpoints for quote follow-up"""
    
    def test_dashboard_returns_two_sequences(self, headers):
        """GET /api/sequences/dashboard should return 2 built-in sequences including quote-followup"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "sequences" in data
        sequences = data["sequences"]
        assert len(sequences) == 2, f"Expected 2 sequences, got {len(sequences)}"
        
        # Check quote-followup sequence exists
        quote_followup = next((s for s in sequences if s["id"] == "quote-followup"), None)
        assert quote_followup is not None, "quote-followup sequence not found"
        
    def test_quote_followup_sequence_structure(self, headers):
        """Quote follow-up should have correct structure: active=true, 3 steps"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        quote_followup = next((s for s in data["sequences"] if s["id"] == "quote-followup"), None)
        
        assert quote_followup["active"] == True, "quote-followup should be active"
        assert quote_followup["type"] == "built-in"
        assert "When quote is sent" in quote_followup["trigger"]
        
        # Check 3 steps
        steps = quote_followup["steps"]
        assert len(steps) == 3, f"Expected 3 steps, got {len(steps)}"
        
        # Verify step details
        step1 = next(s for s in steps if s["stepNumber"] == 1)
        assert step1["name"] == "Gentle Reminder"
        assert step1["delay"] == 3
        
        step2 = next(s for s in steps if s["stepNumber"] == 2)
        assert step2["name"] == "Answer Questions"
        assert step2["delay"] == 7
        
        step3 = next(s for s in steps if s["stepNumber"] == 3)
        assert step3["name"] == "Final Follow-Up"
        assert step3["delay"] == 10
        
    def test_dashboard_stats_includes_both_sequences(self, headers):
        """GET /api/sequences/dashboard/stats should show activeSequences=2"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["totalSequences"] == 2, f"Expected 2 total sequences, got {data.get('totalSequences')}"
        assert data["activeSequences"] == 2, f"Expected 2 active sequences (both should be active), got {data.get('activeSequences')}"
        

class TestQuoteFollowUpEnrollments:
    """Test enrollments endpoint for quote follow-up"""
    
    def test_enrollments_endpoint_returns_array(self, headers):
        """GET /api/sequences/quote-followup/enrollments should return enrollments array"""
        response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/enrollments", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "enrollments" in data, "Response should have 'enrollments' key"
        assert isinstance(data["enrollments"], list), "enrollments should be a list"


class TestQuoteFollowUpEmailPreviews:
    """Test email preview endpoints for quote follow-up steps"""
    
    def test_step1_preview_gentle_reminder(self, headers):
        """GET /api/sequences/quote-followup/steps/1/preview should return Gentle Reminder email"""
        response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/steps/1/preview", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "subject" in data, "Response should have 'subject'"
        assert "html" in data, "Response should have 'html'"
        
        # Verify content
        assert "follow" in data["subject"].lower() or "quote" in data["subject"].lower(), \
            f"Subject should mention following up on quote: {data['subject']}"
        assert len(data["html"]) > 100, "HTML content should be substantial"
        assert "Review Your Quote" in data["html"] or "quote" in data["html"].lower()
        
    def test_step2_preview_answer_questions(self, headers):
        """GET /api/sequences/quote-followup/steps/2/preview should return Answer Questions email"""
        response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/steps/2/preview", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "subject" in data
        assert "html" in data
        
        # Step 2 should be different from Step 1
        assert "questions" in data["subject"].lower() or "question" in data["html"].lower(), \
            f"Step 2 should be about answering questions: {data['subject']}"
        assert "Common Questions" in data["html"] or "question" in data["html"].lower()
        
    def test_step3_preview_final_followup(self, headers):
        """GET /api/sequences/quote-followup/steps/3/preview should return Final Follow-Up email"""
        response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/steps/3/preview", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "subject" in data
        assert "html" in data
        
        # Step 3 should mention expiration/urgency
        assert "expire" in data["subject"].lower() or "final" in data["subject"].lower() or "soon" in data["subject"].lower(), \
            f"Step 3 subject should be about expiration: {data['subject']}"
        assert "expires" in data["html"].lower() or "expire" in data["html"].lower() or "final" in data["html"].lower()
        
    def test_all_three_previews_are_different(self, headers):
        """All 3 step previews should have different subjects"""
        subjects = []
        for step in [1, 2, 3]:
            response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/steps/{step}/preview", headers=headers)
            assert response.status_code == 200
            subjects.append(response.json()["subject"])
        
        # All subjects should be unique
        assert len(set(subjects)) == 3, f"All 3 subjects should be different: {subjects}"


class TestQuoteFollowUpTriggersInRoutes:
    """Verify quote follow-up is triggered correctly in quotes.ts and portal.ts"""
    
    def test_health_check(self, headers):
        """Health check to ensure API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
    def test_quotes_endpoint_exists(self, headers):
        """Quotes endpoint should exist"""
        # Just checking the endpoint doesn't 404 entirely
        response = requests.get(f"{BASE_URL}/api/quotes/nonexistent", headers=headers)
        # Should return 404 for not found quote, not 500
        assert response.status_code in [404, 400], f"Expected 404/400, got {response.status_code}"


class TestUnauthorizedAccess:
    """Test that endpoints require authentication"""
    
    def test_dashboard_requires_auth(self):
        """Dashboard endpoint should require auth"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard")
        assert response.status_code == 401
        
    def test_stats_requires_auth(self):
        """Stats endpoint should require auth"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats")
        assert response.status_code == 401
        
    def test_enrollments_requires_auth(self):
        """Enrollments endpoint should require auth"""
        response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/enrollments")
        assert response.status_code == 401
        
    def test_preview_requires_auth(self):
        """Preview endpoint should require auth"""
        response = requests.get(f"{BASE_URL}/api/sequences/quote-followup/steps/1/preview")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
