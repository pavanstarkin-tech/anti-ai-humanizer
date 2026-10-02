async function main() {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@humanizer.ai', password: 'Password123!' }),
  }).then((r) => r.json() as any);

  const token = loginRes.data.token;
  console.log('✅ Logged in successfully');

  const fd = new FormData();
  fd.append('file', new Blob(['The neural model achieves 96.8% precision on validation benchmark test sets. [REF_001]']), 'live_test.docx');
  fd.append('title', 'NVIDIA NIM Live Test');

  const uploadRes = await fetch('http://localhost:4000/api/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  }).then((r) => r.json() as any);

  const docId = uploadRes.data?.document?.id || uploadRes.data?.id;
  console.log('✅ Uploaded doc ID:', docId);

  await new Promise((r) => setTimeout(r, 1200));

  const doc = await fetch(`http://localhost:4000/api/documents/${docId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json() as any);

  const pageId = doc.data?.pages?.[0]?.id;
  console.log('✅ Found Page ID:', pageId);

  const humRes = await fetch(`http://localhost:4000/api/pages/${pageId}/humanize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ candidateCount: 1 }),
  }).then((r) => r.json() as any);

  const jobId = humRes.data.jobId;
  console.log('✅ Humanize job queued:', jobId);

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const job = await fetch(`http://localhost:4000/api/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json() as any);

    console.log(`[Job ${jobId.slice(0, 8)}] ${job.data?.progressPercent}% - ${job.data?.currentStep} (${job.data?.status})`);

    if (job.data?.status === 'COMPLETED') {
      console.log('\n🎉🎉🎉 LIVE NVIDIA NIM HUMANIZATION COMPLETED 100% SUCCESSFULLY! 🎉🎉🎉');
      
      const review = await fetch(`http://localhost:4000/api/pages/${pageId}/review`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json() as any);

      console.log('\n--- Generated & Evaluated Version ---');
      console.log('Text:', review.data?.currentVersion?.text);
      console.log('Overall Score:', review.data?.currentVersion?.overallScore);
      break;
    }

    if (job.data?.status === 'FAILED') {
      console.log('❌ Job failed:', JSON.stringify(job.data?.errorPayload));
      break;
    }
  }
}

main().catch(console.error);
