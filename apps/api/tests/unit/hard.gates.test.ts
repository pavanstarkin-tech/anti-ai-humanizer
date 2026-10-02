import { HardGateValidator } from '../../src/modules/ai/hard_gates/gate.validator.js';
import { HardGateType, DEFAULT_QUALITY_THRESHOLDS } from '@humanizer/shared';

describe('HardGateValidator Unit Tests', () => {
  let validator: HardGateValidator;

  beforeEach(() => {
    validator = new HardGateValidator(DEFAULT_QUALITY_THRESHOLDS);
  });

  it('should PASS when all dimensions and protected elements are intact', () => {
    const original = 'Revenue was $15.5M in 2024 as shown in [TABLE_001] and [CITATION_001].';
    const candidate = 'During 2024, total revenue reached $15.5M, illustrated in [TABLE_001] and [CITATION_001].';

    const scores = {
      meaningPreservation: 95,
      factualConsistency: 95,
      terminologyPreservation: 92,
      citationPreservation: 95,
      protectedElementIntegrity: 100,
    };

    const result = validator.validate(original, candidate, scores);
    expect(result.allPassed).toBe(true);
    expect(result.failedReasons.length).toBe(0);
  });

  it('should REJECT candidate if numerical figure is altered or missing', () => {
    const original = 'The trial included 450 participants with 82% efficacy.';
    const candidate = 'The trial included 9999 participants with 82% efficacy.'; // 450 changed to 9999

    const scores = {
      meaningPreservation: 95,
      factualConsistency: 95,
      terminologyPreservation: 90,
      citationPreservation: 90,
      protectedElementIntegrity: 100,
    };

    const result = validator.validate(original, candidate, scores);
    expect(result.allPassed).toBe(false);
    expect(result.checks.find((c) => c.gate === HardGateType.NUMERICAL_ACCURACY)?.passed).toBe(false);
  });

  it('should REJECT candidate if protected placeholder is missing or corrupted', () => {
    const original = 'System architecture overview is presented in [IMAGE_001] and [TABLE_002].';
    const candidate = 'The architectural layout can be seen in [IMAGE_001] only.'; // [TABLE_002] deleted

    const scores = {
      meaningPreservation: 95,
      factualConsistency: 95,
      terminologyPreservation: 90,
      citationPreservation: 90,
      protectedElementIntegrity: 100,
    };

    const result = validator.validate(original, candidate, scores);
    expect(result.allPassed).toBe(false);
    expect(result.checks.find((c) => c.gate === HardGateType.PROTECTED_PLACEHOLDERS)?.passed).toBe(false);
  });

  it('should REJECT candidate if meaning preservation is below threshold', () => {
    const original = 'The medication is contraindicated for patients with renal failure.';
    const candidate = 'Patients with renal conditions may occasionally take the medication.';

    const scores = {
      meaningPreservation: 65, // Below 85
      factualConsistency: 60,
      terminologyPreservation: 85,
      citationPreservation: 95,
      protectedElementIntegrity: 100,
    };

    const result = validator.validate(original, candidate, scores);
    expect(result.allPassed).toBe(false);
    expect(result.checks.find((c) => c.gate === HardGateType.MEANING_PRESERVATION)?.passed).toBe(false);
  });
});
