import fs from 'fs';
import path from 'path';
import * as docx from 'docx';
import { DocumentElement } from '@prisma/client';
import { IntegrityValidator } from './integrity.validator.js';
import { IReconstructionIntegrityReport } from '@humanizer/shared';

export interface ReconstructionResult {
  filePath: string;
  mimeType: string;
  integrityReport: IReconstructionIntegrityReport;
}

export class DocumentReconstructor {
  private integrityValidator: IntegrityValidator;

  constructor() {
    this.integrityValidator = new IntegrityValidator();
  }

  async reconstructDocument(
    outputDir: string,
    documentTitle: string,
    originalPages: Array<{ pageNumber: number; originalText: string }>,
    approvedPages: Array<{ pageNumber: number; text: string }>,
    elements: DocumentElement[],
    targetFormat: 'docx' | 'txt' | 'md' | 'original' | 'pdf' = 'docx'
  ): Promise<ReconstructionResult> {
    // 1. Run Integrity Validation
    const integrityReport = this.integrityValidator.validateIntegrity(
      originalPages,
      approvedPages,
      elements
    );

    if (!integrityReport.isValid) {
      console.warn(
        `⚠️ Document reconstruction integrity check noticed discrepancies: ${integrityReport.errors.join('; ')}`
      );
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Sort approved pages in ascending order
    const sortedApproved = [...approvedPages].sort((a, b) => a.pageNumber - b.pageNumber);

    // 2. Reinsert protected elements in page texts
    const restoredPagesText = sortedApproved.map((page) => {
      let pageText = page.text;
      const pageElements = elements.filter((e) => e.pageId === (page as any).pageId || pageText.includes(e.placeholder));

      for (const elem of pageElements) {
        if (pageText.includes(elem.placeholder)) {
          pageText = pageText.split(elem.placeholder).join(elem.rawContent);
        }
      }
      return pageText;
    });

    const sanitizedTitle = documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

    // 3. Build target document
    if (targetFormat === 'docx') {
      const docxPath = path.join(outputDir, `${sanitizedTitle}_humanized.docx`);
      const docxSections = restoredPagesText.map((pageText, idx) => {
        const paragraphs = pageText.split(/\n+/).map((line) => {
          return new (docx as any).Paragraph({
            children: [
              new (docx as any).TextRun({
                text: line,
                font: 'Calibri',
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 200 },
          });
        });

        return {
          properties: { page: { pageNumbers: { start: idx + 1 } } },
          children: paragraphs,
        };
      });

      const doc = new (docx as any).Document({
        sections: docxSections,
      });

      const buffer = await (docx as any).Packer.toBuffer(doc);
      fs.writeFileSync(docxPath, buffer);

      return {
        filePath: docxPath,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        integrityReport,
      };
    }

    if (targetFormat === 'pdf') {
      const pdfPath = path.join(outputDir, `${sanitizedTitle}_humanized.pdf`);
      const PDFDocumentModule = await import('pdfkit');
      const PDFDocument = PDFDocumentModule.default || PDFDocumentModule;

      await new Promise<void>((resolve, reject) => {
        const doc = new (PDFDocument as any)({
          size: 'A4',
          margins: { top: 54, bottom: 54, left: 54, right: 54 },
          autoFirstPage: false,
        });

        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        restoredPagesText.forEach((pageText, idx) => {
          doc.addPage();

          // Clean Top Running Header
          doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(documentTitle, 54, 28, { width: 300, ellipsis: true });
          doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Page ${idx + 1} of ${restoredPagesText.length}`, 300, 28, { width: 241, align: 'right' });
          doc.moveTo(54, 42).lineTo(541, 42).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

          // Page Title / Section
          doc.y = 60;
          doc.fontSize(15).font('Helvetica-Bold').fillColor('#0f172a').text(idx === 0 ? documentTitle : `Section — Page ${idx + 1}`, { paragraphGap: 12 });
          
          // Paragraphs
          const paragraphs = pageText.split(/\n\s*\n/);
          paragraphs.forEach((p) => {
            const clean = p.trim();
            if (clean.length > 0) {
              doc.fontSize(10.5).font('Helvetica').fillColor('#1e293b').text(clean, {
                lineGap: 4.5,
                paragraphGap: 12,
                align: 'left',
              });
            }
          });
        });

        doc.end();
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err: any) => reject(err));
      });

      return {
        filePath: pdfPath,
        mimeType: 'application/pdf',
        integrityReport,
      };
    }

    // Default: Markdown / Text
    const ext = targetFormat === 'md' ? 'md' : 'txt';
    const filePath = path.join(outputDir, `${sanitizedTitle}_humanized.${ext}`);
    const fullContent = restoredPagesText.join('\n\n---\n\n');
    fs.writeFileSync(filePath, fullContent, 'utf-8');

    return {
      filePath,
      mimeType: targetFormat === 'md' ? 'text/markdown' : 'text/plain',
      integrityReport,
    };
  }
}
