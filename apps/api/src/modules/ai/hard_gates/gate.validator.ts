import {
  HardGateType,
  IHardGateResult,
  IHardGateCheck,
  IQualityThresholds,
  DEFAULT_QUALITY_THRESHOLDS,
  SYSTEM_CONFIG,
} from '@humanizer/shared';

export class HardGateValidator {
  constructor(private thresholds: IQualityThresholds = DEFAULT_QUALITY_THRESHOLDS) {}

  public validate(
    originalText: string,
    candidateText: string,
    propertyScores: {
      meaningPreservation: number;
      factualConsistency: number;
      terminologyPreservation: number;
      citationPreservation: number;
      protectedElementIntegrity: number;
    }
  ): IHardGateResult {
    const checks: IHardGateCheck[] = [];

    // 1. Meaning Preservation Gate
    const meaningPassed = propertyScores.meaningPreservation >= this.thresholds.minMeaningPreservation;
    checks.push({
      gate: HardGateType.MEANING_PRESERVATION,
      passed: meaningPassed,
      score: propertyScores.meaningPreservation,
      reason: meaningPassed
        ? undefined
        : `Meaning preservation score (${propertyScores.meaningPreservation}) is below threshold (${this.thresholds.minMeaningPreservation})`,
    });

    // 2. Factual Consistency Gate
    const factualPassed = propertyScores.factualConsistency >= this.thresholds.minFactualConsistency;
    checks.push({
      gate: HardGateType.FACTUAL_CONSISTENCY,
      passed: factualPassed,
      score: propertyScores.factualConsistency,
      reason: factualPassed
        ? undefined
        : `Factual consistency score (${propertyScores.factualConsistency}) is below threshold (${this.thresholds.minFactualConsistency})`,
    });

    // 3. Terminology Preservation Gate
    const termPassed = propertyScores.terminologyPreservation >= this.thresholds.minTerminologyScore;
    checks.push({
      gate: HardGateType.TERMINOLOGY_PRESERVATION,
      passed: termPassed,
      score: propertyScores.terminologyPreservation,
      reason: termPassed
        ? undefined
        : `Terminology preservation score (${propertyScores.terminologyPreservation}) is below threshold (${this.thresholds.minTerminologyScore})`,
    });

    // 4. Citation Preservation Gate
    const citationPassed = propertyScores.citationPreservation >= this.thresholds.minCitationScore;
    checks.push({
      gate: HardGateType.CITATION_PRESERVATION,
      passed: citationPassed,
      score: propertyScores.citationPreservation,
      reason: citationPassed
        ? undefined
        : `Citation preservation score (${propertyScores.citationPreservation}) is below threshold (${this.thresholds.minCitationScore})`,
    });

    // 5. Protected Element Placeholders Gate (Strict deterministic regex check)
    const originalPlaceholders: string[] = originalText.match(SYSTEM_CONFIG.PLACEHOLDER_REGEX) || [];
    const candidatePlaceholders: string[] = candidateText.match(SYSTEM_CONFIG.PLACEHOLDER_REGEX) || [];
    const missingPlaceholders = originalPlaceholders.filter((p: string) => !candidatePlaceholders.includes(p));
    const placeholderPassed = missingPlaceholders.length === 0;

    checks.push({
      gate: HardGateType.PROTECTED_PLACEHOLDERS,
      passed: placeholderPassed,
      score: placeholderPassed ? 100 : 0,
      reason: placeholderPassed
        ? undefined
        : `Missing required protected element placeholders: ${missingPlaceholders.join(', ')}`,
      details: { missingPlaceholders },
    });

    // 6. Numerical Accuracy Gate (Strict deterministic regex check)
    const originalNumbers: string[] = Array.from(new Set(originalText.match(SYSTEM_CONFIG.NUMBER_REGEX) || []));
    const missingNumbers = originalNumbers.filter((num: string) => !candidateText.includes(num));
    const numericalPassed = missingNumbers.length === 0;

    checks.push({
      gate: HardGateType.NUMERICAL_ACCURACY,
      passed: numericalPassed,
      score: numericalPassed ? 100 : 0,
      reason: numericalPassed
        ? undefined
        : `Missing or modified numerical figures: ${missingNumbers.join(', ')}`,
      details: { missingNumbers },
    });

    const failedReasons = checks
      .filter((c) => !c.passed && c.reason)
      .map((c) => c.reason as string);

    return {
      allPassed: checks.every((c) => c.passed),
      checks,
      failedReasons,
    };
  }
}
