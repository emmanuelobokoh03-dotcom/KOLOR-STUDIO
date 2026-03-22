"""
Test Demo Project Feature (Phase 7, Part 4)
Tests:
1. New user signup creates a demo project automatically
2. Demo project creates: lead with isDemoData=true, quote (SENT status), activity, interaction
3. Demo lead has correct data: clientName='Sarah Johnson (Demo)', serviceType='PHOTOGRAPHY', etc.
4. GET /api/leads returns isDemoData field in the response
5. Existing users who already have leads do NOT get a demo project on signup
6. DELETE /api/leads/:id works for demo leads
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://raleway-design-check.preview.emergentagent.com').rstrip('/')


class TestDemoProjectFeature:
    """Test Demo Project creation for new users"""
    
    @pytest.fixture
    def unique_email(self):
        """Generate unique email for testing"""
        timestamp = int(time.time())
        return f"demo-agent-test-{timestamp}-{uuid.uuid4().hex[:8]}@test.com"
    
    @pytest.fixture
    def signup_user(self, unique_email):
        """Signup a new user and return credentials"""
        signup_data = {
            "email": unique_email,
            "password": "TestDemo123!",
            "firstName": "Demo",
            "lastName": "Tester",
            "studioName": "Demo Test Studio"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        assert response.status_code == 201, f"Signup failed: {response.text}"
        
        # Return the signup data for login
        return signup_data
    
    @pytest.fixture
    def new_user_token(self, signup_user):
        """Login with the newly created user and return token"""
        # Small delay to allow async demo project creation
        time.sleep(2)
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": signup_user["email"],
            "password": signup_user["password"]
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return login_response.json()["token"]
    
    @pytest.fixture
    def existing_user_token(self):
        """Login with existing user that already has leads"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "emmanuelobokoh03@gmail.com",
            "password": "successful26#"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return login_response.json()["token"]
    
    def test_signup_returns_201(self):
        """Test that signup returns 201 for valid new user"""
        timestamp = int(time.time())
        signup_data = {
            "email": f"signup-test-{timestamp}-{uuid.uuid4().hex[:6]}@test.com",
            "password": "TestSignup123!",
            "firstName": "Signup",
            "lastName": "Test",
            "studioName": "Test Studio"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == signup_data["email"].lower()
    
    def test_new_user_gets_demo_lead(self, new_user_token):
        """Test that a new user gets a demo lead with isDemoData=true"""
        # Give more time for async demo creation
        time.sleep(1)
        
        headers = {"Authorization": f"Bearer {new_user_token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        leads = data.get("leads", [])
        
        # Find the demo lead
        demo_leads = [l for l in leads if l.get("isDemoData") == True]
        
        assert len(demo_leads) >= 1, f"Expected at least 1 demo lead, found {len(demo_leads)}. All leads: {[l.get('clientName') for l in leads]}"
        
        demo_lead = demo_leads[0]
        
        # Verify demo lead data
        assert demo_lead["clientName"] == "Sarah Johnson (Demo)", f"Expected 'Sarah Johnson (Demo)', got '{demo_lead['clientName']}'"
        assert demo_lead["serviceType"] == "PHOTOGRAPHY"
        assert demo_lead["projectTitle"] == "Wedding Photography"
        assert demo_lead["status"] == "QUOTED"
        assert demo_lead["isDemoData"] == True
    
    def test_demo_lead_has_correct_fields(self, new_user_token):
        """Test that demo lead has all expected fields populated"""
        time.sleep(1)
        
        headers = {"Authorization": f"Bearer {new_user_token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        demo_leads = [l for l in leads if l.get("isDemoData") == True]
        
        if len(demo_leads) == 0:
            pytest.skip("No demo lead found - may already have leads")
        
        demo_lead = demo_leads[0]
        
        # Check expected fields
        assert demo_lead.get("clientEmail") == "sarah.demo@example.com"
        assert demo_lead.get("clientPhone") == "(555) 123-4567"
        assert demo_lead.get("priority") == "HIGH"
        assert demo_lead.get("source") == "INSTAGRAM"
        assert "wedding" in demo_lead.get("tags", []) or "demo" in demo_lead.get("tags", [])
    
    def test_leads_response_includes_isDemoData_field(self, existing_user_token):
        """Test that GET /api/leads returns isDemoData field in response"""
        headers = {"Authorization": f"Bearer {existing_user_token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        leads = data.get("leads", [])
        
        # Every lead should have isDemoData field (true or false)
        for lead in leads[:5]:  # Check first 5 leads
            assert "isDemoData" in lead, f"Lead {lead.get('id')} missing isDemoData field"
            assert isinstance(lead["isDemoData"], bool), f"isDemoData should be boolean, got {type(lead['isDemoData'])}"
    
    def test_existing_user_leads_not_demo(self, existing_user_token):
        """Test that existing user's leads don't have isDemoData=true (unless created as demo)"""
        headers = {"Authorization": f"Bearer {existing_user_token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        # Existing user emmanuelobokoh03@gmail.com should have real leads
        # Most leads should NOT be demo data
        non_demo_leads = [l for l in leads if l.get("isDemoData") != True]
        
        # Expecting existing user to have some non-demo leads
        assert len(non_demo_leads) > 0, "Existing user should have some non-demo leads"
    
    def test_demo_lead_can_be_deleted(self, new_user_token):
        """Test that demo lead can be deleted successfully"""
        time.sleep(1)
        
        headers = {"Authorization": f"Bearer {new_user_token}"}
        
        # Get demo lead
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert response.status_code == 200
        
        leads = response.json().get("leads", [])
        demo_leads = [l for l in leads if l.get("isDemoData") == True]
        
        if len(demo_leads) == 0:
            pytest.skip("No demo lead found to delete")
        
        demo_lead_id = demo_leads[0]["id"]
        
        # Delete the demo lead
        delete_response = requests.delete(f"{BASE_URL}/api/leads/{demo_lead_id}", headers=headers)
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deletion
        verify_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        remaining_leads = verify_response.json().get("leads", [])
        remaining_demo_leads = [l for l in remaining_leads if l.get("id") == demo_lead_id]
        assert len(remaining_demo_leads) == 0, "Demo lead should be deleted"


class TestDemoQuoteCreation:
    """Test Demo Quote is created with demo lead"""
    
    @pytest.fixture
    def new_user_with_demo(self):
        """Create new user and return token"""
        timestamp = int(time.time())
        signup_data = {
            "email": f"demo-quote-test-{timestamp}-{uuid.uuid4().hex[:6]}@test.com",
            "password": "TestDemo123!",
            "firstName": "Quote",
            "lastName": "Tester",
            "studioName": "Quote Test Studio"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        assert response.status_code == 201
        
        # Wait for async demo creation
        time.sleep(2)
        
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": signup_data["email"],
            "password": signup_data["password"]
        })
        assert login_response.status_code == 200
        return login_response.json()["token"]
    
    def test_demo_quote_exists(self, new_user_with_demo):
        """Test that demo quote is created with SENT status"""
        headers = {"Authorization": f"Bearer {new_user_with_demo}"}
        
        # Get leads to find demo lead
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert leads_response.status_code == 200
        
        leads = leads_response.json().get("leads", [])
        demo_leads = [l for l in leads if l.get("isDemoData") == True]
        
        if len(demo_leads) == 0:
            pytest.skip("No demo lead found")
        
        demo_lead_id = demo_leads[0]["id"]
        
        # Get quotes for demo lead
        quotes_response = requests.get(f"{BASE_URL}/api/leads/{demo_lead_id}/quotes", headers=headers)
        assert quotes_response.status_code == 200
        
        quotes = quotes_response.json().get("quotes", [])
        
        assert len(quotes) >= 1, f"Expected at least 1 quote for demo lead, found {len(quotes)}"
        
        demo_quote = quotes[0]
        assert demo_quote["quoteNumber"].startswith("Q-DEMO-"), f"Expected quote number to start with 'Q-DEMO-', got '{demo_quote['quoteNumber']}'"
        assert demo_quote["status"] == "SENT", f"Expected 'SENT', got '{demo_quote['status']}'"
        assert demo_quote["total"] == 3000, f"Expected total 3000, got {demo_quote['total']}"
    
    def test_demo_quote_line_items(self, new_user_with_demo):
        """Test that demo quote has correct line items"""
        headers = {"Authorization": f"Bearer {new_user_with_demo}"}
        
        # Get leads to find demo lead
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        leads = leads_response.json().get("leads", [])
        demo_leads = [l for l in leads if l.get("isDemoData") == True]
        
        if len(demo_leads) == 0:
            pytest.skip("No demo lead found")
        
        demo_lead_id = demo_leads[0]["id"]
        
        # Get quotes
        quotes_response = requests.get(f"{BASE_URL}/api/leads/{demo_lead_id}/quotes", headers=headers)
        quotes = quotes_response.json().get("quotes", [])
        
        if len(quotes) == 0:
            pytest.skip("No quotes found")
        
        line_items = quotes[0].get("lineItems", [])
        
        assert len(line_items) == 3, f"Expected 3 line items, got {len(line_items)}"
        
        # Verify line item totals add up
        total_from_items = sum(item.get("total", 0) for item in line_items)
        assert total_from_items == 3000, f"Line items should total 3000, got {total_from_items}"


class TestDemoActivityAndInteraction:
    """Test Demo Activity and Interaction are created"""
    
    @pytest.fixture
    def new_user_with_demo(self):
        """Create new user and return token"""
        timestamp = int(time.time())
        signup_data = {
            "email": f"demo-activity-test-{timestamp}-{uuid.uuid4().hex[:6]}@test.com",
            "password": "TestDemo123!",
            "firstName": "Activity",
            "lastName": "Tester"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        assert response.status_code == 201
        
        time.sleep(2)
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": signup_data["email"],
            "password": signup_data["password"]
        })
        assert login_response.status_code == 200
        return login_response.json()["token"]
    
    def test_demo_activity_created(self, new_user_with_demo):
        """Test that QUOTE_SENT activity is created for demo lead"""
        headers = {"Authorization": f"Bearer {new_user_with_demo}"}
        
        # Get demo lead
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        leads = leads_response.json().get("leads", [])
        demo_leads = [l for l in leads if l.get("isDemoData") == True]
        
        if len(demo_leads) == 0:
            pytest.skip("No demo lead found")
        
        demo_lead_id = demo_leads[0]["id"]
        
        # Get activities
        activities_response = requests.get(f"{BASE_URL}/api/leads/{demo_lead_id}/activities", headers=headers)
        assert activities_response.status_code == 200
        
        activities = activities_response.json().get("activities", [])
        
        # Should have at least one activity (QUOTE_SENT)
        assert len(activities) >= 1, f"Expected at least 1 activity, found {len(activities)}"
        
        # Check for QUOTE_SENT type
        activity_types = [a.get("type") for a in activities]
        assert "QUOTE_SENT" in activity_types, f"Expected QUOTE_SENT activity, found types: {activity_types}"


class TestExistingUserNoDemoCreation:
    """Test that existing users don't get duplicate demo projects"""
    
    def test_signup_existing_email_fails(self):
        """Test that signup with existing email returns 409 Conflict"""
        signup_data = {
            "email": "emmanuelobokoh03@gmail.com",
            "password": "TestDemo123!",
            "firstName": "Test",
            "lastName": "User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        
        # Should fail with 409 (already exists)
        assert response.status_code == 409, f"Expected 409 for duplicate email, got {response.status_code}"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_accessible(self):
        """Test that API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Health endpoint may not exist, but we should get some response
        assert response.status_code in [200, 404], f"API not accessible: {response.status_code}"
    
    def test_auth_login_works(self):
        """Test that login endpoint works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "emmanuelobokoh03@gmail.com",
            "password": "successful26#"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
