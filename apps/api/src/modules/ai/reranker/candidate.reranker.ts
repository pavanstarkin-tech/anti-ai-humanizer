import { IEvaluationResult } from '@humanizer/shared';
import { GeneratedCandidateResult } from '../generator/candidate.generator.js';

export interface EvaluatedCandidate {
  candidate: GeneratedCandidateResult;
  evaluation: IEvaluationResult;
  isValid: boolean;
  rank: number;
}

export class CandidateReranker {
  public rankCandidates(
    candidatesWithEvals: Array<{
      candidate: GeneratedCandidateResult;
      evaluation: IEvaluationResult;
    }>
  ): {
    ranked: EvaluatedCandidate[];
    validCandidates: EvaluatedCandidate[];
    rejectedCandidates: EvaluatedCandidate[];
    bestCandidate: EvaluatedCandidate | null;
  } {
    // Separate into valid and rejected based on hard gates
    const processed: Array<Omit<EvaluatedCandidate, 'rank'>> = candidatesWithEvals.map((item) => {
      const isValid = item.evaluation.gates.allPassed;
      return {
        candidate: item.candidate,
        evaluation: item.evaluation,
        isValid,
      };
    });

    // Sort valid candidates primarily by overallWeightedScore descending
    const valid = processed
      .filter((c) => c.isValid)
      .sort((a, b) => b.evaluation.overallWeightedScore - a.evaluation.overallWeightedScore);

    // Sort rejected candidates for traceability
    const rejected = processed
      .filter((c) => !c.isValid)
      .sort((a, b) => b.evaluation.overallWeightedScore - a.evaluation.overallWeightedScore);

    const fullRanked: EvaluatedCandidate[] = [
      ...valid.map((item, idx) => ({ ...item, rank: idx + 1 })),
      ...rejected.map((item, idx) => ({ ...item, rank: valid.length + idx + 1 })),
    ];

    const rankedValid = fullRanked.filter((c) => c.isValid);
    const rankedRejected = fullRanked.filter((c) => !c.isValid);
    const bestCandidate = rankedValid.length > 0 ? rankedValid[0] : null;

    return {
      ranked: fullRanked,
      validCandidates: rankedValid,
      rejectedCandidates: rankedRejected,
      bestCandidate,
    };
  }
}
