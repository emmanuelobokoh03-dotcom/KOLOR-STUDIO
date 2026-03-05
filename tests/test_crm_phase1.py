"""
CRM Phase 1 API Tests - Alerts, Interactions, Pipeline, Revenue, Income
Tests for KOLOR STUDIO CRM functionality
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = "https://design-theme.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"

class TestCRMPhase1:
    """CRM Phase 1 API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication and shared test data"""
        # Login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        self.token = login_response.json()["token"]
        self.user_id = login_response.json()["user"]["id"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get a lead for testing
        leads_response = requests.get(
            f"{BASE_URL}/api/leads?limit=1",
            headers=self.headers
        )
        assert leads_response.status_code == 200
        leads = leads_response.json().get("leads", [])
        self.test_lead_id = leads[0]["id"] if leads else None
        
    # ===================
    # CRM ALERTS TESTS
    # ===================
    
    def test_get_crm_alerts_authenticated(self):
        """GET /api/crm/alerts returns alerts for authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/crm/alerts",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "alerts" in data
        assert isinstance(data["alerts"], list)
        
        # If there are alerts, validate structure
        if data["alerts"]:
            alert = data["alerts"][0]
            assert "id" in alert
            assert "priority" in alert
            assert "type" in alert
            assert "message" in alert
            assert "leadId" in alert
            assert "leadName" in alert
            assert "action" in alert
            
            # Validate priority values
            assert alert["priority"] in ["HIGH", "MEDIUM", "LOW"]
    
    def test_get_crm_alerts_sorted_by_priority(self):
        """GET /api/crm/alerts returns alerts sorted with HIGH priority first"""
        response = requests.get(
            f"{BASE_URL}/api/crm/alerts",
            headers=self.headers
        )
        assert response.status_code == 200
        alerts = response.json()["alerts"]
        
        if len(alerts) > 1:
            # Check that HIGH priority alerts come before MEDIUM and LOW
            priority_order = {"HIGH": 1, "MEDIUM": 2, "LOW": 3}
            for i in range(len(alerts) - 1):
                current_priority = priority_order[alerts[i]["priority"]]
                next_priority = priority_order[alerts[i + 1]["priority"]]
                assert current_priority <= next_priority, "Alerts not sorted by priority"
    
    def test_get_crm_alerts_unauthenticated(self):
        """GET /api/crm/alerts returns 401 for unauthenticated request"""
        response = requests.get(f"{BASE_URL}/api/crm/alerts")
        assert response.status_code == 401
    
    # ===================
    # CRM INTERACTIONS TESTS
    # ===================
    
    def test_post_interaction_creates_record(self):
        """POST /api/crm/interactions creates interaction and updates lastContactedAt"""
        if not self.test_lead_id:
            pytest.skip("No lead available for testing")
        
        response = requests.post(
            f"{BASE_URL}/api/crm/interactions",
            headers=self.headers,
            json={
                "leadId": self.test_lead_id,
                "type": "NOTE",
                "content": "TEST_CRM_Interaction note"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate interaction structure
        assert "interaction" in data
        interaction = data["interaction"]
        assert interaction["leadId"] == self.test_lead_id
        assert interaction["type"] == "NOTE"
        assert interaction["content"] == "TEST_CRM_Interaction note"
        assert "id" in interaction
        assert "createdAt" in interaction
    
    def test_post_interaction_missing_fields(self):
        """POST /api/crm/interactions returns 400 for missing required fields"""
        response = requests.post(
            f"{BASE_URL}/api/crm/interactions",
            headers=self.headers,
            json={"content": "Missing leadId and type"}
        )
        assert response.status_code == 400
    
    def test_get_interactions_for_lead(self):
        """GET /api/crm/interactions/:leadId returns interactions for a lead"""
        if not self.test_lead_id:
            pytest.skip("No lead available for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/crm/interactions/{self.test_lead_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "interactions" in data
        assert isinstance(data["interactions"], list)
    
    # ===================
    # PIPELINE TESTS
    # ===================
    
    def test_patch_pipeline_status(self):
        """PATCH /api/crm/leads/:id/pipeline updates pipeline status"""
        if not self.test_lead_id:
            pytest.skip("No lead available for testing")
        
        response = requests.patch(
            f"{BASE_URL}/api/crm/leads/{self.test_lead_id}/pipeline",
            headers=self.headers,
            json={
                "status": "CONTACTED",
                "nextFollowUpAt": (datetime.now() + timedelta(days=3)).isoformat()
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "lead" in data
        assert data["lead"]["pipelineStatus"] == "CONTACTED"
        assert data["lead"]["nextFollowUpAt"] is not None
    
    # ===================
    # REVENUE TESTS
    # ===================
    
    def test_get_revenue_stats(self):
        """GET /api/crm/revenue returns revenue statistics"""
        response = requests.get(
            f"{BASE_URL}/api/crm/revenue",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate required fields
        assert "thisMonth" in data
        assert "thisMonthCount" in data
        assert "monthOverMonth" in data
        assert "ytd" in data
        assert "yearGoal" in data
        assert "goalProgress" in data
        assert "expected" in data
        assert "expectedCount" in data
        assert "monthlyTrend" in data
        
        # Validate monthlyTrend structure
        assert isinstance(data["monthlyTrend"], list)
        assert len(data["monthlyTrend"]) == 12, "Monthly trend should have 12 months"
        
        if data["monthlyTrend"]:
            month_entry = data["monthlyTrend"][0]
            assert "month" in month_entry
            assert "amount" in month_entry
    
    def test_get_revenue_unauthenticated(self):
        """GET /api/crm/revenue returns 401 for unauthenticated request"""
        response = requests.get(f"{BASE_URL}/api/crm/revenue")
        assert response.status_code == 401
    
    # ===================
    # INCOME TESTS
    # ===================
    
    def test_post_income_creates_record(self):
        """POST /api/crm/income creates income record"""
        response = requests.post(
            f"{BASE_URL}/api/crm/income",
            headers=self.headers,
            json={
                "leadId": self.test_lead_id if self.test_lead_id else None,
                "amount": 500,
                "description": "TEST_CRM_Income record",
                "category": "PROJECT",
                "status": "EXPECTED",
                "expectedDate": (datetime.now() + timedelta(days=30)).isoformat()
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "income" in data
        income = data["income"]
        assert income["description"] == "TEST_CRM_Income record"
        assert income["status"] == "EXPECTED"
        assert income["category"] == "PROJECT"
        assert "id" in income
        
        # Store for cleanup/patch test
        self.test_income_id = income["id"]
    
    def test_get_income_records(self):
        """GET /api/crm/income returns income records with lead details"""
        response = requests.get(
            f"{BASE_URL}/api/crm/income",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "incomes" in data
        assert isinstance(data["incomes"], list)
        
        # If there are incomes, validate structure
        if data["incomes"]:
            income = data["incomes"][0]
            assert "id" in income
            assert "amount" in income
            assert "description" in income
            assert "status" in income
            assert "category" in income
    
    def test_patch_income_status(self):
        """PATCH /api/crm/income/:id updates income status"""
        # First create an income to patch
        create_response = requests.post(
            f"{BASE_URL}/api/crm/income",
            headers=self.headers,
            json={
                "amount": 250,
                "description": "TEST_CRM_Income for patch",
                "status": "EXPECTED"
            }
        )
        assert create_response.status_code == 200
        income_id = create_response.json()["income"]["id"]
        
        # Now patch it
        patch_response = requests.patch(
            f"{BASE_URL}/api/crm/income/{income_id}",
            headers=self.headers,
            json={
                "status": "RECEIVED",
                "receivedDate": datetime.now().isoformat()
            }
        )
        assert patch_response.status_code == 200
        data = patch_response.json()
        
        assert "income" in data
        assert data["income"]["status"] == "RECEIVED"
        assert data["income"]["receivedDate"] is not None
    
    def test_get_income_unauthenticated(self):
        """GET /api/crm/income returns 401 for unauthenticated request"""
        response = requests.get(f"{BASE_URL}/api/crm/income")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
