import {
  DomainType,
  IEvaluationResult,
  IScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  SYSTEM_CONFIG,
} from '@humanizer/shared';
import { IAIProvider } from '../providers/base.provider.js';
import { HardGateValidator } from '../hard_gates/gate.validator.js';

export class IndependentEvaluator {
  private gateValidator: HardGateValidator;

  constructor(
    private provider: IAIProvider,
    private weights: IScoringWeights = DEFAULT_SCORING_WEIGHTS,
    gateValidator?: HardGateValidator
  ) {
    this.gateValidator = gateValidator || new HardGateValidator();
  }

  public calculateOverallScore(scores: IEvaluationResult['scores']): number {
    const rawWeighted =
      scores.naturalness * this.weights.naturalness +
      scores.clarity * this.weights.clarity +
      scores.sentenceVariety * this.weights.sentenceVariety +
      scores.repetitionReduction * this.weights.repetitionReduction +
      scores.styleConsistency * this.weights.styleConsistency +
      scores.meaningPreservation * this.weights.meaningPreservation +
      scores.factualConsistency * this.weights.factualConsistency +
      ((scores.terminologyPreservation + scores.citationPreservation) / 2) * this.weights.terminologyCitation;

    return Math.round(rawWeighted * 10) / 10;
  }

  async evaluate(
    originalText: string,
    candidateText: string,
    domain: DomainType
  ): Promise<IEvaluationResult> {
    // 1. Get structured model evaluation
    const evaluationOutput = await this.provider.evaluateCandidate(
      originalText,
      candidateText,
      domain,
      SYSTEM_CONFIG.PROMPT_VERSIONS.EVALUATION
    );

    // 2. Run deterministic hard gates validation (overlaying deterministic checks on top of model scores)
    const gateResult = this.gateValidator.validate(originalText, candidateText, {
      meaningPreservation: evaluationOutput.scores.meaningPreservation,
      factualConsistency: evaluationOutput.scores.factualConsistency,
      terminologyPreservation: evaluationOutput.scores.terminologyPreservation,
      citationPreservation: evaluationOutput.scores.citationPreservation,
      protectedElementIntegrity: evaluationOutput.scores.protectedElementIntegrity,
    });

    // 3. Compute weighted overall score
    const overallWeightedScore = this.calculateOverallScore(evaluationOutput.scores);

    return {
      scores: evaluationOutput.scores,
      overallWeightedScore,
      gates: gateResult,
      feedback: evaluationOutput.feedback,
      evaluatorModel: this.provider.name,
      evaluatorPromptVersion: SYSTEM_CONFIG.PROMPT_VERSIONS.EVALUATION,
      evaluatedAt: new Date(),
    };
  }
}
