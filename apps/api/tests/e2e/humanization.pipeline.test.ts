import { AIOrchestrator } from '../../src/modules/ai/orchestrator.js';
import { MockAIProvider } from '../../src/modules/ai/providers/mock.provider.js';
import { DocumentParser } from '../../src/modules/processing/document.parser.js';
import { DocumentReconstructor } from '../../src/modules/processing/document.reconstructor.js';
import { DomainType, PageState } from '@humanizer/shared';
import fs from 'fs';
import path from 'path';

describe('End-to-End Document Humanization Pipeline Test', () => {
  const testTmpDir = path.resolve(__dirname, '../tmp_test_pipeline');
  let mockProvider: MockAIProvider;
  let orchestrator: AIOrchestrator;
  let parser: DocumentParser;
  let reconstructor: DocumentReconstructor;

  beforeAll(() => {
    if (!fs.existsSync(testTmpDir)) {
      fs.mkdirSync(testTmpDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    mockProvider = new MockAIProvider();
    orchestrator = new AIOrchestrator(mockProvider);
    parser = new DocumentParser();
    reconstructor = new DocumentReconstructor();
  });

  it('should complete the entire multi-page workflow with human-in-the-loop approval and reconstruction', async () => {
    // 1. Create a simulated 2-page document with protected elements and domain terminology
    const sampleDocContent = `
# Clinical Evaluation Study

In order to evaluate the efficacy of the protocol, clinical observations were recorded for 250 patients in 2024.
It is observed that the response rate reached 88.5% as detailed in the summary table below:

| Patient Cohort | Response Rate | Dosage |
| --- | --- | --- |
| Group A | 88.5% | 50mg |
| Group B | 76.2% | 25mg |

=== PAGE_BREAK ===

# Engineering Specifications & Citations

The platform utilizes a distributed database architecture with latency under 15ms.
Testing confirmed the system achieved 99.99% availability during peak workloads.
Reference citation: [Smith et al., 2023].
`;

    const sampleDocPath = path.join(testTmpDir, 'test_study.txt');
    fs.writeFileSync(sampleDocPath, sampleDocContent, 'utf-8');

    // 2. Parse Document into structured pages and protect elements
    const parsed = await parser.parse(sampleDocPath, 'text/plain', 'test_study.txt');
    expect(parsed.totalPages).toBe(2);
    expect(parsed.pages[0].elements.length).toBeGreaterThan(0);
    expect(parsed.pages[0].originalText).toContain('[TABLE_001]');

    // 3. Process Page 1 through AI pipeline
    const page1Result = await orchestrator.runPipelineForPage(parsed.pages[0].originalText);
    expect(page1Result.domainClassification.primaryDomain).toBe(DomainType.MEDICAL);
    expect(page1Result.allGeneratedCandidates.length).toBeGreaterThanOrEqual(3);
    expect(page1Result.finalCandidate.isValid).toBe(true);
    expect(page1Result.finalCandidate.evaluation.overallWeightedScore).toBeGreaterThanOrEqual(80);
    expect(page1Result.finalCandidate.candidate.text).toContain('[TABLE_001]');
    expect(page1Result.finalCandidate.candidate.text).toContain('250');
    expect(page1Result.finalCandidate.candidate.text).toContain('88.5%');

    // 4. Simulate User approving Page 1
    const page1Approved = {
      pageNumber: 1,
      text: page1Result.finalCandidate.candidate.text,
      state: PageState.APPROVED,
    };

    // 5. Process Page 2 (now unlocked)
    const page2Result = await orchestrator.runPipelineForPage(parsed.pages[1].originalText);
    expect(page2Result.domainClassification.primaryDomain).toBe(DomainType.TECHNICAL);
    expect(page2Result.finalCandidate.isValid).toBe(true);
    expect(page2Result.finalCandidate.candidate.text).toContain('[CITATION_002]');

    // 6. Simulate User editing Page 2
    const userEditedPage2Text = page2Result.finalCandidate.candidate.text.replace(
      'under 15ms',
      'below 15ms'
    );
    const page2Approved = {
      pageNumber: 2,
      text: userEditedPage2Text,
      state: PageState.APPROVED,
    };

    // 7. Reconstruct final document and verify 100% integrity
    const allElements = [
      ...parsed.pages[0].elements.map((e, idx) => ({
        id: `elem_1_${idx}`,
        documentId: 'doc_1',
        pageId: 'page_1',
        placeholder: e.placeholder,
        type: e.type,
        rawContent: e.rawContent,
        orderIndex: e.orderIndex,
        isLocked: true,
        createdAt: new Date(),
        metadata: null,
      })),
      ...parsed.pages[1].elements.map((e, idx) => ({
        id: `elem_2_${idx}`,
        documentId: 'doc_1',
        pageId: 'page_2',
        placeholder: e.placeholder,
        type: e.type,
        rawContent: e.rawContent,
        orderIndex: e.orderIndex,
        isLocked: true,
        createdAt: new Date(),
        metadata: null,
      })),
    ];

    const reconstruction = await reconstructor.reconstructDocument(
      testTmpDir,
      'Clinical Study Report',
      parsed.pages.map((p) => ({ pageNumber: p.pageNumber, originalText: p.originalText })),
      [page1Approved, page2Approved],
      allElements as any,
      'md'
    );

    expect(reconstruction.integrityReport.isValid).toBe(true);
    expect(fs.existsSync(reconstruction.filePath)).toBe(true);

    const finalContent = fs.readFileSync(reconstruction.filePath, 'utf-8');
    // Ensure table and citation were restored into final document
    expect(finalContent).toContain('| Patient Cohort | Response Rate |');
    expect(finalContent).toContain('[Smith et al., 2023]');
    expect(finalContent).toContain('88.5%');
    expect(finalContent).toContain('15ms');
  });
});
