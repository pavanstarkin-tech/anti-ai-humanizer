import { NvidiaAIClient } from '../../src/modules/ai/nvidia/nvidia.client.js';
import { ModelRegistry } from '../../src/modules/ai/nvidia/model.registry.js';
import { NVIDIAModelDiscoveryService } from '../../src/modules/ai/nvidia/discovery.service.js';
import { NvidiaMultiModelOrchestrator } from '../../src/modules/ai/nvidia/nvidia.orchestrator.js';
import { DomainType, ExpertType } from '@humanizer/shared';

describe('NVIDIA Multi-Model AI Architecture Unit Tests', () => {
  let mockClient: NvidiaAIClient;
  let discoveryService: NVIDIAModelDiscoveryService;
  let modelRegistry: ModelRegistry;
  let orchestrator: NvidiaMultiModelOrchestrator;

  beforeEach(() => {
    mockClient = new NvidiaAIClient('https://integrate.api.nvidia.com/v1', 'mock-key', true);
    discoveryService = new NVIDIAModelDiscoveryService(mockClient);
    modelRegistry = new ModelRegistry(discoveryService);
    orchestrator = new NvidiaMultiModelOrchestrator(mockClient);
  });

  it('should discover and normalize available NVIDIA models', async () => {
    const models = await discoveryService.getAvailableModels(false);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].provider).toBe('NVIDIA');
    expect(models.some((m) => m.id === 'meta/llama-3.3-70b-instruct')).toBe(true);
  });

  it('should route domain tasks to the appropriate configured NVIDIA model', () => {
    const medicalRouting = modelRegistry.getModelForTask('REWRITE', 'MEDICAL');
    expect(medicalRouting.role).toBe('medicalExpert');
    expect(medicalRouting.selectedModelId).toBeDefined();

    const classifyRouting = modelRegistry.getModelForTask('CLASSIFY');
    expect(classifyRouting.role).toBe('classifier');

    const evaluateRouting = modelRegistry.getModelForTask('EVALUATE_MEANING');
    expect(evaluateRouting.role).toBe('meaningEvaluator');
  });

  it('should generate candidate using configured NVIDIA model without hard-coding', async () => {
    const result = await orchestrator.generateCandidate(
      'Clinical trial enrolled 100 participants.',
      ExpertType.MEDICAL,
      ExpertType.STYLE
    );

    expect(result.rewrittenText).toBeDefined();
    expect(result.modelUsed).toBeDefined();
  });

  it('should evaluate candidate independently and return structured JSON', async () => {
    const evalResult = await orchestrator.evaluateCandidate(
      'The medication is effective.',
      'The therapeutic treatment showed high efficacy.',
      DomainType.MEDICAL
    );

    expect(evalResult.scores.meaningPreservation).toBeGreaterThanOrEqual(85);
    expect(evalResult.gates.allPassed).toBe(true);
    expect(evalResult.modelUsed).toBeDefined();
  });

  it('should perform health check on NVIDIA NIM endpoint', async () => {
    const health = await mockClient.healthCheck();
    expect(health.reachable).toBe(true);
    expect(health.endpoint).toContain('nvidia.com');
  });
});
