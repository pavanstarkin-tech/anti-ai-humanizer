import { DomainClassifier } from '../../src/modules/ai/router/domain.classifier.js';
import { MockAIProvider } from '../../src/modules/ai/providers/mock.provider.js';
import { DomainType, ExpertType } from '@humanizer/shared';

describe('DomainClassifier Unit Tests', () => {
  let mockProvider: MockAIProvider;
  let classifier: DomainClassifier;

  beforeEach(() => {
    mockProvider = new MockAIProvider();
    classifier = new DomainClassifier(mockProvider);
  });

  it('should correctly classify medical text and assign Medical Expert', async () => {
    const text = 'The patient underwent clinical therapy with a daily dose of 50mg.';
    const result = await classifier.classify(text);

    expect(result.primaryDomain).toBe(DomainType.MEDICAL);
    expect(result.confidenceScores[DomainType.MEDICAL]).toBeGreaterThanOrEqual(0.9);
    expect(result.assignedExperts).toContain(ExpertType.MEDICAL);
    expect(result.assignedExperts).toContain(ExpertType.GENERAL_WRITING);
  });

  it('should correctly classify legal text and assign Legal Expert', async () => {
    const text = 'Pursuant to clause 14, the agreement establishes limited liability under state statute.';
    const result = await classifier.classify(text);

    expect(result.primaryDomain).toBe(DomainType.LEGAL);
    expect(result.assignedExperts).toContain(ExpertType.LEGAL);
  });

  it('should extract detected numbers and protected placeholders', async () => {
    const text = 'The system [TABLE_001] processed 4,500 transactions at $250.00 with 99.8% uptime.';
    const result = await classifier.classify(text);

    expect(result.detectedKeyNumbers).toContain('4,500');
    expect(result.detectedKeyNumbers).toContain('$250.00');
    expect(result.detectedKeyNumbers).toContain('99.8%');
    expect(result.detectedProtectedTerms).toContain('[TABLE_001]');
  });
});
