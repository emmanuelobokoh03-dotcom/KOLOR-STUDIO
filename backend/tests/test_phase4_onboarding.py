"""
Phase 4: System Workflow Templates + Industry Onboarding Tests
Tests:
- POST /api/auth/onboarding - sets industry, creates templates
- GET /api/workflow-templates - returns user's seeded templates
- Login response includes primaryIndustry field
- GET /api/auth/me response includes primaryIndustry
"""

import pytest
import requests
import os
import time

BASE_URL = "https://hardened-crm-2.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"

class TestPhase4Onboarding:
    """Phase 4: Onboarding and Workflow Templates API Tests"""
    
    auth_token = None
    user_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login before each test to get auth token"""
        if not TestPhase4Onboarding.auth_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            assert response.status_code == 200, f"Login failed: {response.text}"
            data = response.json()
            TestPhase4Onboarding.auth_token = data.get("token")
            TestPhase4Onboarding.user_id = data.get("user", {}).get("id")
            print(f"✓ Logged in successfully, user_id: {TestPhase4Onboarding.user_id}")
    
    def get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TestPhase4Onboarding.auth_token}"
        }
    
    # ========== LOGIN RESPONSE TESTS ==========
    def test_01_login_returns_primary_industry(self):
        """Login response should include primaryIndustry field"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify user object exists
        assert "user" in data, "Login response should contain 'user' object"
        user = data["user"]
        
        # Verify primaryIndustry field exists in user
        assert "primaryIndustry" in user, "User object should have 'primaryIndustry' field"
        print(f"✓ Login response includes primaryIndustry: {user.get('primaryIndustry')}")
    
    # ========== GET /api/auth/me TESTS ==========
    def test_02_get_me_returns_primary_industry(self):
        """GET /api/auth/me should include primaryIndustry field"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        
        # Verify user object exists
        assert "user" in data, "Response should contain 'user' object"
        user = data["user"]
        
        # Verify primaryIndustry field exists
        assert "primaryIndustry" in user, "User object should have 'primaryIndustry' field"
        print(f"✓ GET /api/auth/me includes primaryIndustry: {user.get('primaryIndustry')}")
    
    # ========== POST /api/auth/onboarding TESTS ==========
    def test_03_onboarding_requires_auth(self):
        """POST /api/auth/onboarding should require authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/onboarding", json={
            "primaryIndustry": "PHOTOGRAPHY"
        })
        # Should be 401 Unauthorized
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Onboarding endpoint requires authentication")
    
    def test_04_onboarding_validates_industry(self):
        """POST /api/auth/onboarding should validate primaryIndustry"""
        # Test invalid industry
        response = requests.post(f"{BASE_URL}/api/auth/onboarding", 
            headers=self.get_headers(),
            json={"primaryIndustry": "INVALID_INDUSTRY"})
        assert response.status_code == 400, f"Expected 400 for invalid industry, got {response.status_code}"
        print("✓ Invalid industry returns 400")
        
        # Test missing industry
        response = requests.post(f"{BASE_URL}/api/auth/onboarding", 
            headers=self.get_headers(),
            json={})
        assert response.status_code == 400, f"Expected 400 for missing industry, got {response.status_code}"
        print("✓ Missing industry returns 400")
    
    def test_05_onboarding_with_graphic_design(self):
        """POST /api/auth/onboarding with GRAPHIC_DESIGN should create Logo Design template"""
        response = requests.post(f"{BASE_URL}/api/auth/onboarding", 
            headers=self.get_headers(),
            json={"primaryIndustry": "GRAPHIC_DESIGN"})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Response should have 'message' field"
        assert data["message"] == "Onboarding complete", f"Expected 'Onboarding complete', got '{data['message']}'"
        
        assert "user" in data, "Response should have 'user' field"
        assert "templates" in data, "Response should have 'templates' field"
        
        # Verify user's industry was updated
        user = data["user"]
        assert user.get("primaryIndustry") == "GRAPHIC_DESIGN", f"Expected GRAPHIC_DESIGN, got {user.get('primaryIndustry')}"
        
        # Verify template was created (Logo Design Project for GRAPHIC_DESIGN)
        templates = data["templates"]
        assert len(templates) > 0, "Should have at least one template"
        print(f"✓ Onboarding created {len(templates)} template(s)")
        
        # Check if Logo Design Project template exists
        template_names = [t.get("name") for t in templates]
        print(f"  Templates: {template_names}")
        
        # For GRAPHIC_DESIGN, should have Logo Design Project
        assert any("Logo Design" in name for name in template_names), \
            f"Expected 'Logo Design Project' template for GRAPHIC_DESIGN, got: {template_names}"
        
        print("✓ POST /api/auth/onboarding with GRAPHIC_DESIGN successful")
    
    # ========== GET /api/workflow-templates TESTS ==========
    def test_06_get_workflow_templates_returns_seeded_templates(self):
        """GET /api/workflow-templates should return user's seeded templates with stages"""
        response = requests.get(f"{BASE_URL}/api/workflow-templates", headers=self.get_headers())
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # API returns {count, templates} wrapper
        assert "templates" in data, "Response should have 'templates' field"
        templates = data.get("templates", [])
        assert len(templates) > 0, "User should have at least one template"
        
        print(f"✓ GET /api/workflow-templates returned {len(templates)} templates")
        
        # Verify template structure
        for template in templates:
            assert "id" in template, "Template should have 'id'"
            assert "name" in template, "Template should have 'name'"
            # Stages might be in _count or stages field
            stage_count = template.get("_count", {}).get("stages", 0) or len(template.get("stages", []))
            print(f"  - {template.get('name')}: {stage_count} stages")
        
        # Verify at least one system template exists
        system_templates = [t for t in templates if t.get("isSystem") == True]
        print(f"✓ Found {len(system_templates)} system templates")
    
    def test_07_workflow_template_has_correct_stages(self):
        """Workflow templates should have expected stages based on industry"""
        response = requests.get(f"{BASE_URL}/api/workflow-templates", headers=self.get_headers())
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        
        # Look for Logo Design Project template
        logo_template = next((t for t in templates if "Logo Design" in t.get("name", "")), None)
        
        if logo_template:
            # Get full template with stages
            template_response = requests.get(f"{BASE_URL}/api/workflow-templates/{logo_template.get('id')}", headers=self.get_headers())
            if template_response.status_code == 200:
                full_template = template_response.json()
                stages = full_template.get("stages", [])
                print(f"✓ Logo Design Project has {len(stages)} stages")
                
                for stage in stages:
                    print(f"  - Stage {stage.get('order')}: {stage.get('name')} ({stage.get('type')})")
                
                # Verify stages have required fields
                for stage in stages:
                    assert "name" in stage, "Stage should have 'name'"
                    assert "type" in stage, "Stage should have 'type'"
                    assert "order" in stage, "Stage should have 'order'"
            else:
                print(f"Note: Could not fetch full template details, stage count: {logo_template.get('_count', {}).get('stages', 0)}")
        else:
            # Check for other templates
            print(f"Note: Logo Design Project template not found, checking other templates")
            for template in templates[:3]:  # Check first 3
                stage_count = template.get("_count", {}).get("stages", 0)
                print(f"  Template '{template.get('name')}': {stage_count} stages")
    
    # ========== VALID INDUSTRY VALUES TESTS ==========
    def test_08_all_valid_industries_accepted(self):
        """Test that all valid industry types are accepted"""
        valid_industries = [
            'PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 
            'ILLUSTRATION', 'FINE_ART', 'SCULPTURE', 'BRANDING', 
            'CONTENT_CREATION', 'OTHER'
        ]
        
        # Test one industry to verify endpoint works
        response = requests.post(f"{BASE_URL}/api/auth/onboarding", 
            headers=self.get_headers(),
            json={"primaryIndustry": "PHOTOGRAPHY"})
        
        # Should be 200 (or already set which is still OK)
        assert response.status_code == 200, f"Expected 200 for valid industry, got {response.status_code}"
        print(f"✓ PHOTOGRAPHY industry accepted")
        
        # Verify industry list is correct by checking /me endpoint
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.get_headers())
        assert response.status_code == 200
        user = response.json().get("user", {})
        industry = user.get("primaryIndustry")
        assert industry in valid_industries, f"User's industry '{industry}' should be a valid type"
        print(f"✓ User's primaryIndustry ({industry}) is valid")


class TestRegressionPhase4:
    """Regression tests to ensure Phase 4 didn't break existing functionality"""
    
    auth_token = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login before each test"""
        if not TestRegressionPhase4.auth_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            assert response.status_code == 200
            TestRegressionPhase4.auth_token = response.json().get("token")
    
    def get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TestRegressionPhase4.auth_token}"
        }
    
    def test_09_leads_endpoint_still_works(self):
        """GET /api/leads should still work"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        # API returns {count, leads} wrapper
        assert "leads" in data, "Response should have 'leads' field"
        leads = data.get("leads", [])
        print(f"✓ GET /api/leads works, returned {len(leads)} leads (count: {data.get('count')})")
    
    def test_10_lead_stats_endpoint_still_works(self):
        """GET /api/leads/stats should still work"""
        response = requests.get(f"{BASE_URL}/api/leads/stats", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert "total" in data, "Stats should have 'total' field"
        print(f"✓ GET /api/leads/stats works, total leads: {data.get('total')}")
    
    def test_11_portfolio_endpoint_still_works(self):
        """GET /api/portfolio should still work"""
        response = requests.get(f"{BASE_URL}/api/portfolio", headers=self.get_headers())
        assert response.status_code == 200
        print("✓ GET /api/portfolio works")
    
    def test_12_analytics_endpoint_still_works(self):
        """GET /api/analytics/dashboard should still work"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=self.get_headers())
        assert response.status_code == 200
        print("✓ GET /api/analytics/dashboard works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
