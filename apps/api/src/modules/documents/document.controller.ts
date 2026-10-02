import { Response, NextFunction } from 'express';
import { documentService } from './document.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import fs from 'fs';
import path from 'path';

export class DocumentController {
  async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'FILE_REQUIRED', message: 'No document file uploaded.' },
        });
        return;
      }

      const result = await documentService.uploadDocument(
        req.user!.id,
        req.file,
        req.body.title
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docs = await documentService.listDocuments(req.user!.id);
      res.status(200).json({
        success: true,
        data: docs,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.getDocument(req.params.documentId, req.user!.id);
      res.status(200).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async reconstruct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentService.triggerReconstruction(
        req.params.documentId,
        req.user!.id,
        req.body.format || 'docx'
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async download(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.getDocument(req.params.documentId, req.user!.id);
      const isReconstructed = req.query.type === 'reconstructed';
      const targetPath = isReconstructed ? doc.reconstructedPath : doc.filePath;

      if (!targetPath || !fs.existsSync(targetPath)) {
        res.status(404).json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: 'Requested file is not available.' },
        });
        return;
      }

      const downloadName = isReconstructed
        ? `${doc.title}_humanized${path.extname(targetPath)}`
        : doc.originalFilename;

      res.download(targetPath, downloadName);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentService.deleteDocument(req.params.documentId, req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();
