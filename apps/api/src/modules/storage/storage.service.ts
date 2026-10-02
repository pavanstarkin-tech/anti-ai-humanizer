import fs from 'fs';
import path from 'path';
import { ENV } from '../../config/env.js';

export class StorageService {
  private baseDir: string;

  constructor(baseDir = ENV.STORAGE_PATH) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public getDocumentDir(documentId: string): string {
    const docDir = path.join(this.baseDir, 'documents', documentId);
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    return docDir;
  }

  public getReconstructedDir(documentId: string): string {
    const recDir = path.join(this.baseDir, 'reconstructed', documentId);
    if (!fs.existsSync(recDir)) {
      fs.mkdirSync(recDir, { recursive: true });
    }
    return recDir;
  }

  public sanitizeFilename(filename: string): string {
    return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  public saveFile(documentId: string, filename: string, buffer: Buffer): string {
    const safeName = this.sanitizeFilename(filename);
    const destDir = this.getDocumentDir(documentId);
    const filePath = path.join(destDir, safeName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  public deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export const storageService = new StorageService();
