import fs from 'fs';
import mammoth from 'mammoth';
import { ElementDetector, DetectionResult } from './element.detector.js';

export interface ParsedPage {
  pageNumber: number;
  originalText: string;
  elements: DetectionResult['elements'];
}

export interface ParsedDocument {
  title: string;
  totalPages: number;
  pages: ParsedPage[];
}

export class DocumentParser {
  private elementDetector: ElementDetector;

  constructor() {
    this.elementDetector = new ElementDetector();
  }

  async parse(filePath: string, mimeType: string, originalFilename: string): Promise<ParsedDocument> {
    const rawPages = await this.extractRawPages(filePath, mimeType);

    const pages: ParsedPage[] = rawPages.map((rawPageText, index) => {
      const pageNumber = index + 1;
      const { processedText, elements } = this.elementDetector.detectAndProtect(
        rawPageText,
        pageNumber
      );

      return {
        pageNumber,
        originalText: processedText,
        elements,
      };
    });

    const title = originalFilename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    return {
      title,
      totalPages: pages.length,
      pages,
    };
  }

  private async extractRawPages(filePath: string, mimeType: string): Promise<string[]> {
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filePath.endsWith('.docx')
    ) {
      return this.extractFromDocx(filePath);
    }

    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      return this.extractFromPdf(filePath);
    }

    // Default: Plain text / Markdown / JSON
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.splitIntoPages(content);
  }

  private async extractFromDocx(filePath: string): Promise<string[]> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const fullText = result.value || '';
      return this.splitIntoPages(fullText);
    } catch (err) {
      // Fallback for docx reading
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.splitIntoPages(content);
    }
  }

  private async extractFromPdf(filePath: string): Promise<string[]> {
    try {
      // Dynamic import for pdf-parse to handle CJS/ESM seamlessly
      const pdfParseModule: any = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;

      const buffer = fs.readFileSync(filePath);
      const pages: string[] = [];

      const options = {
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            let lastY = -1;
            let text = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || lastY === -1) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            const cleanText = text.trim();
            if (cleanText.length > 0) {
              pages.push(cleanText);
            }
            return cleanText;
          });
        },
      };

      const result = await pdfParse(buffer, options);
      if (pages.length > 0) {
        return pages;
      }
      return this.splitIntoPages(result.text || '');
    } catch (err) {
      console.warn('⚠️ PDF parsing warning, using text fallback:', err);
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.splitIntoPages(content);
    }
  }

  private splitIntoPages(fullText: string): string[] {
    // Check for explicit page separators
    if (fullText.includes('\f')) {
      return fullText.split('\f').map((p) => p.trim()).filter((p) => p.length > 0);
    }

    if (fullText.includes('=== PAGE_BREAK ===')) {
      return fullText.split('=== PAGE_BREAK ===').map((p) => p.trim()).filter((p) => p.length > 0);
    }

    if (fullText.includes('\n---\n')) {
      const parts = fullText.split(/\n---\n/).map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length > 1) return parts;
    }

    // If long continuous text, chunk by paragraphs (e.g. ~400-500 words per page)
    const paragraphs = fullText.split(/\n\s*\n/);
    const pages: string[] = [];
    let currentPage = '';
    let currentWordCount = 0;

    for (const para of paragraphs) {
      const words = para.trim().split(/\s+/).length;
      if (currentPage.length > 0 && currentWordCount + words > 350) {
        pages.push(currentPage.trim());
        currentPage = para;
        currentWordCount = words;
      } else {
        currentPage = currentPage ? `${currentPage}\n\n${para}` : para;
        currentWordCount += words;
      }
    }

    if (currentPage.trim().length > 0) {
      pages.push(currentPage.trim());
    }

    return pages.length > 0 ? pages : [fullText.trim()];
  }
}
