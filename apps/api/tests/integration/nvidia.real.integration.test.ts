import { NvidiaAIClient } from '../../src/modules/ai/nvidia/nvidia.client.js';
import { ENV } from '../../src/config/env.js';

describe('NVIDIA Live API Integration Test', () => {
  const apiKey = ENV.NVIDIA_API_KEY;
  const baseUrl = ENV.NVIDIA_API_BASE_URL;

  // Run live test only if API key is present
  const isKeyAvailable = apiKey && apiKey.startsWith('nvapi-');

  (isKeyAvailable ? it : it.skip)(
    'should query live NVIDIA /v1/models and execute a chat completion on NVIDIA NIM',
    async () => {
      const client = new NvidiaAIClient(baseUrl, apiKey, false);

      // 1. Check live model discovery
      const models = await client.listModels();
      expect(models.length).toBeGreaterThan(0);
      console.log(`✅ Live NVIDIA NIM connected! Discovered ${models.length} active models.`);

      // Pick a discovered active instruct model
      const testModel =
        models.find((m) => m.id.includes('llama-3.1-8b-instruct') || m.id.includes('llama-3.3-70b-instruct') || m.id.includes('mistral-large-2-instruct') || m.id.includes('nemotron-4-340b-instruct'))?.id ||
        models.find((m) => m.id.includes('-instruct') || m.id.includes('-it'))?.id ||
        models[0].id;
      console.log(`🧪 Testing inference with model: ${testModel}`);

      // 2. Execute minimal chat completion
      const start = Date.now();
      const response = await client.chatCompletion({
        model: testModel,
        messages: [
          { role: 'system', content: 'You are a concise AI assistant. Output JSON with a "greeting" key.' },
          { role: 'user', content: 'Say hello to the HumanizePro platform.' },
        ],
        temperature: 0.2,
        max_tokens: 150,
      });

      const durationMs = Date.now() - start;
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0].message.content).toBeDefined();
      console.log(`⚡ NVIDIA Inference response received in ${durationMs}ms:`, response.choices[0].message.content);
    },
    25000
  );
});
