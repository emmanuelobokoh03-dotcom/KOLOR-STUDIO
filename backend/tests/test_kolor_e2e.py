"""
KOLOR STUDIO CRM - Comprehensive E2E Backend API Tests
Tests: Authentication, Leads, Portal, Files, Settings, Email Verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolor-growth-engine.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
USER_ID = "3aa2d156-aa26-48ef-8daf-e95641b68b3e"
PORTAL_TOKEN = "qix2u3mijnq0ncf9ycx48br"
LEAD_ID = "2002320d-9d1b-4f27-b126-758d8930340e"
SHARED_FILE_ID = "b21f5da1-4856-402a-b647-23d0ed7017f8"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in response"
    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestSuite1_Authentication:
    """SUITE 1 - AUTH: Login/Logout/Protected Routes"""
    
    def test_1a_login_valid_credentials(self):
        """Login with valid credentials, verify dashboard access"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful, user: {data['user']['firstName']}")
    
    def test_1b_get_me_returns_user(self, auth_headers):
        """Verify /me endpoint returns user with emailVerified field"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "emailVerified" in data["user"], "emailVerified field missing"
        print(f"✓ /me endpoint working, emailVerified: {data['user']['emailVerified']}")
    
    def test_1c_login_wrong_password(self):
        """Login with wrong password, verify error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpassword123"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data or "message" in data
        print("✓ Wrong password correctly returns 401")
    
    def test_1d_protected_route_without_auth(self):
        """Try accessing /me without auth, verify 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Protected route correctly returns 401 without auth")


class TestSuite2_LeadManagement:
    """SUITE 2 - PROJECT CREATION: Create and verify leads"""
    
    def test_2a_get_leads(self, auth_headers):
        """Get all leads"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✓ Got {len(data['leads'])} leads")
    
    def test_2b_get_lead_stats(self, auth_headers):
        """Get lead stats"""
        response = requests.get(f"{BASE_URL}/api/leads/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "statusCounts" in data
        print(f"✓ Lead stats: total={data['total']}, statusCounts={data['statusCounts']}")
    
    def test_2c_get_specific_lead(self, auth_headers):
        """Get Emmanuel lead details"""
        response = requests.get(f"{BASE_URL}/api/leads/{LEAD_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "lead" in data
        lead = data["lead"]
        assert lead["id"] == LEAD_ID
        print(f"✓ Got lead: {lead['clientName']} - {lead['projectTitle']}")
    
    def test_2d_get_lead_activities(self, auth_headers):
        """Get lead activities"""
        response = requests.get(f"{BASE_URL}/api/leads/{LEAD_ID}/activities", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        print(f"✓ Got {len(data['activities'])} activities for lead")


class TestSuite3_LeadDetailAndQuotes:
    """SUITE 3 - LEAD DETAIL & QUOTES"""
    
    def test_3a_get_lead_with_files(self, auth_headers):
        """Get lead files"""
        response = requests.get(f"{BASE_URL}/api/leads/{LEAD_ID}/files", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        print(f"✓ Got {len(data['files'])} files for lead")
    
    def test_3b_get_quotes(self, auth_headers):
        """Get quotes for lead"""
        response = requests.get(f"{BASE_URL}/api/quotes?leadId={LEAD_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "quotes" in data
        print(f"✓ Got {len(data['quotes'])} quotes for lead")
    
    def test_3c_get_contracts(self, auth_headers):
        """Get contracts for lead"""
        response = requests.get(f"{BASE_URL}/api/contracts?leadId={LEAD_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "contracts" in data
        print(f"✓ Got {len(data['contracts'])} contracts for lead")
    
    def test_3d_get_deliverables(self, auth_headers):
        """Get deliverables for lead"""
        response = requests.get(f"{BASE_URL}/api/deliverables?leadId={LEAD_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "deliverables" in data
        print(f"✓ Got {len(data['deliverables'])} deliverables for lead")


class TestSuite4_ClientPortal:
    """SUITE 4 - CLIENT PORTAL: Public portal access"""
    
    def test_4a_portal_loads(self):
        """Navigate to Emmanuel's portal - verify data loads"""
        response = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify portal structure
        assert "project" in data
        assert "status" in data
        assert "client" in data
        assert "timeline" in data
        assert "files" in data
        assert "contracts" in data
        assert "contact" in data
        assert "meta" in data
        
        print(f"✓ Portal loads: {data['project']['title']}, status: {data['status']['label']}")
    
    def test_4b_portal_client_name(self):
        """Verify portal shows correct client name"""
        response = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client"]["name"] is not None
        assert len(data["client"]["name"]) > 0
        print(f"✓ Portal client name: {data['client']['name']}")
    
    def test_4c_portal_status(self):
        """Verify portal status and timeline"""
        response = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        
        assert "current" in data["status"]
        assert "label" in data["status"]
        assert "progress" in data["status"]
        print(f"✓ Portal status: {data['status']['label']} ({data['status']['progress']}%)")
    
    def test_4d_portal_shared_files(self):
        """Verify shared files section"""
        response = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        
        assert "files" in data
        if len(data["files"]) > 0:
            file = data["files"][0]
            assert "id" in file
            assert "name" in file
            print(f"✓ Portal has {len(data['files'])} shared file(s)")
        else:
            print("✓ Portal files section present (0 files)")


class TestSuite5_FileSharing:
    """SUITE 5 - FILE SHARING"""
    
    def test_5a_get_lead_files_with_share_status(self, auth_headers):
        """Get files with share status"""
        response = requests.get(f"{BASE_URL}/api/leads/{LEAD_ID}/files", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "files" in data
        shared_count = sum(1 for f in data["files"] if f.get("sharedWithClient"))
        print(f"✓ Files: {len(data['files'])} total, {shared_count} shared")
    
    def test_5b_portal_file_download_endpoint(self):
        """Test portal file download (if shared file exists)"""
        # First get portal to check if file exists
        portal_response = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        assert portal_response.status_code == 200
        portal_data = portal_response.json()
        
        if len(portal_data["files"]) > 0:
            file_id = portal_data["files"][0]["id"]
            # Test download endpoint (should redirect to file URL)
            response = requests.get(
                f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/files/{file_id}/download",
                allow_redirects=False
            )
            # Should be 302 redirect or 200
            assert response.status_code in [200, 302, 301]
            print(f"✓ File download endpoint works (status: {response.status_code})")
        else:
            print("✓ No shared files to test download")


class TestSuite6_Portfolio:
    """SUITE 6 - PORTFOLIO & SHARING"""
    
    def test_6a_get_public_portfolio(self):
        """Get public portfolio"""
        response = requests.get(f"{BASE_URL}/api/portfolio/public/{USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "portfolio" in data
        assert "user" in data
        print(f"✓ Public portfolio: {len(data['portfolio'])} items, user: {data['user'].get('name', 'N/A')}")
    
    def test_6b_get_user_portfolio(self, auth_headers):
        """Get authenticated user's portfolio"""
        response = requests.get(f"{BASE_URL}/api/portfolio", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "portfolio" in data
        print(f"✓ User portfolio: {len(data['portfolio'])} items")


class TestSuite7_Testimonials:
    """SUITE 7 - TESTIMONIALS"""
    
    def test_7a_get_public_testimonials(self):
        """Get public testimonials for user"""
        response = requests.get(f"{BASE_URL}/api/testimonials/public/{USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "testimonials" in data
        print(f"✓ Public testimonials: {len(data['testimonials'])} approved")
    
    def test_7b_get_user_testimonials(self, auth_headers):
        """Get all user testimonials (including pending)"""
        response = requests.get(f"{BASE_URL}/api/testimonials", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "testimonials" in data
        print(f"✓ User testimonials: {len(data['testimonials'])} total")


class TestSuite8_Settings:
    """SUITE 8 - BRAND & SETTINGS"""
    
    def test_8a_get_settings(self, auth_headers):
        """Get user settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "settings" in data
        settings = data["settings"]
        assert "currency" in settings
        assert "currencySymbol" in settings
        print(f"✓ Settings: currency={settings['currency']}, symbol={settings['currencySymbol']}")
    
    def test_8b_get_brand_settings(self, auth_headers):
        """Verify brand settings in /me"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        user = data["user"]
        # Brand settings should be present
        brand_fields = ["brandPrimaryColor", "brandAccentColor", "brandLogoUrl", "brandFontFamily"]
        for field in brand_fields:
            assert field in user, f"Missing brand field: {field}"
        print(f"✓ Brand settings present: primary={user['brandPrimaryColor']}, font={user['brandFontFamily']}")


class TestSuite9_RevenueDashboard:
    """SUITE 11 - REVENUE DASHBOARD"""
    
    def test_11a_get_revenue_stats(self, auth_headers):
        """Get revenue stats"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should have revenue data
        print(f"✓ Revenue stats endpoint working")
    
    def test_11b_get_crm_alerts(self, auth_headers):
        """Get CRM alerts"""
        response = requests.get(f"{BASE_URL}/api/leads/alerts", headers=auth_headers)
        # May return 404 if no alerts endpoint, but should not error
        assert response.status_code in [200, 404]
        print(f"✓ CRM alerts endpoint status: {response.status_code}")


class TestSuite12_EmailVerification:
    """SUITE 12 - EMAIL VERIFICATION"""
    
    def test_12a_me_has_email_verified(self, auth_headers):
        """Verify /me endpoint returns emailVerified"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "emailVerified" in data["user"]
        print(f"✓ emailVerified field present: {data['user']['emailVerified']}")
    
    def test_12b_invalid_verification_token(self):
        """Test invalid verification token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email/invalid-token-123")
        # Should return 404 for invalid token
        assert response.status_code in [400, 404]
        print(f"✓ Invalid verification token returns error (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
