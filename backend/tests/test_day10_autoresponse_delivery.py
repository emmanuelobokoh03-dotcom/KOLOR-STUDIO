"""
Test Day 10: Auto-Response + Mark as Delivered workflow
- POST /api/leads/submit — public lead submission triggers auto-response  
- POST /api/leads/:id/mark-delivered — delivery workflow endpoint
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolor-light-theme.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
USER_ID = "3aa2d156-aa26-48ef-8daf-e95641b68b3e"


class TestDay10AutoResponseDelivery:
    """Tests for Day 10 Auto-Response and Mark-as-Delivered features"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for API calls"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Auth headers for authenticated requests"""
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    # ========================
    # PUBLIC LEAD SUBMISSION TESTS
    # ========================
    
    def test_public_lead_submission_success(self):
        """POST /api/leads/submit - public submission should work without auth"""
        unique_id = uuid.uuid4().hex[:8]
        lead_data = {
            "clientName": f"AutoResponse Test {unique_id}",
            "clientEmail": f"autotest_{unique_id}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"Test Auto-Response {unique_id}",
            "description": "Testing auto-response email queue functionality",
            "budget": "$500-$1000",
            "timeline": "2 weeks",
            "source": "WEBSITE",
            "studioId": USER_ID  # Assign to known user for auto-response
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/submit",
            json=lead_data
        )
        
        assert response.status_code == 201, f"Public submission failed: {response.text}"
        data = response.json()
        assert "leadId" in data, "Response should contain leadId"
        assert "message" in data, "Response should contain success message"
        print(f"PASSED: Public lead submitted with ID: {data.get('leadId')}")
    
    def test_public_lead_submission_validation(self):
        """POST /api/leads/submit - should validate required fields"""
        # Missing required fields
        response = requests.post(
            f"{BASE_URL}/api/leads/submit",
            json={"clientName": "Test"}  # Missing other required fields
        )
        
        assert response.status_code == 400, f"Should return 400 for invalid data, got {response.status_code}"
        print("PASSED: Public submission validates required fields")
    
    def test_public_lead_submission_email_validation(self):
        """POST /api/leads/submit - should validate email format"""
        response = requests.post(
            f"{BASE_URL}/api/leads/submit",
            json={
                "clientName": "Test",
                "clientEmail": "invalid-email",  # Invalid email
                "serviceType": "PHOTOGRAPHY",
                "projectTitle": "Test",
                "description": "Test description"
            }
        )
        
        assert response.status_code == 400, f"Should return 400 for invalid email, got {response.status_code}"
        print("PASSED: Public submission validates email format")
    
    # ========================
    # MARK AS DELIVERED TESTS
    # ========================
    
    def test_mark_delivered_requires_auth(self):
        """POST /api/leads/:id/mark-delivered - requires authentication"""
        fake_lead_id = "00000000-0000-0000-0000-000000000000"
        response = requests.post(
            f"{BASE_URL}/api/leads/{fake_lead_id}/mark-delivered"
        )
        
        assert response.status_code == 401, f"Should return 401 without auth, got {response.status_code}"
        print("PASSED: mark-delivered requires authentication")
    
    def test_mark_delivered_returns_404_for_nonexistent(self, auth_headers):
        """POST /api/leads/:id/mark-delivered - returns 404 for non-existent lead"""
        fake_lead_id = "00000000-0000-0000-0000-000000000000"
        response = requests.post(
            f"{BASE_URL}/api/leads/{fake_lead_id}/mark-delivered",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Should return 404 for non-existent lead, got {response.status_code}"
        data = response.json()
        assert "error" in data or "Lead not found" in str(data)
        print("PASSED: mark-delivered returns 404 for non-existent lead")
    
    def test_mark_delivered_success(self, auth_headers):
        """POST /api/leads/:id/mark-delivered - successful delivery workflow"""
        # First create a test lead 
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            headers=auth_headers,
            json={
                "clientName": f"Delivery Test {unique_id}",
                "clientEmail": f"delivery_{unique_id}@example.com",
                "serviceType": "PHOTOGRAPHY",
                "projectTitle": f"Delivery Test Project {unique_id}",
                "description": "Testing mark as delivered workflow"
            }
        )
        
        assert create_response.status_code == 201, f"Failed to create test lead: {create_response.text}"
        lead_id = create_response.json().get("lead", {}).get("id")
        assert lead_id, "Lead ID not returned"
        
        # Now mark as delivered
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/mark-delivered",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"mark-delivered failed: {response.text}"
        data = response.json()
        
        # Verify response contains expected fields
        assert "message" in data, "Response should contain message"
        assert "filesShared" in data, "Response should contain filesShared count"
        assert "pipelineStatus" in data or "status" in data, "Response should contain status"
        assert "paymentLinkSent" in data, "Response should contain paymentLinkSent field"
        
        # Verify pipeline status is COMPLETED
        pipeline_status = data.get("pipelineStatus") or data.get("status")
        assert pipeline_status == "COMPLETED", f"Expected pipelineStatus COMPLETED, got {pipeline_status}"
        
        print(f"PASSED: mark-delivered successful - {data.get('filesShared')} files shared, paymentLinkSent: {data.get('paymentLinkSent')}")
    
    def test_mark_delivered_with_no_files(self, auth_headers):
        """POST /api/leads/:id/mark-delivered - handles gracefully when no files to share"""
        # Create a lead without any files
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            headers=auth_headers,
            json={
                "clientName": f"NoFiles Test {unique_id}",
                "clientEmail": f"nofiles_{unique_id}@example.com",
                "serviceType": "GRAPHIC_DESIGN",
                "projectTitle": f"No Files Test {unique_id}",
                "description": "Testing delivery with no files"
            }
        )
        
        assert create_response.status_code == 201
        lead_id = create_response.json().get("lead", {}).get("id")
        
        # Mark as delivered
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/mark-delivered",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Should succeed even with no files: {response.text}"
        data = response.json()
        assert data.get("filesShared") == 0, "filesShared should be 0"
        print("PASSED: mark-delivered handles no files gracefully (filesShared: 0)")
    
    def test_mark_delivered_idempotent(self, auth_headers):
        """POST /api/leads/:id/mark-delivered - should work when already COMPLETED (idempotent)"""
        # Create a test lead
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            headers=auth_headers,
            json={
                "clientName": f"Idempotent Test {unique_id}",
                "clientEmail": f"idempotent_{unique_id}@example.com",
                "serviceType": "VIDEOGRAPHY",
                "projectTitle": f"Idempotent Delivery Test {unique_id}",
                "description": "Testing idempotent mark-delivered"
            }
        )
        
        assert create_response.status_code == 201
        lead_id = create_response.json().get("lead", {}).get("id")
        
        # First mark as delivered
        response1 = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/mark-delivered",
            headers=auth_headers
        )
        assert response1.status_code == 200, f"First mark-delivered failed: {response1.text}"
        
        # Second mark as delivered - should still succeed
        response2 = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/mark-delivered",
            headers=auth_headers
        )
        assert response2.status_code == 200, f"Second mark-delivered should be idempotent: {response2.text}"
        print("PASSED: mark-delivered is idempotent (can be called multiple times)")
    
    # ========================
    # VERIFICATION TESTS
    # ========================
    
    def test_verify_lead_status_after_delivery(self, auth_headers):
        """Verify lead status is updated correctly after mark-delivered"""
        # Create and deliver a test lead
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            headers=auth_headers,
            json={
                "clientName": f"Status Verify Test {unique_id}",
                "clientEmail": f"verify_{unique_id}@example.com",
                "serviceType": "WEB_DESIGN",
                "projectTitle": f"Status Verify Test {unique_id}",
                "description": "Testing status verification"
            }
        )
        
        assert create_response.status_code == 201
        lead_id = create_response.json().get("lead", {}).get("id")
        
        # Mark as delivered
        deliver_response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/mark-delivered",
            headers=auth_headers
        )
        assert deliver_response.status_code == 200
        
        # Fetch lead and verify status
        get_response = requests.get(
            f"{BASE_URL}/api/leads/{lead_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        lead = get_response.json().get("lead", {})
        
        # Verify status is BOOKED (highest lead status)
        assert lead.get("status") == "BOOKED", f"Expected status BOOKED, got {lead.get('status')}"
        # Verify pipelineStatus is COMPLETED
        assert lead.get("pipelineStatus") == "COMPLETED", f"Expected pipelineStatus COMPLETED, got {lead.get('pipelineStatus')}"
        
        print(f"PASSED: Lead status verified - status: {lead.get('status')}, pipelineStatus: {lead.get('pipelineStatus')}")


class TestExistingFlows:
    """Regression tests for existing functionality"""
    
    def test_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("PASSED: Health check successful")
    
    def test_login(self):
        """Verify login still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Login should return token"
        print("PASSED: Login working correctly")
    
    def test_leads_list(self):
        """Verify leads list endpoint still works"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        token = login_response.json().get("token")
        
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Leads list failed: {response.text}"
        data = response.json()
        assert "leads" in data, "Should return leads array"
        print(f"PASSED: Leads list returns {len(data.get('leads', []))} leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
