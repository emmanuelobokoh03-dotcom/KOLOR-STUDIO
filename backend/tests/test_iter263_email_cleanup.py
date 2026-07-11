"""
Iteration 263 backend regression tests:
- Verify email cleanup (2 orphan functions deleted) did not break routes
- POST /api/leads/submit (public) still works (regression: sendClientConfirmation etc.)
- POST /api/leads (auth) still works (regression: sendAutoResponse call site)
- GET /api/calendar/events (auth) — regression on edited calendar route file
- GET /api/calendar/google-events (auth, no connection) — must return 200 not 500
- Login regression baseline
"""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://settings-restructure-1.preview.emergentagent.com").rstrip("/")
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session():
    """Login returns HttpOnly cookie — use requests.Session to preserve it."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:300]}"
    body = r.json()
    assert body.get("user", {}).get("email") == TEST_EMAIL, f"Unexpected login body: {body}"
    # Also try to grab a token if present for Bearer fallback
    tok = body.get("token") or body.get("accessToken") or (body.get("data") or {}).get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


# --- Auth baseline ---

class TestAuthBaseline:
    def test_login_success(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        assert r.status_code == 200
        b = r.json()
        assert b.get("user", {}).get("email") == TEST_EMAIL


# --- Calendar route regression (file that was edited) ---

class TestCalendarRoutes:
    def test_calendar_events_returns_200(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/calendar/events", timeout=30)
        assert r.status_code == 200, f"/api/calendar/events failed: {r.status_code} {r.text[:300]}"
        b = r.json()
        assert "events" in b, f"Expected 'events' key, got: {list(b.keys())}"
        assert isinstance(b["events"], list)

    def test_google_events_no_connection_returns_200(self, auth_session):
        """User has no Google Calendar connection => must return 200 {connected:false, events:[]}, NOT 500.
        This exercises the modified route (handleCalendarAuthFailure wiring)."""
        r = auth_session.get(f"{BASE_URL}/api/calendar/google-events", timeout=30)
        assert r.status_code == 200, f"/api/calendar/google-events failed: {r.status_code} {r.text[:400]}"
        b = r.json()
        assert "connected" in b, f"Missing 'connected' key: {list(b.keys())}"
        assert "events" in b
        assert isinstance(b["events"], list)
        assert b["connected"] in (True, False)


# --- Leads regression (sendAutoResponse call sites) ---

class TestLeadsRegression:
    def test_public_lead_submit_returns_201(self, api_client):
        """POST /api/leads/submit (public, no auth). Must not crash even if RESEND_API_KEY missing."""
        unique = uuid.uuid4().hex[:8]
        payload = {
            "clientName": f"TEST_Submit_{unique}",
            "clientEmail": f"test_submit_{unique}@example.com",
            "clientPhone": "+15551234567",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"TEST public submit {unique}",
            "description": "Regression test for iter 263 email cleanup — verify /submit still 201s.",
            "budget": "1000-3000",
            "timeline": "2 months",
            "source": "WEBSITE",
        }
        r = api_client.post(f"{BASE_URL}/api/leads/submit", json=payload, timeout=30)
        assert r.status_code == 201, f"/api/leads/submit failed: {r.status_code} {r.text[:400]}"
        b = r.json()
        assert "leadId" in b, f"Expected 'leadId', got: {list(b.keys())}"
        assert isinstance(b["leadId"], str) and len(b["leadId"]) > 0

    def test_authenticated_lead_creation_returns_201(self, auth_session):
        """POST /api/leads (auth). Regression on sendAutoResponse call site."""
        unique = uuid.uuid4().hex[:8]
        payload = {
            "clientName": f"TEST_Manual_{unique}",
            "clientEmail": f"test_manual_{unique}@example.com",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"TEST manual lead {unique}",
            "description": "Regression test for iter 263 — manual lead creation via auth POST /api/leads.",
        }
        r = auth_session.post(f"{BASE_URL}/api/leads", json=payload, timeout=30)
        assert r.status_code == 201, f"POST /api/leads failed: {r.status_code} {r.text[:400]}"
        b = r.json()
        assert "lead" in b, f"Expected 'lead' key, got: {list(b.keys())}"
        assert b["lead"].get("id")
        # Cleanup
        try:
            auth_session.delete(f"{BASE_URL}/api/leads/{b['lead']['id']}", timeout=15)
        except Exception:
            pass
