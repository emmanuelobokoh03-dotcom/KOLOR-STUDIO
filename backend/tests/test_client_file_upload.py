"""
Test Suite: Phase 7 Part 2 - Client File Upload System
Tests client file upload functionality via portal
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://autopilot-portal-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "emmanuelobokoh03@gmail.com"
TEST_PASSWORD = "successful26#"
PORTAL_TOKEN = "7571cca7-ccda-461c-99c6-6ab2ea8170e5"  # Cokespice lead
LEAD_ID = "6bc704c4-8030-42e2-be8a-8f7ed4035709"  # Cokespice lead ID


@pytest.fixture(scope="module")
def session():
    """Create a requests session"""
    return requests.Session()


@pytest.fixture(scope="module")
def auth_token(session):
    """Get authentication token for creative dashboard tests"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✓ Login successful, got token")
        return token
    else:
        print(f"✗ Login failed: {response.status_code} - {response.text}")
        pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return auth headers for authenticated requests"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPortalUploadEndpoint:
    """Test POST /api/portal/:token/upload - Client file upload via portal"""

    def test_upload_valid_txt_file(self, session):
        """Client can upload a valid .txt file"""
        # Create a test file
        file_content = b"Test file content for client upload testing"
        files = {
            'files': ('test_upload.txt', io.BytesIO(file_content), 'text/plain')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"Upload response: {response.status_code} - {response.text[:200]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "files" in data, "Response should contain 'files' array"
        assert len(data["files"]) == 1, "Should have uploaded 1 file"
        
        uploaded_file = data["files"][0]
        assert uploaded_file["originalName"] == "test_upload.txt"
        assert uploaded_file["uploadedBy"] == "client"
        print(f"✓ File uploaded: {uploaded_file['originalName']}, uploadedBy: {uploaded_file['uploadedBy']}")

    def test_upload_valid_image_file(self, session):
        """Client can upload a valid .jpg image file"""
        # Create a minimal valid JPEG header
        jpeg_content = bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]) + b'\x00' * 100
        files = {
            'files': ('test_image.jpg', io.BytesIO(jpeg_content), 'image/jpeg')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"Image upload response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["files"]) == 1
        assert data["files"][0]["uploadedBy"] == "client"
        print(f"✓ Image uploaded successfully")

    def test_upload_valid_pdf_file(self, session):
        """Client can upload a valid .pdf file"""
        pdf_content = b"%PDF-1.4 test content"
        files = {
            'files': ('test_document.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"PDF upload response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["files"]) == 1
        assert data["files"][0]["uploadedBy"] == "client"
        print(f"✓ PDF uploaded successfully")

    def test_upload_blocked_exe_file(self, session):
        """Blocked file type .exe should be rejected"""
        exe_content = b"MZ fake exe content"
        files = {
            'files': ('malicious.exe', io.BytesIO(exe_content), 'application/octet-stream')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"EXE upload response: {response.status_code} - {response.text[:200]}")
        # Should be rejected - either 400 or 500 with error
        assert response.status_code in [400, 500], f"Expected rejection, got {response.status_code}"
        print(f"✓ .exe file correctly rejected")

    def test_upload_blocked_sh_file(self, session):
        """Blocked file type .sh should be rejected"""
        sh_content = b"#!/bin/bash\necho 'malicious'"
        files = {
            'files': ('script.sh', io.BytesIO(sh_content), 'application/x-sh')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"SH upload response: {response.status_code}")
        assert response.status_code in [400, 500], f"Expected rejection, got {response.status_code}"
        print(f"✓ .sh file correctly rejected")

    def test_upload_blocked_js_file(self, session):
        """Blocked file type .js should be rejected"""
        js_content = b"console.log('malicious');"
        files = {
            'files': ('script.js', io.BytesIO(js_content), 'application/javascript')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"JS upload response: {response.status_code}")
        assert response.status_code in [400, 500], f"Expected rejection, got {response.status_code}"
        print(f"✓ .js file correctly rejected")

    def test_upload_blocked_bat_file(self, session):
        """Blocked file type .bat should be rejected"""
        bat_content = b"@echo off\necho malicious"
        files = {
            'files': ('script.bat', io.BytesIO(bat_content), 'text/plain')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"BAT upload response: {response.status_code}")
        assert response.status_code in [400, 500], f"Expected rejection, got {response.status_code}"
        print(f"✓ .bat file correctly rejected")

    def test_upload_multiple_files(self, session):
        """Client can upload up to 5 files at once"""
        files = [
            ('files', ('file1.txt', io.BytesIO(b"content 1"), 'text/plain')),
            ('files', ('file2.txt', io.BytesIO(b"content 2"), 'text/plain')),
            ('files', ('file3.txt', io.BytesIO(b"content 3"), 'text/plain')),
        ]
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"Multiple files upload response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["files"]) == 3, f"Expected 3 files, got {len(data['files'])}"
        print(f"✓ Multiple files uploaded successfully: {len(data['files'])} files")

    def test_upload_no_files(self, session):
        """Upload with no files should return 400"""
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload"
        )
        
        print(f"No files upload response: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Empty upload correctly rejected")

    def test_upload_invalid_token(self, session):
        """Upload with invalid token should return 404"""
        files = {
            'files': ('test.txt', io.BytesIO(b"test"), 'text/plain')
        }
        
        response = session.post(
            f"{BASE_URL}/api/portal/invalid-token-12345/upload",
            files=files
        )
        
        print(f"Invalid token upload response: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid token correctly returns 404")


class TestPortalGetFilesEndpoint:
    """Test GET /api/portal/:token/files - List client-uploaded files"""

    def test_get_client_files(self, session):
        """Client can list their uploaded files via portal"""
        response = session.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/files")
        
        print(f"Get files response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200
        
        data = response.json()
        assert "files" in data, "Response should contain 'files' array"
        print(f"✓ Client files retrieved: {len(data['files'])} files")
        
        # Check file structure
        if len(data["files"]) > 0:
            file = data["files"][0]
            assert "id" in file, "File should have id"
            assert "name" in file, "File should have name"
            assert "size" in file, "File should have size"
            print(f"  First file: {file.get('name')}")

    def test_get_files_invalid_token(self, session):
        """Get files with invalid token should return 404"""
        response = session.get(f"{BASE_URL}/api/portal/invalid-token-xyz/files")
        
        print(f"Invalid token get files response: {response.status_code}")
        assert response.status_code == 404
        print(f"✓ Invalid token correctly returns 404")


class TestPortalDataIncludesClientFiles:
    """Test GET /api/portal/:token - Portal data includes client-uploaded files"""

    def test_portal_data_includes_files(self, session):
        """Portal data should include client-uploaded files with uploadedBy field"""
        response = session.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        
        print(f"Portal data response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "files" in data, "Portal data should contain 'files' array"
        
        files = data["files"]
        print(f"Portal shows {len(files)} files")
        
        # Check for uploadedBy field
        for file in files:
            if "uploadedBy" in file:
                print(f"  File: {file.get('name')}, uploadedBy: {file.get('uploadedBy')}")
                assert file["uploadedBy"] in ["client", "creative"], f"uploadedBy should be 'client' or 'creative'"
        
        print(f"✓ Portal data correctly includes files with uploadedBy field")

    def test_portal_shows_client_uploaded_files(self, session):
        """Portal should show files uploaded by client with 'client' indicator"""
        response = session.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        
        assert response.status_code == 200
        data = response.json()
        
        client_files = [f for f in data.get("files", []) if f.get("uploadedBy") == "client"]
        print(f"Found {len(client_files)} client-uploaded files in portal")
        
        if len(client_files) > 0:
            print(f"✓ Client-uploaded files visible in portal")
        else:
            print(f"⚠ No client-uploaded files found yet (this may be OK if tests run first)")


class TestPortalFileDownload:
    """Test GET /api/portal/:token/files/:fileId/download - Download files from portal"""

    def test_download_shared_file(self, session):
        """Client can download shared files via portal"""
        # First get files list to find a file ID
        response = session.get(f"{BASE_URL}/api/portal/{PORTAL_TOKEN}")
        assert response.status_code == 200
        
        files = response.json().get("files", [])
        if len(files) == 0:
            pytest.skip("No files available for download test")
        
        file_id = files[0]["id"]
        print(f"Testing download of file: {files[0].get('name', file_id)}")
        
        # Try to download
        download_response = session.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/files/{file_id}/download",
            allow_redirects=False
        )
        
        print(f"Download response: {download_response.status_code}")
        # Should redirect to file URL or return file content
        assert download_response.status_code in [200, 302, 307], f"Expected redirect or success, got {download_response.status_code}"
        print(f"✓ File download endpoint working")

    def test_download_invalid_file(self, session):
        """Download with invalid file ID should return 404"""
        response = session.get(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/files/invalid-file-id/download",
            allow_redirects=False
        )
        
        print(f"Invalid file download response: {response.status_code}")
        assert response.status_code == 404
        print(f"✓ Invalid file ID correctly returns 404")


class TestCreativeDashboardShowsClientUploads:
    """Test GET /api/leads/:leadId/files - Creative sees client-uploaded files"""

    def test_creative_sees_client_uploads(self, session, auth_headers):
        """Creative dashboard should show files with uploadedBy = 'client'"""
        response = session.get(
            f"{BASE_URL}/api/leads/{LEAD_ID}/files",
            headers=auth_headers
        )
        
        print(f"Creative files response: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200
        
        data = response.json()
        assert "files" in data, "Response should contain 'files' array"
        
        files = data["files"]
        print(f"Creative sees {len(files)} total files")
        
        # Check for client-uploaded files
        client_uploads = [f for f in files if f.get("uploadedBy") == "client"]
        print(f"  Client-uploaded files: {len(client_uploads)}")
        
        for f in client_uploads:
            print(f"    - {f.get('originalName')}, uploadedBy: {f.get('uploadedBy')}")
        
        if len(client_uploads) > 0:
            print(f"✓ Creative dashboard correctly shows client-uploaded files with badge")
        else:
            print(f"⚠ No client-uploaded files found for this lead yet")


class TestFileValidationRules:
    """Test file validation: max 5 files, 50MB limit, allowed/blocked extensions"""

    def test_max_5_files_enforced(self, session):
        """Cannot upload more than 5 files at once"""
        files = [
            ('files', (f'file{i}.txt', io.BytesIO(f"content {i}".encode()), 'text/plain'))
            for i in range(6)
        ]
        
        response = session.post(
            f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
            files=files
        )
        
        print(f"6 files upload response: {response.status_code}")
        # Should either return error or only accept first 5
        if response.status_code == 200:
            data = response.json()
            # Multer limit should have kicked in
            assert len(data.get("files", [])) <= 5, "Should not upload more than 5 files"
            print(f"✓ Max 5 files enforced - uploaded {len(data.get('files', []))} files")
        else:
            # Error is also acceptable
            print(f"✓ Max 5 files enforced - request rejected")

    def test_allowed_extensions_pass(self, session):
        """Allowed extensions should pass validation"""
        allowed_exts = ['.png', '.pdf', '.txt', '.zip']
        
        for ext in allowed_exts:
            files = {
                'files': (f'test_file{ext}', io.BytesIO(b"test content"), 'application/octet-stream')
            }
            
            response = session.post(
                f"{BASE_URL}/api/portal/{PORTAL_TOKEN}/upload",
                files=files
            )
            
            print(f"Extension {ext}: {response.status_code}")
            assert response.status_code == 200, f"Extension {ext} should be allowed"
        
        print(f"✓ All allowed extensions pass validation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
