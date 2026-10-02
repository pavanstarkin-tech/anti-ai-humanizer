import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4000';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  httpCode?: number;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  endpoint: string,
  method: string,
  fn: () => Promise<{ status: number; data: any }>
) {
  const start = Date.now();
  process.stdout.write(`⏳ Testing [${method.padEnd(6)}] ${endpoint.padEnd(42)} - ${name}... `);
  try {
    const res = await fn();
    const durationMs = Date.now() - start;
    if (res.status >= 200 && res.status < 300) {
      console.log(`✅ PASS (${res.status}) [${durationMs}ms]`);
      results.push({ name, endpoint, method, status: 'PASS', httpCode: res.status, durationMs });
    } else {
      console.log(`❌ FAIL (${res.status}) [${durationMs}ms]`);
      results.push({ name, endpoint, method, status: 'FAIL', httpCode: res.status, message: JSON.stringify(res.data), durationMs });
    }
    return res.data;
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const msg = err.message || 'Unknown network error';
    console.log(`❌ FAIL [${durationMs}ms]: ${msg}`);
    results.push({ name, endpoint, method, status: 'FAIL', httpCode: 500, message: msg, durationMs });
    return null;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('===============================================================');
  console.log('  🧪 HUMANIZATION PLATFORM — FULL QA ENDPOINT TEST SUITE');
  console.log('===============================================================\n');

  // 1. Health Endpoints
  await runTest('System Health Check (/health)', '/health', 'GET', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  await runTest('API Health Check (/api/health)', '/api/health', 'GET', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  // 2. NVIDIA Models Endpoint
  await runTest('NVIDIA Live Model Discovery', '/api/models', 'GET', async () => {
    const res = await fetch(`${BASE_URL}/api/models`);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  // 3. Auth Login
  let authToken = '';
  const loginRes = await runTest('Admin Login', '/api/auth/login', 'POST', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@humanizepro.com',
        password: 'Password123!',
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  if (loginRes?.data?.token) {
    authToken = loginRes.data.token;
  }

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${authToken}`,
  };

  // 4. Auth Me
  await runTest('Current User Profile', '/api/auth/me', 'GET', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  // 5. Auth Register a new test user
  const randomEmail = `testuser_${Date.now()}@test.com`;
  await runTest('Register New User', '/api/auth/register', 'POST', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail,
        password: 'TestPassword123!',
        name: 'QA Automated Tester',
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  // 6. Upload Document
  const sampleDocPath = path.resolve(process.cwd(), 'qa/fixtures/sample_bias_ai.docx');
  let fileBlob: Blob;
  if (fs.existsSync(sampleDocPath)) {
    const buffer = fs.readFileSync(sampleDocPath);
    fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  } else {
    fileBlob = new Blob(['Test content for QA validation. Deep learning models achieve 99.2% accuracy on validation set.'], { type: 'text/plain' });
  }

  const formData = new FormData();
  formData.append('file', fileBlob, 'sample_qa_doc.docx');
  formData.append('title', 'QA Endpoint Verification Document');
  formData.append('targetAudience', 'Executive / Board');
  formData.append('tone', 'authoritative');

  let createdDocId: string = '';
  const uploadRes = await runTest('Upload Document', '/api/documents', 'POST', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  if (uploadRes?.data?.document?.id || uploadRes?.data?.id) {
    createdDocId = uploadRes.data?.document?.id || uploadRes.data?.id;
  }

  // 7. List Documents
  await runTest('List User Documents', '/api/documents', 'GET', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, { headers: authHeaders });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  });

  // Wait 1.5 seconds for async parser job to process pages
  await sleep(1500);

  // If createdDoc exists, test document retrieval & page operations
  if (createdDocId) {
    // 8. Get Document by ID
    let docPages: any[] = [];
    const docDetail = await runTest('Get Document Details', `/api/documents/${createdDocId}`, 'GET', async () => {
      const res = await fetch(`${BASE_URL}/api/documents/${createdDocId}`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    });

    docPages = docDetail?.data?.pages || [];

    if (docPages.length > 0) {
      const firstPageId = docPages[0].id;

      // 9. Review Page
      await runTest('Get Page Review Data', `/api/pages/${firstPageId}/review`, 'GET', async () => {
        const res = await fetch(`${BASE_URL}/api/pages/${firstPageId}/review`, { headers: authHeaders });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      });

      // 10. Humanize Page
      await runTest('Humanize Page (Multi-Expert NIM AI)', `/api/pages/${firstPageId}/humanize`, 'POST', async () => {
        const res = await fetch(`${BASE_URL}/api/pages/${firstPageId}/humanize`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateCount: 2,
            targetAudience: 'Executive',
          }),
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      });

      // 11. Approve All Pages in the Document (to satisfy reconstruct gate)
      for (const p of docPages) {
        await runTest(`Approve Page ${p.pageNumber}`, `/api/pages/${p.id}/approve`, 'POST', async () => {
          const res = await fetch(`${BASE_URL}/api/pages/${p.id}/approve`, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notes: `Approved during QA automated test suite run for page ${p.pageNumber}`,
            }),
          });
          const data = await res.json().catch(() => ({}));
          return { status: res.status, data };
        });
      }

      // 12. Reconstruct Document
      await runTest('Reconstruct Document Export', `/api/documents/${createdDocId}/reconstruct`, 'POST', async () => {
        const res = await fetch(`${BASE_URL}/api/documents/${createdDocId}/reconstruct`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'docx',
          }),
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      });
    }
  }

  // Summary Report
  console.log('\n===============================================================');
  console.log('  📊 QA ENDPOINT TEST SUMMARY');
  console.log('===============================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Endpoints Tested: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '🎉'}`);
  console.log('---------------------------------------------------------------');
  results.forEach((r) => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.method.padEnd(6)}] ${r.endpoint.padEnd(42)} -> ${r.name} (${r.durationMs}ms)`);
  });
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
