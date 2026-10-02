import { DocumentStatus, JobStatus } from '@humanizer/shared';
import { documentRepository } from '../../database/repositories/document.repository.js';
import { jobRepository } from '../../database/repositories/job.repository.js';
import { auditRepository } from '../../database/repositories/audit.repository.js';
import { storageService } from '../storage/storage.service.js';
import { jobRunner } from '../jobs/job.runner.js';
import { randomUUID } from 'crypto';

export class DocumentService {
  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    title?: string
  ) {
    const documentId = randomUUID();
    const docTitle = title || file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    // Save uploaded file buffer to secure storage path
    const savedPath = storageService.saveFile(documentId, file.originalname, file.buffer);

    // Create document record
    const document = await documentRepository.create({
      userId,
      title: docTitle,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: savedPath,
      status: DocumentStatus.PARSING,
    });

    // Create async parsing job
    const job = await jobRepository.create({
      documentId: document.id,
      userId,
      jobType: 'DOCUMENT_PARSE',
      status: JobStatus.QUEUED,
      progressPercent: 0,
      currentStep: 'Parsing queued',
    });

    // Launch parse job asynchronously (non-blocking)
    setImmediate(() => {
      jobRunner.runDocumentParseJob(job.id, document.id, userId);
    });

    await auditRepository.log({
      userId,
      documentId: document.id,
      action: 'DOCUMENT_UPLOADED',
      metadata: { originalFilename: file.originalname, size: file.size },
    });

    return {
      document,
      jobId: job.id,
    };
  }

  async listDocuments(userId: string) {
    return documentRepository.findByUserId(userId);
  }

  async getDocument(documentId: string, userId: string) {
    const doc = await documentRepository.findById(documentId, true);
    if (!doc) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Document not found.' };
    }
    if (doc.userId !== userId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to this document.' };
    }
    return doc;
  }

  async triggerReconstruction(documentId: string, userId: string, format = 'docx') {
    const doc = await documentRepository.findById(documentId, true);
    if (!doc) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Document not found.' };
    }
    if (doc.userId !== userId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to this document.' };
    }

    // Verify all pages are APPROVED
    const unapproved = doc.pages.filter((p: any) => p.state !== 'APPROVED');
    if (unapproved.length > 0) {
      throw {
        statusCode: 400,
        code: 'PAGES_NOT_APPROVED',
        message: `Cannot reconstruct document. ${unapproved.length} page(s) still require approval.`,
        details: { unapprovedPageNumbers: unapproved.map((p: any) => p.pageNumber) },
      };
    }

    const job = await jobRepository.create({
      documentId,
      userId,
      jobType: 'DOCUMENT_RECONSTRUCT',
      status: JobStatus.QUEUED,
      progressPercent: 0,
      currentStep: 'Reconstruction queued',
    });

    setImmediate(() => {
      jobRunner.runDocumentReconstructJob(job.id, documentId, userId, format);
    });

    return {
      jobId: job.id,
      status: 'QUEUED',
    };
  }

  async deleteDocument(documentId: string, userId: string) {
    const doc = await this.getDocument(documentId, userId);
    await documentRepository.delete(documentId);
    storageService.deleteFile(doc.filePath);
    if (doc.reconstructedPath) {
      storageService.deleteFile(doc.reconstructedPath);
    }
    return { deleted: true };
  }
}

export const documentService = new DocumentService();
