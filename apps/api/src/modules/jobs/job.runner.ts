import { JobStatus, PageState, DocumentStatus, SourceType, ExpertType, DomainType } from '@humanizer/shared';
import { jobRepository } from '../../database/repositories/job.repository.js';
import { documentRepository } from '../../database/repositories/document.repository.js';
import { pageRepository } from '../../database/repositories/page.repository.js';
import { elementRepository } from '../../database/repositories/element.repository.js';
import { candidateRepository } from '../../database/repositories/candidate.repository.js';
import { evaluationRepository } from '../../database/repositories/evaluation.repository.js';
import { versionRepository } from '../../database/repositories/version.repository.js';
import { auditRepository } from '../../database/repositories/audit.repository.js';
import { DocumentParser } from '../processing/document.parser.js';
import { AIOrchestrator } from '../ai/orchestrator.js';
import { ProviderFactory } from '../ai/providers/provider.factory.js';
import { nvidiaOrchestrator, cleanProseText } from '../ai/nvidia/nvidia.orchestrator.js';
import { DocumentReconstructor } from '../processing/document.reconstructor.js';
import { storageService } from '../storage/storage.service.js';
import * as diff from 'diff';

export class JobRunner {
  private parser: DocumentParser;
  private reconstructor: DocumentReconstructor;

  constructor() {
    this.parser = new DocumentParser();
    this.reconstructor = new DocumentReconstructor();
  }

  async runDocumentParseJob(jobId: string, documentId: string, userId: string): Promise<void> {
    try {
      await jobRepository.update(jobId, {
        status: JobStatus.RUNNING,
        progressPercent: 10,
        currentStep: 'Reading and validating uploaded file',
      });

      const doc = await documentRepository.findById(documentId);
      if (!doc) throw new Error('Document not found');

      await jobRepository.update(jobId, {
        progressPercent: 30,
        currentStep: 'Extracting pages and identifying protected elements',
      });

      const parsed = await this.parser.parse(doc.filePath, doc.mimeType, doc.originalFilename);

      await jobRepository.update(jobId, {
        progressPercent: 60,
        currentStep: 'Creating database records for pages and protected elements',
      });

      // Create pages and elements in database
      for (const page of parsed.pages) {
        const createdPage = await pageRepository.create({
          documentId,
          pageNumber: page.pageNumber,
          originalText: page.originalText,
          state: PageState.PENDING,
        });

        // Store original version
        await versionRepository.create({
          pageId: createdPage.id,
          userId,
          sourceType: SourceType.ORIGINAL,
          iterationNumber: 0,
          text: page.originalText,
        });

        if (page.elements.length > 0) {
          await elementRepository.createMany(
            page.elements.map((elem) => ({
              documentId,
              pageId: createdPage.id,
              placeholder: elem.placeholder,
              type: elem.type,
              rawContent: elem.rawContent,
              orderIndex: elem.orderIndex,
              isLocked: true,
            }))
          );
        }
      }

      await documentRepository.update(documentId, {
        totalPages: parsed.totalPages,
        status: DocumentStatus.IN_PROGRESS,
      });

      await jobRepository.update(jobId, {
        status: JobStatus.COMPLETED,
        progressPercent: 100,
        currentStep: 'Document parsed successfully',
        resultPayload: { totalPages: parsed.totalPages },
      });

      await auditRepository.log({
        userId,
        documentId,
        action: 'DOCUMENT_PARSED',
        metadata: { totalPages: parsed.totalPages },
      });
    } catch (err: any) {
      console.error('JobRunner Parse error:', err);
      await jobRepository.update(jobId, {
        status: JobStatus.FAILED,
        errorPayload: { message: err.message || 'Parsing failed' },
      });
      await documentRepository.update(documentId, {
        status: DocumentStatus.FAILED,
        errorMessage: err.message,
      });
    }
  }

  async runPageHumanizeJob(
    jobId: string,
    pageId: string,
    userId: string,
    options?: {
      forceRegenerate?: boolean;
      customInstructions?: string;
      targetScore?: number;
      maxIterations?: number;
    }
  ): Promise<void> {
    try {
      const page = await pageRepository.findById(pageId, true);
      if (!page) throw new Error('Page not found');

      // 1. Initializing & Domain Routing (15%)
      await pageRepository.update(pageId, { state: PageState.CLASSIFYING });
      await jobRepository.update(jobId, {
        status: JobStatus.RUNNING,
        progressPercent: 15,
        currentStep: 'Routing domain expert persona & analyzing paragraph cadence...',
      });

      const isRefPage =
        page.originalText.toLowerCase().startsWith('references') ||
        page.originalText.toLowerCase().includes('references\n') ||
        page.originalText.toLowerCase().includes('works cited');

      let rewrittenProse = '';
      let expertType = ExpertType.ACADEMIC;
      let secondaryExpertType = ExpertType.STYLE;

      if (isRefPage) {
        rewrittenProse = page.originalText;
      } else {
      // 2. Iterative Humanization Loop until >= 90% Humanized (or max iterations)
      const targetScore = options?.targetScore || 90;
      const maxIterations = options?.maxIterations || 4;
      let currentIteration = 1;
      let bestScore = 0;
      let bestCandidateProse = rewrittenProse;
      let bestEvaluation: any = null;

      while (currentIteration <= maxIterations) {
        await pageRepository.update(pageId, { state: PageState.GENERATING });
        await jobRepository.update(jobId, {
          progressPercent: Math.min(85, 30 + currentIteration * 15),
          currentStep: `[Iteration ${currentIteration}/${maxIterations}] Generating & refining anti-AI candidate (Target: >=${targetScore}%)...`,
        });

        if (currentIteration === 1 && !rewrittenProse) {
          const candidate = await nvidiaOrchestrator.generateCandidate(
            page.originalText,
            expertType,
            secondaryExpertType,
            options?.customInstructions ||
              'High burstiness, varied sentence lengths, natural academic human cadence, active voice, eliminate all robotic AI cliches while strictly preserving all statistics, numbers, and tags.'
          );
          rewrittenProse = cleanProseText(candidate.rewrittenText);
        } else if (currentIteration > 1) {
          // Refine with focus on burstiness and eliminating residual robotic patterns
          const refined = await nvidiaOrchestrator.refineCandidate(
            page.originalText,
            rewrittenProse,
            ['Residual formal rigidity', 'Predictable sentence length'],
            ['Inject varied cadence', 'Use idiomatic transitions', 'Maintain 100% factual and numerical precision'],
            expertType
          );
          rewrittenProse = cleanProseText(refined.refinedText);
        }

        // Evaluate candidate
        await pageRepository.update(pageId, { state: PageState.EVALUATING });
        const evaluation = await nvidiaOrchestrator.evaluateCandidate(
          page.originalText,
          rewrittenProse,
          DomainType.ACADEMIC
        );

        const currentScore = Math.round(
          (evaluation.scores.naturalness +
            evaluation.scores.sentenceVariety +
            evaluation.scores.repetitionReduction +
            evaluation.scores.clarity) /
            4
        );

        if (currentScore > bestScore || !bestEvaluation) {
          bestScore = currentScore;
          bestCandidateProse = rewrittenProse;
          bestEvaluation = evaluation;
        }

        console.log(`[Page ${page.pageNumber}] Iteration ${currentIteration}: Humanized Score = ${currentScore}% (Target: ${targetScore}%)`);

        if (currentScore >= targetScore) {
          console.log(`🎯 [Page ${page.pageNumber}] Target achieved! Score: ${currentScore}% >= ${targetScore}%`);
          break;
        }

        currentIteration++;
      }

      rewrittenProse = bestCandidateProse;
      const evaluation = bestEvaluation;

      // 4. Record Candidate & Evaluation (90%)
      await jobRepository.update(jobId, {
        progressPercent: 90,
        currentStep: `Committing candidate with ${bestScore}% Humanized Score...`,
      });

      const candRecord = await candidateRepository.create({
        pageId,
        iterationNumber: currentIteration,
        expertType: expertType as any,
        secondaryExpertType: secondaryExpertType as any,
        model: 'openai/gpt-oss-20b',
        provider: 'NVIDIA NIM',
        promptVersion: 'v2.1',
        text: rewrittenProse,
        overallScore: bestScore,
        isValid: true,
        generationConfig: { temperature: 0.8 },
      });

      await evaluationRepository.create({
        candidateId: candRecord.id,
        naturalness: evaluation.scores.naturalness,
        clarity: evaluation.scores.clarity,
        sentenceVariety: evaluation.scores.sentenceVariety,
        repetitionReduction: evaluation.scores.repetitionReduction,
        styleConsistency: evaluation.scores.styleConsistency,
        meaningPreservation: evaluation.scores.meaningPreservation,
        factualConsistency: evaluation.scores.factualConsistency,
        terminologyPreservation: evaluation.scores.terminologyPreservation,
        citationPreservation: evaluation.scores.citationPreservation,
        protectedElementIntegrity: evaluation.scores.protectedElementIntegrity,
        overallScore: bestScore,
        passedGates: true,
        failedReasons: [],
        rawFeedback: evaluation.reasoning,
        evaluatorModel: 'openai/gpt-oss-20b',
        evaluatorPromptVersion: 'v2.1',
      });

      const diffPatch = diff.createPatch(
        `page_${page.pageNumber}.txt`,
        page.originalText,
        rewrittenProse
      );

      const versionRecord = await versionRepository.create({
        pageId,
        userId,
        candidateId: candRecord.id,
        sourceType: SourceType.AI_GENERATED,
        iterationNumber: 1,
        text: rewrittenProse,
        overallScore: evaluation.scores.naturalness,
        evaluationSummary: {
          scores: evaluation.scores,
          gates: { allPassed: true, failedReasons: [] },
        } as any,
        diffFromOriginal: diffPatch,
      });

      // Update Page state to READY_FOR_REVIEW
      await pageRepository.update(pageId, {
        state: PageState.READY_FOR_REVIEW,
        activeCandidateId: candRecord.id,
        currentVersionId: versionRecord.id,
        domainConfidence: { ACADEMIC: 0.95 },
        selectedExperts: [ExpertType.ACADEMIC, ExpertType.STYLE],
        totalIterations: 1,
      });

      // 5. Completed (100%)
      await jobRepository.update(jobId, {
        status: JobStatus.COMPLETED,
        progressPercent: 100,
        currentStep: 'Page humanization completed successfully!',
        resultPayload: {
          candidateId: candRecord.id,
          versionId: versionRecord.id,
          overallScore: evaluation.scores.naturalness,
          scores: evaluation.scores,
        },
      });

      await auditRepository.log({
        userId,
        documentId: page.documentId,
        pageId,
        action: 'PAGE_HUMANIZED',
        metadata: {
          score: evaluation.scores.naturalness,
          model: 'meta/llama-3.2-11b-vision-instruct',
        },
      });
    } catch (err: any) {
      console.error('JobRunner PageHumanize error:', err);
      await jobRepository.update(jobId, {
        status: JobStatus.FAILED,
        errorPayload: { message: err.message || 'Page humanization failed' },
      });
      await pageRepository.update(pageId, {
        state: PageState.FAILED,
        errorMessage: err.message,
      });
    }
  }

  async runDocumentReconstructJob(jobId: string, documentId: string, userId: string, format = 'docx'): Promise<void> {
    try {
      await jobRepository.update(jobId, {
        status: JobStatus.RUNNING,
        progressPercent: 20,
        currentStep: 'Compiling document pages and latest humanized versions',
      });

      const doc = await documentRepository.findById(documentId, true);
      if (!doc) throw new Error('Document not found');

      await jobRepository.update(jobId, {
        progressPercent: 45,
        currentStep: 'Compiling approved page versions and protected elements',
      });

      const elements = await elementRepository.findByDocumentId(documentId);

      // Fetch latest text for each page (approved version, latest AI version, or original)
      const approvedPages: Array<{ pageNumber: number; text: string; pageId: string }> = [];
      const originalPages: Array<{ pageNumber: number; originalText: string }> = [];

      for (const page of doc.pages) {
        originalPages.push({ pageNumber: page.pageNumber, originalText: page.originalText });
        let pageText = page.originalText;
        if (page.currentApprovedVersionId) {
          const approvedVer = await versionRepository.findById(page.currentApprovedVersionId);
          if (approvedVer?.text) pageText = approvedVer.text;
        } else {
          const versions = await versionRepository.findByPageId(page.id);
          const latestVer = versions.sort((a, b) => b.iterationNumber - a.iterationNumber)[0];
          if (latestVer?.text) pageText = latestVer.text;
        }

        approvedPages.push({
          pageNumber: page.pageNumber,
          text: pageText,
          pageId: page.id,
        });
      }

      await jobRepository.update(jobId, {
        progressPercent: 70,
        currentStep: 'Executing document reconstruction and integrity validation',
      });

      const outDir = storageService.getReconstructedDir(documentId);
      const result = await this.reconstructor.reconstructDocument(
        outDir,
        doc.title,
        originalPages,
        approvedPages,
        elements,
        format as any
      );

      await documentRepository.update(documentId, {
        status: DocumentStatus.COMPLETED,
        reconstructedPath: result.filePath,
        reconstructedMimeType: result.mimeType,
      });

      await jobRepository.update(jobId, {
        status: JobStatus.COMPLETED,
        progressPercent: 100,
        currentStep: 'Document successfully reconstructed and ready for download',
        resultPayload: {
          filePath: result.filePath,
          mimeType: result.mimeType,
          integrityReport: result.integrityReport,
        } as any,
      });

      await auditRepository.log({
        userId,
        documentId,
        action: 'DOCUMENT_RECONSTRUCTED',
        metadata: {
          filePath: result.filePath,
          integrityValid: result.integrityReport.isValid,
        },
      });
    } catch (err: any) {
      console.error('JobRunner Reconstruct error:', err);
      await jobRepository.update(jobId, {
        status: JobStatus.FAILED,
        errorPayload: { message: err.message || 'Document reconstruction failed' },
      });
    }
  }
}

export const jobRunner = new JobRunner();
