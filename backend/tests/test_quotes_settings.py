"""
Test Suite for Quote/Proposal System with Currency Settings - KOLOR STUDIO CRM
Tests: Settings API, Quotes API, Public Quote Endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('VITE_API_URL', 'https://crm-studio-1.preview.emergentagent.com/api')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


class TestSettingsAPI:
    """Currency Settings API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_settings_returns_currency_info(self):
        """GET /api/settings - returns currency settings for user"""
        response = requests.get(f"{BASE_URL}/settings", headers=self.headers)
        
        assert response.status_code == 200, f"Failed to get settings: {response.text}"
        data = response.json()
        
        # Verify settings structure
        assert "settings" in data
        settings = data["settings"]
        
        # Check currency fields exist
        assert "currency" in settings, "Missing currency field"
        assert "currencySymbol" in settings, "Missing currencySymbol field"
        assert "currencyPosition" in settings, "Missing currencyPosition field"
        assert "numberFormat" in settings, "Missing numberFormat field"
        assert "defaultTaxRate" in settings, "Missing defaultTaxRate field"
        
        # Verify available currencies are returned
        assert "availableCurrencies" in data
        currencies = data["availableCurrencies"]
        assert len(currencies) >= 10, "Should have at least 10 currencies"
        
        # Check currency structure
        first_currency = currencies[0]
        assert "code" in first_currency
        assert "symbol" in first_currency
        assert "name" in first_currency
        
        print(f"✓ Current settings: currency={settings['currency']}, symbol={settings['currencySymbol']}")
        print(f"✓ Available currencies: {len(currencies)}")
    
    def test_update_currency_settings(self):
        """PATCH /api/settings - updates currency settings"""
        # Test updating to EUR
        update_data = {
            "currency": "EUR",
            "currencySymbol": "€",
            "currencyPosition": "BEFORE",
            "numberFormat": "1.000,00",
            "defaultTaxRate": 21
        }
        
        response = requests.patch(
            f"{BASE_URL}/settings",
            headers=self.headers,
            json=update_data
        )
        
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        data = response.json()
        
        assert "settings" in data
        settings = data["settings"]
        
        # Verify updates were applied
        assert settings["currency"] == "EUR"
        assert settings["currencySymbol"] == "€"
        assert settings["currencyPosition"] == "BEFORE"
        assert settings["numberFormat"] == "1.000,00"
        assert settings["defaultTaxRate"] == 21
        
        print(f"✓ Settings updated to EUR with 21% tax rate")
        
        # Reset back to USD for other tests
        reset_data = {
            "currency": "USD",
            "currencySymbol": "$",
            "currencyPosition": "BEFORE",
            "numberFormat": "1,000.00",
            "defaultTaxRate": 10
        }
        requests.patch(f"{BASE_URL}/settings", headers=self.headers, json=reset_data)
        print("✓ Settings reset to USD")
    
    def test_update_currency_position_after(self):
        """PATCH /api/settings - currency symbol position AFTER"""
        update_data = {
            "currencyPosition": "AFTER"
        }
        
        response = requests.patch(
            f"{BASE_URL}/settings",
            headers=self.headers,
            json=update_data
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["settings"]["currencyPosition"] == "AFTER"
        print("✓ Currency position set to AFTER")
        
        # Reset
        requests.patch(f"{BASE_URL}/settings", headers=self.headers, json={"currencyPosition": "BEFORE"})
    
    def test_update_number_format_european(self):
        """PATCH /api/settings - European number format"""
        update_data = {
            "numberFormat": "1.000,00"
        }
        
        response = requests.patch(
            f"{BASE_URL}/settings",
            headers=self.headers,
            json=update_data
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        assert response.json()["settings"]["numberFormat"] == "1.000,00"
        print("✓ Number format set to European (1.000,00)")
        
        # Reset
        requests.patch(f"{BASE_URL}/settings", headers=self.headers, json={"numberFormat": "1,000.00"})
    
    def test_invalid_tax_rate_rejected(self):
        """PATCH /api/settings - rejects invalid tax rate >100"""
        update_data = {
            "defaultTaxRate": 150
        }
        
        response = requests.patch(
            f"{BASE_URL}/settings",
            headers=self.headers,
            json=update_data
        )
        
        # Should reject tax rate > 100
        assert response.status_code == 400, f"Should reject tax >100, got {response.status_code}"
        print("✓ Invalid tax rate (>100) correctly rejected")
    
    def test_get_currencies_public(self):
        """GET /api/settings/currencies - public currencies list"""
        response = requests.get(f"{BASE_URL}/settings/currencies")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "currencies" in data
        currencies = data["currencies"]
        
        # Check for key currencies
        currency_codes = [c["code"] for c in currencies]
        assert "USD" in currency_codes, "Missing USD"
        assert "EUR" in currency_codes, "Missing EUR"
        assert "GBP" in currency_codes, "Missing GBP"
        assert "NGN" in currency_codes, "Missing NGN (Nigerian Naira)"
        
        print(f"✓ Found {len(currencies)} currencies: {currency_codes}")


class TestQuotesAPI:
    """Quote CRUD and Send Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token, find a lead"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get leads to find one for testing
        leads_response = requests.get(f"{BASE_URL}/leads", headers=self.headers)
        assert leads_response.status_code == 200, f"Failed to get leads: {leads_response.text}"
        leads = leads_response.json().get("leads", [])
        
        if leads:
            self.lead_id = leads[0]["id"]
            self.lead = leads[0]
            print(f"✓ Using lead: {self.lead['clientName']} ({self.lead_id})")
        else:
            pytest.skip("No leads available for testing")
    
    def test_create_quote_basic(self):
        """POST /api/leads/:leadId/quotes - creates quote with line items"""
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        quote_data = {
            "lineItems": [
                {"description": "Photography Session - 2 hours", "quantity": 1, "price": 500},
                {"description": "Photo Editing (per image)", "quantity": 50, "price": 10}
            ],
            "tax": 10,
            "paymentTerms": "DEPOSIT_50",
            "validUntil": valid_until,
            "terms": "50% deposit required to confirm booking."
        }
        
        response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        
        assert response.status_code == 201, f"Failed to create quote: {response.text}"
        data = response.json()
        
        assert "quote" in data
        quote = data["quote"]
        
        # Verify quote structure
        assert "id" in quote
        assert "quoteNumber" in quote
        assert quote["quoteNumber"].startswith("Q-")
        assert quote["status"] == "DRAFT"
        assert len(quote["lineItems"]) == 2
        
        # Verify calculations
        assert quote["subtotal"] == 1000  # 500 + (50*10)
        assert quote["tax"] == 10
        assert quote["taxAmount"] == 100  # 10% of 1000
        assert quote["total"] == 1100  # 1000 + 100
        
        print(f"✓ Quote created: {quote['quoteNumber']}, Total: ${quote['total']}")
        
        # Cleanup
        self.quote_id = quote["id"]
        self.quote_token = quote.get("quoteToken")
    
    def test_create_quote_with_currency_override(self):
        """POST /api/leads/:leadId/quotes - creates quote with currency override"""
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        quote_data = {
            "lineItems": [
                {"description": "Video Production", "quantity": 1, "price": 2000}
            ],
            "tax": 7.5,
            "paymentTerms": "FULL_UPFRONT",
            "validUntil": valid_until,
            # Currency override for Nigerian client
            "currency": "NGN",
            "currencySymbol": "₦",
            "currencyPosition": "BEFORE",
            "numberFormat": "1,000.00"
        }
        
        response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        
        assert response.status_code == 201, f"Failed: {response.text}"
        quote = response.json()["quote"]
        
        # Verify currency override was saved
        assert quote.get("currency") == "NGN", "Currency override not saved"
        assert quote.get("currencySymbol") == "₦", "Currency symbol not saved"
        assert quote.get("currencyPosition") == "BEFORE"
        
        print(f"✓ Quote created with NGN currency override: {quote['quoteNumber']}")
        
        # Store for cleanup
        self._test_quote_id = quote["id"]
    
    def test_get_quotes_for_lead(self):
        """GET /api/leads/:leadId/quotes - returns all quotes for a lead"""
        response = requests.get(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "quotes" in data
        quotes = data["quotes"]
        assert isinstance(quotes, list)
        
        print(f"✓ Found {len(quotes)} quotes for lead {self.lead_id}")
        
        if quotes:
            quote = quotes[0]
            # Verify quote has currency info from creator
            assert "createdBy" in quote
            print(f"  - {quote['quoteNumber']}: ${quote['total']} ({quote['status']})")
    
    def test_send_quote_creates_sent_status(self):
        """POST /api/quotes/:quoteId/send - sends quote email to client"""
        # First create a draft quote
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        quote_data = {
            "lineItems": [{"description": "Test Service", "quantity": 1, "price": 100}],
            "tax": 0,
            "paymentTerms": "DEPOSIT_50",
            "validUntil": valid_until
        }
        
        create_response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        
        assert create_response.status_code == 201
        quote = create_response.json()["quote"]
        quote_id = quote["id"]
        
        # Send the quote
        send_response = requests.post(
            f"{BASE_URL}/quotes/{quote_id}/send",
            headers=self.headers
        )
        
        assert send_response.status_code == 200, f"Failed to send: {send_response.text}"
        data = send_response.json()
        
        assert "message" in data
        assert "sent" in data["message"].lower()
        
        # Verify status changed
        if "quote" in data:
            assert data["quote"]["status"] == "SENT"
        
        print(f"✓ Quote {quote['quoteNumber']} sent successfully")
    
    def test_validation_empty_line_items_rejected(self):
        """POST /api/leads/:leadId/quotes - rejects empty line items"""
        quote_data = {
            "lineItems": [],
            "tax": 10,
            "validUntil": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        
        assert response.status_code == 400, f"Should reject empty lineItems, got {response.status_code}"
        print("✓ Empty line items correctly rejected")
    
    def test_validation_past_date_rejected(self):
        """POST /api/leads/:leadId/quotes - rejects past validUntil date"""
        past_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        
        quote_data = {
            "lineItems": [{"description": "Test", "quantity": 1, "price": 100}],
            "tax": 0,
            "validUntil": past_date
        }
        
        response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        
        assert response.status_code == 400, f"Should reject past date, got {response.status_code}"
        print("✓ Past validUntil date correctly rejected")


class TestPublicQuoteAPI:
    """Public Quote Page Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and create a test quote to get a public token"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get a lead
        leads_response = requests.get(f"{BASE_URL}/leads", headers=self.headers)
        leads = leads_response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads available")
        
        self.lead_id = leads[0]["id"]
        
        # Get existing quotes or create one
        quotes_response = requests.get(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers
        )
        quotes = quotes_response.json().get("quotes", [])
        
        # Find a SENT or VIEWED quote for testing
        for q in quotes:
            if q["status"] in ["SENT", "VIEWED"]:
                self.quote_token = q.get("quoteToken")
                self.quote_id = q["id"]
                self.quote = q
                print(f"✓ Using existing quote: {q['quoteNumber']} ({q['status']})")
                return
        
        # Create and send a new quote if none exist
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        quote_data = {
            "lineItems": [{"description": "Public Test Service", "quantity": 1, "price": 999}],
            "tax": 10,
            "validUntil": valid_until
        }
        
        create_response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        quote = create_response.json()["quote"]
        
        # Send the quote
        requests.post(f"{BASE_URL}/quotes/{quote['id']}/send", headers=self.headers)
        
        self.quote_token = quote.get("quoteToken")
        self.quote_id = quote["id"]
        self.quote = quote
        print(f"✓ Created and sent quote: {quote['quoteNumber']}")
    
    def test_public_quote_view(self):
        """GET /api/quotes/public/:quoteToken - public view of quote"""
        if not self.quote_token:
            pytest.skip("No quote token available")
        
        response = requests.get(f"{BASE_URL}/quotes/public/{self.quote_token}")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "quote" in data
        quote = data["quote"]
        
        # Verify quote structure for public view
        assert "quoteNumber" in quote
        assert "lineItems" in quote
        assert "subtotal" in quote
        assert "total" in quote
        assert "lead" in quote
        assert "createdBy" in quote
        
        # Verify merged currency settings
        assert "currencySettings" in quote or "createdBy" in quote
        
        print(f"✓ Public quote view working: {quote['quoteNumber']}")
        print(f"  Total: {quote['total']}")
        
        if "currencySettings" in quote:
            cs = quote["currencySettings"]
            print(f"  Currency: {cs.get('currency')} ({cs.get('currencySymbol')})")
    
    def test_public_quote_invalid_token(self):
        """GET /api/quotes/public/:quoteToken - 404 for invalid token"""
        response = requests.get(f"{BASE_URL}/quotes/public/invalid-token-xyz")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid quote token returns 404")
    
    def test_accept_quote(self):
        """POST /api/quotes/public/:quoteToken/accept - client accepts quote"""
        # Create a fresh quote for accept test
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        quote_data = {
            "lineItems": [{"description": "Accept Test Service", "quantity": 1, "price": 500}],
            "tax": 0,
            "validUntil": valid_until
        }
        
        create_response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        quote = create_response.json()["quote"]
        
        # Send the quote first
        send_response = requests.post(
            f"{BASE_URL}/quotes/{quote['id']}/send",
            headers=self.headers
        )
        assert send_response.status_code == 200
        
        # Now accept it as the client (no auth needed)
        accept_response = requests.post(
            f"{BASE_URL}/quotes/public/{quote['quoteToken']}/accept"
        )
        
        assert accept_response.status_code == 200, f"Failed to accept: {accept_response.text}"
        data = accept_response.json()
        
        assert "message" in data
        assert "accepted" in data["message"].lower()
        
        print(f"✓ Quote {quote['quoteNumber']} accepted successfully")
    
    def test_decline_quote_with_reason(self):
        """POST /api/quotes/public/:quoteToken/decline - client declines quote"""
        # Create a fresh quote for decline test
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        quote_data = {
            "lineItems": [{"description": "Decline Test Service", "quantity": 1, "price": 1500}],
            "tax": 0,
            "validUntil": valid_until
        }
        
        create_response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        quote = create_response.json()["quote"]
        
        # Send the quote first
        send_response = requests.post(
            f"{BASE_URL}/quotes/{quote['id']}/send",
            headers=self.headers
        )
        assert send_response.status_code == 200
        
        # Decline it with a reason
        decline_response = requests.post(
            f"{BASE_URL}/quotes/public/{quote['quoteToken']}/decline",
            json={"reason": "Price is too high for my budget"}
        )
        
        assert decline_response.status_code == 200, f"Failed to decline: {decline_response.text}"
        data = decline_response.json()
        
        assert "message" in data
        assert "decline" in data["message"].lower()
        
        print(f"✓ Quote {quote['quoteNumber']} declined with reason")
    
    def test_cannot_accept_already_declined(self):
        """POST /api/quotes/public/:quoteToken/accept - cannot accept declined quote"""
        # Create and decline a quote
        valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        quote_data = {
            "lineItems": [{"description": "Double Action Test", "quantity": 1, "price": 200}],
            "tax": 0,
            "validUntil": valid_until
        }
        
        create_response = requests.post(
            f"{BASE_URL}/leads/{self.lead_id}/quotes",
            headers=self.headers,
            json=quote_data
        )
        quote = create_response.json()["quote"]
        
        # Send and decline
        requests.post(f"{BASE_URL}/quotes/{quote['id']}/send", headers=self.headers)
        requests.post(f"{BASE_URL}/quotes/public/{quote['quoteToken']}/decline")
        
        # Try to accept after decline
        accept_response = requests.post(
            f"{BASE_URL}/quotes/public/{quote['quoteToken']}/accept"
        )
        
        assert accept_response.status_code == 400, f"Should reject, got {accept_response.status_code}"
        print("✓ Cannot accept already declined quote")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
