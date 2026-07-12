"""
Iteration 268 - Email Change Flow Backend Tests

Tests:
  1) POST /api/auth/request-email-change (auth, password re-auth, validation, rate limit)
  2) GET  /api/auth/verify-email-change/:token (token injection to bypass Resend)
  3) POST /api/auth/revoke-email-change
  4) Session invalidation via tokenVersion increment
  5) Login with new/old email post-verification
  6) Expired token auto-cleanup
  7) Regression: login + /api/settings + /api/auth/change-password
"""
import os
import subprocess
import json
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://settings-restructure-1.preview.emergentagent.com").rstrip("/")

CANONICAL_EMAIL = "bookingtest@test.com"
CANONICAL_PASSWORD = "password123"

BACKEND_DIR = "/app/kolor-studio-v2/backend"
HELPER = "scripts/iter268_prisma_helper.js"

DISPOSABLE_PREFIX = "iter268_"  # all disposable users start with this


def run_helper(*args):
    """Run the prisma helper. Returns parsed JSON (or None if non-json)."""
    result = subprocess.run(
        ["node", HELPER, *args],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Helper failed: args={args} stderr={result.stderr}")
    out = result.stdout.strip()
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return out


def make_disposable_email():
    return f"{DISPOSABLE_PREFIX}{uuid.uuid4().hex[:10]}@example.com"


def signup_user(email, password="TestPass123!", first="Iter", last="Test"):
    """Signup via API. Returns (email, password)."""
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "email": email,
        "password": password,
        "firstName": first,
        "lastName": last,
    }, timeout=30)
    assert r.status_code == 201, f"Signup failed for {email}: {r.status_code} {r.text[:300]}"
    return email, password


def login_session(email, password):
    """Login and return a requests.Session preserving auth cookie."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    return s, r


# ─────────────────────────────────────────────────────────────
# Cleanup fixture (session-scoped teardown)
# ─────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def _cleanup_disposable_users():
    yield
    try:
        result = run_helper("cleanup", DISPOSABLE_PREFIX)
        print(f"\n[CLEANUP] Deleted disposable users: {result}")
    except Exception as e:
        print(f"\n[CLEANUP] FAILED: {e}")
    # Ensure bookingtest is intact
    try:
        u = run_helper("get", CANONICAL_EMAIL)
        print(f"[CLEANUP] Canonical user state: {u}")
        # verify login still works
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CANONICAL_EMAIL, "password": CANONICAL_PASSWORD}, timeout=30)
        print(f"[CLEANUP] Canonical login status: {r.status_code}")
    except Exception as e:
        print(f"[CLEANUP] Canonical verify failed: {e}")


# ─────────────────────────────────────────────────────────────
# Fixtures: fresh disposable user + logged-in session
# ─────────────────────────────────────────────────────────────

@pytest.fixture()
def fresh_user():
    email = make_disposable_email()
    password = "TestPass123!"
    signup_user(email, password)
    return {"email": email, "password": password}


@pytest.fixture()
def fresh_session(fresh_user):
    s, r = login_session(fresh_user["email"], fresh_user["password"])
    assert r.status_code == 200, f"Login failed for fresh user: {r.status_code} {r.text[:300]}"
    return {"session": s, "email": fresh_user["email"], "password": fresh_user["password"]}


# ─────────────────────────────────────────────────────────────
# 1) POST /api/auth/request-email-change
# ─────────────────────────────────────────────────────────────

class TestRequestEmailChange:
    def test_unauthenticated_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": make_disposable_email(), "currentPassword": "whatever"}, timeout=30)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text[:200]}"

    def test_wrong_password_returns_401(self, fresh_session):
        s = fresh_session["session"]
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": make_disposable_email(), "currentPassword": "WRONG_PASSWORD"}, timeout=30)
        assert r.status_code == 401
        body = r.json()
        assert "current password" in body.get("message", "").lower(), f"Msg: {body}"

    def test_invalid_email_format_returns_400(self, fresh_session):
        s = fresh_session["session"]
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": "not-an-email", "currentPassword": fresh_session["password"]}, timeout=30)
        assert r.status_code == 400, f"got {r.status_code} {r.text[:200]}"

    def test_same_email_returns_400(self, fresh_session):
        s = fresh_session["session"]
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": fresh_session["email"], "currentPassword": fresh_session["password"]}, timeout=30)
        assert r.status_code == 400, f"got {r.status_code} {r.text[:200]}"
        assert "same" in r.json().get("message", "").lower()

    def test_email_already_used_returns_409(self, fresh_session):
        # create a 2nd user
        other_email = make_disposable_email()
        signup_user(other_email)
        s = fresh_session["session"]
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": other_email, "currentPassword": fresh_session["password"]}, timeout=30)
        assert r.status_code == 409, f"got {r.status_code} {r.text[:200]}"

    def test_happy_path_sets_pending_and_token(self, fresh_session):
        s = fresh_session["session"]
        new_email = make_disposable_email()
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": new_email, "currentPassword": fresh_session["password"]}, timeout=30)
        assert r.status_code == 200, f"got {r.status_code} {r.text[:400]}"
        body = r.json()
        assert body.get("success") is True
        assert body.get("pendingEmail") == new_email.lower()

        # DB verification via Prisma
        u = run_helper("get", fresh_session["email"])
        assert u["pendingEmail"] == new_email.lower(), f"pendingEmail not set: {u}"
        assert u["emailChangeToken"] is not None
        assert len(u["emailChangeToken"]) == 64, f"Token not 64-hex: {u['emailChangeToken']}"
        assert all(c in "0123456789abcdef" for c in u["emailChangeToken"])
        assert u["emailChangeTokenExpiry"] is not None
        assert u["emailChangeAttempts"] == 1

    def test_rate_limit_4th_request_returns_429(self, fresh_session):
        s = fresh_session["session"]
        # 3 successful requests
        for i in range(3):
            new_email = make_disposable_email()
            r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
                "newEmail": new_email, "currentPassword": fresh_session["password"]}, timeout=30)
            assert r.status_code == 200, f"Request #{i+1} failed: {r.status_code} {r.text[:200]}"
        # 4th
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": make_disposable_email(), "currentPassword": fresh_session["password"]}, timeout=30)
        assert r.status_code == 429, f"Expected 429, got {r.status_code}: {r.text[:200]}"
        body = r.json()
        assert "minute" in body.get("message", "").lower()


# ─────────────────────────────────────────────────────────────
# 2) GET /api/auth/verify-email-change/:token  (with token injection)
# ─────────────────────────────────────────────────────────────

class TestVerifyEmailChange:
    def test_garbage_token_returns_400(self):
        r = requests.get(f"{BASE_URL}/api/auth/verify-email-change/deadbeefgarbagetoken12345", timeout=30)
        assert r.status_code == 400, f"got {r.status_code} {r.text[:200]}"
        assert "invalid" in r.json().get("message", "").lower() or "expired" in r.json().get("message", "").lower()

    def test_happy_path_verifies_and_invalidates_session(self, fresh_session):
        s = fresh_session["session"]
        old_email = fresh_session["email"]
        new_email = make_disposable_email()
        raw_token = f"iter268rawtoken{uuid.uuid4().hex}"

        # First do a real request so we have valid state, then inject known token
        r = s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": new_email, "currentPassword": fresh_session["password"]}, timeout=30)
        assert r.status_code == 200

        # inject known raw token (hashes to emailChangeToken in DB)
        run_helper("inject", old_email, raw_token, new_email)

        # Session BEFORE verification: /api/settings should return 200
        pre = s.get(f"{BASE_URL}/api/settings", timeout=30)
        assert pre.status_code == 200, f"pre-verify /api/settings failed: {pre.status_code}"
        pre_token_version = run_helper("get", old_email)["tokenVersion"]

        # VERIFY
        vr = requests.get(f"{BASE_URL}/api/auth/verify-email-change/{raw_token}", timeout=30)
        assert vr.status_code == 200, f"verify failed: {vr.status_code} {vr.text[:300]}"
        vb = vr.json()
        assert vb.get("success") is True
        assert vb.get("oldEmail") == old_email
        assert vb.get("newEmail") == new_email.lower()

        # DB verification: email swapped, all 5 fields cleared, tokenVersion incremented
        u = run_helper("get", new_email)
        assert u is not None, "User not found by new email"
        assert u["email"] == new_email.lower()
        assert u["pendingEmail"] is None
        assert u["emailChangeToken"] is None
        assert u["emailChangeTokenExpiry"] is None
        assert u["emailChangeAttempts"] == 0
        assert u["emailChangeWindowStart"] is None
        assert u["tokenVersion"] == pre_token_version + 1, f"tokenVersion not incremented: {u['tokenVersion']} vs {pre_token_version}"

        # Session invalidation: old session cookie now returns 401
        post = s.get(f"{BASE_URL}/api/settings", timeout=30)
        assert post.status_code == 401, f"session not invalidated post-verify: {post.status_code}"

        # Login w/ NEW email works
        _, nr = login_session(new_email, fresh_session["password"])
        assert nr.status_code == 200, f"login with new email failed: {nr.status_code} {nr.text[:200]}"

        # Login w/ OLD email fails
        _, orr = login_session(old_email, fresh_session["password"])
        assert orr.status_code == 401, f"old email should not login: {orr.status_code}"

    def test_expired_token_returns_400_and_clears_fields(self, fresh_session):
        s = fresh_session["session"]
        old_email = fresh_session["email"]
        new_email = make_disposable_email()
        raw_token = f"iter268expired{uuid.uuid4().hex}"

        # Kick off a legit request first (to satisfy validation path)
        s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": new_email, "currentPassword": fresh_session["password"]}, timeout=30)

        # Now inject an EXPIRED token
        run_helper("inject-expired", old_email, raw_token, new_email)

        vr = requests.get(f"{BASE_URL}/api/auth/verify-email-change/{raw_token}", timeout=30)
        assert vr.status_code == 400, f"expected 400 for expired, got {vr.status_code} {vr.text[:200]}"
        assert "expired" in vr.json().get("message", "").lower()

        # Verify fields are auto-cleared
        u = run_helper("get", old_email)
        assert u["pendingEmail"] is None, f"pendingEmail not cleared: {u}"
        assert u["emailChangeToken"] is None
        assert u["emailChangeTokenExpiry"] is None
        # email UNCHANGED
        assert u["email"] == old_email


# ─────────────────────────────────────────────────────────────
# 3) POST /api/auth/revoke-email-change
# ─────────────────────────────────────────────────────────────

class TestRevokeEmailChange:
    def test_revoke_happy_path_and_double_revoke(self, fresh_session):
        s = fresh_session["session"]
        old_email = fresh_session["email"]
        new_email = make_disposable_email()
        raw_token = f"iter268revoke{uuid.uuid4().hex}"

        # Kick off request then inject known token
        s.post(f"{BASE_URL}/api/auth/request-email-change", json={
            "newEmail": new_email, "currentPassword": fresh_session["password"]}, timeout=30)
        run_helper("inject", old_email, raw_token, new_email)

        # REVOKE
        rv = requests.post(f"{BASE_URL}/api/auth/revoke-email-change", json={"token": raw_token}, timeout=30)
        assert rv.status_code == 200, f"revoke failed: {rv.status_code} {rv.text[:200]}"
        assert rv.json().get("success") is True

        # Verify DB: pendingEmail/token/expiry cleared, email UNCHANGED
        u = run_helper("get", old_email)
        assert u["email"] == old_email, f"email should be unchanged: {u}"
        assert u["pendingEmail"] is None
        assert u["emailChangeToken"] is None
        assert u["emailChangeTokenExpiry"] is None

        # Second revoke with same token -> 400
        rv2 = requests.post(f"{BASE_URL}/api/auth/revoke-email-change", json={"token": raw_token}, timeout=30)
        assert rv2.status_code == 400, f"second revoke should 400, got {rv2.status_code}: {rv2.text[:200]}"

    def test_revoke_missing_token_returns_400(self):
        r = requests.post(f"{BASE_URL}/api/auth/revoke-email-change", json={}, timeout=30)
        assert r.status_code == 400


# ─────────────────────────────────────────────────────────────
# 4) Regression: canonical login + settings + change-password path (non-destructive)
# ─────────────────────────────────────────────────────────────

class TestRegression:
    def test_canonical_login_and_settings(self):
        s, r = login_session(CANONICAL_EMAIL, CANONICAL_PASSWORD)
        assert r.status_code == 200, f"Canonical login failed: {r.status_code} {r.text[:200]}"
        assert r.json().get("user", {}).get("email") == CANONICAL_EMAIL
        sr = s.get(f"{BASE_URL}/api/settings", timeout=30)
        assert sr.status_code == 200

    def test_change_password_wrong_current_returns_401(self):
        """Non-destructive: ensure change-password endpoint untouched.
        We intentionally send wrong current password so the actual password never changes."""
        s, r = login_session(CANONICAL_EMAIL, CANONICAL_PASSWORD)
        assert r.status_code == 200
        cp = s.post(f"{BASE_URL}/api/auth/change-password", json={
            "currentPassword": "WRONG_CURRENT_PWD_ITER268",
            "newPassword": "SomeNewPassword123!",
        }, timeout=30)
        # Must be 400/401, NOT 500 → confirms endpoint is functional and untouched
        assert cp.status_code in (400, 401), f"change-password endpoint returned {cp.status_code}: {cp.text[:200]}"
