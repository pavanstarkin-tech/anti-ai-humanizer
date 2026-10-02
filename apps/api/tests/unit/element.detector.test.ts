import { ElementDetector } from '../../src/modules/processing/element.detector.js';
import { ElementType } from '@humanizer/shared';

describe('ElementDetector Unit Tests', () => {
  let detector: ElementDetector;

  beforeEach(() => {
    detector = new ElementDetector();
  });

  it('should detect tables, equations, citations, and images, replacing them with stable placeholders', () => {
    const rawText = `
Here is a table:
| Name | Value |
| --- | --- |
| Alpha | 100 |

Here is an image: ![Diagram](https://example.com/diag.png)

Here is a math formula: $$E = mc^2$$

Here is an academic citation [Smith et al., 2023].
`;

    const result = detector.detectAndProtect(rawText, 1);

    expect(result.elements.length).toBe(4);
    expect(result.processedText).toContain('[TABLE_001]');
    expect(result.processedText).toContain('[IMAGE_002]');
    expect(result.processedText).toContain('[EQUATION_003]');
    expect(result.processedText).toContain('[CITATION_004]');

    expect(result.elements.find((e) => e.type === ElementType.TABLE)).toBeDefined();
    expect(result.elements.find((e) => e.type === ElementType.IMAGE)).toBeDefined();
    expect(result.elements.find((e) => e.type === ElementType.EQUATION)).toBeDefined();
    expect(result.elements.find((e) => e.type === ElementType.CITATION)).toBeDefined();
  });
});
