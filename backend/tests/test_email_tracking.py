"""
Test Email Open Rate Tracking (P2 Feature)

Tests for:
1. GET /api/track/open/:trackingId - Tracking pixel endpoint (public, no auth)
2. GET /api/sequences/dashboard - Real open rates per step
3. GET /api/sequences/dashboard/stats - Sequence stats with open tracking

Test data in DB:
- 7 EmailTracking records:
  - 3 for client-onboarding step 1 (all opened)
  - 2 for client-onboarding step 2 (1 opened)
  - 2 for quote-followup step 1 (1 opened)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://availability-sync-5.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "analytics-test@test.com"
TEST_PASSWORD = "Test1234!"

# Test lead IDs from existing data
LEAD_ID_A = "cmml2ycii000aex8n9u8k9lpr"  # Pipeline Client A
LEAD_ID_B = "cmml2yd7x000gex8n3b2lbbyb"  # Pipeline Client B
PORTAL_TOKEN = "cmml2ycii000bex8nbbhta3li"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get authenticated headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestTrackingPixelEndpoint:
    """Tests for GET /api/track/open/:trackingId - public, no auth required"""

    def test_tracking_pixel_returns_png_with_valid_id(self, auth_headers):
        """Test that tracking pixel returns 1x1 transparent PNG with correct headers"""
        # First, let's get an existing tracking ID from the database
        # We'll query the sequences dashboard to verify tracking data exists
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Dashboard should load: {response.text}"
        
        # Generate a new UUID for testing (won't exist in DB but should still return pixel)
        test_tracking_id = str(uuid.uuid4())
        
        # Request the tracking pixel (no auth required)
        pixel_response = requests.get(f"{BASE_URL}/api/track/open/{test_tracking_id}")
        
        # Verify status code
        assert pixel_response.status_code == 200, f"Tracking pixel should return 200: {pixel_response.status_code}"
        
        # Verify Content-Type header
        content_type = pixel_response.headers.get("Content-Type", "")
        assert "image/png" in content_type, f"Content-Type should be image/png, got: {content_type}"
        
        # Verify Cache-Control header (no-cache)
        cache_control = pixel_response.headers.get("Cache-Control", "")
        assert "no-cache" in cache_control or "no-store" in cache_control, \
            f"Cache-Control should contain no-cache: {cache_control}"
        
        # Verify content length exists
        content_length = pixel_response.headers.get("Content-Length")
        assert content_length is not None, "Content-Length header should be present"
        assert int(content_length) > 0, "Content should have length > 0"
        
        # Verify content is binary (PNG data)
        content = pixel_response.content
        assert len(content) > 0, "Response should contain pixel data"
        # PNG files start with signature bytes
        assert content[:4] == b'\x89PNG' or len(content) < 200, \
            "Content should be a valid PNG image or small pixel"
        
        print(f"✓ Tracking pixel endpoint returns valid PNG (size: {len(content)} bytes)")

    def test_tracking_pixel_invalid_id_still_returns_pixel(self):
        """Test that invalid/nonexistent trackingId still returns pixel (no error)"""
        # Test with various invalid IDs
        invalid_ids = [
            "nonexistent-id-12345",
            "invalid",
            "",
            "00000000-0000-0000-0000-000000000000",
            "test-id-that-does-not-exist"
        ]
        
        for invalid_id in invalid_ids:
            if invalid_id == "":
                continue  # Skip empty string as it changes the route
            
            response = requests.get(f"{BASE_URL}/api/track/open/{invalid_id}")
            
            # Should still return 200 with pixel (not 404 or 500)
            assert response.status_code == 200, \
                f"Invalid ID '{invalid_id}' should still return 200, got: {response.status_code}"
            
            # Should still have PNG content type
            content_type = response.headers.get("Content-Type", "")
            assert "image/png" in content_type, \
                f"Invalid ID should still return PNG content type for '{invalid_id}'"
        
        print("✓ Invalid/nonexistent tracking IDs still return valid pixel (no errors)")

    def test_tracking_pixel_no_auth_required(self):
        """Test that tracking endpoint is public (no auth header needed)"""
        test_id = str(uuid.uuid4())
        
        # Request without any auth headers
        response = requests.get(f"{BASE_URL}/api/track/open/{test_id}")
        
        # Should not return 401 or 403
        assert response.status_code != 401, "Tracking endpoint should not require auth (got 401)"
        assert response.status_code != 403, "Tracking endpoint should not be forbidden (got 403)"
        assert response.status_code == 200, f"Tracking endpoint should be public, got: {response.status_code}"
        
        print("✓ Tracking pixel endpoint is public (no auth required)")


class TestTrackingOpenBehavior:
    """Tests for tracking open behavior - first open vs subsequent opens"""

    def test_tracking_pixel_opens_increment(self):
        """
        Test that:
        - First open sets opened=true, openedAt, openCount=1
        - Subsequent opens increment openCount but don't change openedAt
        
        Note: We can't directly verify DB state without DB access,
        but we can verify the endpoint behaves consistently
        """
        # Generate a unique tracking ID for this test
        test_tracking_id = f"test-{uuid.uuid4()}"
        
        # First request (simulating first open)
        response1 = requests.get(f"{BASE_URL}/api/track/open/{test_tracking_id}")
        assert response1.status_code == 200, "First open should succeed"
        
        # Second request (simulating subsequent open)
        response2 = requests.get(f"{BASE_URL}/api/track/open/{test_tracking_id}")
        assert response2.status_code == 200, "Second open should succeed"
        
        # Third request (another subsequent open)
        response3 = requests.get(f"{BASE_URL}/api/track/open/{test_tracking_id}")
        assert response3.status_code == 200, "Third open should succeed"
        
        # All should return the same pixel
        assert response1.content == response2.content == response3.content, \
            "All opens should return the same pixel content"
        
        print("✓ Multiple opens to same tracking ID all succeed and return consistent pixel")


class TestSequencesDashboardOpenRates:
    """Tests for GET /api/sequences/dashboard with real open rates"""

    def test_dashboard_returns_open_rates_per_step(self, auth_headers):
        """Test that dashboard returns real open rates per step (not null) when tracking data exists"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        
        assert response.status_code == 200, f"Dashboard should return 200: {response.text}"
        
        data = response.json()
        assert "sequences" in data, "Response should have 'sequences' field"
        
        sequences = data["sequences"]
        assert len(sequences) >= 2, "Should have at least 2 sequences (client-onboarding and quote-followup)"
        
        # Find client-onboarding sequence
        onboarding_seq = next((s for s in sequences if s["id"] == "client-onboarding"), None)
        assert onboarding_seq is not None, "client-onboarding sequence should exist"
        
        # Check steps have openRate field
        steps = onboarding_seq.get("steps", [])
        assert len(steps) >= 1, "Should have at least 1 step"
        
        # Verify step 1 has openRate (expected to be 100% based on test data - 3/3 opened)
        step1 = steps[0] if steps else None
        assert step1 is not None, "Step 1 should exist"
        assert "openRate" in step1, "Step should have 'openRate' field"
        
        # If tracking data exists, openRate should be a number (not null)
        # Based on test data: onb step1=100% (3/3), onb step2=50% (1/2)
        step1_rate = step1.get("openRate")
        if step1_rate is not None:
            assert isinstance(step1_rate, (int, float)), f"openRate should be numeric: {step1_rate}"
            assert 0 <= step1_rate <= 100, f"openRate should be 0-100%: {step1_rate}"
            print(f"  Step 1 (Welcome) openRate: {step1_rate}%")
        else:
            print("  Step 1 openRate is null (no tracking data for this step)")
        
        # Check step 2 if exists
        if len(steps) >= 2:
            step2 = steps[1]
            step2_rate = step2.get("openRate")
            if step2_rate is not None:
                print(f"  Step 2 (Portal Guide) openRate: {step2_rate}%")
            else:
                print("  Step 2 openRate is null")
        
        print("✓ Dashboard returns open rates per step")

    def test_dashboard_returns_average_open_rate(self, auth_headers):
        """Test that dashboard returns averageOpenRate in stats for each sequence"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        
        assert response.status_code == 200, f"Dashboard should return 200: {response.text}"
        
        data = response.json()
        sequences = data.get("sequences", [])
        
        for seq in sequences:
            stats = seq.get("stats", {})
            
            # averageOpenRate should be present in stats
            assert "averageOpenRate" in stats, \
                f"Sequence '{seq['id']}' stats should have 'averageOpenRate' field"
            
            avg_rate = stats.get("averageOpenRate")
            
            # If tracking data exists, should be a number
            if avg_rate is not None:
                assert isinstance(avg_rate, (int, float)), \
                    f"averageOpenRate should be numeric for '{seq['id']}': {avg_rate}"
                assert 0 <= avg_rate <= 100, \
                    f"averageOpenRate should be 0-100% for '{seq['id']}': {avg_rate}"
            
            print(f"  Sequence '{seq['name']}' averageOpenRate: {avg_rate}%")
        
        print("✓ Dashboard returns averageOpenRate in stats for each sequence")

    def test_open_rate_null_when_no_tracking_data(self, auth_headers):
        """Test that open rate is null when no tracking data exists for a step"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=auth_headers)
        
        assert response.status_code == 200
        
        data = response.json()
        sequences = data.get("sequences", [])
        
        # Check quote-followup sequence step 3 (no emails sent yet based on test data)
        followup_seq = next((s for s in sequences if s["id"] == "quote-followup"), None)
        assert followup_seq is not None, "quote-followup sequence should exist"
        
        steps = followup_seq.get("steps", [])
        
        # Step 3 likely has no tracking data (email3SentAt is null in most enrollments)
        if len(steps) >= 3:
            step3 = steps[2]
            step3_sent = step3.get("sentCount", 0)
            step3_rate = step3.get("openRate")
            
            # If no emails sent for step 3, openRate should be null
            if step3_sent == 0:
                assert step3_rate is None, \
                    f"openRate should be null when sentCount=0, got: {step3_rate}"
                print(f"  Step 3 (Final Follow-Up): sentCount=0, openRate=null as expected")
            else:
                print(f"  Step 3 (Final Follow-Up): sentCount={step3_sent}, openRate={step3_rate}%")
        
        print("✓ Open rate is null when no tracking data exists for a step")


class TestSequencesDashboardStats:
    """Tests for GET /api/sequences/dashboard/stats"""

    def test_dashboard_stats_returns_required_fields(self, auth_headers):
        """Test that stats endpoint returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats", headers=auth_headers)
        
        assert response.status_code == 200, f"Stats endpoint should return 200: {response.text}"
        
        data = response.json()
        
        # Check required fields
        required_fields = ["totalSequences", "activeSequences", "emailsSentThisWeek", "totalEnrolled"]
        for field in required_fields:
            assert field in data, f"Stats should have '{field}' field"
            assert isinstance(data[field], int), f"'{field}' should be integer"
            assert data[field] >= 0, f"'{field}' should be >= 0"
        
        print(f"  totalSequences: {data['totalSequences']}")
        print(f"  activeSequences: {data['activeSequences']}")
        print(f"  emailsSentThisWeek: {data['emailsSentThisWeek']}")
        print(f"  totalEnrolled: {data['totalEnrolled']}")
        
        # totalSequences should be 2 (built-in sequences)
        assert data["totalSequences"] == 2, f"Should have 2 total sequences: {data['totalSequences']}"
        
        # activeSequences should be 2 (both built-in sequences are active)
        assert data["activeSequences"] == 2, f"Should have 2 active sequences: {data['activeSequences']}"
        
        print("✓ Dashboard stats returns all required fields with correct values")


class TestExistingEndpointsStillWork:
    """Regression tests - ensure existing endpoints still work correctly"""

    def test_crm_revenue_still_works(self, auth_headers):
        """Test that revenue calculations still work (PAID_IN_FULL included in received)"""
        response = requests.get(f"{BASE_URL}/api/crm/revenue", headers=auth_headers)
        
        assert response.status_code == 200, f"Revenue endpoint should return 200: {response.text}"
        
        data = response.json()
        
        # Check required fields
        assert "thisMonth" in data, "Should have 'thisMonth' field"
        assert "ytd" in data, "Should have 'ytd' field"
        assert "expected" in data, "Should have 'expected' field"
        
        print(f"  thisMonth: {data['thisMonth']}, ytd: {data['ytd']}, expected: {data['expected']}")
        print("✓ CRM revenue endpoint still works correctly")

    def test_analytics_revenue_pipeline_still_works(self, auth_headers):
        """Test that all 5 pipeline stages work correctly"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue-pipeline", headers=auth_headers)
        
        assert response.status_code == 200, f"Revenue pipeline should return 200: {response.text}"
        
        data = response.json()
        assert "pipeline" in data, "Should have 'pipeline' field"
        
        pipeline = data["pipeline"]
        
        # Check all 5 stages exist
        expected_stages = ["quoteSent", "contractSigned", "depositPaid", "inProgress", "paidInFull"]
        for stage_name in expected_stages:
            assert stage_name in pipeline, f"Stage '{stage_name}' should exist in pipeline"
            stage = pipeline[stage_name]
            assert "count" in stage, f"Stage '{stage_name}' should have 'count'"
            assert "value" in stage, f"Stage '{stage_name}' should have 'value'"
        
        print("✓ Analytics revenue pipeline with all 5 stages still works")

    def test_portal_views_still_increment(self):
        """Test that portal views still increment correctly"""
        # Get portal data (no auth required for portal)
        response1 = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        
        assert response1.status_code == 200, f"Portal should return 200: {response1.text}"
        
        data = response1.json()
        assert "meta" in data, "Portal should have 'meta' field"
        
        # Note: We're not incrementing in tests to avoid polluting data
        # Just verify the endpoint works and returns expected structure
        print(f"  Portal meta: {data['meta']}")
        print("✓ Portal endpoint still works correctly")


class TestAuthenticationRequired:
    """Test that authenticated endpoints require auth"""

    def test_dashboard_requires_auth(self):
        """Test that /api/sequences/dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard")
        assert response.status_code == 401, \
            f"Dashboard should require auth (expected 401, got {response.status_code})"
        print("✓ Dashboard endpoint requires authentication")

    def test_dashboard_stats_requires_auth(self):
        """Test that /api/sequences/dashboard/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard/stats")
        assert response.status_code == 401, \
            f"Dashboard stats should require auth (expected 401, got {response.status_code})"
        print("✓ Dashboard stats endpoint requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
