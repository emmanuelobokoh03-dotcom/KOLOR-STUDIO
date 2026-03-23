"""
KOLOR STUDIO CRM - File Attachments API Tests
Tests for file upload, download, and delete functionality
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hardened-crm-2.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    data = response.json()
    token = data.get("token")
    if not token:
        pytest.skip("No token in auth response")
    
    return token


@pytest.fixture(scope="module")
def test_lead_id(auth_token):
    """Get a lead ID for testing file operations"""
    response = requests.get(
        f"{BASE_URL}/api/leads",
        headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code != 200:
        pytest.skip(f"Failed to get leads: {response.status_code}")
    
    data = response.json()
    leads = data.get("leads", [])
    
    if not leads:
        pytest.skip("No leads available for testing")
    
    return leads[0]["id"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Create headers dict with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestFileEndpointsAuth:
    """Test authentication requirements for file endpoints"""
    
    def test_get_files_requires_auth(self, test_lead_id):
        """GET /api/leads/:leadId/files requires authentication"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead_id}/files")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ GET /api/leads/:leadId/files correctly returns 401 without auth")
    
    def test_upload_files_requires_auth(self, test_lead_id):
        """POST /api/leads/:leadId/files requires authentication"""
        files = {
            'files': ('test.txt', io.BytesIO(b'test content'), 'text/plain')
        }
        response = requests.post(f"{BASE_URL}/api/leads/{test_lead_id}/files", files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ POST /api/leads/:leadId/files correctly returns 401 without auth")
    
    def test_delete_file_requires_auth(self):
        """DELETE /api/files/:fileId requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/files/fake-file-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ DELETE /api/files/:fileId correctly returns 401 without auth")
    
    def test_download_file_requires_auth(self):
        """GET /api/files/:fileId/download requires authentication"""
        response = requests.get(f"{BASE_URL}/api/files/fake-file-id/download")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ GET /api/files/:fileId/download correctly returns 401 without auth")


class TestGetFiles:
    """Test GET /api/leads/:leadId/files endpoint"""
    
    def test_get_files_success(self, test_lead_id, auth_headers):
        """Successfully get files for a lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "files" in data, "Response should contain 'files' array"
        assert isinstance(data["files"], list), "'files' should be an array"
        
        print(f"✓ GET /api/leads/{test_lead_id}/files returns {len(data['files'])} files")
        
        # If there are files, verify structure
        if data["files"]:
            file = data["files"][0]
            assert "id" in file, "File should have 'id'"
            assert "filename" in file, "File should have 'filename'"
            assert "originalName" in file, "File should have 'originalName'"
            assert "mimeType" in file, "File should have 'mimeType'"
            assert "size" in file, "File should have 'size'"
            assert "formattedSize" in file, "File should have 'formattedSize'"
            assert "category" in file, "File should have 'category'"
            assert "url" in file, "File should have 'url'"
            assert "createdAt" in file, "File should have 'createdAt'"
            print(f"✓ File structure is correct: {file['originalName']}")
    
    def test_get_files_invalid_lead(self, auth_headers):
        """Returns 404 for non-existent lead"""
        fake_lead_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(
            f"{BASE_URL}/api/leads/{fake_lead_id}/files",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ GET /api/leads/:leadId/files returns 404 for invalid lead ID")


class TestFileUpload:
    """Test POST /api/leads/:leadId/files endpoint"""
    
    def test_upload_text_file(self, test_lead_id, auth_token):
        """Successfully upload a text file"""
        # Create a test file
        test_content = b"This is a test file for KOLOR STUDIO CRM file upload testing."
        files = {
            'files': ('TEST_upload_test.txt', io.BytesIO(test_content), 'text/plain')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "files" in data, "Response should contain 'files' array"
        assert len(data["files"]) == 1, "Should have uploaded 1 file"
        
        uploaded_file = data["files"][0]
        assert uploaded_file["originalName"] == "TEST_upload_test.txt"
        assert uploaded_file["mimeType"] == "text/plain"
        assert "id" in uploaded_file
        assert "url" in uploaded_file
        assert "formattedSize" in uploaded_file
        assert "category" in uploaded_file
        assert uploaded_file["category"] == "text"
        
        print(f"✓ File upload successful: {uploaded_file['originalName']} ({uploaded_file['formattedSize']})")
        
        # Store file ID for cleanup
        return uploaded_file["id"]
    
    def test_upload_multiple_files(self, test_lead_id, auth_token):
        """Successfully upload multiple files at once"""
        files = [
            ('files', ('TEST_multi_1.txt', io.BytesIO(b'Content 1'), 'text/plain')),
            ('files', ('TEST_multi_2.txt', io.BytesIO(b'Content 2'), 'text/plain')),
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert len(data["files"]) == 2, f"Expected 2 files, got {len(data['files'])}"
        
        print(f"✓ Multiple file upload successful: uploaded {len(data['files'])} files")
    
    def test_upload_no_files(self, test_lead_id, auth_token):
        """Returns 400 when no files are provided"""
        response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Upload correctly returns 400 when no files provided")
    
    def test_upload_to_invalid_lead(self, auth_token):
        """Returns 404 when uploading to non-existent lead"""
        fake_lead_id = "00000000-0000-0000-0000-000000000000"
        files = {
            'files': ('test.txt', io.BytesIO(b'test'), 'text/plain')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{fake_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Upload correctly returns 404 for invalid lead ID")


class TestFileActivityLogging:
    """Test that file operations log activities"""
    
    def test_file_upload_logs_activity(self, test_lead_id, auth_token, auth_headers):
        """File upload should create FILE_UPLOADED activity"""
        # First, get current activities count
        activities_before = requests.get(
            f"{BASE_URL}/api/leads/{test_lead_id}/activities",
            headers=auth_headers
        ).json().get("activities", [])
        
        # Upload a file
        files = {
            'files': ('TEST_activity_log.txt', io.BytesIO(b'Activity test file'), 'text/plain')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert upload_response.status_code == 201, f"Upload failed: {upload_response.status_code}"
        
        # Check activities after
        activities_after = requests.get(
            f"{BASE_URL}/api/leads/{test_lead_id}/activities",
            headers=auth_headers
        ).json().get("activities", [])
        
        assert len(activities_after) > len(activities_before), "Activity should be logged"
        
        # Find FILE_UPLOADED activity
        latest_activity = activities_after[0]  # Most recent first
        assert latest_activity["type"] == "FILE_UPLOADED", f"Expected FILE_UPLOADED, got {latest_activity['type']}"
        assert "TEST_activity_log.txt" in latest_activity["description"], "Activity should mention filename"
        
        print(f"✓ FILE_UPLOADED activity logged: {latest_activity['description']}")


class TestFileDownload:
    """Test GET /api/files/:fileId/download endpoint"""
    
    def test_download_url_for_existing_file(self, test_lead_id, auth_token, auth_headers):
        """Get download URL for an existing file"""
        # First, upload a file
        files = {
            'files': ('TEST_download_test.txt', io.BytesIO(b'Download test content'), 'text/plain')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert upload_response.status_code == 201
        file_id = upload_response.json()["files"][0]["id"]
        
        # Get download URL
        download_response = requests.get(
            f"{BASE_URL}/api/files/{file_id}/download",
            headers=auth_headers
        )
        
        assert download_response.status_code == 200, f"Expected 200, got {download_response.status_code}"
        
        data = download_response.json()
        assert "url" in data, "Response should contain 'url'"
        assert "filename" in data, "Response should contain 'filename'"
        assert data["url"].startswith("http"), "URL should be a valid HTTP URL"
        
        print(f"✓ Download URL generated successfully for {data['filename']}")
    
    def test_download_invalid_file(self, auth_headers):
        """Returns 404 for non-existent file"""
        fake_file_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(
            f"{BASE_URL}/api/files/{fake_file_id}/download",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Download correctly returns 404 for invalid file ID")


class TestFileDelete:
    """Test DELETE /api/files/:fileId endpoint"""
    
    def test_delete_file_success(self, test_lead_id, auth_token, auth_headers):
        """Successfully delete a file"""
        # First, upload a file to delete
        files = {
            'files': ('TEST_to_delete.txt', io.BytesIO(b'File to be deleted'), 'text/plain')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert upload_response.status_code == 201
        file_id = upload_response.json()["files"][0]["id"]
        
        # Delete the file
        delete_response = requests.delete(
            f"{BASE_URL}/api/files/{file_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert "message" in data, "Response should contain 'message'"
        
        print(f"✓ File deleted successfully")
        
        # Verify file is gone
        download_response = requests.get(
            f"{BASE_URL}/api/files/{file_id}/download",
            headers=auth_headers
        )
        
        assert download_response.status_code == 404, "Deleted file should return 404"
        print(f"✓ Deleted file returns 404 when accessed")
    
    def test_delete_invalid_file(self, auth_headers):
        """Returns 404 for non-existent file"""
        fake_file_id = "00000000-0000-0000-0000-000000000000"
        response = requests.delete(
            f"{BASE_URL}/api/files/{fake_file_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Delete correctly returns 404 for invalid file ID")


class TestCleanup:
    """Clean up test files"""
    
    def test_cleanup_test_files(self, test_lead_id, auth_token, auth_headers):
        """Remove TEST_ prefixed files created during testing"""
        # Get all files
        response = requests.get(
            f"{BASE_URL}/api/leads/{test_lead_id}/files",
            headers=auth_headers
        )
        
        if response.status_code != 200:
            print("⚠ Could not fetch files for cleanup")
            return
        
        files = response.json().get("files", [])
        test_files = [f for f in files if f["originalName"].startswith("TEST_")]
        
        deleted_count = 0
        for file in test_files:
            delete_response = requests.delete(
                f"{BASE_URL}/api/files/{file['id']}",
                headers=auth_headers
            )
            if delete_response.status_code == 200:
                deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test files")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
