"""
Test suite for KOLOR STUDIO CRM - Phase 7 Part 1: Client Portal Messaging System
Tests the bidirectional messaging thread between creative (studio owner) and client via portal.

Features tested:
1. GET /api/leads/:leadId/messages - Get all messages for a lead (authenticated)
2. POST /api/leads/:leadId/messages - Creative sends message (content required)
3. POST /api/leads/:leadId/messages with empty content - Should return 400
4. GET /api/portal/:token/messages - Public, returns messages for portal
5. POST /api/portal/:token/messages - Client sends message (content required)
6. PATCH /api/leads/:leadId/messages/read - Marks client messages as read
7. GET /api/leads/unread-counts/all - Returns unread counts per lead
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
EMMANUEL_LEAD_ID = "2002320d-9d1b-4f27-b126-758d8930340e"
PORTAL_TOKEN = "qix2u3mijnq0ncf9ycx48br"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for the test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("token")


@pytest.fixture
def auth_headers(auth_token):
    """Returns headers with authorization token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestAuthenticatedMessagesAPI:
    """Tests for authenticated message endpoints (Creative side)"""
    
    def test_get_messages_for_lead(self, auth_headers):
        """Test GET /api/leads/:leadId/messages - returns messages for a lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "messages" in data, "Response should contain 'messages' field"
        assert isinstance(data["messages"], list), "messages should be a list"
        
        # Verify message structure if messages exist
        if data["messages"]:
            msg = data["messages"][0]
            assert "id" in msg, "Message should have id"
            assert "content" in msg, "Message should have content"
            assert "from" in msg, "Message should have 'from' field"
            assert msg["from"] in ["CLIENT", "CREATIVE"], f"from should be CLIENT or CREATIVE, got {msg['from']}"
            assert "read" in msg, "Message should have 'read' field"
            assert "createdAt" in msg, "Message should have createdAt"
        
        print(f"SUCCESS: GET messages returned {len(data['messages'])} messages")

    def test_creative_send_message(self, auth_headers):
        """Test POST /api/leads/:leadId/messages - creative sends message"""
        unique_content = f"Test message from creative - {uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages",
            headers=auth_headers,
            json={"content": unique_content}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Response should contain 'message' field"
        msg = data["message"]
        assert msg["content"] == unique_content, "Content should match what was sent"
        assert msg["from"] == "CREATIVE", "Message should be from CREATIVE"
        assert msg["read"], "Creative messages should be marked as read"
        assert "id" in msg, "Message should have an id"
        assert "createdAt" in msg, "Message should have createdAt"
        
        print(f"SUCCESS: Creative sent message with id: {msg['id']}")

    def test_creative_send_empty_message_fails(self, auth_headers):
        """Test POST /api/leads/:leadId/messages with empty content returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages",
            headers=auth_headers,
            json={"content": ""}
        )
        
        assert response.status_code == 400, f"Expected 400 for empty content, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data, "Error response should have 'error' field"
        
        print("SUCCESS: Empty message correctly rejected with 400")

    def test_creative_send_whitespace_only_message_fails(self, auth_headers):
        """Test POST /api/leads/:leadId/messages with whitespace-only content returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages",
            headers=auth_headers,
            json={"content": "   "}
        )
        
        assert response.status_code == 400, f"Expected 400 for whitespace content, got {response.status_code}: {response.text}"
        
        print("SUCCESS: Whitespace-only message correctly rejected with 400")

    def test_mark_messages_as_read(self, auth_headers):
        """Test PATCH /api/leads/:leadId/messages/read - marks client messages as read"""
        response = requests.patch(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages/read",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should have success message"
        
        print("SUCCESS: Messages marked as read")

    def test_get_unread_counts(self, auth_headers):
        """Test GET /api/leads/unread-counts/all - returns unread counts per lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/unread-counts/all",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "unreadCounts" in data, "Response should contain 'unreadCounts' field"
        assert isinstance(data["unreadCounts"], dict), "unreadCounts should be a dict"
        
        print(f"SUCCESS: Unread counts retrieved: {len(data['unreadCounts'])} leads with unread messages")


class TestPortalMessagesAPI:
    """Tests for public portal message endpoints (Client side)"""
    
    def test_portal_get_messages(self):
        """Test GET /api/portal/:token/messages - public, returns messages for portal"""
        response = requests.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/messages"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "messages" in data, "Response should contain 'messages' field"
        assert isinstance(data["messages"], list), "messages should be a list"
        
        # Verify message structure if messages exist
        if data["messages"]:
            msg = data["messages"][0]
            assert "id" in msg, "Message should have id"
            assert "content" in msg, "Message should have content"
            assert "from" in msg, "Message should have 'from' field"
            assert msg["from"] in ["CLIENT", "CREATIVE"], "from should be CLIENT or CREATIVE"
            assert "read" in msg, "Message should have 'read' field"
            assert "createdAt" in msg, "Message should have createdAt"
        
        print(f"SUCCESS: Portal GET messages returned {len(data['messages'])} messages")

    def test_portal_client_send_message(self):
        """Test POST /api/portal/:token/messages - client sends message"""
        unique_content = f"Test message from client portal - {uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/messages",
            headers={"Content-Type": "application/json"},
            json={"content": unique_content}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Response should contain 'message' field"
        msg = data["message"]
        assert msg["content"] == unique_content, "Content should match what was sent"
        assert msg["from"] == "CLIENT", "Message should be from CLIENT"
        assert not msg["read"], "Client messages should start as unread"
        assert "id" in msg, "Message should have an id"
        assert "createdAt" in msg, "Message should have createdAt"
        
        print(f"SUCCESS: Client sent message via portal with id: {msg['id']}")

    def test_portal_client_send_empty_message_fails(self):
        """Test POST /api/portal/:token/messages with empty content returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/messages",
            headers={"Content-Type": "application/json"},
            json={"content": ""}
        )
        
        assert response.status_code == 400, f"Expected 400 for empty content, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data, "Error response should have 'error' field"
        
        print("SUCCESS: Empty portal message correctly rejected with 400")

    def test_portal_invalid_token_returns_404(self):
        """Test GET /api/portal/invalid-token/messages returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/portal/invalid-token-12345/messages"
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid token, got {response.status_code}: {response.text}"
        
        print("SUCCESS: Invalid portal token correctly returns 404")


class TestMessagingFlow:
    """End-to-end tests for the messaging flow"""
    
    def test_full_messaging_flow(self, auth_headers):
        """Test complete flow: creative sends message -> client sees it -> client replies -> creative sees reply"""
        # Step 1: Creative sends a message
        creative_msg = f"Hello from studio! - {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages",
            headers=auth_headers,
            json={"content": creative_msg}
        )
        assert response.status_code == 200, f"Creative send failed: {response.text}"
        creative_msg_id = response.json()["message"]["id"]
        print(f"Step 1: Creative sent message: {creative_msg_id}")
        
        # Step 2: Verify client can see the message via portal
        response = requests.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/messages")
        assert response.status_code == 200, f"Portal get failed: {response.text}"
        messages = response.json()["messages"]
        found = any(m["id"] == creative_msg_id for m in messages)
        assert found, "Creative message not found in portal messages"
        print("Step 2: Client sees message in portal")
        
        # Step 3: Client sends a reply via portal
        client_msg = f"Thanks for reaching out! - {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/messages",
            headers={"Content-Type": "application/json"},
            json={"content": client_msg}
        )
        assert response.status_code == 200, f"Client send failed: {response.text}"
        client_msg_id = response.json()["message"]["id"]
        print(f"Step 3: Client sent reply: {client_msg_id}")
        
        # Step 4: Verify creative can see the client reply
        response = requests.get(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Creative get failed: {response.text}"
        messages = response.json()["messages"]
        found = any(m["id"] == client_msg_id for m in messages)
        assert found, "Client message not found in creative messages"
        print("Step 4: Creative sees client reply")
        
        # Step 5: Verify unread count increased
        response = requests.get(
            f"{BASE_URL}/api/leads/unread-counts/all",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Unread counts failed: {response.text}"
        unread = response.json()["unreadCounts"]
        # Client message should show as unread
        print(f"Step 5: Unread counts: {unread.get(EMMANUEL_LEAD_ID, 0)} for lead")
        
        # Step 6: Mark as read and verify count decreases
        response = requests.patch(
            f"{BASE_URL}/api/leads/{EMMANUEL_LEAD_ID}/messages/read",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Mark read failed: {response.text}"
        print("Step 6: Messages marked as read")
        
        print("SUCCESS: Full messaging flow completed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
