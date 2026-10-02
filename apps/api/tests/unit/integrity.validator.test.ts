import { IntegrityValidator } from '../../src/modules/processing/integrity.validator.js';
import { ElementType } from '@humanizer/shared';

describe('IntegrityValidator Unit Tests', () => {
  let validator: IntegrityValidator;

  beforeEach(() => {
    validator = new IntegrityValidator();
  });

  it('should PASS when all approved pages retain all protected objects and numbers', () => {
    const originalPages = [
      { pageNumber: 1, originalText: 'Clinical report [TABLE_001] observed 150 patients in 2024.' },
    ];
    const approvedPages = [
      { pageNumber: 1, text: 'The clinical study [TABLE_001] evaluated 150 patients during 2024.' },
    ];
    const elements = [
      {
        id: '1',
        documentId: 'd1',
        pageId: 'p1',
        placeholder: '[TABLE_001]',
        type: ElementType.TABLE,
        rawContent: '| Col1 | Col2 |',
        orderIndex: 1,
        isLocked: true,
        createdAt: new Date(),
        metadata: null,
      },
    ];

    const report = validator.validateIntegrity(originalPages, approvedPages, elements);

    expect(report.isValid).toBe(true);
    expect(report.missingPlaceholderIds.length).toBe(0);
    expect(report.errors.length).toBe(0);
  });

  it('should FAIL when a placeholder is missing in approved pages', () => {
    const originalPages = [
      { pageNumber: 1, originalText: 'Formula [EQUATION_001] yields 42.' },
    ];
    const approvedPages = [
      { pageNumber: 1, text: 'The mathematical expression yields 42.' }, // [EQUATION_001] missing!
    ];
    const elements = [
      {
        id: '1',
        documentId: 'd1',
        pageId: 'p1',
        placeholder: '[EQUATION_001]',
        type: ElementType.EQUATION,
        rawContent: '$$x = y + z$$',
        orderIndex: 1,
        isLocked: true,
        createdAt: new Date(),
        metadata: null,
      },
    ];

    const report = validator.validateIntegrity(originalPages, approvedPages, elements);

    expect(report.isValid).toBe(false);
    expect(report.missingPlaceholderIds).toContain('[EQUATION_001]');
  });
});
