import urllib.request
import json
import os
import sys
import mimetypes
import uuid

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://acheva.in/humanizer-api/api"

def run_qa_tests():
    print("==================================================================")
    print("🧪 FULL QA TEST SUITE: HOSTINGER LIVE PHP ENDPOINTS")
    print("🌐 Base URL:", BASE_URL)
    print("==================================================================\n")

    # 1. Test Health Endpoint
    print("👉 Test 1: Testing Health Endpoint...")
    req = urllib.request.Request(f"{BASE_URL}/health.php")
    with urllib.request.urlopen(req) as res:
        health_data = json.loads(res.read().decode('utf-8'))
        print("   Health Response:", json.dumps(health_data, indent=2))
        assert health_data['status'] == 'healthy', "Health check failed!"
        assert health_data['nvidia_api']['status'] == 'connected', "NVIDIA API not connected!"
        print("   ✅ Test 1 Passed: Server & NVIDIA API are 100% Healthy!\n")

    # 2. Test Upload Endpoint with real DOCX
    test_docx_path = "C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment.docx"
    print(f"👉 Test 2: Uploading DOCX to {BASE_URL}/upload.php...")
    print(f"   Source File: {test_docx_path}")

    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    with open(test_docx_path, 'rb') as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="2. Bias in AI recruitment.docx"\r\n'
        f"Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n"
    ).encode('utf-8') + file_bytes + f"\r\n--{boundary}--\r\n".encode('utf-8')

    upload_req = urllib.request.Request(
        f"{BASE_URL}/upload.php",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )

    with urllib.request.urlopen(upload_req) as res:
        upload_res = json.loads(res.read().decode('utf-8'))
        print("   Upload Response Summary:")
        print(f"   - Document ID: {upload_res.get('documentId')}")
        print(f"   - Tables Extracted: {upload_res.get('tablesCount')} (Expected: 13)")
        print(f"   - Total Paragraphs: {upload_res.get('totalParagraphs')}")
        print(f"   - Humanizable Paragraphs: {upload_res.get('humanizableParagraphs')}")
        assert upload_res['success'] is True, "Upload failed!"
        assert upload_res['tablesCount'] == 13, f"Expected 13 tables, got {upload_res.get('tablesCount')}"
        document_id = upload_res['documentId']
        paragraphs = upload_res['paragraphs']
        print("   ✅ Test 2 Passed: Document parsed & all 13 tables extracted!\n")

    # 3. Test Humanize Endpoint
    print(f"👉 Test 3: Testing Paragraph Humanization on {BASE_URL}/humanize.php...")
    sample_para = [p for p in paragraphs if p.get('shouldHumanize')][0]['text']
    print(f"   Original Sample Paragraph: \"{sample_para[:120]}...\"")

    humanize_payload = json.dumps({"text": sample_para}).encode('utf-8')
    hum_req = urllib.request.Request(
        f"{BASE_URL}/humanize.php",
        data=humanize_payload,
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(hum_req) as res:
        hum_res = json.loads(res.read().decode('utf-8'))
        humanized_text = hum_res.get('humanizedText', '')
        print(f"   Humanized Output: \"{humanized_text[:120]}...\"")
        assert hum_res['success'] is True, "Humanization failed!"
        assert len(humanized_text) > 30, "Humanized text is empty!"
        print("   ✅ Test 3 Passed: Paragraph humanized with NVIDIA AI & Lynote Sanitizer!\n")

    # 4. Test In-Place Reconstruction Endpoint
    print(f"👉 Test 4: Testing In-Place Reconstruction on {BASE_URL}/reconstruct.php...")
    humanized_map = {
        sample_para: humanized_text
    }

    reconstruct_payload = json.dumps({
        "documentId": document_id,
        "humanizedMap": humanized_map
    }).encode('utf-8')

    rec_req = urllib.request.Request(
        f"{BASE_URL}/reconstruct.php",
        data=reconstruct_payload,
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(rec_req) as res:
        rec_res = json.loads(res.read().decode('utf-8'))
        print("   Reconstruction Result:")
        print("   - Replaced Paragraphs:", rec_res.get('replacedParagraphs'))
        print("   - Download DOCX URL:", rec_res.get('downloadDocxUrl'))
        print("   - Download TXT URL:", rec_res.get('downloadTxtUrl'))
        assert rec_res['success'] is True, "Reconstruction failed!"
        assert rec_res.get('downloadDocxUrl'), "No download URL returned!"
        docx_url = rec_res['downloadDocxUrl']
        print("   ✅ Test 4 Passed: In-place DOCX reconstructed and download URL generated!\n")

    # 5. Test Live File Download & Verification
    print(f"👉 Test 5: Downloading reconstructed DOCX from {docx_url}...")
    with urllib.request.urlopen(docx_url) as res:
        downloaded_bytes = res.read()
        print(f"   Downloaded Size: {len(downloaded_bytes)} bytes")
        assert len(downloaded_bytes) > 50000, "Downloaded DOCX file is too small!"
        print("   ✅ Test 5 Passed: Downloaded file verified!\n")

    print("==================================================================")
    print("🎉 ALL QA TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL.")
    print("==================================================================")

if __name__ == "__main__":
    run_qa_tests()
