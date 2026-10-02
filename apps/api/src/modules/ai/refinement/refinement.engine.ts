import { DomainType, ExpertType, SYSTEM_CONFIG } from '@humanizer/shared';
import { IAIProvider } from '../providers/base.provider.js';
import { IndependentEvaluator } from '../evaluator/independent.evaluator.js';
import { EvaluatedCandidate } from '../reranker/candidate.reranker.js';

export interface IterationStepResult {
  iterationNumber: number;
  candidateText: string;
  evaluatedCandidate: EvaluatedCandidate;
  isImproved: boolean;
  notes: string;
}

export class RefinementEngine {
  constructor(
    private provider: IAIProvider,
    private evaluator: IndependentEvaluator
  ) {}

  async refineUntilTargetOrMax(
    originalText: string,
    initialBestCandidate: EvaluatedCandidate,
    domain: DomainType,
    targetScore = 80,
    maxIterations = 5
  ): Promise<{
    finalCandidate: EvaluatedCandidate;
    iterations: IterationStepResult[];
    achievedTarget: boolean;
    totalIterations: number;
  }> {
    let currentBest = initialBestCandidate;
    const history: IterationStepResult[] = [
      {
        iterationNumber: 1,
        candidateText: currentBest.candidate.text,
        evaluatedCandidate: currentBest,
        isImproved: true,
        notes: 'Initial generation and ranking.',
      },
    ];

    let currentIteration = 1;

    // Check if initial candidate already satisfies target score
    if (currentBest.evaluation.overallWeightedScore >= targetScore && currentBest.isValid) {
      return {
        finalCandidate: currentBest,
        iterations: history,
        achievedTarget: true,
        totalIterations: 1,
      };
    }

    while (currentIteration < maxIterations) {
      currentIteration++;

      const weaknesses = currentBest.evaluation.feedback.weaknesses;
      const actionableFixes = currentBest.evaluation.feedback.actionableFixes;

      // Invoke refinement
      const refinedOutput = await this.provider.refineCandidate(
        originalText,
        currentBest.candidate.text,
        weaknesses,
        actionableFixes,
        currentBest.candidate.expertType || ExpertType.GENERAL_WRITING,
        { temperature: 0.4 },
        SYSTEM_CONFIG.PROMPT_VERSIONS.REFINEMENT
      );

      // Re-evaluate refined output
      const evalResult = await this.evaluator.evaluate(
        originalText,
        refinedOutput.refinedText,
        domain
      );

      const isCandidateValid = evalResult.gates.allPassed;
      const isBetter =
        isCandidateValid &&
        evalResult.overallWeightedScore > currentBest.evaluation.overallWeightedScore;

      const newEvaluated: EvaluatedCandidate = {
        candidate: {
          ...currentBest.candidate,
          text: refinedOutput.refinedText,
        },
        evaluation: evalResult,
        isValid: isCandidateValid,
        rank: 1,
      };

      if (isBetter) {
        currentBest = newEvaluated;
        history.push({
          iterationNumber: currentIteration,
          candidateText: refinedOutput.refinedText,
          evaluatedCandidate: newEvaluated,
          isImproved: true,
          notes: `Score improved from ${history[history.length - 1].evaluatedCandidate.evaluation.overallWeightedScore} to ${evalResult.overallWeightedScore}.`,
        });
      } else {
        // Retain previous stronger candidate if refinement regressed
        history.push({
          iterationNumber: currentIteration,
          candidateText: refinedOutput.refinedText,
          evaluatedCandidate: newEvaluated,
          isImproved: false,
          notes: `Refinement did not surpass previous best (${evalResult.overallWeightedScore} vs ${currentBest.evaluation.overallWeightedScore}). Retaining prior candidate.`,
        });
      }

      if (currentBest.evaluation.overallWeightedScore >= targetScore && currentBest.isValid) {
        break;
      }
    }

    return {
      finalCandidate: currentBest,
      iterations: history,
      achievedTarget: currentBest.evaluation.overallWeightedScore >= targetScore,
      totalIterations: currentIteration,
    };
  }
}
