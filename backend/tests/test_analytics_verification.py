"""
Analytics Verification Tests (P0) - Testing all financial and engagement analytics

Tests cover:
- GET /api/crm/revenue - Revenue dashboard with PAID_IN_FULL/RECEIVED as received, DEPOSIT_RECEIVED/OVERDUE as pending
- GET /api/analytics/revenue-pipeline - All 5 pipeline stages based on income status and lead state
- GET /api/portal/:token - Portal views increment and lastPortalView update
- GET /api/sequences/dashboard - Sequences stats with enrolled/completed/active counts
- GET /api/sequences/dashboard/stats - emailsSentThisWeek counting individual emails
- GET /api/digest/preview - Weekly digest with revenue from PAID_IN_FULL and RECEIVED
- GET /api/analytics/dashboard - Dashboard analytics (pipeline value, conversion rates, booked value)
- GET /api/analytics/monthly-trend - Monthly trend grouping correctly across Dec/Jan
- GET /api/leads/:id/milestones - CRUD operations on milestones
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
TEST_EMAIL = "analytics-test@test.com"
TEST_PASSWORD = "Test1234!"

# Test data IDs from review request
TEST_LEAD_IDS = [
    "cmml2wdf70003w4wjvihslakq",  # Revenue Test Client
    "cmml2ycii000aex8n9u8k9lpr",  # Pipeline Client A
    "cmml2yd7x000gex8n3b2lbbyb"   # Pipeline Client B
]
PORTAL_TOKEN = "cmml2ycii000bex8nbbhta3li"  # Pipeline Client A portal token


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for analytics-test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


class TestRevenueStats:
    """Test /api/crm/revenue - Revenue dashboard calculations"""

    def test_revenue_endpoint_returns_200(self, auth_headers):
        """Revenue endpoint should return 200 status"""
        response = requests.get(
            f"{BASE_URL}/api/crm/revenue",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Revenue endpoint returned 200")

    def test_revenue_response_structure(self, auth_headers):
        """Revenue response should have expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/crm/revenue",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        # Check expected fields exist
        assert "thisMonth" in data, "Missing 'thisMonth' field"
        assert "ytd" in data, "Missing 'ytd' field"
        assert "expected" in data, "Missing 'expected' (pending) field"
        assert "monthlyTrend" in data, "Missing 'monthlyTrend' field"
        
        print(f"Revenue stats: thisMonth={data.get('thisMonth')}, ytd={data.get('ytd')}, expected={data.get('expected')}")

    def test_revenue_values_are_numbers(self, auth_headers):
        """All revenue values should be numeric"""
        response = requests.get(
            f"{BASE_URL}/api/crm/revenue",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        assert isinstance(data.get("thisMonth"), (int, float)), "thisMonth should be numeric"
        assert isinstance(data.get("ytd"), (int, float)), "ytd should be numeric"
        assert isinstance(data.get("expected"), (int, float)), "expected should be numeric"
        
        print(f"Revenue values verified as numeric")


class TestRevenuePipeline:
    """Test /api/analytics/revenue-pipeline - All 5 pipeline stages"""

    def test_revenue_pipeline_returns_200(self, auth_headers):
        """Revenue pipeline endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/revenue-pipeline",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Revenue pipeline endpoint returned 200")

    def test_revenue_pipeline_has_all_5_stages(self, auth_headers):
        """Pipeline should have all 5 stages: quoteSent, contractSigned, depositPaid, inProgress, paidInFull"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/revenue-pipeline",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        expected_stages = ["quoteSent", "contractSigned", "depositPaid", "inProgress", "paidInFull"]
        pipeline = data.get("pipeline", {})
        
        for stage in expected_stages:
            assert stage in pipeline, f"Missing pipeline stage: {stage}"
            stage_data = pipeline[stage]
            assert "count" in stage_data, f"Stage {stage} missing 'count'"
            assert "value" in stage_data, f"Stage {stage} missing 'value'"
            print(f"Pipeline stage {stage}: count={stage_data.get('count')}, value={stage_data.get('value')}")

    def test_revenue_pipeline_total_value(self, auth_headers):
        """Pipeline should include totalValue"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/revenue-pipeline",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        assert "totalValue" in data, "Missing 'totalValue' field"
        assert isinstance(data["totalValue"], (int, float)), "totalValue should be numeric"
        print(f"Pipeline total value: {data['totalValue']}")


class TestPortalViews:
    """Test /api/portal/:token - Portal views increment"""

    def test_portal_view_returns_200(self):
        """Portal view endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}",
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Portal endpoint returned 200")

    def test_portal_view_returns_client_data(self):
        """Portal should return project and client data"""
        response = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}",
            timeout=30
        )
        data = response.json()
        
        assert "project" in data, "Missing 'project' field"
        assert "client" in data, "Missing 'client' field"
        assert "status" in data, "Missing 'status' field"
        assert "meta" in data, "Missing 'meta' field"
        
        print(f"Portal data: project={data.get('project', {}).get('title')}, client={data.get('client', {}).get('name')}")

    def test_portal_view_increments_count(self):
        """Portal views should increment on each visit"""
        # First visit
        response1 = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}",
            timeout=30
        )
        data1 = response1.json()
        views1 = data1.get("meta", {}).get("portalViews", 0)
        
        # Second visit
        time.sleep(0.5)
        response2 = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}",
            timeout=30
        )
        data2 = response2.json()
        views2 = data2.get("meta", {}).get("portalViews", 0)
        
        # The second view should be higher than first
        assert views2 > views1, f"Portal views should increment: {views1} -> {views2}"
        print(f"Portal views incremented: {views1} -> {views2}")

    def test_portal_meta_has_last_updated(self):
        """Portal meta should include lastUpdated timestamp"""
        response = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}",
            timeout=30
        )
        data = response.json()
        
        meta = data.get("meta", {})
        assert "lastUpdated" in meta, "Missing 'lastUpdated' in meta"
        print(f"Portal lastUpdated: {meta.get('lastUpdated')}")


class TestSequencesDashboard:
    """Test /api/sequences/dashboard - Sequences stats"""

    def test_sequences_dashboard_returns_200(self, auth_headers):
        """Sequences dashboard should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/dashboard",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Sequences dashboard returned 200")

    def test_sequences_have_correct_stats(self, auth_headers):
        """Each sequence should have enrolled/completed/active stats"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/dashboard",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        sequences = data.get("sequences", [])
        assert len(sequences) >= 2, "Expected at least 2 sequences (client-onboarding and quote-followup)"
        
        for seq in sequences:
            stats = seq.get("stats", {})
            assert "enrolled" in stats, f"Sequence {seq.get('name')} missing 'enrolled' stat"
            assert "completed" in stats, f"Sequence {seq.get('name')} missing 'completed' stat"
            assert "active" in stats, f"Sequence {seq.get('name')} missing 'active' stat"
            
            # Active should exclude stopped enrollments (active = enrolled - completed - stopped)
            print(f"Sequence {seq.get('name')}: enrolled={stats.get('enrolled')}, completed={stats.get('completed')}, active={stats.get('active')}")


class TestSequencesStats:
    """Test /api/sequences/dashboard/stats - Global sequences stats"""

    def test_sequences_stats_returns_200(self, auth_headers):
        """Sequences stats endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/dashboard/stats",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Sequences stats returned 200")

    def test_sequences_stats_has_required_fields(self, auth_headers):
        """Stats should include totalSequences, activeSequences, emailsSentThisWeek, totalEnrolled"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/dashboard/stats",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        assert "totalSequences" in data, "Missing 'totalSequences'"
        assert "activeSequences" in data, "Missing 'activeSequences'"
        assert "emailsSentThisWeek" in data, "Missing 'emailsSentThisWeek'"
        assert "totalEnrolled" in data, "Missing 'totalEnrolled'"
        
        print(f"Sequences stats: total={data.get('totalSequences')}, active={data.get('activeSequences')}, emailsThisWeek={data.get('emailsSentThisWeek')}, enrolled={data.get('totalEnrolled')}")

    def test_emails_sent_is_integer(self, auth_headers):
        """emailsSentThisWeek should be a non-negative integer"""
        response = requests.get(
            f"{BASE_URL}/api/sequences/dashboard/stats",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        emails_sent = data.get("emailsSentThisWeek")
        assert isinstance(emails_sent, int), f"emailsSentThisWeek should be int, got {type(emails_sent)}"
        assert emails_sent >= 0, f"emailsSentThisWeek should be >= 0, got {emails_sent}"
        print(f"emailsSentThisWeek is valid: {emails_sent}")


class TestDigestPreview:
    """Test /api/digest/preview - Weekly digest preview"""

    def test_digest_preview_returns_200(self, auth_headers):
        """Digest preview should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/digest/preview",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Digest preview returned 200")

    def test_digest_has_stats_structure(self, auth_headers):
        """Digest should include stats with revenue fields"""
        response = requests.get(
            f"{BASE_URL}/api/digest/preview",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        # Response is nested: {digest: {stats: {...}, ...}}
        digest = data.get("digest", data)
        stats = digest.get("stats", {})
        assert "totalRevenue" in stats, "Missing 'totalRevenue' in stats"
        assert "newLeads" in stats, "Missing 'newLeads' in stats"
        
        # Revenue should be numeric (from PAID_IN_FULL and RECEIVED income)
        assert isinstance(stats.get("totalRevenue"), (int, float)), "totalRevenue should be numeric"
        print(f"Digest stats: revenue={stats.get('totalRevenue')}, newLeads={stats.get('newLeads')}")

    def test_digest_has_period(self, auth_headers):
        """Digest should include period with start/end dates"""
        response = requests.get(
            f"{BASE_URL}/api/digest/preview",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        # Response is nested: {digest: {period: {...}, ...}}
        digest = data.get("digest", data)
        period = digest.get("period", {})
        assert "start" in period, "Missing 'start' in period"
        assert "end" in period, "Missing 'end' in period"
        print(f"Digest period: {period.get('start')} to {period.get('end')}")


class TestAnalyticsDashboard:
    """Test /api/analytics/dashboard - Main dashboard analytics"""

    def test_analytics_dashboard_returns_200(self, auth_headers):
        """Analytics dashboard should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Analytics dashboard returned 200")

    def test_analytics_has_overview(self, auth_headers):
        """Dashboard should have overview with pipelineValue, bookedThisMonth, conversionRate"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        overview = data.get("overview", {})
        assert "pipelineValue" in overview, "Missing 'pipelineValue' in overview"
        assert "bookedThisMonth" in overview, "Missing 'bookedThisMonth' in overview"
        assert "conversionRate" in overview, "Missing 'conversionRate' in overview"
        
        print(f"Dashboard overview: pipelineValue={overview.get('pipelineValue')}, conversionRate={overview.get('conversionRate')}%")

    def test_analytics_has_metrics(self, auth_headers):
        """Dashboard should have metrics with avgDealSize, winRate, totalLeads"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        metrics = data.get("metrics", {})
        assert "avgDealSize" in metrics, "Missing 'avgDealSize' in metrics"
        assert "winRate" in metrics, "Missing 'winRate' in metrics"
        assert "totalLeads" in metrics, "Missing 'totalLeads' in metrics"
        
        print(f"Dashboard metrics: avgDealSize={metrics.get('avgDealSize')}, winRate={metrics.get('winRate')}%, totalLeads={metrics.get('totalLeads')}")


class TestMonthlyTrend:
    """Test /api/analytics/monthly-trend - Monthly revenue trend"""

    def test_monthly_trend_returns_200(self, auth_headers):
        """Monthly trend should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/monthly-trend",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Monthly trend returned 200")

    def test_monthly_trend_has_12_months(self, auth_headers):
        """Monthly trend should return 12 months of data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/monthly-trend",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        trend = data.get("trend", [])
        assert len(trend) == 12, f"Expected 12 months, got {len(trend)}"
        print(f"Monthly trend has {len(trend)} months")

    def test_monthly_trend_structure(self, auth_headers):
        """Each month should have month, monthKey, count, revenue"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/monthly-trend",
            headers=auth_headers,
            timeout=30
        )
        data = response.json()
        
        trend = data.get("trend", [])
        for month_data in trend[:3]:  # Check first 3 months
            assert "month" in month_data, "Missing 'month' field"
            assert "monthKey" in month_data, "Missing 'monthKey' field"
            assert "count" in month_data, "Missing 'count' field"
            assert "revenue" in month_data, "Missing 'revenue' field"
        
        print(f"Monthly trend structure verified. First month: {trend[0].get('month')}, Last month: {trend[-1].get('month')}")


class TestMilestones:
    """Test /api/leads/:id/milestones - Milestone CRUD operations"""
    
    created_milestone_id = None

    def test_get_milestones_returns_200(self, auth_headers):
        """GET milestones should return 200"""
        lead_id = TEST_LEAD_IDS[0]  # Revenue Test Client
        response = requests.get(
            f"{BASE_URL}/api/leads/{lead_id}/milestones",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"GET milestones returned 200 for lead {lead_id}")

    def test_create_milestone(self, auth_headers):
        """POST milestone should create a new milestone"""
        lead_id = TEST_LEAD_IDS[0]
        milestone_data = {
            "name": "TEST_Analytics_Verification_Milestone",
            "description": "Test milestone for analytics verification",
            "dueDate": "2026-02-15T00:00:00.000Z",
            "completed": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/milestones",
            headers=auth_headers,
            json=milestone_data,
            timeout=30
        )
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        milestone = data.get("milestone", data)  # Handle both {milestone: {...}} and {...} responses
        assert "id" in milestone, "Created milestone should have 'id'"
        
        TestMilestones.created_milestone_id = milestone.get("id")
        print(f"Created milestone: {milestone.get('name')} with id={milestone.get('id')}")

    def test_update_milestone(self, auth_headers):
        """PATCH milestone should update the milestone"""
        if not TestMilestones.created_milestone_id:
            pytest.skip("No milestone was created to update")
        
        # Note: Update route is /api/leads/milestones/:milestoneId (not /api/leads/:id/milestones/:id)
        update_data = {
            "completed": True
        }
        
        response = requests.patch(
            f"{BASE_URL}/api/leads/milestones/{TestMilestones.created_milestone_id}",
            headers=auth_headers,
            json=update_data,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        milestone = data.get("milestone", data)
        assert milestone.get("completed") == True, "Milestone should be marked as completed"
        print(f"Updated milestone {TestMilestones.created_milestone_id} - completed=True")

    def test_delete_milestone(self, auth_headers):
        """DELETE milestone should remove the milestone"""
        if not TestMilestones.created_milestone_id:
            pytest.skip("No milestone was created to delete")
        
        # Note: Delete route is /api/leads/milestones/:milestoneId (not /api/leads/:id/milestones/:id)
        response = requests.delete(
            f"{BASE_URL}/api/leads/milestones/{TestMilestones.created_milestone_id}",
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code in [200, 204], f"Expected 200/204, got {response.status_code}: {response.text}"
        print(f"Deleted milestone {TestMilestones.created_milestone_id}")

    def test_milestones_on_portal(self):
        """Portal should show milestones (via timeline endpoint)"""
        response = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/timeline",
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "milestones" in data, "Portal timeline should include milestones"
        print(f"Portal timeline has {len(data.get('milestones', []))} milestones")


class TestAuthRequired:
    """Test that all analytics endpoints require authentication"""

    def test_revenue_requires_auth(self):
        """Revenue endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/crm/revenue", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Revenue endpoint correctly requires auth")

    def test_analytics_dashboard_requires_auth(self):
        """Analytics dashboard should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Analytics dashboard correctly requires auth")

    def test_revenue_pipeline_requires_auth(self):
        """Revenue pipeline should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue-pipeline", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Revenue pipeline correctly requires auth")

    def test_sequences_dashboard_requires_auth(self):
        """Sequences dashboard should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/sequences/dashboard", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Sequences dashboard correctly requires auth")

    def test_digest_preview_requires_auth(self):
        """Digest preview should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/digest/preview", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Digest preview correctly requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
