import {
  IReconstructionIntegrityReport,
  SYSTEM_CONFIG,
  ElementType,
} from '@humanizer/shared';
import { DocumentElement } from '@prisma/client';

export class IntegrityValidator {
  public validateIntegrity(
    originalPages: Array<{ pageNumber: number; originalText: string }>,
    approvedPages: Array<{ pageNumber: number; text: string }>,
    elements: DocumentElement[]
  ): IReconstructionIntegrityReport {
    const errors: string[] = [];
    const missingPlaceholderIds: string[] = [];
    const numericalMismatches: Array<{ expected: string; found: string; context: string }> = [];

    // 1. Validate Page Counts
    if (originalPages.length !== approvedPages.length) {
      errors.push(`Page count mismatch: expected ${originalPages.length} pages, but got ${approvedPages.length}`);
    }

    // 2. Count original elements by type
    const originalCounts = {
      pages: originalPages.length,
      tables: elements.filter((e) => e.type === ElementType.TABLE).length,
      images: elements.filter((e) => e.type === ElementType.IMAGE).length,
      diagrams: elements.filter((e) => e.type === ElementType.DIAGRAM).length,
      charts: elements.filter((e) => e.type === ElementType.CHART).length,
      equations: elements.filter((e) => e.type === ElementType.EQUATION).length,
      citations: elements.filter((e) => e.type === ElementType.CITATION).length,
    };

    // 3. Verify placeholder presence across all approved page texts
    const combinedApprovedText = approvedPages.map((p) => p.text).join('\n\n');

    for (const elem of elements) {
      if (!combinedApprovedText.includes(elem.placeholder)) {
        missingPlaceholderIds.push(elem.placeholder);
        errors.push(`Protected element placeholder ${elem.placeholder} (${elem.type}) is missing from approved content`);
      }
    }

    // 4. Validate numerical integrity across pages (focus on statistical data, percentages, metrics, and multi-digit figures)
    for (let i = 0; i < originalPages.length; i++) {
      const orig = originalPages[i];
      const approved = approvedPages.find((p) => p.pageNumber === orig.pageNumber);
      if (!approved) continue;

      const isReferencePage = orig.originalText.toLowerCase().includes('references\n') ||
        orig.originalText.toLowerCase().includes('bibliography\n') ||
        orig.originalText.toLowerCase().startsWith('references');

      const origNumbers = Array.from(new Set(orig.originalText.match(SYSTEM_CONFIG.NUMBER_REGEX) || []));
      for (const num of origNumbers) {
        // Strict check on statistical, decimal, percentage, currency, and multi-digit figures
        const isSignificant = num.includes('%') || num.includes('.') || num.includes('$') || num.length > 1;
        if (isSignificant && !approved.text.includes(num)) {
          numericalMismatches.push({
            expected: num,
            found: 'MISSING',
            context: `Page ${orig.pageNumber}`,
          });
          errors.push(`Significant numerical figure '${num}' on Page ${orig.pageNumber} was altered or removed in approved text`);
        }
      }
    }

    const reconstructedCounts = {
      pages: approvedPages.length,
      tables: originalCounts.tables - missingPlaceholderIds.filter((p) => p.startsWith('[TABLE_')).length,
      images: originalCounts.images - missingPlaceholderIds.filter((p) => p.startsWith('[IMAGE_')).length,
      diagrams: originalCounts.diagrams - missingPlaceholderIds.filter((p) => p.startsWith('[DIAGRAM_')).length,
      charts: originalCounts.charts - missingPlaceholderIds.filter((p) => p.startsWith('[CHART_')).length,
      equations: originalCounts.equations - missingPlaceholderIds.filter((p) => p.startsWith('[EQUATION_')).length,
      citations: originalCounts.citations - missingPlaceholderIds.filter((p) => p.startsWith('[CITATION_')).length,
    };

    const isValid = errors.length === 0 && missingPlaceholderIds.length === 0;

    return {
      isValid,
      originalCounts,
      reconstructedCounts,
      missingPlaceholderIds,
      numericalMismatches,
      errors,
    };
  }
}
