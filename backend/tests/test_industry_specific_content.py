"""
Industry-Specific Content Tests for KOLOR STUDIO CRM
Tests:
- Industry-specific demo project creation during onboarding
- Industry-specific email sequence seeding during onboarding
- No demo project at signup (only during onboarding)
- Existing user login regression
- Sequences API health check
- Health endpoint
"""

import pytest
import requests
import os
import time
import uuid

# Use the public API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

# Test credentials
EXISTING_USER_EMAIL = "emmanuelobokoh03@gmail.com"
EXISTING_USER_PASSWORD = "successful26#"

# Generate unique test emails for this iteration
UNIQUE_SUFFIX = str(uuid.uuid4())[:8]
TEST_PHOTO_EMAIL = f"test.photo.v41.{UNIQUE_SUFFIX}@example.com"
TEST_ART_EMAIL = f"test.art.v41.{UNIQUE_SUFFIX}@example.com"
TEST_DESIGN_EMAIL = f"test.design.v41.{UNIQUE_SUFFIX}@example.com"
TEST_SIGNUP_ONLY_EMAIL = f"test.signup.only.v41.{UNIQUE_SUFFIX}@example.com"

# Expected industry-specific content
EXPECTED_CONTENT = {
    'PHOTOGRAPHY': {
        'project_title': 'Wedding Photography',
        'client_name': 'Sarah Johnson (Demo)',
        'sequence_name': 'Quote Follow-Up',
    },
    'FINE_ART': {
        'project_title': 'Custom Portrait Commission',
        'client_name': 'Marcus Chen (Demo)',
        'sequence_name': 'Commission Follow-Up',
    },
    'GRAPHIC_DESIGN': {
        'project_title': 'Brand Identity Package',
        'client_name': 'Olivia Park (Demo)',
        'sequence_name': 'Project Follow-Up',
    },
}


class TestHealthEndpoint:
    """Test health endpoint for connection pool stability"""
    
    def test_health_returns_200(self):
        """Health endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health check response: {response.status_code}")
        assert response.status_code == 200, f"Health check failed: {response.text}"


class TestExistingUserRegression:
    """Regression tests for existing user login and API access"""
    
    def test_existing_user_login(self):
        """Existing user should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_USER_EMAIL,
            "password": EXISTING_USER_PASSWORD
        })
        print(f"Login response: {response.status_code}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token missing from login response"
        assert "user" in data, "User data missing from login response"
        
        # Store token for next test
        TestExistingUserRegression.auth_token = data["token"]
        TestExistingUserRegression.user_id = data["user"]["id"]
        print(f"Login successful for user: {data['user']['email']}")
    
    def test_sequences_api_accessible(self):
        """Sequences API should work (no connection pool errors)"""
        if not hasattr(TestExistingUserRegression, 'auth_token'):
            pytest.skip("Login test must pass first")
        
        headers = {"Authorization": f"Bearer {TestExistingUserRegression.auth_token}"}
        response = requests.get(f"{BASE_URL}/api/sequences", headers=headers)
        print(f"Sequences API response: {response.status_code}")
        assert response.status_code == 200, f"Sequences API failed: {response.text}"
        
        data = response.json()
        assert "sequences" in data, "Sequences key missing from response"
        print(f"Found {len(data['sequences'])} sequences for existing user")


class TestSignupNoDemo:
    """Test that signup alone does NOT create demo project"""
    
    def test_signup_only_no_demo(self):
        """Signing up should NOT create demo project (only onboarding creates it)"""
        # Signup new user
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_SIGNUP_ONLY_EMAIL,
            "password": "testpassword123",
            "firstName": "SignupTest",
            "lastName": "User"
        })
        print(f"Signup response: {response.status_code}")
        assert response.status_code == 201, f"Signup failed: {response.text}"
        
        # Login to get token and user_id
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_SIGNUP_ONLY_EMAIL,
            "password": "testpassword123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        token = login_data["token"]
        user_id = login_data["user"]["id"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Check leads - the API returns user's leads + unassigned leads
        # We need to check that NO demo lead was created for THIS user
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        print(f"Leads response: {leads_response.status_code}")
        assert leads_response.status_code == 200, f"Leads API failed: {leads_response.text}"
        
        leads_data = leads_response.json()
        leads = leads_data.get("leads", leads_data) if isinstance(leads_data, dict) else leads_data
        
        # Filter to find demo leads assigned to this user
        user_demo_leads = [lead for lead in leads if lead.get('assignedToId') == user_id and lead.get('isDemoData')]
        
        print(f"Total leads visible: {len(leads) if isinstance(leads, list) else 'unknown'}")
        print(f"Demo leads assigned to this user: {len(user_demo_leads)}")
        
        # Should have NO demo leads assigned to this user (no demo project created at signup)
        assert len(user_demo_leads) == 0, f"Expected 0 demo leads after signup (before onboarding), got {len(user_demo_leads)}"
        
        # Check sequences - should be empty (no sequence seeded yet)
        seq_response = requests.get(f"{BASE_URL}/api/sequences", headers=headers)
        assert seq_response.status_code == 200
        seq_data = seq_response.json()
        sequences = seq_data.get("sequences", [])
        print(f"Sequences count after signup (before onboarding): {len(sequences)}")
        assert len(sequences) == 0, f"Expected 0 sequences after signup (before onboarding), got {len(sequences)}"
        
        # Store token for cleanup
        TestSignupNoDemo.token = token
        print("PASS: No demo project or sequences created at signup (correct behavior)")


class TestIndustryPhotography:
    """Test PHOTOGRAPHY industry creates correct demo content"""
    
    def test_photography_signup_and_onboard(self):
        """Signup and onboard as PHOTOGRAPHY user"""
        # Signup
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_PHOTO_EMAIL,
            "password": "testpassword123",
            "firstName": "PhotoTest",
            "lastName": "User"
        })
        print(f"Photography signup response: {response.status_code}")
        assert response.status_code == 201, f"Signup failed: {response.text}"
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHOTO_EMAIL,
            "password": "testpassword123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Onboard with PHOTOGRAPHY industry
        onboard_response = requests.post(
            f"{BASE_URL}/api/auth/onboarding",
            headers=headers,
            json={"primaryIndustry": "PHOTOGRAPHY"}
        )
        print(f"Onboarding response: {onboard_response.status_code}")
        assert onboard_response.status_code == 200, f"Onboarding failed: {onboard_response.text}"
        
        # Wait for async demo creation
        print("Waiting 3 seconds for async demo project creation...")
        time.sleep(3)
        
        # Verify demo project created
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert leads_response.status_code == 200, f"Leads API failed: {leads_response.text}"
        
        leads_data = leads_response.json()
        leads = leads_data.get("leads", leads_data) if isinstance(leads_data, dict) else leads_data
        
        print(f"Leads count after PHOTOGRAPHY onboarding: {len(leads) if isinstance(leads, list) else 'unknown'}")
        
        # Should have 1 demo lead
        assert isinstance(leads, list) and len(leads) >= 1, f"Expected at least 1 lead, got {leads}"
        
        # Check demo project content
        demo_lead = leads[0] if leads else None
        assert demo_lead is not None, "No demo lead found"
        
        expected = EXPECTED_CONTENT['PHOTOGRAPHY']
        print(f"Demo lead project title: {demo_lead.get('projectTitle')}")
        print(f"Demo lead client name: {demo_lead.get('clientName')}")
        
        assert demo_lead.get('projectTitle') == expected['project_title'], \
            f"Expected project title '{expected['project_title']}', got '{demo_lead.get('projectTitle')}'"
        assert demo_lead.get('clientName') == expected['client_name'], \
            f"Expected client name '{expected['client_name']}', got '{demo_lead.get('clientName')}'"
        
        # Verify sequence seeded
        seq_response = requests.get(f"{BASE_URL}/api/sequences", headers=headers)
        assert seq_response.status_code == 200
        seq_data = seq_response.json()
        sequences = seq_data.get("sequences", [])
        
        print(f"Sequences count after PHOTOGRAPHY onboarding: {len(sequences)}")
        assert len(sequences) >= 1, f"Expected at least 1 sequence, got {len(sequences)}"
        
        sequence = sequences[0]
        print(f"Sequence name: {sequence.get('name')}")
        
        assert sequence.get('name') == expected['sequence_name'], \
            f"Expected sequence name '{expected['sequence_name']}', got '{sequence.get('name')}'"
        
        # Verify 3 steps in sequence
        steps_array = sequence.get('steps', [])
        step_count = len(steps_array)
        print(f"Sequence step count (from steps array): {step_count}")
        assert step_count == 3, f"Expected 3 steps in sequence, got {step_count}"
        
        print("PASS: PHOTOGRAPHY industry creates correct demo content")


class TestIndustryFineArt:
    """Test FINE_ART industry creates correct demo content"""
    
    def test_fine_art_signup_and_onboard(self):
        """Signup and onboard as FINE_ART user"""
        # Signup
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_ART_EMAIL,
            "password": "testpassword123",
            "firstName": "ArtTest",
            "lastName": "User"
        })
        print(f"Fine Art signup response: {response.status_code}")
        assert response.status_code == 201, f"Signup failed: {response.text}"
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_ART_EMAIL,
            "password": "testpassword123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Onboard with FINE_ART industry
        onboard_response = requests.post(
            f"{BASE_URL}/api/auth/onboarding",
            headers=headers,
            json={"primaryIndustry": "FINE_ART"}
        )
        print(f"Onboarding response: {onboard_response.status_code}")
        assert onboard_response.status_code == 200, f"Onboarding failed: {onboard_response.text}"
        
        # Wait for async demo creation
        print("Waiting 3 seconds for async demo project creation...")
        time.sleep(3)
        
        # Verify demo project created
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert leads_response.status_code == 200, f"Leads API failed: {leads_response.text}"
        
        leads_data = leads_response.json()
        leads = leads_data.get("leads", leads_data) if isinstance(leads_data, dict) else leads_data
        
        print(f"Leads count after FINE_ART onboarding: {len(leads) if isinstance(leads, list) else 'unknown'}")
        
        # Should have 1 demo lead
        assert isinstance(leads, list) and len(leads) >= 1, f"Expected at least 1 lead, got {leads}"
        
        # Check demo project content
        demo_lead = leads[0] if leads else None
        assert demo_lead is not None, "No demo lead found"
        
        expected = EXPECTED_CONTENT['FINE_ART']
        print(f"Demo lead project title: {demo_lead.get('projectTitle')}")
        print(f"Demo lead client name: {demo_lead.get('clientName')}")
        
        assert demo_lead.get('projectTitle') == expected['project_title'], \
            f"Expected project title '{expected['project_title']}', got '{demo_lead.get('projectTitle')}'"
        assert demo_lead.get('clientName') == expected['client_name'], \
            f"Expected client name '{expected['client_name']}', got '{demo_lead.get('clientName')}'"
        
        # Verify sequence seeded
        seq_response = requests.get(f"{BASE_URL}/api/sequences", headers=headers)
        assert seq_response.status_code == 200
        seq_data = seq_response.json()
        sequences = seq_data.get("sequences", [])
        
        print(f"Sequences count after FINE_ART onboarding: {len(sequences)}")
        assert len(sequences) >= 1, f"Expected at least 1 sequence, got {len(sequences)}"
        
        sequence = sequences[0]
        print(f"Sequence name: {sequence.get('name')}")
        
        assert sequence.get('name') == expected['sequence_name'], \
            f"Expected sequence name '{expected['sequence_name']}', got '{sequence.get('name')}'"
        
        # Verify 3 steps in sequence
        steps_array = sequence.get('steps', [])
        step_count = len(steps_array)
        print(f"Sequence step count (from steps array): {step_count}")
        assert step_count == 3, f"Expected 3 steps in sequence, got {step_count}"
        
        print("PASS: FINE_ART industry creates correct demo content")


class TestIndustryGraphicDesign:
    """Test GRAPHIC_DESIGN industry creates correct demo content"""
    
    def test_graphic_design_signup_and_onboard(self):
        """Signup and onboard as GRAPHIC_DESIGN user"""
        # Signup
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_DESIGN_EMAIL,
            "password": "testpassword123",
            "firstName": "DesignTest",
            "lastName": "User"
        })
        print(f"Graphic Design signup response: {response.status_code}")
        assert response.status_code == 201, f"Signup failed: {response.text}"
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_DESIGN_EMAIL,
            "password": "testpassword123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Onboard with GRAPHIC_DESIGN industry
        onboard_response = requests.post(
            f"{BASE_URL}/api/auth/onboarding",
            headers=headers,
            json={"primaryIndustry": "GRAPHIC_DESIGN"}
        )
        print(f"Onboarding response: {onboard_response.status_code}")
        assert onboard_response.status_code == 200, f"Onboarding failed: {onboard_response.text}"
        
        # Wait for async demo creation
        print("Waiting 3 seconds for async demo project creation...")
        time.sleep(3)
        
        # Verify demo project created
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert leads_response.status_code == 200, f"Leads API failed: {leads_response.text}"
        
        leads_data = leads_response.json()
        leads = leads_data.get("leads", leads_data) if isinstance(leads_data, dict) else leads_data
        
        print(f"Leads count after GRAPHIC_DESIGN onboarding: {len(leads) if isinstance(leads, list) else 'unknown'}")
        
        # Should have 1 demo lead
        assert isinstance(leads, list) and len(leads) >= 1, f"Expected at least 1 lead, got {leads}"
        
        # Check demo project content
        demo_lead = leads[0] if leads else None
        assert demo_lead is not None, "No demo lead found"
        
        expected = EXPECTED_CONTENT['GRAPHIC_DESIGN']
        print(f"Demo lead project title: {demo_lead.get('projectTitle')}")
        print(f"Demo lead client name: {demo_lead.get('clientName')}")
        
        assert demo_lead.get('projectTitle') == expected['project_title'], \
            f"Expected project title '{expected['project_title']}', got '{demo_lead.get('projectTitle')}'"
        assert demo_lead.get('clientName') == expected['client_name'], \
            f"Expected client name '{expected['client_name']}', got '{demo_lead.get('clientName')}'"
        
        # Verify sequence seeded
        seq_response = requests.get(f"{BASE_URL}/api/sequences", headers=headers)
        assert seq_response.status_code == 200
        seq_data = seq_response.json()
        sequences = seq_data.get("sequences", [])
        
        print(f"Sequences count after GRAPHIC_DESIGN onboarding: {len(sequences)}")
        assert len(sequences) >= 1, f"Expected at least 1 sequence, got {len(sequences)}"
        
        sequence = sequences[0]
        print(f"Sequence name: {sequence.get('name')}")
        
        assert sequence.get('name') == expected['sequence_name'], \
            f"Expected sequence name '{expected['sequence_name']}', got '{sequence.get('name')}'"
        
        # Verify 3 steps in sequence
        steps_array = sequence.get('steps', [])
        step_count = len(steps_array)
        print(f"Sequence step count (from steps array): {step_count}")
        assert step_count == 3, f"Expected 3 steps in sequence, got {step_count}"
        
        print("PASS: GRAPHIC_DESIGN industry creates correct demo content")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
