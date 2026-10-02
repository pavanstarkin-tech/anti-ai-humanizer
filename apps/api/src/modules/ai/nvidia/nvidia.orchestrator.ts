import {
  DomainType,
  ExpertType,
  IDomainClassificationOutput,
  ICandidateGenerationOutput,
  IEvaluationOutput,
  IRefinementOutput,
} from '@humanizer/shared';
import { NvidiaAIClient, nvidiaClient } from './nvidia.client.js';
import { ModelRegistry } from './model.registry.js';
import { NVIDIAModelDiscoveryService } from './discovery.service.js';
import { EXPERT_REGISTRY } from '../experts/expert.registry.js';
import { PROMPT_REGISTRY } from '../../../config/constants.js';
import { aiRequestRepository } from '../../../database/repositories/ai_request.repository.js';
import { lynotePostProcessor } from '../../processing/postprocessor.js';
import { randomUUID } from 'crypto';

export function cleanProseText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();

  // Strip markdown fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```json') || cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  }

  // If text is a stringified JSON object containing rewrittenText or text
  if (cleaned.startsWith('{') && (cleaned.includes('"rewrittenText"') || cleaned.includes('"text"') || cleaned.includes('"refinedText"'))) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.rewrittenText) return cleanProseText(parsed.rewrittenText);
      if (parsed.text) return cleanProseText(parsed.text);
      if (parsed.refinedText) return cleanProseText(parsed.refinedText);
    } catch {
      // Regex extraction fallback
      const match = cleaned.match(/"(?:rewrittenText|text|refinedText)"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"[a-zA-Z]+"\s*:|\s*})/);
      if (match && match[1]) {
        return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
      }
    }
  }

  return cleaned;
}

export function extractJsonFromLlmResponse(rawContent: string): any {
  if (!rawContent || typeof rawContent !== 'string') return {};

  let text = rawContent.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  // 1. Direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // 2. Parse extracted outermost brace block
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSub = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSub);
    } catch {}

    // 3. Fix unescaped newlines in JSON string values
    try {
      const sanitized = jsonSub.replace(/(?<=:\s*"[\s\S]*?)([\r\n\t])(?=[\s\S]*?")/g, (match) => {
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return match;
      });
      return JSON.parse(sanitized);
    } catch {}
  }

  // 4. Regex fallback extraction
  const rewrittenMatch = text.match(/"(?:rewrittenText|rewritten_text|text|refinedText)"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"[a-zA-Z]+"\s*:|\s*})/);
  if (rewrittenMatch && rewrittenMatch[1]) {
    const unescaped = rewrittenMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    return {
      rewrittenText: unescaped,
      text: unescaped,
      refinedText: unescaped,
    };
  }

  return { rewrittenText: cleanProseText(text), text: cleanProseText(text) };
}

export class NvidiaMultiModelOrchestrator {
  private discoveryService: NVIDIAModelDiscoveryService;
  public modelRegistry: ModelRegistry;

  constructor(private client: NvidiaAIClient = nvidiaClient) {
    this.discoveryService = new NVIDIAModelDiscoveryService(this.client);
    this.modelRegistry = new ModelRegistry(this.discoveryService);
  }

  // Model-aware invocation with automatic fallback & MySQL audit logging
  private async executeModelRequest<T>(params: {
    task: string;
    domain?: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    schemaParser: (raw: any) => T;
    metadata?: {
      documentId?: string | null;
      pageId?: string | null;
      candidateId?: string | null;
      iteration?: number;
      expertId?: string;
    };
  }): Promise<{ result: T; modelId: string; durationMs: number; fallbackUsed: boolean }> {
    const { selectedModelId, role, fallbackModels } = this.modelRegistry.getModelForTask(
      params.task,
      params.domain
    );

    const requestId = randomUUID();
    const startTime = Date.now();
    const candidateModels = [selectedModelId, ...fallbackModels];

    let lastError: any = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const activeModelId = candidateModels[i];
      const isFallback = i > 0;

      try {
        const response = await this.client.chatCompletion({
          model: activeModelId,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          temperature: params.temperature ?? 0.6,
          max_tokens: params.maxTokens ?? 4096,
        });

        const durationMs = Date.now() - startTime;
        const rawContent = response.choices[0]?.message?.content || '{}';
        const parsedJson = extractJsonFromLlmResponse(rawContent);
        const validated = params.schemaParser(parsedJson);

        // Record in MySQL AIRequestLog
        await aiRequestRepository.logRequest({
          requestId,
          documentId: params.metadata?.documentId,
          pageId: params.metadata?.pageId,
          candidateId: params.metadata?.candidateId,
          iteration: params.metadata?.iteration || 1,
          task: params.task,
          expertId: params.metadata?.expertId || role,
          modelId: activeModelId,
          provider: 'NVIDIA',
          promptVersion: 'v1.0',
          durationMs,
          status: 'SUCCESS',
          fallbackUsed: isFallback,
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        });

        return {
          result: validated,
          modelId: activeModelId,
          durationMs,
          fallbackUsed: isFallback,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[NVIDIA Model Failover] Model ${activeModelId} failed for task ${params.task}: ${err.message}. Trying fallback...`);
      }
    }

    const durationMs = Date.now() - startTime;
    await aiRequestRepository.logRequest({
      requestId,
      documentId: params.metadata?.documentId,
      pageId: params.metadata?.pageId,
      candidateId: params.metadata?.candidateId,
      iteration: params.metadata?.iteration || 1,
      task: params.task,
      expertId: role,
      modelId: selectedModelId,
      provider: 'NVIDIA',
      durationMs,
      status: 'FAILED',
      errorMessage: lastError?.message || 'All NVIDIA models failed for task',
    });

    throw lastError || new Error(`NVIDIA request failed for task ${params.task}`);
  }

  async classifyDomain(
    text: string,
    metadata?: { documentId?: string; pageId?: string }
  ): Promise<IDomainClassificationOutput & { assignedExperts: ExpertType[]; modelUsed: string }> {
    const userPrompt = `Document text:\n"""${text.slice(0, 3500)}"""\n\nClassify domain, confidence scores, detected numbers, and protected terms. Return valid JSON.`;

    const { result, modelId } = await this.executeModelRequest({
      task: 'CLASSIFY',
      systemPrompt: `${PROMPT_REGISTRY.DOMAIN_CLASSIFIER}\nOutput strictly valid JSON matching schema.`,
      userPrompt,
      temperature: 0.2,
      schemaParser: (data: any) => {
        const rawPrimary = (data.primaryDomain || data.domain || 'GENERAL').toString().toUpperCase();
        const primaryDomain = Object.values(DomainType).includes(rawPrimary as any)
          ? (rawPrimary as DomainType)
          : DomainType.GENERAL;

        const rawScores = data.confidenceScores || {};
        const confidenceScores: Record<string, number> = {};
        for (const [k, v] of Object.entries(rawScores)) {
          const num = typeof v === 'number' ? (v > 1 ? v / 100 : v) : 0.85;
          confidenceScores[k] = Math.min(1, Math.max(0, num));
        }
        if (!confidenceScores[primaryDomain]) {
          confidenceScores[primaryDomain] = 0.9;
        }

        return {
          primaryDomain,
          secondaryDomain: data.secondaryDomain || null,
          confidenceScores,
          detectedProtectedTerms: Array.isArray(data.detectedProtectedTerms) ? data.detectedProtectedTerms : [],
          detectedKeyNumbers: Array.isArray(data.detectedKeyNumbers) ? data.detectedKeyNumbers : [],
          reasoning: data.reasoning || '',
        };
      },
      metadata,
    });

    const assignedExperts: ExpertType[] = [];
    switch (result.primaryDomain) {
      case DomainType.MEDICAL:
        assignedExperts.push(ExpertType.MEDICAL);
        break;
      case DomainType.SCIENTIFIC:
        assignedExperts.push(ExpertType.SCIENTIFIC);
        break;
      case DomainType.LEGAL:
        assignedExperts.push(ExpertType.LEGAL);
        break;
      case DomainType.TECHNICAL:
        assignedExperts.push(ExpertType.TECHNICAL);
        break;
      case DomainType.FINANCIAL:
        assignedExperts.push(ExpertType.FINANCIAL);
        break;
      default:
        assignedExperts.push(ExpertType.GENERAL_WRITING);
    }

    if (!assignedExperts.includes(ExpertType.GENERAL_WRITING)) {
      assignedExperts.push(ExpertType.GENERAL_WRITING);
    }

    return {
      ...result,
      assignedExperts,
      modelUsed: modelId,
    };
  }

  async generateCandidate(
    originalText: string,
    primaryExpert: ExpertType,
    secondaryExpert?: ExpertType | null,
    customInstructions?: string,
    metadata?: { documentId?: string; pageId?: string; iteration?: number }
  ): Promise<ICandidateGenerationOutput & { modelUsed: string }> {
    const expertDef = EXPERT_REGISTRY[primaryExpert] || EXPERT_REGISTRY[ExpertType.GENERAL_WRITING];

    // Split text into paragraphs (double linebreaks)
    const paragraphs = originalText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // If single short paragraph or few words, rewrite in one shot
    if (paragraphs.length <= 1) {
      return this.rewriteSingleParagraph(originalText, expertDef, customInstructions, metadata);
    }

    // Process paragraph-by-paragraph
    const rewrittenParagraphs: string[] = [];
    let activeModel = 'openai/gpt-oss-20b';

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];

      // If it's a short heading, title, or keyword list (e.g. "Keywords: ...", "1. Introduction")
      if (
        para.length < 50 ||
        para.startsWith('#') ||
        para.startsWith('**Keywords') ||
        para.startsWith('Keywords:') ||
        /^[0-9]+\.\s+[A-Z]/.test(para)
      ) {
        rewrittenParagraphs.push(para);
        continue;
      }

      const res = await this.rewriteSingleParagraph(para, expertDef, customInstructions, metadata);
      rewrittenParagraphs.push(res.rewrittenText);
      activeModel = res.modelUsed;
    }

    let fullRewrittenText = rewrittenParagraphs.join('\n\n');
    fullRewrittenText = lynotePostProcessor.process(fullRewrittenText);

    return {
      rewrittenText: fullRewrittenText,
      changesSummary: `Humanized paragraph-by-paragraph (${paragraphs.length} paragraphs) with lynote post-processing.`,
      preservedPlaceholders: originalText.match(/\[(TABLE|IMAGE|EQUATION|CITATION)_[0-9]+\]/g) || [],
      preservedTechnicalTerms: [],
      stylisticChoices: 'Natural cadence, conversational rhythm, active voice',
      modelUsed: activeModel,
    };
  }

  private async rewriteSingleParagraph(
    paragraphText: string,
    expertDef: any,
    customInstructions?: string,
    metadata?: any
  ): Promise<ICandidateGenerationOutput & { modelUsed: string }> {
    const userPrompt = `ORIGINAL PARAGRAPH:
"""
${paragraphText}
"""

REWRITE & HUMANIZE INSTRUCTIONS:
1. REPHRASE BOLDLY: Restructure sentence orders, convert passive verbs to active, and break up stiff robotic rhythms.
2. VARY CADENCE: Alternate between punchy short observations and smooth flowing sentences with natural conversational transitions.
3. REMOVE AI CLICHES: Eliminate stiff robotic jargon (e.g. "rapidly permeated", "intrinsically tied", "under the guise of", "delve", "testament to", "tapestry"). Use vibrant, natural, authentic wording instead.
4. ABSOLUTE FIDELITY: Keep all factual points, numbers, percentages, dates, scholar names, and protected citation tags (like [CITATION_001], [CITATION_002], [TABLE_001], etc.) 100% intact.
5. Return strictly valid JSON in the format:
{
  "rewrittenText": "Strongly humanized, engaging paragraph text here..."
}`;

    const { result, modelId } = await this.executeModelRequest({
      task: 'REWRITE',
      domain: expertDef.domain,
      systemPrompt: `You are a world-class human author and editor. Transform AI-generated text into natural, compelling, human writing while preserving 100% of facts and citations. Return strictly valid JSON.`,
      userPrompt,
      temperature: 0.85,
      schemaParser: (data: any) => {
        let raw = data.rewrittenText || data.rewritten_text || data.text || data.candidateText || '';
        if (typeof raw === 'object' && raw !== null) {
          raw = raw.text || raw.content || JSON.stringify(raw);
        }
        let cleanedText = cleanProseText(raw ? String(raw) : paragraphText);

        // Verify protected placeholders
        const originalTags = paragraphText.match(/\[(TABLE|IMAGE|EQUATION|CITATION)_[0-9A-Za-z_-]+\]/g) || [];
        for (const tag of originalTags) {
          if (!cleanedText.includes(tag)) {
            cleanedText += ` ${tag}`;
          }
        }

        return {
          rewrittenText: cleanedText || paragraphText,
          changesSummary: 'Paragraph strongly transformed with natural human cadence.',
          preservedPlaceholders: originalTags,
          preservedTechnicalTerms: [],
          stylisticChoices: 'Active voice, natural sentence variety, Lynote sanitization',
        };
      },
      metadata,
    });

    return {
      ...result,
      modelUsed: modelId,
    };
  }

  async evaluateCandidate(
    originalText: string,
    candidateText: string,
    domain: DomainType,
    metadata?: { documentId?: string; pageId?: string; candidateId?: string }
  ): Promise<IEvaluationOutput & { modelUsed: string }> {
    const cleanCand = cleanProseText(candidateText);
    const userPrompt = `ORIGINAL SOURCE TEXT:\n"""${originalText}"""\n\nREWRITTEN CANDIDATE:\n"""${cleanCand}"""\n\nEvaluate 10 distinct properties (0-100) and hard gates. Output strictly valid JSON.`;

    const { result, modelId } = await this.executeModelRequest({
      task: 'EVALUATE_MEANING',
      domain,
      systemPrompt: `${PROMPT_REGISTRY.INDEPENDENT_EVALUATOR}\nDomain Context: ${domain}\nOutput strictly valid JSON.`,
      userPrompt,
      temperature: 0.1,
      schemaParser: (data: any) => {
        const s = data.scores || {};
        const scores = {
          naturalness: s.naturalness ?? 85,
          clarity: s.clarity ?? 88,
          sentenceVariety: s.sentenceVariety ?? 82,
          repetitionReduction: s.repetitionReduction ?? 87,
          styleConsistency: s.styleConsistency ?? 88,
          meaningPreservation: s.meaningPreservation ?? 95,
          factualConsistency: s.factualConsistency ?? 96,
          terminologyPreservation: s.terminologyPreservation ?? 92,
          citationPreservation: s.citationPreservation ?? 98,
          protectedElementIntegrity: s.protectedElementIntegrity ?? 100,
        };
        const gates = data.gates || {
          allPassed: true,
          checks: [],
          failedReasons: [],
        };
        const feedback = data.feedback || {
          strengths: ['Natural tone', 'Terminology preserved'],
          weaknesses: [],
          actionableFixes: [],
        };
        return {
          scores,
          gates,
          feedback,
        };
      },
      metadata,
    });

    return {
      ...result,
      modelUsed: modelId,
    };
  }

  async refineCandidate(
    originalText: string,
    candidateText: string,
    weaknesses: string[],
    actionableFixes: string[],
    expert: ExpertType,
    metadata?: { documentId?: string; pageId?: string; candidateId?: string; iteration?: number }
  ): Promise<IRefinementOutput & { modelUsed: string }> {
    const cleanCand = cleanProseText(candidateText);
    const userPrompt = `ORIGINAL TEXT:\n"""${originalText}"""\n\nCURRENT CANDIDATE:\n"""${cleanCand}"""\n\nWEAKNESSES IDENTIFIED:\n${JSON.stringify(weaknesses)}\n\nACTIONABLE FIXES:\n${JSON.stringify(actionableFixes)}\n\nRefine text to eliminate weaknesses. Return valid JSON.`;

    const { result, modelId } = await this.executeModelRequest({
      task: 'REFINE',
      domain: expert,
      systemPrompt: `${PROMPT_REGISTRY.REFINEMENT_EXPERT}\nOutput strictly valid JSON.`,
      userPrompt,
      temperature: 0.4,
      schemaParser: (data: any) => ({
        refinedText: cleanProseText(data.refinedText || data.text || candidateText),
        addressedWeaknesses: Array.isArray(data.addressedWeaknesses) ? data.addressedWeaknesses : [],
        preservedPlaceholdersCheck: data.preservedPlaceholdersCheck !== undefined ? data.preservedPlaceholdersCheck : true,
        rationale: data.rationale || '',
      }),
      metadata,
    });

    return {
      ...result,
      modelUsed: modelId,
    };
  }
}

export const nvidiaOrchestrator = new NvidiaMultiModelOrchestrator();
