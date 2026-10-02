const API_KEY = process.env.NVIDIA_API_KEY || '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';

async function testModel(modelId: string): Promise<boolean> {
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      console.log(`✅ WORKING: ${modelId}`);
      return true;
    } else {
      const err = await res.text();
      // console.log(`❌ ${modelId} -> ${res.status}: ${err.slice(0, 70)}`);
      return false;
    }
  } catch (err: any) {
    return false;
  }
}

async function run() {
  console.log('Fetching model list from NVIDIA API...');
  const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = (await res.json()) as any;
  const list: string[] = (data.data || []).map((m: any) => m.id);
  console.log(`Testing ${list.length} models for active status...`);

  const working: string[] = [];
  const batchSize = 10;
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((m) => testModel(m)));
    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        working.push(batch[j]);
      }
    }
  }

  console.log('\n=============================================');
  console.log('ACTIVE WORKING NVIDIA MODELS:', working);
  console.log('=============================================');
}

run();
