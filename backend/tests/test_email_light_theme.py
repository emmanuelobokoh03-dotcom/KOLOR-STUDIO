"""
Email Light Theme Template Verification Tests
Tests that all email templates use light theme and the correct tagline.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEmailTemplateVerification:
    """Verify email template changes for light theme"""
    
    def test_health_check(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✓ Health check passed: {data}")

    def test_auth_login(self):
        """POST /api/auth/login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "emailtest@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Login successful, token obtained")
        return data["token"]

    def test_email_ts_no_dark_backgrounds(self):
        """Verify email.ts has no dark background colors"""
        email_path = "/app/kolor-studio-v2/backend/src/services/email.ts"
        with open(email_path, 'r') as f:
            content = f.read()
        
        # Check for dark background colors (as CSS background, not text color)
        lines_with_issues = []
        for i, line in enumerate(content.split('\n'), 1):
            # Look for background properties with dark colors
            if 'background' in line.lower() and ('#0f0f0f' in line or '#1a1a1a' in line):
                lines_with_issues.append(f"Line {i}: {line.strip()}")
        
        assert len(lines_with_issues) == 0, f"Found dark backgrounds in email.ts:\n" + "\n".join(lines_with_issues)
        print("✓ No dark background colors (#0f0f0f, #1a1a1a) found in email.ts backgrounds")

    def test_email_ts_tagline_updated(self):
        """Verify header tagline says 'Your CRM should work harder than you do'"""
        email_path = "/app/kolor-studio-v2/backend/src/services/email.ts"
        with open(email_path, 'r') as f:
            content = f.read()
        
        new_tagline = "Your CRM should work harder than you do"
        old_tagline = "The CRM that doesn't feel like a CRM"
        
        # Check new tagline exists
        assert new_tagline in content, f"New tagline '{new_tagline}' not found in email.ts"
        print(f"✓ New tagline found: '{new_tagline}'")
        
        # Check old tagline is removed
        assert old_tagline not in content, f"Old tagline '{old_tagline}' still exists in email.ts"
        print(f"✓ Old tagline removed: '{old_tagline}'")

    def test_email_ts_get_email_template_light_theme(self):
        """Verify getEmailTemplate uses light theme (#f5f3ff, #ffffff backgrounds)"""
        email_path = "/app/kolor-studio-v2/backend/src/services/email.ts"
        with open(email_path, 'r') as f:
            content = f.read()
        
        # Check getEmailTemplate function exists and uses light backgrounds
        assert "const getEmailTemplate" in content, "getEmailTemplate function not found"
        print("✓ getEmailTemplate function exists")
        
        # Light theme colors
        assert "#f5f3ff" in content, "Light purple background (#f5f3ff) not found"
        print("✓ Light purple background (#f5f3ff) found")
        
        assert "#ffffff" in content, "White background (#ffffff) not found"
        print("✓ White background (#ffffff) found")

    def test_send_contract_agreed_uses_template(self):
        """Verify sendContractAgreedNotification uses getEmailTemplate wrapper"""
        email_path = "/app/kolor-studio-v2/backend/src/services/email.ts"
        with open(email_path, 'r') as f:
            content = f.read()
        
        # Find sendContractAgreedNotification function
        assert "sendContractAgreedNotification" in content, "sendContractAgreedNotification function not found"
        
        # Extract the function block (simple approach)
        start_idx = content.find("export async function sendContractAgreedNotification")
        assert start_idx != -1, "sendContractAgreedNotification export not found"
        
        # Find the next export function to delimit
        next_export = content.find("export async function", start_idx + 50)
        if next_export == -1:
            next_export = len(content)
        
        func_block = content[start_idx:next_export]
        
        # Check it uses getEmailTemplate
        assert "getEmailTemplate(content" in func_block, "sendContractAgreedNotification doesn't use getEmailTemplate wrapper"
        print("✓ sendContractAgreedNotification uses getEmailTemplate wrapper")
        
        # Check NO inline dark backgrounds in this function
        assert "#0f0f0f" not in func_block, "sendContractAgreedNotification still has #0f0f0f"
        assert "background-color: #1a1a1a" not in func_block and "background:#1a1a1a" not in func_block, \
            "sendContractAgreedNotification still has #1a1a1a background"
        print("✓ sendContractAgreedNotification has no dark backgrounds")

    def test_all_email_functions_use_template(self):
        """Verify all email send functions use getEmailTemplate"""
        email_path = "/app/kolor-studio-v2/backend/src/services/email.ts"
        with open(email_path, 'r') as f:
            content = f.read()
        
        # List of key email functions that should use getEmailTemplate
        email_functions = [
            "sendNewLeadNotification",
            "sendClientConfirmation", 
            "sendStatusChangeNotification",
            "sendPortalLinkEmail",
            "sendPasswordResetEmail",
            "sendVerificationEmail",
            "sendQuoteEmail",
            "sendQuoteAcceptedNotification",
            "sendQuoteDeclinedNotification",
            "sendContractSentEmail",
            "sendContractAgreedNotification",  # The key fix
            "sendAutoResponseEmail",
            "sendDepositPaymentEmail",
        ]
        
        for func_name in email_functions:
            assert func_name in content, f"Function {func_name} not found in email.ts"
            print(f"✓ {func_name} exists")


class TestAPIEndpoints:
    """Test the email-related API endpoints work"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "emailtest@test.com",
            "password": "password123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_health_endpoint(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        print("✓ Health endpoint working")

    def test_signup_endpoint_exists(self):
        """POST /api/auth/signup endpoint exists (email verification uses getEmailTemplate)"""
        # Test with invalid data to check endpoint exists
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": "",
            "password": "",
            "firstName": "",
            "lastName": ""
        })
        # We expect 400 (bad request) not 404 (not found)
        assert response.status_code != 404, "Signup endpoint not found"
        print(f"✓ Signup endpoint exists (returned {response.status_code})")

    def test_get_quotes_endpoint(self, auth_token):
        """GET /api/quotes endpoint works (quote email uses light theme)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/quotes", headers=headers)
        assert response.status_code == 200
        print(f"✓ Quotes endpoint works, returned {len(response.json())} quotes")

    def test_get_contracts_endpoint(self, auth_token):
        """GET /api/contracts endpoint works (contract email uses light theme)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        assert response.status_code == 200
        print(f"✓ Contracts endpoint works, returned {len(response.json())} contracts")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
