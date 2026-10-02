import {
  PageState,
  DocumentStatus,
  SourceType,
  JobStatus,
  DomainType,
} from '@humanizer/shared';
import { pageRepository } from '../../database/repositories/page.repository.js';
import { documentRepository } from '../../database/repositories/document.repository.js';
import { candidateRepository } from '../../database/repositories/candidate.repository.js';
import { evaluationRepository } from '../../database/repositories/evaluation.repository.js';
import { versionRepository } from '../../database/repositories/version.repository.js';
import { approvalRepository } from '../../database/repositories/approval.repository.js';
import { jobRepository } from '../../database/repositories/job.repository.js';
import { auditRepository } from '../../database/repositories/audit.repository.js';
import { withTransaction, isDatabaseConnected } from '../../database/prisma.js';
import { jobRunner } from '../jobs/job.runner.js';
import { HardGateValidator } from '../ai/hard_gates/gate.validator.js';
import { IndependentEvaluator } from '../ai/evaluator/independent.evaluator.js';
import { ProviderFactory } from '../ai/providers/provider.factory.js';
import * as diff from 'diff';

export class PageService {
  private gateValidator: HardGateValidator;

  constructor() {
    this.gateValidator = new HardGateValidator();
  }

  async getPagesForDocument(documentId: string, userId: string) {
    const doc = await documentRepository.findById(documentId);
    if (!doc) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Document not found' };
    if (doc.userId !== userId) throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };

    const pages = await pageRepository.findByDocumentId(documentId);
    const approvedCount = pages.filter((p) => p.state === PageState.APPROVED).length;

    return {
      documentId,
      totalPages: pages.length,
      approvedPages: approvedCount,
      remainingPages: pages.length - approvedCount,
      pages,
    };
  }

  async getPageById(pageId: string, userId: string) {
    const page = await pageRepository.findById(pageId, true);
    if (!page) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Page not found' };
    if (page.document.userId !== userId) throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
    return page;
  }

  async startHumanization(
    pageId: string,
    userId: string,
    options?: {
      forceRegenerate?: boolean;
      customInstructions?: string;
      targetNaturalness?: number;
      maxIterations?: number;
    }
  ) {
    const page = await this.getPageById(pageId, userId);

    // Concurrency / Duplicate check
    const activeJob = await jobRepository.findActiveByPageId(pageId);
    if (activeJob) {
      return {
        jobId: activeJob.id,
        status: activeJob.status,
        message: 'A humanization job is already running for this page.',
      };
    }

    // Create async job
    const job = await jobRepository.create({
      documentId: page.documentId,
      pageId,
      userId,
      jobType: 'PAGE_HUMANIZE',
      status: JobStatus.QUEUED,
      progressPercent: 0,
      currentStep: 'Humanization job queued',
    });

    setImmediate(() => {
      jobRunner.runPageHumanizeJob(job.id, pageId, userId, {
        forceRegenerate: options?.forceRegenerate,
        customInstructions: options?.customInstructions,
        targetScore: options?.targetNaturalness,
        maxIterations: options?.maxIterations,
      });
    });

    return {
      jobId: job.id,
      status: 'QUEUED',
      pageId,
    };
  }

  async getCandidates(pageId: string, userId: string) {
    await this.getPageById(pageId, userId);
    return candidateRepository.findByPageId(pageId);
  }

  async getReviewData(pageId: string, userId: string) {
    const page = await this.getPageById(pageId, userId);
    const versions = await versionRepository.findByPageId(pageId);
    const latestVersion = versions[0] || null;

    let activeCandidate = null;
    if (page.activeCandidateId) {
      activeCandidate = await candidateRepository.findById(page.activeCandidateId);
    }

    const diffPatch = latestVersion
      ? diff.createPatch(`page_${page.pageNumber}.txt`, page.originalText, latestVersion.text)
      : '';

    return {
      pageId: page.id,
      pageNumber: page.pageNumber,
      documentId: page.documentId,
      documentTitle: page.document.title,
      state: page.state,
      originalText: page.originalText,
      currentVersion: latestVersion,
      activeCandidate,
      diffPatch,
      domainConfidence: page.domainConfidence,
      selectedExperts: page.selectedExperts,
      totalIterations: page.totalIterations,
    };
  }

  async approvePage(pageId: string, userId: string, notes?: string) {
    const page = await this.getPageById(pageId, userId);

    if (page.state === PageState.APPROVED) {
      return {
        message: 'Page is already approved.',
        pageId,
        approved: true,
      };
    }

    let versions = await versionRepository.findByPageId(pageId);
    let latestVersion = versions[0];
    if (!latestVersion) {
      // Auto-create initial version from original text
      latestVersion = await versionRepository.create({
        pageId,
        userId,
        sourceType: SourceType.ORIGINAL,
        iterationNumber: 1,
        text: page.originalText,
        overallScore: 70,
        evaluationSummary: { note: 'Initial unhumanized version' } as any,
        diffFromOriginal: '',
      });
    }

    if (!isDatabaseConnected) {
      // 1. Create Approval record
      const approval = await approvalRepository.create({
        pageId,
        pageVersionId: latestVersion.id,
        userId,
        notes: notes || null,
      });

      // 2. Create APPROVED PageVersion copy
      const approvedVersion = await versionRepository.create({
        pageId,
        userId,
        candidateId: latestVersion.candidateId,
        sourceType: SourceType.APPROVED,
        iterationNumber: latestVersion.iterationNumber,
        text: latestVersion.text,
        overallScore: latestVersion.overallScore,
        evaluationSummary: latestVersion.evaluationSummary as any,
        diffFromOriginal: latestVersion.diffFromOriginal,
      });

      // 3. Update DocumentPage state to APPROVED
      await pageRepository.update(pageId, {
        state: PageState.APPROVED,
        currentApprovedVersionId: approvedVersion.id,
      });

      // 4. Update Document approved count
      const allPages = await pageRepository.findByDocumentId(page.documentId);
      const allApproved = allPages.filter((p) => p.state === PageState.APPROVED).length;

      await documentRepository.update(page.documentId, {
        approvedPages: allApproved,
      });

      // 5. Audit log
      await auditRepository.log({
        userId,
        documentId: page.documentId,
        pageId,
        action: 'PAGE_APPROVED',
        metadata: { pageNumber: page.pageNumber, versionId: approvedVersion.id },
      });

      return {
        success: true,
        approvalId: approval.id,
        pageId,
        pageNumber: page.pageNumber,
        state: PageState.APPROVED,
        approvedPagesCount: allApproved,
      };
    }

    // Execute atomic approval inside a database transaction
    return withTransaction(async (tx) => {
      // 1. Create Approval record
      const approval = await tx.approval.create({
        data: {
          pageId,
          pageVersionId: latestVersion.id,
          userId,
          notes: notes || null,
        },
      });

      // 2. Create APPROVED PageVersion copy
      const approvedVersion = await tx.pageVersion.create({
        data: {
          pageId,
          userId,
          candidateId: latestVersion.candidateId,
          sourceType: SourceType.APPROVED,
          iterationNumber: latestVersion.iterationNumber,
          text: latestVersion.text,
          overallScore: latestVersion.overallScore,
          evaluationSummary: latestVersion.evaluationSummary as any,
          diffFromOriginal: latestVersion.diffFromOriginal,
        },
      });

      // 3. Update DocumentPage state to APPROVED
      await tx.documentPage.update({
        where: { id: pageId },
        data: {
          state: PageState.APPROVED,
          currentApprovedVersionId: approvedVersion.id,
        },
      });

      // 4. Update Document approved count
      const allApproved = await tx.documentPage.count({
        where: { documentId: page.documentId, state: PageState.APPROVED },
      });

      await tx.document.update({
        where: { id: page.documentId },
        data: { approvedPages: allApproved },
      });

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          documentId: page.documentId,
          pageId,
          action: 'PAGE_APPROVED',
          metadata: { pageNumber: page.pageNumber, versionId: approvedVersion.id },
        },
      });

      return {
        success: true,
        approvalId: approval.id,
        pageId,
        pageNumber: page.pageNumber,
        state: PageState.APPROVED,
        approvedPagesCount: allApproved,
      };
    });
  }

  async editPage(pageId: string, userId: string, text: string, editSummary?: string) {
    const page = await this.getPageById(pageId, userId);

    // Validate hard gates on user edit (preserve numbers, citations, and placeholders)
    const provider = ProviderFactory.getProvider();
    const evaluator = new IndependentEvaluator(provider);
    const domain = (page.domainConfidence as any)?.primaryDomain || DomainType.GENERAL;

    const evalResult = await evaluator.evaluate(page.originalText, text, domain);

    const diffPatch = diff.createPatch(`page_${page.pageNumber}.txt`, page.originalText, text);

    // Store new version
    const newVersion = await versionRepository.create({
      pageId,
      userId,
      sourceType: SourceType.USER_EDITED,
      iterationNumber: page.totalIterations,
      text,
      overallScore: evalResult.overallWeightedScore,
      evaluationSummary: {
        scores: evalResult.scores,
        gates: evalResult.gates,
        summary: editSummary || 'User manual edits',
      } as any,
      diffFromOriginal: diffPatch,
    });

    await pageRepository.update(pageId, {
      state: PageState.EDITED,
    });

    await auditRepository.log({
      userId,
      documentId: page.documentId,
      pageId,
      action: 'PAGE_USER_EDITED',
      metadata: { versionId: newVersion.id, gatesPassed: evalResult.gates.allPassed },
    });

    return {
      version: newVersion,
      evaluation: evalResult,
      gatesPassed: evalResult.gates.allPassed,
    };
  }

  async getVersions(pageId: string, userId: string) {
    await this.getPageById(pageId, userId);
    return versionRepository.findByPageId(pageId);
  }
}

export const pageService = new PageService();
