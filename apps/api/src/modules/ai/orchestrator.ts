import {
  DomainType,
  ExpertType,
  SYSTEM_CONFIG,
} from '@humanizer/shared';
import { IAIProvider } from './providers/base.provider.js';
import { DomainClassifier } from './router/domain.classifier.js';
import { CandidateGenerator } from './generator/candidate.generator.js';
import { IndependentEvaluator } from './evaluator/independent.evaluator.js';
import { CandidateReranker, EvaluatedCandidate } from './reranker/candidate.reranker.js';
import { RefinementEngine, IterationStepResult } from './refinement/refinement.engine.js';

export interface PipelineExecutionResult {
  domainClassification: {
    primaryDomain: DomainType;
    secondaryDomain?: DomainType | null;
    confidenceScores: Record<string, number>;
    assignedExperts: ExpertType[];
    reasoning: string;
  };
  allGeneratedCandidates: EvaluatedCandidate[];
  validCandidates: EvaluatedCandidate[];
  rejectedCandidates: EvaluatedCandidate[];
  selectedInitialCandidate: EvaluatedCandidate | null;
  refinementResult?: {
    finalCandidate: EvaluatedCandidate;
    iterations: IterationStepResult[];
    achievedTarget: boolean;
    totalIterations: number;
  } | null;
  finalCandidate: EvaluatedCandidate;
}

export class AIOrchestrator {
  private classifier: DomainClassifier;
  private generator: CandidateGenerator;
  private evaluator: IndependentEvaluator;
  private reranker: CandidateReranker;
  private refinementEngine: RefinementEngine;

  constructor(private provider: IAIProvider) {
    this.classifier = new DomainClassifier(this.provider);
    this.generator = new CandidateGenerator(this.provider);
    this.evaluator = new IndependentEvaluator(this.provider);
    this.reranker = new CandidateReranker();
    this.refinementEngine = new RefinementEngine(this.provider, this.evaluator);
  }

  async runPipelineForPage(
    originalText: string,
    options?: {
      candidateCount?: number;
      customInstructions?: string;
      targetScore?: number;
      maxIterations?: number;
    }
  ): Promise<PipelineExecutionResult> {
    const candidateCount = options?.candidateCount || SYSTEM_CONFIG.CANDIDATES_PER_ITERATION;
    const targetScore = options?.targetScore || 80;
    const maxIterations = options?.maxIterations || 2;

    // 1. Classify Domain
    const classification = await this.classifier.classify(originalText);

    // 2. Multi-Candidate Generation
    const rawCandidates = await this.generator.generateCandidates(
      originalText,
      classification.assignedExperts,
      candidateCount,
      options?.customInstructions
    );

    // 3. Independent Evaluation of each candidate
    const evaluatedList = await Promise.all(
      rawCandidates.map(async (cand) => {
        const evaluation = await this.evaluator.evaluate(
          originalText,
          cand.text,
          classification.primaryDomain
        );
        return {
          candidate: cand,
          evaluation,
        };
      })
    );

    // 4. Hard Gate Validation & Reranking
    const rankResult = this.reranker.rankCandidates(evaluatedList);

    if (!rankResult.bestCandidate) {
      // If all candidates failed hard gates, fallback to the safest least-deviant or first candidate with failure flags
      const fallback = rankResult.ranked[0];
      return {
        domainClassification: classification,
        allGeneratedCandidates: rankResult.ranked,
        validCandidates: rankResult.validCandidates,
        rejectedCandidates: rankResult.rejectedCandidates,
        selectedInitialCandidate: null,
        refinementResult: null,
        finalCandidate: fallback,
      };
    }

    // 5. Iterative Self-Improvement
    const refinementResult = await this.refinementEngine.refineUntilTargetOrMax(
      originalText,
      rankResult.bestCandidate,
      classification.primaryDomain,
      targetScore,
      maxIterations
    );

    return {
      domainClassification: classification,
      allGeneratedCandidates: rankResult.ranked,
      validCandidates: rankResult.validCandidates,
      rejectedCandidates: rankResult.rejectedCandidates,
      selectedInitialCandidate: rankResult.bestCandidate,
      refinementResult,
      finalCandidate: refinementResult.finalCandidate,
    };
  }
}
