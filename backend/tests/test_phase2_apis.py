"""
Phase 2 API Tests - KOLOR STUDIO CRM
Tests for:
- Workflow Templates CRUD
- Deliverables CRUD  
- Lead field updates (projectType, industry, deliverableType)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"

# Valid enum values
VALID_PROJECT_TYPES = ['SERVICE', 'COMMISSION', 'PROJECT', 'PRODUCT_SALE']
VALID_INDUSTRIES = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 'ILLUSTRATION', 'FINE_ART', 'SCULPTURE', 'BRANDING', 'CONTENT_CREATION', 'OTHER']
VALID_DELIVERABLE_TYPES = ['DIGITAL_FILES', 'PHYSICAL_ART', 'PRINTS', 'SERVICE', 'WEBSITE', 'MIXED']
VALID_DELIVERABLE_STATUSES = ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'SHIPPED']


class TestAuth:
    """Authentication - get token for subsequent tests"""
    
    def test_login_success(self):
        """POST /api/auth/login - Login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        # Store token for use by other tests
        pytest.auth_token = data["token"]
        pytest.user_id = data["user"]["id"]
        print(f"✅ Login successful, user_id: {pytest.user_id}")


class TestLeadsWithNewFields:
    """Tests for GET/PATCH leads with new fields (projectType, industry, deliverableType)"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {pytest.auth_token}"}
    
    def test_get_leads_returns_new_fields(self, auth_headers):
        """GET /api/leads - Returns leads with projectType, industry, deliverableType"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "leads" in data
        assert data["count"] >= 0
        
        # Check if leads have new fields (defaults should be set)
        if data["count"] > 0:
            lead = data["leads"][0]
            assert "projectType" in lead, "Lead missing projectType field"
            print(f"✅ GET /api/leads returns {data['count']} leads with new fields")
            print(f"   Sample lead projectType: {lead.get('projectType')}, industry: {lead.get('industry')}, deliverableType: {lead.get('deliverableType')}")
    
    def test_filter_leads_by_project_type(self, auth_headers):
        """GET /api/leads?projectType=SERVICE - Filter by projectType"""
        response = requests.get(f"{BASE_URL}/api/leads?projectType=SERVICE", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "leads" in data
        print(f"✅ Filter by projectType=SERVICE returns {data['count']} leads")
    
    def test_get_single_lead_with_new_fields(self, auth_headers):
        """GET /api/leads/:id - Returns single lead with new fields"""
        # First get a lead ID
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            assert response.status_code == 200, f"Failed: {response.text}"
            data = response.json()
            assert "lead" in data
            lead = data["lead"]
            assert "projectType" in lead
            print(f"✅ GET /api/leads/{lead_id[:8]}... returns lead with new fields")
        else:
            pytest.skip("No leads available to test")
    
    def test_patch_lead_new_fields(self, auth_headers):
        """PATCH /api/leads/:id - Can update projectType, industry, deliverableType"""
        # First get a lead ID
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            
            # Update with new field values
            update_data = {
                "projectType": "COMMISSION",
                "industry": "PHOTOGRAPHY",
                "deliverableType": "PRINTS"
            }
            response = requests.patch(f"{BASE_URL}/api/leads/{lead_id}", json=update_data, headers=auth_headers)
            assert response.status_code == 200, f"PATCH failed: {response.text}"
            data = response.json()
            assert "lead" in data
            
            # Verify the update
            updated_lead = data["lead"]
            assert updated_lead.get("projectType") == "COMMISSION", f"projectType not updated, got: {updated_lead.get('projectType')}"
            assert updated_lead.get("industry") == "PHOTOGRAPHY", f"industry not updated, got: {updated_lead.get('industry')}"
            assert updated_lead.get("deliverableType") == "PRINTS", f"deliverableType not updated, got: {updated_lead.get('deliverableType')}"
            
            # GET to verify persistence
            verify_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            assert verify_response.status_code == 200
            verify_data = verify_response.json()["lead"]
            assert verify_data.get("projectType") == "COMMISSION"
            
            print(f"✅ PATCH /api/leads/{lead_id[:8]}... successfully updated new fields")
            
            # Restore to SERVICE
            requests.patch(f"{BASE_URL}/api/leads/{lead_id}", json={"projectType": "SERVICE", "industry": None, "deliverableType": "DIGITAL_FILES"}, headers=auth_headers)
        else:
            pytest.skip("No leads available to test")


class TestWorkflowTemplates:
    """Tests for Workflow Templates CRUD"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {pytest.auth_token}"}
    
    created_template_id = None
    
    def test_create_workflow_template(self, auth_headers):
        """POST /api/workflow-templates - Create template with stages"""
        unique_id = str(uuid.uuid4())[:8]
        template_data = {
            "name": f"TEST_Wedding Photography Workflow_{unique_id}",
            "description": "Standard workflow for wedding photography",
            "industry": "PHOTOGRAPHY",
            "projectType": "SERVICE",
            "stages": [
                {"name": "Initial Consultation", "type": "DISCOVERY", "order": 0, "required": True},
                {"name": "Send Quote", "type": "QUOTATION", "order": 1, "required": True},
                {"name": "Sign Contract", "type": "AGREEMENT", "order": 2, "required": True},
                {"name": "Shoot Day", "type": "CREATION", "order": 3, "required": True},
                {"name": "Deliver Photos", "type": "DELIVERY", "order": 4, "required": True}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/workflow-templates", json=template_data, headers=auth_headers)
        assert response.status_code == 201, f"Failed: {response.text}"
        data = response.json()
        assert "template" in data
        template = data["template"]
        assert template["name"] == template_data["name"]
        assert len(template.get("stages", [])) == 5
        
        TestWorkflowTemplates.created_template_id = template["id"]
        print(f"✅ POST /api/workflow-templates created template with {len(template['stages'])} stages")
    
    def test_get_workflow_templates(self, auth_headers):
        """GET /api/workflow-templates - List all templates"""
        response = requests.get(f"{BASE_URL}/api/workflow-templates", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "templates" in data
        assert "count" in data
        print(f"✅ GET /api/workflow-templates returns {data['count']} templates")
    
    def test_get_single_workflow_template(self, auth_headers):
        """GET /api/workflow-templates/:id - Get single template with stages"""
        if not TestWorkflowTemplates.created_template_id:
            pytest.skip("No template created yet")
        
        template_id = TestWorkflowTemplates.created_template_id
        response = requests.get(f"{BASE_URL}/api/workflow-templates/{template_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "template" in data
        template = data["template"]
        assert template["id"] == template_id
        assert "stages" in template
        print(f"✅ GET /api/workflow-templates/{template_id[:8]}... returns template with stages")
    
    def test_get_templates_by_industry(self, auth_headers):
        """GET /api/workflow-templates/industry/:industry - Filter by industry"""
        response = requests.get(f"{BASE_URL}/api/workflow-templates/industry/PHOTOGRAPHY", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "templates" in data
        print(f"✅ GET /api/workflow-templates/industry/PHOTOGRAPHY returns {data['count']} templates")
    
    def test_patch_workflow_template(self, auth_headers):
        """PATCH /api/workflow-templates/:id - Update template name/description"""
        if not TestWorkflowTemplates.created_template_id:
            pytest.skip("No template created yet")
        
        template_id = TestWorkflowTemplates.created_template_id
        update_data = {
            "name": "TEST_Updated Wedding Workflow",
            "description": "Updated description"
        }
        
        response = requests.patch(f"{BASE_URL}/api/workflow-templates/{template_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"PATCH failed: {response.text}"
        data = response.json()
        assert data["template"]["name"] == update_data["name"]
        print(f"✅ PATCH /api/workflow-templates/{template_id[:8]}... updated successfully")
    
    def test_delete_workflow_template(self, auth_headers):
        """DELETE /api/workflow-templates/:id - Delete template (cascade delete stages)"""
        if not TestWorkflowTemplates.created_template_id:
            pytest.skip("No template created yet")
        
        template_id = TestWorkflowTemplates.created_template_id
        response = requests.delete(f"{BASE_URL}/api/workflow-templates/{template_id}", headers=auth_headers)
        assert response.status_code == 200, f"DELETE failed: {response.text}"
        
        # Verify deletion
        verify_response = requests.get(f"{BASE_URL}/api/workflow-templates/{template_id}", headers=auth_headers)
        assert verify_response.status_code == 404
        print(f"✅ DELETE /api/workflow-templates/{template_id[:8]}... deleted with cascade")


class TestDeliverables:
    """Tests for Deliverables CRUD"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {pytest.auth_token}"}
    
    created_deliverable_id = None
    test_lead_id = None
    
    def test_create_deliverable_for_lead(self, auth_headers):
        """POST /api/leads/:leadId/deliverables - Create deliverable"""
        # First get a lead ID
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        if len(leads) == 0:
            pytest.skip("No leads available to test")
        
        lead_id = leads[0]["id"]
        TestDeliverables.test_lead_id = lead_id
        
        unique_id = str(uuid.uuid4())[:8]
        deliverable_data = {
            "name": f"TEST_Wedding Album_{unique_id}",
            "type": "PRINTS",
            "description": "50-page premium wedding album",
            "dimensions": "12x16 inches",
            "material": "Premium photo paper with leather cover",
            "dueDate": "2026-04-15",
            "notes": "Include all edited photos from ceremony and reception"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/deliverables", json=deliverable_data, headers=auth_headers)
        assert response.status_code == 201, f"Failed: {response.text}"
        data = response.json()
        assert "deliverable" in data
        deliverable = data["deliverable"]
        assert deliverable["name"] == deliverable_data["name"]
        assert deliverable["type"] == "PRINTS"
        assert deliverable["status"] == "PENDING"  # Default status
        
        TestDeliverables.created_deliverable_id = deliverable["id"]
        print(f"✅ POST /api/leads/{lead_id[:8]}../deliverables created deliverable")
    
    def test_get_deliverables_for_lead(self, auth_headers):
        """GET /api/leads/:leadId/deliverables - List deliverables for a lead"""
        if not TestDeliverables.test_lead_id:
            pytest.skip("No test lead available")
        
        lead_id = TestDeliverables.test_lead_id
        response = requests.get(f"{BASE_URL}/api/leads/{lead_id}/deliverables", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "deliverables" in data
        assert "count" in data
        print(f"✅ GET /api/leads/{lead_id[:8]}../deliverables returns {data['count']} deliverables")
    
    def test_get_single_deliverable(self, auth_headers):
        """GET /api/deliverables/:id - Get single deliverable with lead info"""
        if not TestDeliverables.created_deliverable_id:
            pytest.skip("No deliverable created yet")
        
        deliverable_id = TestDeliverables.created_deliverable_id
        response = requests.get(f"{BASE_URL}/api/deliverables/{deliverable_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "deliverable" in data
        deliverable = data["deliverable"]
        assert deliverable["id"] == deliverable_id
        assert "lead" in deliverable  # Should include lead info
        print(f"✅ GET /api/deliverables/{deliverable_id[:8]}... returns deliverable with lead info")
    
    def test_patch_deliverable(self, auth_headers):
        """PATCH /api/deliverables/:id - Update deliverable fields"""
        if not TestDeliverables.created_deliverable_id:
            pytest.skip("No deliverable created yet")
        
        deliverable_id = TestDeliverables.created_deliverable_id
        update_data = {
            "name": "TEST_Updated Wedding Album",
            "description": "Updated to 60-page album",
            "notes": "Updated notes"
        }
        
        response = requests.patch(f"{BASE_URL}/api/deliverables/{deliverable_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"PATCH failed: {response.text}"
        data = response.json()
        assert data["deliverable"]["name"] == update_data["name"]
        print(f"✅ PATCH /api/deliverables/{deliverable_id[:8]}... updated successfully")
    
    def test_patch_deliverable_status_pending_to_in_progress(self, auth_headers):
        """PATCH /api/deliverables/:id/status - Update status PENDING → IN_PROGRESS"""
        if not TestDeliverables.created_deliverable_id:
            pytest.skip("No deliverable created yet")
        
        deliverable_id = TestDeliverables.created_deliverable_id
        response = requests.patch(f"{BASE_URL}/api/deliverables/{deliverable_id}/status", 
                                  json={"status": "IN_PROGRESS"}, headers=auth_headers)
        assert response.status_code == 200, f"Status update failed: {response.text}"
        data = response.json()
        assert data["deliverable"]["status"] == "IN_PROGRESS"
        print(f"✅ PATCH /api/deliverables/{deliverable_id[:8]}../status → IN_PROGRESS")
    
    def test_patch_deliverable_status_to_delivered(self, auth_headers):
        """PATCH /api/deliverables/:id/status - Update status IN_PROGRESS → DELIVERED"""
        if not TestDeliverables.created_deliverable_id:
            pytest.skip("No deliverable created yet")
        
        deliverable_id = TestDeliverables.created_deliverable_id
        response = requests.patch(f"{BASE_URL}/api/deliverables/{deliverable_id}/status", 
                                  json={"status": "DELIVERED"}, headers=auth_headers)
        assert response.status_code == 200, f"Status update failed: {response.text}"
        data = response.json()
        assert data["deliverable"]["status"] == "DELIVERED"
        # Should auto-set completedAt
        assert data["deliverable"].get("completedAt") is not None
        print(f"✅ PATCH /api/deliverables/{deliverable_id[:8]}../status → DELIVERED (completedAt set)")
    
    def test_delete_deliverable(self, auth_headers):
        """DELETE /api/deliverables/:id - Delete deliverable"""
        if not TestDeliverables.created_deliverable_id:
            pytest.skip("No deliverable created yet")
        
        deliverable_id = TestDeliverables.created_deliverable_id
        response = requests.delete(f"{BASE_URL}/api/deliverables/{deliverable_id}", headers=auth_headers)
        assert response.status_code == 200, f"DELETE failed: {response.text}"
        
        # Verify deletion
        verify_response = requests.get(f"{BASE_URL}/api/deliverables/{deliverable_id}", headers=auth_headers)
        assert verify_response.status_code == 404
        print(f"✅ DELETE /api/deliverables/{deliverable_id[:8]}... deleted successfully")


class TestRegressionDashboard:
    """Regression tests - Dashboard still loads correctly"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {pytest.auth_token}"}
    
    def test_leads_stats(self, auth_headers):
        """GET /api/leads/stats - Dashboard stats still work"""
        response = requests.get(f"{BASE_URL}/api/leads/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "total" in data
        assert "statusCounts" in data
        print(f"✅ GET /api/leads/stats returns total={data['total']}, statusCounts={data['statusCounts']}")
    
    def test_portfolio(self, auth_headers):
        """GET /api/portfolio - Portfolio still works"""
        response = requests.get(f"{BASE_URL}/api/portfolio", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "portfolio" in data
        print(f"✅ GET /api/portfolio returns {len(data['portfolio'])} items")
    
    def test_analytics(self, auth_headers):
        """GET /api/analytics/dashboard - Analytics still works"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Data is nested under overview.conversionRate / overview.pipelineValue
        assert "overview" in data or "metrics" in data
        print(f"✅ GET /api/analytics/dashboard working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
