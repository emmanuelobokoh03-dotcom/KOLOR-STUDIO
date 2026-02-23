#!/usr/bin/env python3
"""
KOLOR STUDIO Backend API Tests
Tests authentication system including signup, login, and protected routes
"""

import requests
import json
import sys
from datetime import datetime
import uuid

class KolorStudioAPITester:
    def __init__(self, base_url="https://crm-ready-go.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASSED" if success else "❌ FAILED"
        result = {
            "test": test_name,
            "status": "PASSED" if success else "FAILED", 
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {test_name}: {details}")
    
    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"response": response.text}
            
            if success:
                self.tests_passed += 1
                self.log_result(name, True, f"Status: {response.status_code}")
                return True, response_data
            else:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code} - {response_data}")
                return False, response_data
                
        except requests.exceptions.Timeout:
            self.log_result(name, False, "Request timeout")
            return False, {"error": "timeout"}
        except requests.exceptions.ConnectionError:
            self.log_result(name, False, "Connection error - server may be down")
            return False, {"error": "connection_error"}
        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "/health",
            200
        )
        return success

    def test_signup_validation(self):
        """Test signup with missing required fields"""
        print("\n📝 Testing Signup Validation...")
        
        # Test missing fields
        test_cases = [
            ({"email": "test@test.com"}, "missing password, firstName, lastName"),
            ({"password": "123456"}, "missing email, firstName, lastName"),
            ({"email": "test@test.com", "password": "123456"}, "missing firstName, lastName"),
            ({"email": "invalid-email", "password": "123456", "firstName": "Test", "lastName": "User"}, "invalid email format"),
        ]
        
        validation_passed = 0
        for test_data, description in test_cases:
            success, _ = self.run_test(
                f"Signup Validation - {description}",
                "POST",
                "/auth/signup",
                400,
                test_data
            )
            if success:
                validation_passed += 1
        
        return validation_passed == len(test_cases)

    def test_signup_new_user(self):
        """Test creating a new user account"""
        # Generate unique test user
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        self.test_user_data = {
            "firstName": "Test",
            "lastName": "User",
            "studioName": "Test Studio",
            "email": f"test_user_{timestamp}_{unique_id}@example.com",
            "password": "testpassword123"
        }
        
        success, response = self.run_test(
            "New User Signup",
            "POST",
            "/auth/signup",
            201,
            self.test_user_data
        )
        
        if success and 'user' in response:
            print(f"   ✅ User created with ID: {response['user'].get('id')}")
            return True
        return False

    def test_signup_duplicate_email(self):
        """Test signup with existing email"""
        # Try to create user with same email
        success, _ = self.run_test(
            "Duplicate Email Signup",
            "POST", 
            "/auth/signup",
            409,  # Conflict
            self.test_user_data
        )
        return success

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n🔑 Testing Login with Invalid Credentials...")
        
        test_cases = [
            ({"email": "nonexistent@example.com", "password": "wrongpass"}, "non-existent user"),
            ({"email": self.test_user_data["email"], "password": "wrongpassword"}, "wrong password"),
            ({"email": "", "password": "test123"}, "empty email"),
            ({"email": "test@test.com", "password": ""}, "empty password"),
        ]
        
        validation_passed = 0
        for test_data, description in test_cases:
            expected_status = 400 if not test_data["email"] or not test_data["password"] else 401
            success, _ = self.run_test(
                f"Invalid Login - {description}",
                "POST",
                "/auth/login", 
                expected_status,
                test_data
            )
            if success:
                validation_passed += 1
        
        return validation_passed == len(test_cases)

    def test_login_valid_user(self):
        """Test login with valid credentials"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        success, response = self.run_test(
            "Valid User Login",
            "POST",
            "/auth/login",
            200,
            login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Token received: {self.token[:20]}...")
            print(f"   ✅ User data: {response.get('user', {}).get('firstName')} {response.get('user', {}).get('lastName')}")
            return True
        return False

    def test_existing_user_login(self):
        """Test login with existing test user"""
        login_data = {
            "email": "test@example.com",
            "password": "test123456"
        }
        
        success, response = self.run_test(
            "Existing Test User Login",
            "POST",
            "/auth/login",
            200,
            login_data
        )
        
        if success and 'token' in response:
            self.existing_token = response['token']
            print(f"   ✅ Existing user token: {self.existing_token[:20]}...")
            return True
        return False

    def test_protected_route_no_auth(self):
        """Test accessing protected route without authentication"""
        # Temporarily clear token
        original_token = self.token
        self.token = None
        
        success, _ = self.run_test(
            "Protected Route - No Auth",
            "GET",
            "/auth/me",
            401,
            auth_required=False
        )
        
        # Restore token
        self.token = original_token
        return success

    def test_protected_route_invalid_token(self):
        """Test accessing protected route with invalid token"""
        # Use invalid token
        original_token = self.token
        self.token = "invalid_token_12345"
        
        success, _ = self.run_test(
            "Protected Route - Invalid Token",
            "GET",
            "/auth/me",
            401,
            auth_required=True
        )
        
        # Restore token
        self.token = original_token
        return success

    def test_get_user_profile(self):
        """Test getting authenticated user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "/auth/me",
            200,
            auth_required=True
        )
        
        if success and 'user' in response:
            user = response['user']
            print(f"   ✅ User Profile: {user.get('firstName')} {user.get('lastName')}")
            print(f"   ✅ Email: {user.get('email')}")
            print(f"   ✅ Studio: {user.get('studioName', 'Not set')}")
            return True
        return False

    def test_get_existing_user_profile(self):
        """Test getting existing user profile"""
        if not hasattr(self, 'existing_token'):
            print("   ⚠️  Skipping - no existing user token")
            return True
            
        # Use existing user token
        original_token = self.token
        self.token = self.existing_token
        
        success, response = self.run_test(
            "Get Existing User Profile", 
            "GET",
            "/auth/me",
            200,
            auth_required=True
        )
        
        # Restore token
        self.token = original_token
        
        if success and 'user' in response:
            user = response['user']
            print(f"   ✅ Existing User: {user.get('firstName')} {user.get('lastName')}")
            return True
        return False

    # LEADS API TESTS
    def test_get_leads_unauthorized(self):
        """Test getting leads without auth token"""
        original_token = self.token
        self.token = None
        
        success, _ = self.run_test(
            "Get Leads - No Auth",
            "GET",
            "/leads",
            401,
            auth_required=False
        )
        
        self.token = original_token
        return success

    def test_get_leads_authorized(self):
        """Test getting leads with valid auth"""
        if not hasattr(self, 'existing_token'):
            print("   ⚠️  Skipping - using current token")
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        success, response = self.run_test(
            "Get Leads - Authenticated",
            "GET", 
            "/leads",
            200,
            auth_required=True
        )
        
        self.token = original_token
        
        if success:
            leads = response.get('leads', [])
            print(f"   ✅ Found {len(leads)} leads")
            if leads:
                self.sample_lead_id = leads[0]['id']
                print(f"   ✅ Sample lead ID: {self.sample_lead_id}")
            return True
        return False

    def test_get_leads_stats(self):
        """Test getting lead statistics"""
        if not hasattr(self, 'existing_token'):
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        success, response = self.run_test(
            "Get Lead Stats",
            "GET",
            "/leads/stats", 
            200,
            auth_required=True
        )
        
        self.token = original_token
        
        if success:
            print(f"   ✅ Total leads: {response.get('total', 0)}")
            print(f"   ✅ Status counts: {response.get('statusCounts', {})}")
            return True
        return False

    def test_create_lead_missing_fields(self):
        """Test creating lead with missing required fields"""
        if not hasattr(self, 'existing_token'):
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        invalid_data = {
            "clientName": "Test Client",
            # Missing required fields
        }
        
        success, _ = self.run_test(
            "Create Lead - Missing Fields",
            "POST",
            "/leads",
            400,
            invalid_data,
            auth_required=True
        )
        
        self.token = original_token
        return success

    def test_create_lead_valid(self):
        """Test creating a new lead with valid data"""
        if not hasattr(self, 'existing_token'):
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        self.test_lead_data = {
            "clientName": f"Test Client {timestamp}",
            "clientEmail": f"client_{timestamp}@example.com",
            "clientPhone": "+1-555-0123",
            "clientCompany": "Test Company",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"Test Project {timestamp}",
            "description": "This is a test project for testing purposes",
            "budget": "$2,000 - $5,000",
            "timeline": "2-3 weeks",
            "priority": "MEDIUM",
            "source": "WEBSITE"
        }
        
        success, response = self.run_test(
            "Create Lead - Valid Data",
            "POST",
            "/leads",
            201,
            self.test_lead_data,
            auth_required=True
        )
        
        self.token = original_token
        
        if success and 'lead' in response:
            self.created_lead_id = response['lead']['id']
            print(f"   ✅ Lead created with ID: {self.created_lead_id}")
            return True
        return False

    def test_public_lead_submission(self):
        """Test public lead submission (no auth required)"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        public_lead_data = {
            "clientName": f"Public Client {timestamp}",
            "clientEmail": f"public_{timestamp}@example.com",
            "clientPhone": "+1-555-9999",
            "serviceType": "VIDEOGRAPHY",
            "projectTitle": f"Public Project {timestamp}",
            "description": "This is a public inquiry submission",
            "budget": "$1,000 - $3,000",
            "timeline": "1 month"
        }
        
        success, response = self.run_test(
            "Public Lead Submission",
            "POST",
            "/leads/submit",
            201,
            public_lead_data,
            auth_required=False
        )
        
        if success:
            print(f"   ✅ Public lead submitted with ID: {response.get('leadId')}")
            return True
        return False

    def test_update_lead_status(self):
        """Test updating lead status"""
        if not hasattr(self, 'created_lead_id'):
            print("   ⚠️  Skipping - no created lead")
            return True

        if not hasattr(self, 'existing_token'):
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        status_data = {"status": "CONTACTED"}
        
        success, response = self.run_test(
            "Update Lead Status",
            "PATCH",
            f"/leads/{self.created_lead_id}/status",
            200,
            status_data,
            auth_required=True
        )
        
        self.token = original_token
        
        if success:
            print(f"   ✅ Lead status updated to: {response.get('lead', {}).get('status')}")
            return True
        return False

    def test_get_single_lead(self):
        """Test getting single lead by ID"""
        if not hasattr(self, 'created_lead_id'):
            print("   ⚠️  Skipping - no created lead")
            return True

        if not hasattr(self, 'existing_token'):
            auth_token = self.token  
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        success, response = self.run_test(
            "Get Single Lead",
            "GET",
            f"/leads/{self.created_lead_id}",
            200,
            auth_required=True
        )
        
        self.token = original_token
        
        if success and 'lead' in response:
            lead = response['lead']
            print(f"   ✅ Retrieved lead: {lead.get('projectTitle')}")
            return True
        return False

    def test_update_lead_full(self):
        """Test full lead update"""
        if not hasattr(self, 'created_lead_id'):
            print("   ⚠️  Skipping - no created lead")
            return True

        if not hasattr(self, 'existing_token'):
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        update_data = {
            "budget": "$5,000 - $10,000",
            "priority": "HIGH",
            "tags": ["urgent", "corporate"]
        }
        
        success, response = self.run_test(
            "Update Lead Full",
            "PATCH",
            f"/leads/{self.created_lead_id}",
            200,
            update_data,
            auth_required=True
        )
        
        self.token = original_token
        
        if success:
            print(f"   ✅ Lead updated successfully")
            return True
        return False

    def test_delete_lead_unauthorized(self):
        """Test deleting lead without proper ownership"""
        if not hasattr(self, 'created_lead_id'):
            print("   ⚠️  Skipping - no created lead")
            return True

        # Use the new user token (different from existing user)
        success, _ = self.run_test(
            "Delete Lead - Wrong User",
            "DELETE",
            f"/leads/{self.created_lead_id}",
            404,  # Not found due to ownership check
            auth_required=True
        )
        
        return success

    def test_delete_lead_authorized(self):
        """Test deleting lead with proper authorization"""
        if not hasattr(self, 'created_lead_id'):
            print("   ⚠️  Skipping - no created lead")
            return True

        if not hasattr(self, 'existing_token'):
            auth_token = self.token
        else:
            auth_token = self.existing_token

        original_token = self.token
        self.token = auth_token
        
        success, response = self.run_test(
            "Delete Lead - Authorized",
            "DELETE",
            f"/leads/{self.created_lead_id}",
            200,
            auth_required=True
        )
        
        self.token = original_token
        
        if success:
            print(f"   ✅ Lead deleted successfully")
            return True
        return False

    def run_all_tests(self):
        """Run all API tests including authentication and leads"""
        print("🚀 Starting KOLOR STUDIO API Tests - Authentication & Leads Pipeline")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("API Health Check", self.test_health_check),
            ("Signup Validation", self.test_signup_validation), 
            ("New User Signup", self.test_signup_new_user),
            ("Duplicate Email Protection", self.test_signup_duplicate_email),
            ("Invalid Login Attempts", self.test_login_invalid_credentials),
            ("Valid User Login", self.test_login_valid_user),
            ("Existing User Login", self.test_existing_user_login),
            ("Protected Route - No Auth", self.test_protected_route_no_auth),
            ("Protected Route - Invalid Token", self.test_protected_route_invalid_token),
            ("Get User Profile", self.test_get_user_profile),
            ("Get Existing User Profile", self.test_get_existing_user_profile),
            # Lead Pipeline Tests
            ("Get Leads - Unauthorized", self.test_get_leads_unauthorized),
            ("Get Leads - Authorized", self.test_get_leads_authorized),
            ("Get Lead Stats", self.test_get_leads_stats),
            ("Create Lead - Missing Fields", self.test_create_lead_missing_fields),
            ("Create Lead - Valid Data", self.test_create_lead_valid),
            ("Public Lead Submission", self.test_public_lead_submission),
            ("Update Lead Status", self.test_update_lead_status),
            ("Get Single Lead", self.test_get_single_lead),
            ("Update Lead Full", self.test_update_lead_full),
            ("Delete Lead - Wrong User", self.test_delete_lead_unauthorized),
            ("Delete Lead - Authorized", self.test_delete_lead_authorized),
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if not result:
                    print(f"   ⚠️  Test '{test_name}' had issues")
            except Exception as e:
                print(f"   ❌ Test '{test_name}' failed with exception: {e}")
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Test Results Summary - Authentication & Leads Pipeline")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Backend API system is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} tests failed. Check the issues above.")
            return 1

def main():
    tester = KolorStudioAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())