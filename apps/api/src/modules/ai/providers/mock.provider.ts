import {
  DomainType,
  ExpertType,
  HardGateType,
  IDomainClassificationOutput,
  ICandidateGenerationOutput,
  IEvaluationOutput,
  IRefinementOutput,
  SYSTEM_CONFIG,
} from '@humanizer/shared';
import { IAIProvider, GenerationOptions } from './base.provider.js';

export class MockAIProvider implements IAIProvider {
  readonly name = 'mock-provider';

  // Configurable mock behaviors for testing edge cases
  public forceInvalidOutput = false;
  public forceTimeout = false;
  public forceGateFailure: HardGateType | null = null;
  public forceRegressiveRefinement = false;

  async classifyDomain(text: string): Promise<IDomainClassificationOutput> {
    if (this.forceTimeout) {
      throw new Error('AI Provider timeout simulated');
    }

    const lower = text.toLowerCase();
    const scores: Record<string, number> = {
      [DomainType.GENERAL]: 0.3,
      [DomainType.MEDICAL]: 0.1,
      [DomainType.SCIENTIFIC]: 0.1,
      [DomainType.LEGAL]: 0.1,
      [DomainType.TECHNICAL]: 0.1,
      [DomainType.ENGINEERING]: 0.1,
      [DomainType.ACADEMIC]: 0.1,
      [DomainType.FINANCIAL]: 0.1,
    };

    if (lower.includes('patient') || lower.includes('clinical') || lower.includes('therapy') || lower.includes('diagnosis') || lower.includes('dose')) {
      scores[DomainType.MEDICAL] = 0.92;
      scores[DomainType.SCIENTIFIC] = 0.75;
    }
    if (lower.includes('experiment') || lower.includes('hypothesis') || lower.includes('methodology') || lower.includes('sample size')) {
      scores[DomainType.SCIENTIFIC] = 0.89;
      scores[DomainType.ACADEMIC] = 0.81;
    }
    if (lower.includes('agreement') || lower.includes('clause') || lower.includes('liability') || lower.includes('jurisdiction') || lower.includes('statute')) {
      scores[DomainType.LEGAL] = 0.95;
    }
    if (lower.includes('algorithm') || lower.includes('database') || lower.includes('api') || lower.includes('latency') || lower.includes('architecture')) {
      scores[DomainType.TECHNICAL] = 0.91;
      scores[DomainType.ENGINEERING] = 0.84;
    }
    if (lower.includes('revenue') || lower.includes('ebitda') || lower.includes('fiscal') || lower.includes('portfolio') || lower.includes('margin')) {
      scores[DomainType.FINANCIAL] = 0.94;
    }

    // Find primary domain
    let primaryDomain = DomainType.GENERAL;
    let maxScore = scores[DomainType.GENERAL] || 0.3;
    let secondaryDomain: DomainType | null = null;

    for (const [dom, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryDomain = dom as DomainType;
      }
    }

    // Find secondary domain if close
    for (const [dom, score] of Object.entries(scores)) {
      if (dom !== primaryDomain && score >= 0.6) {
        secondaryDomain = dom as DomainType;
        break;
      }
    }

    // Extract numbers & protected terms
    const detectedKeyNumbers = text.match(SYSTEM_CONFIG.NUMBER_REGEX) || [];
    const detectedProtectedTerms = text.match(/\[[A-Z0-9_-]+\]/g) || [];

    return {
      primaryDomain,
      secondaryDomain,
      confidenceScores: scores,
      detectedProtectedTerms: Array.from(new Set(detectedProtectedTerms)),
      detectedKeyNumbers: Array.from(new Set(detectedKeyNumbers)),
      reasoning: `Domain classified as ${primaryDomain} (confidence ${(maxScore * 100).toFixed(0)}%) based on domain-specific terminology patterns.`,
    };
  }

  async generateCandidate(
    originalText: string,
    primaryExpert: ExpertType,
    secondaryExpert?: ExpertType | null,
    customInstructions?: string,
    options?: GenerationOptions
  ): Promise<ICandidateGenerationOutput> {
    if (this.forceTimeout) {
      throw new Error('AI Provider timeout simulated');
    }

    // Preserve placeholders
    const placeholders = originalText.match(SYSTEM_CONFIG.PLACEHOLDER_REGEX) || [];

    let rewritten = originalText;

    // Apply expert-guided naturalization
    if (primaryExpert === ExpertType.MEDICAL) {
      rewritten = rewritten
        .replace(/\bIt is observed that\b/gi, 'Clinical observations indicate that')
        .replace(/\bIn order to\b/gi, 'To')
        .replace(/\butilize\b/gi, 'use')
        .replace(/\ba large number of\b/gi, 'numerous');
    } else if (primaryExpert === ExpertType.LEGAL) {
      rewritten = rewritten
        .replace(/\bIt is noteworthy that\b/gi, 'Notably,')
        .replace(/\bwith respect to\b/gi, 'regarding')
        .replace(/\bprior to\b/gi, 'before');
    } else if (primaryExpert === ExpertType.TECHNICAL || primaryExpert === ExpertType.ENGINEERING) {
      rewritten = rewritten
        .replace(/\bIt has been demonstrated that the system\b/gi, 'Testing confirmed the system')
        .replace(/\bconduct an evaluation of\b/gi, 'evaluate')
        .replace(/\bmake an adjustment to\b/gi, 'adjust');
    } else {
      rewritten = rewritten
        .replace(/\bIt is important to note that\b/gi, 'Importantly,')
        .replace(/\bIn the event that\b/gi, 'If')
        .replace(/\bDue to the fact that\b/gi, 'Because')
        .replace(/\bAt the present time\b/gi, 'Currently')
        .replace(/\bhas the capability to\b/gi, 'can');
    }

    // Secondary expert nuance
    if (secondaryExpert === ExpertType.STYLE) {
      rewritten = rewritten.replace(/\bvery\b/gi, 'distinctly');
    }

    // If simulating fact change for test
    if (this.forceGateFailure === HardGateType.NUMERICAL_ACCURACY) {
      rewritten = rewritten.replace(/\b\d+\b/, '9999999');
    }
    if (this.forceGateFailure === HardGateType.PROTECTED_PLACEHOLDERS && placeholders.length > 0 && placeholders[0]) {
      rewritten = rewritten.replace(placeholders[0], '[CORRUPTED_TAG]');
    }

    return {
      rewrittenText: rewritten,
      changesSummary: `Rewritten using ${primaryExpert} and ${secondaryExpert || 'General'} guidance to improve cadence and eliminate wordiness while preserving all protected structures.`,
      preservedPlaceholders: placeholders,
      preservedTechnicalTerms: ['preservation', 'protocol'],
      stylisticChoices: 'Active voice, varied sentence lengths, natural syntactic rhythm.',
    };
  }

  async evaluateCandidate(
    originalText: string,
    candidateText: string,
    domain: DomainType
  ): Promise<IEvaluationOutput> {
    if (this.forceTimeout) {
      throw new Error('AI Provider timeout simulated');
    }

    const origPlaceholders: string[] = originalText.match(SYSTEM_CONFIG.PLACEHOLDER_REGEX) || [];
    const candPlaceholders: string[] = candidateText.match(SYSTEM_CONFIG.PLACEHOLDER_REGEX) || [];

    const origNumbers: string[] = originalText.match(SYSTEM_CONFIG.NUMBER_REGEX) || [];
    const candNumbers: string[] = candidateText.match(SYSTEM_CONFIG.NUMBER_REGEX) || [];

    // Check placeholder integrity
    const allPlaceholdersPresent = origPlaceholders.every((p: string) => candPlaceholders.includes(p));
    const noCorruptedPlaceholders = !candidateText.includes('[CORRUPTED_TAG]');
    const protectedIntegrityPassed = allPlaceholdersPresent && noCorruptedPlaceholders && this.forceGateFailure !== HardGateType.PROTECTED_PLACEHOLDERS;

    // Check numerical consistency
    const allNumbersPresent = origNumbers.every((n: string) => candNumbers.includes(n)) && this.forceGateFailure !== HardGateType.NUMERICAL_ACCURACY;

    // Base scores
    const meaningScore = this.forceGateFailure === HardGateType.MEANING_PRESERVATION ? 55 : 94;
    const factualScore = allNumbersPresent ? (this.forceGateFailure === HardGateType.FACTUAL_CONSISTENCY ? 60 : 95) : 40;
    const termScore = this.forceGateFailure === HardGateType.TERMINOLOGY_PRESERVATION ? 50 : 92;
    const citationScore = this.forceGateFailure === HardGateType.CITATION_PRESERVATION ? 45 : 96;
    const protectedScore = protectedIntegrityPassed ? 100 : 20;

    const naturalness = this.forceGateFailure ? 88 : 86;
    const clarity = 90;
    const sentenceVariety = 84;
    const repetitionReduction = 88;
    const styleConsistency = 91;

    const checks = [
      {
        gate: HardGateType.MEANING_PRESERVATION,
        passed: meaningScore >= 85,
        score: meaningScore,
        reason: meaningScore >= 85 ? 'Core assertions and semantic intent intact' : 'Semantic deviation detected in core claims',
      },
      {
        gate: HardGateType.FACTUAL_CONSISTENCY,
        passed: factualScore >= 85,
        score: factualScore,
        reason: factualScore >= 85 ? 'All statements and numerical bounds factually consistent' : 'Numerical or factual alteration found',
      },
      {
        gate: HardGateType.TERMINOLOGY_PRESERVATION,
        passed: termScore >= 80,
        score: termScore,
        reason: termScore >= 80 ? 'Specialized domain vocabulary preserved' : 'Critical domain terms substituted or lost',
      },
      {
        gate: HardGateType.CITATION_PRESERVATION,
        passed: citationScore >= 90,
        score: citationScore,
        reason: citationScore >= 90 ? 'All academic references and citation identifiers preserved' : 'Citations distorted',
      },
      {
        gate: HardGateType.PROTECTED_PLACEHOLDERS,
        passed: protectedIntegrityPassed,
        score: protectedScore,
        reason: protectedIntegrityPassed ? 'All protected element markers intact' : 'Missing or altered protected placeholder tags',
      },
      {
        gate: HardGateType.NUMERICAL_ACCURACY,
        passed: allNumbersPresent,
        score: allNumbersPresent ? 100 : 30,
        reason: allNumbersPresent ? 'All numbers, dates, measurements matched exactly' : 'Numerical discrepancy between source and candidate',
      },
    ];

    const failedReasons: string[] = checks.filter((c) => !c.passed).map((c) => c.reason);
    const allPassed = checks.every((c) => c.passed);

    return {
      scores: {
        naturalness,
        clarity,
        sentenceVariety,
        repetitionReduction,
        styleConsistency,
        meaningPreservation: meaningScore,
        factualConsistency: factualScore,
        terminologyPreservation: termScore,
        citationPreservation: citationScore,
        protectedElementIntegrity: protectedScore,
      },
      gates: {
        allPassed,
        checks,
        failedReasons,
      },
      feedback: {
        strengths: ['Fluid sentence rhythm', 'Active voice clarity', 'Complete placeholder fidelity'],
        weaknesses: allPassed ? [] : ['Preservation gate requirement failed'],
        actionableFixes: allPassed ? ['Consider minor cadence polish'] : failedReasons,
      },
    };
  }

  async refineCandidate(
    originalText: string,
    candidateText: string,
    weaknesses: string[],
    actionableFixes: string[],
    expert: ExpertType
  ): Promise<IRefinementOutput> {
    if (this.forceTimeout) {
      throw new Error('AI Provider timeout simulated');
    }

    if (this.forceRegressiveRefinement) {
      // Simulate regression
      return {
        refinedText: candidateText + ' (clunky unnatural repetitive addition)',
        addressedWeaknesses: weaknesses,
        preservedPlaceholdersCheck: true,
        rationale: 'Simulated regressive refinement for fallback testing.',
      };
    }

    const refined = candidateText
      .replace(/\bNotably,\b/gi, 'Significantly,')
      .replace(/\bTesting confirmed the system\b/gi, 'Comprehensive evaluations demonstrated that the platform');

    return {
      refinedText: refined,
      addressedWeaknesses: weaknesses,
      preservedPlaceholdersCheck: true,
      rationale: `Targeted refinement applied to address ${actionableFixes.join(', ')} while protecting all structures.`,
    };
  }
}
