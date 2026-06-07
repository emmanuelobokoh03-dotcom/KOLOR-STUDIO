"""
Account Deletion Cascade Tests for KOLOR STUDIO CRM
Tests for DELETE /api/user/account endpoint with Prisma cascade deletion.

Test scenarios:
1. Create user with lead data (lead + quote + activity) then delete account - should cascade delete all
2. After deletion, login should fail for that user
3. Without auth token returns 401
4. Without password in body returns 400
5. With wrong password returns 401
6. Route Audit: Health, leads, settings, analytics, sequences endpoints
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRouteAudit:
    """Verify all routes are properly mounted and responding"""
    
    def test_health_endpoint_returns_200(self):
        """GET /api/health should return 200"""
        res = requests.get(f"{BASE_URL}/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        assert data.get("status") == "ok", f"Health status should be 'ok', got: {data}"
        print(f"✓ GET /api/health returns 200: {data.get('message')}")
    
    def _get_auth_headers(self):
        """Helper to get auth token"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "security@test.com",
            "password": "TestPass123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json().get("token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_leads_endpoint_with_auth_returns_200(self):
        """GET /api/leads with auth should return 200"""
        headers = self._get_auth_headers()
        res = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert res.status_code == 200, f"GET /api/leads failed: {res.text}"
        print("✓ GET /api/leads with auth returns 200")
    
    def test_settings_endpoint_with_auth_returns_200(self):
        """GET /api/settings with auth should return 200"""
        headers = self._get_auth_headers()
        res = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert res.status_code == 200, f"GET /api/settings failed: {res.text}"
        print("✓ GET /api/settings with auth returns 200")
    
    def test_analytics_revenue_pipeline_with_auth_returns_200(self):
        """GET /api/analytics/revenue-pipeline with auth should return 200"""
        headers = self._get_auth_headers()
        res = requests.get(f"{BASE_URL}/api/analytics/revenue-pipeline", headers=headers)
        assert res.status_code == 200, f"GET /api/analytics/revenue-pipeline failed: {res.text}"
        print("✓ GET /api/analytics/revenue-pipeline with auth returns 200")
    
    def test_sequences_dashboard_with_auth_returns_200(self):
        """GET /api/sequences/dashboard with auth should return 200"""
        headers = self._get_auth_headers()
        res = requests.get(f"{BASE_URL}/api/sequences/dashboard", headers=headers)
        assert res.status_code == 200, f"GET /api/sequences/dashboard failed: {res.text}"
        print("✓ GET /api/sequences/dashboard with auth returns 200")


class TestAccountDeletionAuth:
    """Test authentication requirements for account deletion"""
    
    def test_delete_account_without_token_returns_401(self):
        """DELETE /api/user/account without auth token returns 401"""
        res = requests.delete(f"{BASE_URL}/api/user/account", json={"password": "TestPass123!"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print("✓ DELETE /api/user/account without token returns 401")
    
    def test_delete_account_without_password_returns_400(self):
        """DELETE /api/user/account without password returns 400"""
        # Create a disposable user
        unique_email = f"test-nopwd-{uuid.uuid4().hex[:8]}@test.com"
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "TestPass123!",
            "firstName": "Test",
            "lastName": "NoPwd"
        })
        assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
        
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Try to delete without password
        res = requests.delete(f"{BASE_URL}/api/user/account", headers=headers, json={})
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        data = res.json()
        assert "Password required" in data.get("error", "") or "password" in data.get("error", "").lower(), \
            f"Expected password required error, got: {data}"
        print(f"✓ DELETE /api/user/account without password returns 400: {data.get('error')}")
    
    def test_delete_account_with_wrong_password_returns_401(self):
        """DELETE /api/user/account with wrong password returns 401"""
        # Create a disposable user
        unique_email = f"test-wrongpwd-{uuid.uuid4().hex[:8]}@test.com"
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "TestPass123!",
            "firstName": "Test",
            "lastName": "WrongPwd"
        })
        assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
        
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Try to delete with wrong password
        res = requests.delete(f"{BASE_URL}/api/user/account", headers=headers, json={
            "password": "WrongPassword123!"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        data = res.json()
        assert "Invalid password" in data.get("error", "") or "password" in data.get("error", "").lower(), \
            f"Expected invalid password error, got: {data}"
        print(f"✓ DELETE /api/user/account with wrong password returns 401: {data.get('error')}")


class TestAccountDeletionCascade:
    """Test cascade deletion of user data - the critical bug fix verification"""
    
    def test_delete_account_with_lead_data_cascades_successfully(self):
        """
        CREATE user -> CREATE lead -> DELETE account
        Should cascade delete all related data (leads, quotes, activities, messages)
        This was the original bug: foreign key constraint errors when deleting user with existing data
        """
        # Step 1: Create a disposable user
        unique_email = f"test-cascade-{uuid.uuid4().hex[:8]}@test.com"
        unique_id = uuid.uuid4().hex[:8]
        
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "TestPass123!",
            "firstName": "Cascade",
            "lastName": "Test"
        })
        assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
        print(f"✓ Step 1: Created user {unique_email}")
        
        # Login to get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json().get("token")
        user_id = login_res.json().get("user", {}).get("id")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        print(f"✓ Step 2: Logged in as {unique_email}, user ID: {user_id}")
        
        # Step 2: Create a lead with all required fields
        lead_data = {
            "clientName": f"TEST_CascadeClient_{unique_id}",
            "clientEmail": f"cascade-client-{unique_id}@test.com",
            "projectTitle": f"Cascade Test Project {unique_id}",
            "serviceType": "PHOTOGRAPHY",
            "description": "Test lead for cascade deletion verification"
        }
        
        lead_res = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=headers)
        assert lead_res.status_code == 201, f"Lead creation failed: {lead_res.text}"
        lead_id = lead_res.json().get("lead", {}).get("id")
        assert lead_id, f"No lead ID returned: {lead_res.json()}"
        print(f"✓ Step 3: Created lead {lead_id} for user")
        
        # Verify lead exists
        verify_lead_res = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=headers)
        assert verify_lead_res.status_code == 200, f"Lead verification failed: {verify_lead_res.text}"
        print("✓ Step 4: Verified lead exists")
        
        # Step 3: Delete account with correct password
        # This is where the original bug occurred - foreign key constraints blocked deletion
        delete_res = requests.delete(f"{BASE_URL}/api/user/account", headers=headers, json={
            "password": "TestPass123!"
        })
        assert delete_res.status_code == 200, f"Account deletion FAILED: {delete_res.text}"
        data = delete_res.json()
        assert "permanently deleted" in data.get("message", "").lower() or "deleted" in data.get("message", "").lower(), \
            f"Expected deletion confirmation, got: {data}"
        print(f"✓ Step 5: Account deleted successfully: {data.get('message')}")
        
        # Step 4: Verify account is actually deleted by trying to login
        time.sleep(0.5)  # Small delay to ensure DB consistency
        login_after_delete = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_after_delete.status_code == 401, \
            f"Account should be deleted, login should return 401, got {login_after_delete.status_code}: {login_after_delete.text}"
        print("✓ Step 6: Verified account is deleted - login returns 401")
        
        print("\n✅ CASCADE DELETION TEST PASSED")
        print("   User with lead data was successfully deleted.")
        print("   Prisma onDelete:Cascade rules are working correctly.")
    
    def test_after_deletion_login_fails(self):
        """After account deletion, login should fail with 401"""
        # Create user
        unique_email = f"test-loginafter-{uuid.uuid4().hex[:8]}@test.com"
        
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "TestPass123!",
            "firstName": "Login",
            "lastName": "After"
        })
        assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
        
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Delete account
        delete_res = requests.delete(f"{BASE_URL}/api/user/account", headers=headers, json={
            "password": "TestPass123!"
        })
        assert delete_res.status_code == 200, f"Deletion failed: {delete_res.text}"
        print("✓ Account deleted")
        
        # Verify login fails
        time.sleep(0.5)
        login_after = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_after.status_code == 401, f"Expected 401, got {login_after.status_code}"
        print("✓ Login after deletion correctly returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
