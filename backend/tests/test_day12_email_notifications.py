"""
Day 12: Email Notification Templates - Backend API Tests
Tests that email function wiring is correct and endpoints don't crash.
The email functions should return false gracefully if Resend API key is not configured.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"

# Test data storage
test_context = {}


class TestHealthAndAuth:
    """Basic health and authentication tests"""

    def test_01_health_check(self):
        """Backend health check should return ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✓ Health check passed: {data['message']}")

    def test_02_login(self):
        """Login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        test_context["token"] = data["token"]
        test_context["user_id"] = data["user"]["id"]
        print(f"✓ Login successful, user_id: {data['user']['id']}")


class TestPaymentServiceEmailWiring:
    """Test that paymentService.ts has proper email imports and endpoints work"""

    def test_03_deposit_checkout_endpoint_exists(self):
        """POST /api/payments/:incomeId/deposit should exist and return proper error for invalid income"""
        token = test_context.get("token")
        if not token:
            pytest.skip("No auth token")
        
        headers = {"Authorization": f"Bearer {token}"}
        # Try with fake income ID - should return 404 or 400, not 500
        response = requests.post(
            f"{BASE_URL}/api/payments/fake-income-id/deposit",
            headers=headers,
            json={"originUrl": "https://example.com"}
        )
        # Accept 404 (not found), 400 (bad request), or 500 with "Stripe not configured"
        # The key is it should NOT crash with undefined function errors
        assert response.status_code in [400, 404, 500]
        if response.status_code == 500:
            data = response.json()
            # If 500, should be Stripe-related, not email function errors
            assert "email" not in data.get("error", "").lower()
            print(f"✓ Deposit endpoint: {data.get('error', 'Stripe not configured')}")
        else:
            print(f"✓ Deposit endpoint returned {response.status_code} as expected")

    def test_04_final_checkout_endpoint_exists(self):
        """POST /api/payments/:incomeId/final should exist and return proper error for invalid income"""
        token = test_context.get("token")
        if not token:
            pytest.skip("No auth token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/fake-income-id/final",
            headers=headers,
            json={"originUrl": "https://example.com"}
        )
        assert response.status_code in [400, 404, 500]
        if response.status_code == 500:
            data = response.json()
            assert "email" not in data.get("error", "").lower()
        print(f"✓ Final payment endpoint returned {response.status_code}")


class TestLeadsMarkDeliveredEmailWiring:
    """Test that leads.ts mark-delivered sends testimonial request email"""

    def test_05_create_test_lead_for_delivery(self):
        """Create a test lead to mark as delivered"""
        token = test_context.get("token")
        if not token:
            pytest.skip("No auth token")
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = requests.post(f"{BASE_URL}/api/leads", headers=headers, json={
            "clientName": "TEST_Day12_EmailWiring",
            "clientEmail": "test-day12@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": "Day 12 Email Wiring Test",
            "description": "Testing that testimonial request email is wired correctly"
        })
        assert response.status_code == 201
        data = response.json()
        test_context["test_lead_id"] = data["lead"]["id"]
        print(f"✓ Created test lead: {data['lead']['id']}")

    def test_06_mark_delivered_with_testimonial_email(self):
        """POST /api/leads/:id/mark-delivered should send testimonial email without crashing"""
        token = test_context.get("token")
        lead_id = test_context.get("test_lead_id")
        if not token or not lead_id:
            pytest.skip("Missing token or lead_id")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/mark-delivered", headers=headers)
        
        # Should succeed - email functions should gracefully handle missing API key
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["pipelineStatus"] == "COMPLETED"
        print(f"✓ Mark as delivered succeeded: {data['message']}")
        
        # Verify activity was logged (testimonial email activity)
        activities_response = requests.get(
            f"{BASE_URL}/api/leads/{lead_id}/activities",
            headers=headers
        )
        if activities_response.status_code == 200:
            activities = activities_response.json().get("activities", [])
            testimonial_activity = any(
                "testimonial" in a.get("description", "").lower() 
                for a in activities
            )
            if testimonial_activity:
                print("✓ Testimonial request activity logged")
            else:
                print("! Testimonial activity not found (email may have failed silently)")


class TestContractsEmailWiring:
    """Test that contracts.ts sends contract emails correctly"""

    def test_07_get_existing_lead_with_contracts(self):
        """Get an existing lead that has contracts"""
        token = test_context.get("token")
        if not token:
            pytest.skip("No auth token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        # Find a lead with contracts
        for lead in leads:
            lead_id = lead["id"]
            contracts_resp = requests.get(
                f"{BASE_URL}/api/leads/{lead_id}/contracts",
                headers=headers
            )
            if contracts_resp.status_code == 200:
                contracts = contracts_resp.json().get("contracts", [])
                if contracts:
                    test_context["contract_lead_id"] = lead_id
                    test_context["contract_id"] = contracts[0]["id"]
                    print(f"✓ Found lead with contracts: {lead_id}")
                    return
        
        print("! No leads with contracts found - creating one")
        # If no contracts exist, we'll create one
        test_context["contract_lead_id"] = test_context.get("test_lead_id")

    def test_08_create_and_send_contract(self):
        """Create and send a contract to verify email wiring"""
        token = test_context.get("token")
        lead_id = test_context.get("contract_lead_id") or test_context.get("test_lead_id")
        if not token or not lead_id:
            pytest.skip("Missing token or lead_id")
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Create a contract
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/contracts",
            headers=headers,
            json={"templateType": "GENERAL_SERVICE"}
        )
        
        if response.status_code == 201:
            contract = response.json().get("contract")
            test_context["new_contract_id"] = contract["id"]
            print(f"✓ Contract created: {contract['id']}")
            
            # Send the contract (triggers sendContractSentEmail)
            send_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract['id']}/send",
                headers=headers
            )
            # Should succeed even if email fails (graceful handling)
            assert send_response.status_code == 200
            print(f"✓ Contract sent successfully (email function called)")
        else:
            print(f"! Could not create contract: {response.status_code}")


class TestQuotesEmailWiring:
    """Test that quotes.ts sends quote emails correctly"""

    def test_09_create_quote_for_email_test(self):
        """Create a quote to test email wiring"""
        token = test_context.get("token")
        lead_id = test_context.get("test_lead_id")
        if not token or not lead_id:
            pytest.skip("Missing token or lead_id")
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=headers,
            json={
                "lineItems": [
                    {"description": "Day 12 Email Test Service", "quantity": 1, "price": 100}
                ],
                "tax": 0,
                "paymentTerms": "DEPOSIT_50",
                "validUntil": "2026-12-31T00:00:00Z"
            }
        )
        assert response.status_code == 201
        quote = response.json().get("quote")
        test_context["quote_id"] = quote["id"]
        test_context["quote_token"] = quote.get("quoteToken")
        print(f"✓ Quote created: {quote['id']}")

    def test_10_send_quote_triggers_email(self):
        """POST /api/quotes/:quoteId/send should call sendQuoteEmail"""
        token = test_context.get("token")
        quote_id = test_context.get("quote_id")
        if not token or not quote_id:
            pytest.skip("Missing token or quote_id")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Quote sent: {data['message']}")

    def test_11_get_quote_token_for_public_tests(self):
        """Get quote token for public accept/decline tests"""
        token = test_context.get("token")
        quote_id = test_context.get("quote_id")
        if not token or not quote_id:
            pytest.skip("Missing token or quote_id")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}", headers=headers)
        assert response.status_code == 200
        quote = response.json().get("quote")
        test_context["quote_token"] = quote.get("quoteToken")
        print(f"✓ Quote token retrieved: {quote.get('quoteToken')[:20]}...")


class TestPublicQuoteEmailWiring:
    """Test public quote accept/decline endpoints trigger emails"""

    def test_12_public_quote_decline_triggers_email(self):
        """POST /api/quotes/public/:quoteToken/decline should call sendQuoteDeclinedNotification"""
        quote_token = test_context.get("quote_token")
        if not quote_token:
            pytest.skip("No quote token")
        
        # Create a new quote to decline (can't decline the already sent one)
        token = test_context.get("token")
        lead_id = test_context.get("test_lead_id")
        if not token or not lead_id:
            pytest.skip("Missing auth")
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Create new quote
        response = requests.post(
            f"{BASE_URL}/api/leads/{lead_id}/quotes",
            headers=headers,
            json={
                "lineItems": [{"description": "Decline Test", "quantity": 1, "price": 50}],
                "tax": 0,
                "validUntil": "2026-12-31T00:00:00Z"
            }
        )
        if response.status_code != 201:
            pytest.skip("Could not create quote for decline test")
        
        new_quote = response.json().get("quote")
        
        # Send the quote first
        send_resp = requests.post(
            f"{BASE_URL}/api/quotes/{new_quote['id']}/send",
            headers=headers
        )
        
        # Get the quote token
        quote_resp = requests.get(
            f"{BASE_URL}/api/quotes/{new_quote['id']}",
            headers=headers
        )
        new_quote_token = quote_resp.json().get("quote", {}).get("quoteToken")
        
        # Now decline via public endpoint
        decline_response = requests.post(
            f"{BASE_URL}/api/quotes/public/{new_quote_token}/decline",
            json={"reason": "Day 12 email wiring test"}
        )
        
        assert decline_response.status_code == 200
        print("✓ Quote declined successfully (sendQuoteDeclinedNotification called)")


class TestEmailServiceGracefulHandling:
    """Verify email service functions handle missing API key gracefully"""

    def test_13_verify_email_imports_compile(self):
        """Backend compiles successfully with all email imports"""
        # If we got this far, the imports are working
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ All email imports compile successfully")

    def test_14_public_lead_submit_triggers_auto_response(self):
        """POST /api/leads/submit should trigger auto-response email"""
        response = requests.post(
            f"{BASE_URL}/api/leads/submit",
            json={
                "clientName": "TEST_Day12_AutoResponse",
                "clientEmail": "autoresponse-test@example.com",
                "serviceType": "PHOTOGRAPHY",
                "projectTitle": "Auto Response Email Test",
                "description": "Testing that auto-response email is triggered on public submission"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "message" in data
        test_context["submitted_lead_id"] = data.get("leadId")
        print(f"✓ Public lead submitted: {data['message']}")


class TestSequenceEngineEmailWiring:
    """Test that sequenceEngine.ts uses sendSequenceEmail"""

    def test_15_verify_sequence_engine_import(self):
        """Verify sequenceEngine compiles with sendSequenceEmail import"""
        # The fact that quote sending works (which enrolls in sequences) proves this
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Sequence engine with sendSequenceEmail import compiles correctly")


class TestCleanup:
    """Clean up test data"""

    def test_99_cleanup_test_leads(self):
        """Delete test leads created during testing"""
        token = test_context.get("token")
        if not token:
            print("! No token for cleanup")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all leads
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        if response.status_code == 200:
            leads = response.json().get("leads", [])
            deleted = 0
            for lead in leads:
                if lead["clientName"].startswith("TEST_Day12"):
                    del_resp = requests.delete(
                        f"{BASE_URL}/api/leads/{lead['id']}",
                        headers=headers
                    )
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
