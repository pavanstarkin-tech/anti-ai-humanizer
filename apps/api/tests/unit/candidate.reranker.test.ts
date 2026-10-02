import { CandidateReranker } from '../../src/modules/ai/reranker/candidate.reranker.js';
import { ExpertType } from '@humanizer/shared';

describe('CandidateReranker Unit Tests', () => {
  let reranker: CandidateReranker;

  beforeEach(() => {
    reranker = new CandidateReranker();
  });

  it('should rank valid candidates by weighted score and pick the strongest valid one', () => {
    const candidateA = {
      candidate: {
        text: 'Candidate A Text',
        expertType: ExpertType.GENERAL_WRITING,
        model: 'mock',
        provider: 'mock',
        promptVersion: 'v1.0',
        generationConfig: { temperature: 0.7 },
        outputDetails: {} as any,
      },
      evaluation: {
        scores: {} as any,
        overallWeightedScore: 82,
        gates: { allPassed: true, checks: [], failedReasons: [] },
        feedback: { strengths: [], weaknesses: [], actionableFixes: [] },
        evaluatorModel: 'mock',
        evaluatorPromptVersion: 'v1.0',
        evaluatedAt: new Date(),
      },
    };

    const candidateB = {
      candidate: {
        text: 'Candidate B Text',
        expertType: ExpertType.MEDICAL,
        model: 'mock',
        provider: 'mock',
        promptVersion: 'v1.0',
        generationConfig: { temperature: 0.5 },
        outputDetails: {} as any,
      },
      evaluation: {
        scores: {} as any,
        overallWeightedScore: 89,
        gates: { allPassed: true, checks: [], failedReasons: [] },
        feedback: { strengths: [], weaknesses: [], actionableFixes: [] },
        evaluatorModel: 'mock',
        evaluatorPromptVersion: 'v1.0',
        evaluatedAt: new Date(),
      },
    };

    const result = reranker.rankCandidates([candidateA, candidateB]);

    expect(result.bestCandidate?.candidate.text).toBe('Candidate B Text');
    expect(result.validCandidates.length).toBe(2);
    expect(result.rejectedCandidates.length).toBe(0);
  });

  it('should REJECT high-scoring candidate if it failed hard gates, selecting valid alternative', () => {
    const highNaturalnessViolatingCandidate = {
      candidate: {
        text: 'Super natural prose that altered factual numbers',
        expertType: ExpertType.GENERAL_WRITING,
        model: 'mock',
        provider: 'mock',
        promptVersion: 'v1.0',
        generationConfig: { temperature: 0.7 },
        outputDetails: {} as any,
      },
      evaluation: {
        scores: {} as any,
        overallWeightedScore: 94, // Highest score!
        gates: {
          allPassed: false, // FAILED GATE
          checks: [],
          failedReasons: ['Numerical discrepancy found'],
        },
        feedback: { strengths: [], weaknesses: [], actionableFixes: [] },
        evaluatorModel: 'mock',
        evaluatorPromptVersion: 'v1.0',
        evaluatedAt: new Date(),
      },
    };

    const validCandidate = {
      candidate: {
        text: 'Accurate and well-written compliant prose',
        expertType: ExpertType.TECHNICAL,
        model: 'mock',
        provider: 'mock',
        promptVersion: 'v1.0',
        generationConfig: { temperature: 0.5 },
        outputDetails: {} as any,
      },
      evaluation: {
        scores: {} as any,
        overallWeightedScore: 85,
        gates: { allPassed: true, checks: [], failedReasons: [] },
        feedback: { strengths: [], weaknesses: [], actionableFixes: [] },
        evaluatorModel: 'mock',
        evaluatorPromptVersion: 'v1.0',
        evaluatedAt: new Date(),
      },
    };

    const result = reranker.rankCandidates([highNaturalnessViolatingCandidate, validCandidate]);

    expect(result.bestCandidate?.candidate.text).toBe('Accurate and well-written compliant prose');
    expect(result.rejectedCandidates.length).toBe(1);
    expect(result.validCandidates.length).toBe(1);
  });
});
