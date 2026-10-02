import { RefinementEngine } from '../../src/modules/ai/refinement/refinement.engine.js';
import { MockAIProvider } from '../../src/modules/ai/providers/mock.provider.js';
import { IndependentEvaluator } from '../../src/modules/ai/evaluator/independent.evaluator.js';
import { DomainType, ExpertType } from '@humanizer/shared';

describe('RefinementEngine Unit Tests', () => {
  let mockProvider: MockAIProvider;
  let evaluator: IndependentEvaluator;
  let engine: RefinementEngine;

  beforeEach(() => {
    mockProvider = new MockAIProvider();
    evaluator = new IndependentEvaluator(mockProvider);
    engine = new RefinementEngine(mockProvider, evaluator);
  });

  it('should stop immediately if initial candidate already exceeds target score', async () => {
    const originalText = 'In order to evaluate the system, testing was performed.';
    const initialCandidate = {
      candidate: {
        text: 'To evaluate the system, we conducted testing.',
        expertType: ExpertType.GENERAL_WRITING,
        model: 'mock',
        provider: 'mock',
        promptVersion: 'v1.0',
        generationConfig: { temperature: 0.7 },
        outputDetails: {} as any,
      },
      evaluation: {
        scores: {} as any,
        overallWeightedScore: 88,
        gates: { allPassed: true, checks: [], failedReasons: [] },
        feedback: { strengths: ['Clear'], weaknesses: [], actionableFixes: [] },
        evaluatorModel: 'mock',
        evaluatorPromptVersion: 'v1.0',
        evaluatedAt: new Date(),
      },
      isValid: true,
      rank: 1,
    };

    const result = await engine.refineUntilTargetOrMax(
      originalText,
      initialCandidate,
      DomainType.GENERAL,
      80, // target is 80, initial is 88
      5
    );

    expect(result.achievedTarget).toBe(true);
    expect(result.totalIterations).toBe(1);
    expect(result.iterations.length).toBe(1);
  });

  it('should respect max iterations limit and not loop infinitely', async () => {
    const originalText = 'The system [TABLE_001] was evaluated with 99.9% uptime.';
    const initialCandidate = {
      candidate: {
        text: 'The platform [TABLE_001] was evaluated with 99.9% uptime.',
        expertType: ExpertType.TECHNICAL,
        model: 'mock',
        provider: 'mock',
        promptVersion: 'v1.0',
        generationConfig: { temperature: 0.5 },
        outputDetails: {} as any,
      },
      evaluation: {
        scores: {} as any,
        overallWeightedScore: 70, // Below target 95
        gates: { allPassed: true, checks: [], failedReasons: [] },
        feedback: { strengths: ['Factual'], weaknesses: ['Rhythm'], actionableFixes: ['Polish flow'] },
        evaluatorModel: 'mock',
        evaluatorPromptVersion: 'v1.0',
        evaluatedAt: new Date(),
      },
      isValid: true,
      rank: 1,
    };

    const maxIterations = 3;
    const result = await engine.refineUntilTargetOrMax(
      originalText,
      initialCandidate,
      DomainType.TECHNICAL,
      98, // Very high target score
      maxIterations
    );

    expect(result.totalIterations).toBeLessThanOrEqual(maxIterations);
    expect(result.iterations.length).toBeLessThanOrEqual(maxIterations);
  });
});
