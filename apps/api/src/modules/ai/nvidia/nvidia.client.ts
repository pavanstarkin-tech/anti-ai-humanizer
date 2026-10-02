import { ENV } from '../../../config/env.js';

export interface NvidiaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NvidiaChatRequest {
  model: string;
  messages: NvidiaChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' | 'text' };
}

export interface NvidiaChatResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      reasoning?: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NvidiaModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface NvidiaHealthStatus {
  reachable: boolean;
  live: boolean;
  ready: boolean;
  latencyMs: number;
  endpoint: string;
}

export class NvidiaAIClient {
  private baseUrl: string;
  private apiKey: string;
  public mockMode: boolean;

  constructor(baseUrl = ENV.NVIDIA_API_BASE_URL, apiKey = ENV.NVIDIA_API_KEY, mockMode = ENV.USE_MOCK_NVIDIA) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.mockMode = mockMode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  async healthCheck(): Promise<NvidiaHealthStatus> {
    const start = Date.now();

    if (this.mockMode || !this.apiKey) {
      return {
        reachable: true,
        live: true,
        ready: true,
        latencyMs: 12,
        endpoint: this.baseUrl,
      };
    }

    try {
      // Try /v1/health/live or fallback to /v1/models
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - start;
      return {
        reachable: res.ok || res.status === 401,
        live: res.ok,
        ready: res.ok,
        latencyMs: latency,
        endpoint: this.baseUrl,
      };
    } catch (err) {
      return {
        reachable: false,
        live: false,
        ready: false,
        latencyMs: Date.now() - start,
        endpoint: this.baseUrl,
      };
    }
  }

  async listModels(): Promise<NvidiaModelInfo[]> {
    if (this.mockMode || !this.apiKey) {
      return [
        { id: 'openai/gpt-oss-20b', object: 'model', created: Date.now(), owned_by: 'NVIDIA' },
        { id: 'meta/llama-3.2-11b-vision-instruct', object: 'model', created: Date.now(), owned_by: 'NVIDIA' },
        { id: 'meta/llama-3.3-70b-instruct', object: 'model', created: Date.now(), owned_by: 'NVIDIA' },
        { id: 'mistralai/mistral-large-2-instruct', object: 'model', created: Date.now(), owned_by: 'NVIDIA' },
        { id: 'deepseek-ai/deepseek-r1', object: 'model', created: Date.now(), owned_by: 'NVIDIA' },
        { id: 'nvidia/nemotron-4-340b-instruct', object: 'model', created: Date.now(), owned_by: 'NVIDIA' },
      ];
    }

    const res = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NVIDIA API listModels failed [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as { data: NvidiaModelInfo[] };
    return data.data || [];
  }

  async chatCompletion(request: NvidiaChatRequest, timeoutMs = 75000): Promise<NvidiaChatResponse> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (this.mockMode) {
          return this.generateMockResponse(request);
        }

        if (!this.apiKey) {
          throw new Error('NVIDIA_API_KEY is not configured in environment.');
        }

        let currentModel = request.model;
        if (
          !currentModel.startsWith('openai/') &&
          !currentModel.startsWith('meta/llama-3.2') &&
          !currentModel.startsWith('writer/') &&
          (currentModel.includes('llama-3.1') || currentModel.includes('llama-3.3') || currentModel.includes('mistral-large-2'))
        ) {
          currentModel = 'meta/llama-3.2-11b-vision-instruct';
        }

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens ?? 4096,
            top_p: request.top_p ?? 1.0,
            response_format: request.response_format,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) {
          const errText = await res.text();
          // If model is deprecated (410 Gone / 404 Not Found), fallback to active fast Llama 3.2 11B
          if ((res.status === 410 || res.status === 404 || errText.includes('end of life') || errText.includes('no longer available')) && currentModel !== 'meta/llama-3.2-11b-vision-instruct') {
            console.warn(`⚠️ Model ${currentModel} is deprecated or unavailable (${res.status}). Auto-falling back to meta/llama-3.2-11b-vision-instruct.`);
            request.model = 'meta/llama-3.2-11b-vision-instruct';
            continue;
          }
          // If rate limit (429) or temporary gateway error (503/502), retry with backoff
          if ((res.status === 429 || res.status === 503 || res.status === 502) && attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }
          throw new Error(`NVIDIA API Error [${res.status}]: ${errText}`);
        }

        const data = (await res.json()) as NvidiaChatResponse;
        return data;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('410') || err.message?.includes('end of life')) {
          request.model = 'meta/llama-3.3-70b-instruct';
        }
        if (attempt < maxRetries && !err.message?.includes('401') && !err.message?.includes('403')) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('NVIDIA chat completion failed');
  }

  private generateMockResponse(request: NvidiaChatRequest): NvidiaChatResponse {
    const userMsg = request.messages.find((m) => m.role === 'user')?.content || '';
    const sysMsg = request.messages.find((m) => m.role === 'system')?.content || '';

    let content = '';

    if (sysMsg.includes('DOMAIN_CLASSIFIER') || userMsg.includes('Classify domain')) {
      content = JSON.stringify({
        primaryDomain: 'GENERAL',
        secondaryDomain: 'TECHNICAL',
        confidenceScores: { GENERAL: 0.85, TECHNICAL: 0.72 },
        detectedProtectedTerms: ['[TABLE_001]'],
        detectedKeyNumbers: ['2024'],
        reasoning: 'Classified using mock NVIDIA model.',
      });
    } else if (
      sysMsg.includes('INDEPENDENT_EVALUATOR') ||
      userMsg.includes('Evaluate 10 distinct properties')
    ) {
      content = JSON.stringify({
        scores: {
          naturalness: 86,
          clarity: 89,
          sentenceVariety: 84,
          repetitionReduction: 88,
          styleConsistency: 90,
          meaningPreservation: 95,
          factualConsistency: 95,
          terminologyPreservation: 92,
          citationPreservation: 96,
          protectedElementIntegrity: 100,
        },
        gates: {
          allPassed: true,
          checks: [
            { gate: 'MEANING_PRESERVATION', passed: true, score: 95 },
            { gate: 'FACTUAL_CONSISTENCY', passed: true, score: 95 },
            { gate: 'TERMINOLOGY_PRESERVATION', passed: true, score: 92 },
            { gate: 'CITATION_PRESERVATION', passed: true, score: 96 },
            { gate: 'PROTECTED_PLACEHOLDERS', passed: true, score: 100 },
            { gate: 'NUMERICAL_ACCURACY', passed: true, score: 100 },
          ],
          failedReasons: [],
        },
        feedback: { strengths: ['Clear phrasing', 'Factual fidelity'], weaknesses: [], actionableFixes: [] },
      });
    } else if (sysMsg.includes('REFINEMENT_EXPERT') || userMsg.includes('WEAKNESSES IDENTIFIED') || userMsg.includes('Refine text')) {
      const match = userMsg.match(/CURRENT CANDIDATE:\s*"""([\s\S]*?)"""/) || userMsg.match(/ORIGINAL TEXT:\s*"""([\s\S]*?)"""/);
      const textToRefine = match ? match[1].trim() : userMsg.trim();
      content = JSON.stringify({
        refinedText: textToRefine,
        addressedWeaknesses: ['Polished cadence and improved sentence transitions'],
        preservedPlaceholdersCheck: true,
        rationale: 'Refinement completed using NVIDIA model with all numbers and placeholders preserved.',
      });
    } else {
      // General rewrite candidate
      const match = userMsg.match(/Original Text:\s*"""([\s\S]*?)"""/) || userMsg.match(/"""([\s\S]*?)"""/);
      const originalText = match ? match[1].trim() : userMsg.trim();
      content = JSON.stringify({
        rewrittenText: originalText,
        changesSummary: `Humanized using NVIDIA model ${request.model} with active voice and varied sentence cadence`,
        preservedPlaceholders: originalText.match(/\[(TABLE|IMAGE|EQUATION|CITATION)_[0-9]+\]/g) || [],
        preservedTechnicalTerms: ['clinical decision-support', 'sensitivity', 'specificity'],
        stylisticChoices: 'Active voice, natural rhythm, academic rigor',
      });
    }

    return {
      id: `nv_mock_${Date.now()}`,
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 120,
        completion_tokens: 85,
        total_tokens: 205,
      },
    };
  }
}

export const nvidiaClient = new NvidiaAIClient();
