"""
Iteration 49: Prisma Schema PascalCase Model Names Verification
Tests that all Prisma model accessors work correctly after schema restoration
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"

class TestPrismaSchemaVerification:
    """Verify Prisma schema changes work correctly"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Shared requests session"""
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        """Get authentication token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # Test 1: Health Check
    def test_01_health_check(self, session):
        """Test /api/health endpoint"""
        response = session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health check passed")
    
    # Test 2: Login (prisma.user accessor)
    def test_02_login(self, session, auth_token):
        """Test login works (verifies prisma.user accessor)"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Login successful - token length: {len(auth_token)}")
    
    # Test 3: GET /api/leads (prisma.lead accessor)
    def test_03_get_leads(self, session, auth_headers):
        """Test GET /api/leads (verifies prisma.lead.findMany)"""
        response = session.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200, f"GET /api/leads failed: {response.text}"
        data = response.json()
        
        # API returns {leads: [...], count: N}
        if isinstance(data, dict) and "leads" in data:
            leads = data["leads"]
            count = data.get("count", len(leads))
            assert isinstance(leads, list), "Expected leads to be a list"
            print(f"✓ GET /api/leads returned {count} leads (prisma.lead accessor works)")
        elif isinstance(data, list):
            print(f"✓ GET /api/leads returned {len(data)} leads (prisma.lead accessor works)")
        else:
            pytest.fail(f"Unexpected response format: {type(data)}")
    
    # Test 4: POST /api/leads (prisma.lead.create with auto-generated id, portalToken)
    def test_04_create_lead(self, session, auth_headers):
        """Test POST /api/leads (verifies prisma.lead.create with @default(cuid()))"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "clientName": f"TEST_PrismaSchema_{unique_id}",
            "clientEmail": f"test.prisma.{unique_id}@example.com",
            "projectTitle": f"Test Prisma Schema Lead {unique_id}",
            "serviceType": "PHOTOGRAPHY",
            "description": "Testing Prisma schema PascalCase models"
        }
        response = session.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        assert response.status_code == 201, f"POST /api/leads failed: {response.text}"
        data = response.json()
        
        # API returns {lead: {...}, message: "..."}
        lead = data.get("lead", data)
        
        # Verify auto-generated fields
        assert "id" in lead, f"Lead should have auto-generated id. Got: {lead.keys()}"
        assert "portalToken" in lead, "Lead should have auto-generated portalToken"
        assert len(lead["id"]) > 0, "ID should not be empty"
        assert len(lead["portalToken"]) > 0, "portalToken should not be empty"
        
        print(f"✓ POST /api/leads created lead with id: {lead['id'][:20]}... (prisma.lead.create works)")
        return lead["id"]
    
    # Test 5: GET /api/sequences (prisma.emailSequence accessor)
    def test_05_get_sequences(self, session, auth_headers):
        """Test GET /api/sequences (verifies prisma.emailSequence accessor)"""
        response = session.get(f"{BASE_URL}/api/sequences", headers=auth_headers)
        assert response.status_code == 200, f"GET /api/sequences failed: {response.text}"
        data = response.json()
        
        # API returns {sequences: [...]}
        if isinstance(data, dict) and "sequences" in data:
            sequences = data["sequences"]
            assert isinstance(sequences, list), "Expected sequences to be a list"
            print(f"✓ GET /api/sequences returned {len(sequences)} sequences (prisma.emailSequence accessor works)")
        elif isinstance(data, list):
            print(f"✓ GET /api/sequences returned {len(data)} sequences (prisma.emailSequence accessor works)")
        else:
            pytest.fail(f"Unexpected response format: {type(data)}")
    
    # Test 6: GET /api/settings/brand (prisma.user accessor)
    def test_06_get_brand_settings(self, session, auth_headers):
        """Test GET /api/settings/brand (verifies prisma.user accessor)"""
        response = session.get(f"{BASE_URL}/api/settings/brand", headers=auth_headers)
        assert response.status_code == 200, f"GET /api/settings/brand failed: {response.text}"
        data = response.json()
        
        # API returns {brand: {...}}
        if isinstance(data, dict) and "brand" in data:
            brand = data["brand"]
            assert "primaryColor" in brand or "accentColor" in brand, "Expected brand settings"
            print(f"✓ GET /api/settings/brand returned brand settings (prisma.user accessor works)")
        elif "brandPrimaryColor" in data or "primaryColor" in data:
            print(f"✓ GET /api/settings/brand returned brand settings (prisma.user accessor works)")
        else:
            pytest.fail(f"Unexpected response format: {data.keys()}")
    
    # Test 7: POST /api/portal/submit (prisma.lead.create from portal with assignedToId)
    def test_07_portal_submit(self, session):
        """Test POST /api/portal/submit (verifies prisma.lead.create from portal)"""
        unique_id = str(uuid.uuid4())[:8]
        portal_data = {
            "clientName": f"TEST_Portal_Prisma_{unique_id}",
            "clientEmail": f"test.portal.prisma.{unique_id}@example.com",
            "clientPhone": "+1234567890",
            "projectTitle": f"Portal Submission Prisma Test {unique_id}",
            "serviceType": "PHOTOGRAPHY",
            "description": "Testing portal submission after Prisma schema fix",
            "budget": "$1000-$2000"
        }
        response = session.post(f"{BASE_URL}/api/portal/submit", json=portal_data)
        assert response.status_code == 201, f"POST /api/portal/submit failed: {response.text}"
        data = response.json()
        
        # API returns {success: true, leadId: "...", message: "..."}
        assert data.get("success") == True, f"Portal submit should succeed. Got: {data}"
        assert "leadId" in data, f"Portal submit should return leadId. Got: {data.keys()}"
        assert len(data["leadId"]) > 0, "leadId should not be empty"
        
        print(f"✓ POST /api/portal/submit created lead with id: {data['leadId'][:20]}... (prisma.lead.create from portal works)")
        return data["leadId"]
    
    # Test 8: GET /api/leads/:id/quotes (prisma.quote accessor)
    def test_08_get_lead_quotes(self, session, auth_headers):
        """Test GET /api/leads/:id/quotes (verifies prisma.quote accessor)"""
        # First get a lead
        leads_response = session.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert leads_response.status_code == 200
        data = leads_response.json()
        
        # Handle both formats
        leads = data.get("leads", data) if isinstance(data, dict) else data
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            response = session.get(f"{BASE_URL}/api/leads/{lead_id}/quotes", headers=auth_headers)
            assert response.status_code == 200, f"GET /api/leads/:id/quotes failed: {response.text}"
            quotes_data = response.json()
            
            # Handle wrapped response
            quotes = quotes_data.get("quotes", quotes_data) if isinstance(quotes_data, dict) else quotes_data
            if isinstance(quotes, list):
                print(f"✓ GET /api/leads/:id/quotes returned {len(quotes)} quotes (prisma.quote accessor works)")
            else:
                print(f"✓ GET /api/leads/:id/quotes works (prisma.quote accessor works)")
        else:
            pytest.skip("No leads available to test quotes endpoint")
    
    # Test 9: Bookings endpoint (prisma.booking accessor)
    def test_09_get_bookings(self, session, auth_headers):
        """Test GET /api/bookings (verifies prisma.booking accessor)"""
        response = session.get(f"{BASE_URL}/api/bookings", headers=auth_headers)
        assert response.status_code == 200, f"GET /api/bookings failed: {response.text}"
        data = response.json()
        
        # Handle various formats - API returns {bookings: [...], count: N}
        bookings = data.get("bookings", data.get("events", data)) if isinstance(data, dict) else data
        count = data.get("count", len(bookings) if isinstance(bookings, list) else 0)
        if isinstance(bookings, list):
            print(f"✓ GET /api/bookings returned {count} bookings (prisma.booking accessor works)")
        else:
            print(f"✓ GET /api/bookings works (prisma.booking accessor works)")
    
    # Test 10: Activities (prisma.activity accessor)
    def test_10_get_lead_activities(self, session, auth_headers):
        """Test GET /api/leads/:id/activities (verifies prisma.activity accessor)"""
        # First get a lead
        leads_response = session.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert leads_response.status_code == 200
        data = leads_response.json()
        
        # Handle both formats
        leads = data.get("leads", data) if isinstance(data, dict) else data
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            response = session.get(f"{BASE_URL}/api/leads/{lead_id}/activities", headers=auth_headers)
            assert response.status_code == 200, f"GET /api/leads/:id/activities failed: {response.text}"
            activities_data = response.json()
            
            # Handle wrapped response
            activities = activities_data.get("activities", activities_data) if isinstance(activities_data, dict) else activities_data
            if isinstance(activities, list):
                print(f"✓ GET /api/leads/:id/activities returned {len(activities)} activities (prisma.activity accessor works)")
            else:
                print(f"✓ GET /api/leads/:id/activities works (prisma.activity accessor works)")
        else:
            pytest.skip("No leads available to test activities endpoint")
    
    # Test 11: Additional Prisma accessors via GET endpoints
    def test_11_additional_endpoints(self, session, auth_headers):
        """Test additional endpoints to verify more Prisma accessors"""
        
        # Test portfolio (prisma.portfolio accessor)
        portfolio_response = session.get(f"{BASE_URL}/api/portfolio", headers=auth_headers)
        if portfolio_response.status_code == 200:
            print(f"✓ GET /api/portfolio works (prisma.portfolio accessor)")
        
        # Test testimonials (prisma.testimonial accessor)
        testimonials_response = session.get(f"{BASE_URL}/api/testimonials", headers=auth_headers)
        if testimonials_response.status_code == 200:
            print(f"✓ GET /api/testimonials works (prisma.testimonial accessor)")
        
        # Test income (prisma.income accessor)
        income_response = session.get(f"{BASE_URL}/api/income", headers=auth_headers)
        if income_response.status_code == 200:
            print(f"✓ GET /api/income works (prisma.income accessor)")
        
        # Test quote templates (prisma.quoteTemplate accessor)
        templates_response = session.get(f"{BASE_URL}/api/quotes/templates", headers=auth_headers)
        if templates_response.status_code == 200:
            print(f"✓ GET /api/quotes/templates works (prisma.quoteTemplate accessor)")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_leads(self):
        """Delete test leads created during testing"""
        session = requests.Session()
        
        # Login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            print("⚠ Could not login for cleanup")
            return
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all leads and delete test ones
        leads_response = session.get(f"{BASE_URL}/api/leads", headers=headers)
        if leads_response.status_code == 200:
            data = leads_response.json()
            leads = data.get("leads", data) if isinstance(data, dict) else data
            
            if isinstance(leads, list):
                test_leads = [l for l in leads if l.get("clientName", "").startswith("TEST_")]
                
                deleted_count = 0
                for lead in test_leads:
                    delete_response = session.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=headers)
                    if delete_response.status_code in [200, 204]:
                        deleted_count += 1
                
                print(f"✓ Cleanup completed - deleted {deleted_count} test leads")
            else:
                print(f"⚠ Unexpected leads format for cleanup")
        else:
            print(f"⚠ Could not get leads for cleanup")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
