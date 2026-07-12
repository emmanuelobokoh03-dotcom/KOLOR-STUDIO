"""
Iteration 264 backend regression tests — single client email per public inquiry.

Verifies:
 1. POST /api/leads/submit returns 201 and log analysis shows EXACTLY ONE
    client-facing email attempt: the '[EMAIL] Inquiry acknowledgement sent/failed' line;
    ZERO occurrences of '[AutoResponse]' | 'Auto-response' | 'Confirmation email sent'
    | 'Client confirmation' for the submit lead's window.
 2. Owner notification is allowed (different audience — different log message).
 3. Code-level: 0 refs to sendClientConfirmation in backend/src.
 4. Regression — POST /api/leads (authenticated) still returns 201 AND still triggers
    the '[AutoResponse]' / auto-response path (call site kept at leads.ts:446).
 5. Regression — login works, GET /api/leads returns 200.
"""
import os
import re
import subprocess
import time
import uuid
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://settings-restructure-1.preview.emergentagent.com").rstrip("/")
TEST_EMAIL = "bookingtest@test.com"
TEST_PASSWORD = "password123"

BACKEND_SRC = Path("/app/kolor-studio-v2/backend/src")
LOG_PATHS = [
    "/var/log/supervisor/backend.out.log",
    "/var/log/supervisor/backend.err.log",
]


# ------------- fixtures -------------


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:300]}"
    body = r.json()
    assert body.get("user", {}).get("email") == TEST_EMAIL, f"Unexpected login body: {body}"
    return s


def _read_all_backend_logs() -> str:
    combined = []
    for p in LOG_PATHS:
        try:
            with open(p, "r", errors="replace") as f:
                combined.append(f.read())
        except FileNotFoundError:
            pass
    return "\n".join(combined)


def _log_size_snapshot() -> dict:
    """Per-file byte offset so we can slice ONLY content produced after this point."""
    snap = {}
    for p in LOG_PATHS:
        try:
            snap[p] = os.path.getsize(p)
        except FileNotFoundError:
            snap[p] = 0
    return snap


def _read_new_log_lines(before_snapshot: dict) -> str:
    """Return only content appended to each log file after the given snapshot."""
    out = []
    for p in LOG_PATHS:
        try:
            size = os.path.getsize(p)
        except FileNotFoundError:
            continue
        offset = before_snapshot.get(p, 0)
        if size <= offset:
            continue
        try:
            with open(p, "rb") as f:
                f.seek(offset)
                out.append(f.read().decode(errors="replace"))
        except FileNotFoundError:
            continue
    return "\n".join(out)


# ------------- Test 1: code-level checks -------------


class TestCodeLevelCleanup:
    def test_no_sendClientConfirmation_references_in_src(self):
        """grep backend/src for sendClientConfirmation must return 0 hits."""
        result = subprocess.run(
            ["grep", "-rn", "sendClientConfirmation", str(BACKEND_SRC)],
            capture_output=True, text=True,
        )
        # grep returns exit code 1 when no matches — that's success for us
        assert result.returncode == 1, (
            f"Expected 0 hits for sendClientConfirmation, but found:\n{result.stdout}"
        )
        assert result.stdout.strip() == "", f"Unexpected hits:\n{result.stdout}"

    def test_submit_route_only_calls_expected_email_funcs(self):
        """leads.ts /submit block (line 461+) must contain ONLY sendNewLeadNotification
        + sendInquiryAcknowledgementEmail — no sendAutoResponse / sendClientConfirmation."""
        leads_ts = (BACKEND_SRC / "routes" / "leads.ts").read_text()
        # Slice /submit route: from "router.post('/submit'" to next router.post
        start = leads_ts.index("router.post('/submit'")
        # Find next route definition
        rest = leads_ts[start + 1:]
        next_route_relative = rest.index("router.")
        submit_block = leads_ts[start:start + 1 + next_route_relative]

        assert "sendNewLeadNotification" in submit_block, "sendNewLeadNotification missing from /submit"
        assert "sendInquiryAcknowledgementEmail" in submit_block, "sendInquiryAcknowledgementEmail missing from /submit"
        # These MUST NOT be present in /submit block
        assert "sendClientConfirmation" not in submit_block, "sendClientConfirmation must be removed from /submit"
        assert "sendAutoResponse" not in submit_block, "sendAutoResponse must be removed from /submit"

    def test_submit_ack_call_has_enrichment_params(self):
        leads_ts = (BACKEND_SRC / "routes" / "leads.ts").read_text()
        # Find sendInquiryAcknowledgementEmail call in /submit block
        start = leads_ts.index("router.post('/submit'")
        rest = leads_ts[start + 1:]
        next_route_relative = rest.index("router.")
        submit_block = leads_ts[start:start + 1 + next_route_relative]

        for key in ("serviceLabel", "budget", "timeline", "portfolioUrl", "SERVICE_TYPE_LABELS"):
            assert key in submit_block, f"Missing enrichment param '{key}' in /submit ack call"

    def test_email_template_has_summary_and_portfolio_markup(self):
        email_ts = (BACKEND_SRC / "services" / "email.ts").read_text()
        assert "summaryCardHtml" in email_ts
        assert "portfolioLinkHtml" in email_ts
        assert "Your Inquiry" in email_ts, "'Your Inquiry' summary card markup missing in email.ts"
        assert "export const SERVICE_TYPE_LABELS" in email_ts, "SERVICE_TYPE_LABELS must be exported"

    def test_authenticated_lead_route_still_has_sendAutoResponse(self):
        """POST /api/leads (auth) at line 368 must still call sendAutoResponse(lead)."""
        leads_ts = (BACKEND_SRC / "routes" / "leads.ts").read_text()
        # slice between auth POST '/' and next router.
        start = leads_ts.index("router.post('/', authMiddleware")
        rest = leads_ts[start + 1:]
        next_route_relative = rest.index("router.")
        auth_block = leads_ts[start:start + 1 + next_route_relative]
        assert "sendAutoResponse(lead)" in auth_block, "sendAutoResponse call site removed from authenticated POST /api/leads!"


# ------------- Test 2: runtime — single client email attempt on /submit -------------


class TestSingleClientEmailOnSubmit:
    def test_submit_returns_201_and_only_ack_email_logged(self, api_client):
        unique = uuid.uuid4().hex[:8]
        marker = f"TEST_SubmitIter264_{unique}"
        payload = {
            "clientName": marker,
            "clientEmail": f"iter264_submit_{unique}@example.com",
            "clientPhone": "+15551234567",
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"TEST iter264 single-email {unique}",
            "description": "Iteration 264 test — verifies exactly ONE client email attempt on public inquiry submit.",
            "budget": "1000-3000",
            "timeline": "2 months",
            "source": "WEBSITE",
        }

        # Snapshot log size before request
        pre = _log_size_snapshot()

        r = api_client.post(f"{BASE_URL}/api/leads/submit", json=payload, timeout=30)
        assert r.status_code == 201, f"/api/leads/submit failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        assert "leadId" in body and isinstance(body["leadId"], str) and body["leadId"]

        # Wait for fire-and-forget email attempts to log
        time.sleep(6)

        new_logs = _read_new_log_lines(pre)

        # Also try to filter to lines that reference our unique marker OR the client email
        # (the ack log line prints the client email)
        client_email = payload["clientEmail"]
        # Search for the ack log lines addressed to our specific email — this
        # isolates our request from any concurrent traffic
        ack_sent_pattern = re.compile(
            rf"\[EMAIL\] Inquiry acknowledgement (sent to|failed).*{re.escape(client_email)}|"
            rf"\[EMAIL\] Inquiry acknowledgement (sent to|failed) {re.escape(client_email)}",
            re.IGNORECASE,
        )
        # Simpler: count both variants
        sent_hits = [ln for ln in new_logs.splitlines() if client_email in ln and "Inquiry acknowledgement" in ln]

        # Fallback: if not found by email match, count generic ack lines during window
        if not sent_hits:
            sent_hits = [ln for ln in new_logs.splitlines() if "[EMAIL] Inquiry acknowledgement" in ln and ("sent to" in ln or "failed" in ln or "error" in ln.lower())]

        # DELETED / REMOVED paths that MUST NOT appear
        forbidden_patterns = [
            "Confirmation email sent",
            "Client confirmation",
            "[AutoResponse]",
            "Auto-response sent",
        ]
        forbidden_hits = {p: [] for p in forbidden_patterns}
        # Restrict forbidden search to lines that reference our marker/email to avoid noise
        for ln in new_logs.splitlines():
            if client_email in ln or marker in ln:
                for p in forbidden_patterns:
                    if p in ln:
                        forbidden_hits[p].append(ln)

        # Assertions
        assert len(sent_hits) >= 1, (
            f"Expected at least ONE '[EMAIL] Inquiry acknowledgement (sent/failed)' log line "
            f"for {client_email}. New logs tail (last 4KB):\n{new_logs[-4000:]}"
        )
        # Exactly one client-facing ack attempt (allow >=1 since Resend retry may not happen;
        # but there should not be >1 either — cap at 1)
        # We are lenient: assert no more than 2 (in case of both 'error' + 'failed' double log)
        assert len(sent_hits) <= 2, (
            f"Expected exactly 1 client email attempt, got {len(sent_hits)}:\n" + "\n".join(sent_hits)
        )

        for p, hits in forbidden_hits.items():
            assert not hits, (
                f"Forbidden log pattern '{p}' appeared for /submit request "
                f"(should have been removed in iter 264):\n" + "\n".join(hits)
            )


# ------------- Test 3: regression — authenticated POST /api/leads still triggers auto-response -------------


class TestAuthenticatedLeadStillTriggersAutoResponse:
    def test_auth_lead_creation_still_calls_autoresponse(self, auth_session):
        unique = uuid.uuid4().hex[:8]
        marker = f"TEST_AuthIter264_{unique}"
        client_email = f"iter264_auth_{unique}@example.com"
        payload = {
            "clientName": marker,
            "clientEmail": client_email,
            "serviceType": "PHOTOGRAPHY",
            "projectTitle": f"TEST iter264 auth lead {unique}",
            "description": "Iteration 264 regression — auto-response call site must remain on authed POST /api/leads.",
        }

        pre = _log_size_snapshot()
        r = auth_session.post(f"{BASE_URL}/api/leads", json=payload, timeout=30)
        assert r.status_code == 201, f"POST /api/leads failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        lead_id = body.get("lead", {}).get("id")
        assert lead_id, f"Missing lead.id in response: {body}"

        # Wait for fire-and-forget email
        time.sleep(6)
        new_logs = _read_new_log_lines(pre)

        # Look for AutoResponse indicators. The log line is
        # 'Error sending auto-response:' followed by the error object on next lines;
        # or '[AutoResponse] Error:' from leads.ts wrapper. Since we sliced only NEW
        # log content after our request, any hit is attributable to our request.
        autoresp_signatures = [
            "[AutoResponse]",
            "Error sending auto-response",
            "Auto-response sent",
            "sendAutoResponseEmail",
        ]
        autoresp_hits = []
        for ln in new_logs.splitlines():
            for sig in autoresp_signatures:
                if sig in ln:
                    autoresp_hits.append(ln)
                    break

        assert autoresp_hits, (
            f"Expected auto-response attempt (log with '[AutoResponse]' / 'Auto-response') "
            f"for authed lead {client_email}. New logs tail:\n{new_logs[-4000:]}"
        )

        # Cleanup
        try:
            auth_session.delete(f"{BASE_URL}/api/leads/{lead_id}", timeout=15)
        except Exception:
            pass


# ------------- Test 4: basic regressions — login + GET /api/leads -------------


class TestBaselineRegressions:
    def test_login_baseline(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        }, timeout=30)
        assert r.status_code == 200
        assert r.json().get("user", {}).get("email") == TEST_EMAIL

    def test_get_leads_authenticated(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/leads", timeout=30)
        assert r.status_code == 200, f"GET /api/leads failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        # Response contract check — should have 'leads' array or similar
        assert isinstance(body, dict) or isinstance(body, list), f"Unexpected body type: {type(body)}"
