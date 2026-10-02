import { ElementType } from '@humanizer/shared';

export interface DetectedElement {
  placeholder: string;
  type: ElementType;
  rawContent: string;
  orderIndex: number;
}

export interface DetectionResult {
  processedText: string;
  elements: DetectedElement[];
}

export class ElementDetector {
  private elementCounter = 1;

  public detectAndProtect(rawText: string, pageNumber: number): DetectionResult {
    const elements: DetectedElement[] = [];
    let text = rawText;

    // 1. Detect Tables (e.g. Markdown tables or [TABLE ...] blocks)
    const tableRegex = /(\|[^\n\r]+\|(?:\r?\n\|[-:\s|]+\|)?(?:\r?\n\|[^\n\r]+\|)+)/g;
    text = text.replace(tableRegex, (match) => {
      const id = String(this.elementCounter++).padStart(3, '0');
      const placeholder = `[TABLE_${id}]`;
      elements.push({
        placeholder,
        type: ElementType.TABLE,
        rawContent: match,
        orderIndex: elements.length + 1,
      });
      return `\n\n${placeholder}\n\n`;
    });

    // 2. Detect Markdown Images & HTML img tags
    const imageRegex = /(!\[.*?\]\(.*?\)|<img\s+[^>]*>)/g;
    text = text.replace(imageRegex, (match) => {
      const id = String(this.elementCounter++).padStart(3, '0');
      const placeholder = `[IMAGE_${id}]`;
      elements.push({
        placeholder,
        type: ElementType.IMAGE,
        rawContent: match,
        orderIndex: elements.length + 1,
      });
      return placeholder;
    });

    // 3. Detect Mathematical Equations (e.g. $$...$$ or LaTeX formulas)
    const eqRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n\r]+\$)/g;
    text = text.replace(eqRegex, (match) => {
      const id = String(this.elementCounter++).padStart(3, '0');
      const placeholder = `[EQUATION_${id}]`;
      elements.push({
        placeholder,
        type: ElementType.EQUATION,
        rawContent: match,
        orderIndex: elements.length + 1,
      });
      return placeholder;
    });

    // 4. Detect Academic Citations (e.g. [1], [2-4], [Smith et al., 2023], (Author, 2021))
    const citationRegex = /(\[(?:\d+|[A-Z][a-zA-Z\s]+(?:et\s+al\.)?,\s*\d{4})\]|\([A-Z][a-zA-Z\s]+(?:et\s+al\.)?,\s*\d{4}\))/g;
    text = text.replace(citationRegex, (match) => {
      const id = String(this.elementCounter++).padStart(3, '0');
      const placeholder = `[CITATION_${id}]`;
      elements.push({
        placeholder,
        type: ElementType.CITATION,
        rawContent: match,
        orderIndex: elements.length + 1,
      });
      return placeholder;
    });

    // Clean up excessive blank lines
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    return {
      processedText: text,
      elements,
    };
  }
}
