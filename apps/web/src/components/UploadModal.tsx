import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (document: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgressStep('Uploading document securely...');

    try {
      const uploadRes = await api.uploadDocument(file, title.trim() || undefined);
      setProgressStep('Parsing pages and isolating protected tables, images, and citations...');

      // Poll parsing job
      const completedJob = await api.pollJobUntilComplete(uploadRes.jobId, (job) => {
        if (job.currentStep) setProgressStep(job.currentStep);
      });

      setIsUploading(false);
      onUploadSuccess(uploadRes.document);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'Upload and parsing failed.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '580px', padding: '30px' }}>
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Upload Document</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Document Title
            </label>
            <input
              type="text"
              placeholder="e.g. Clinical Study Trial Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Document File (DOCX, PDF, Markdown, TXT)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt,.md,.json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <UploadCloud size={36} color="var(--accent-primary)" style={{ margin: '0 auto 10px' }} />
              {file ? (
                <div>
                  <p style={{ fontWeight: 700, color: '#fff' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Click or drag & drop document here
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supported: DOCX, PDF, TXT, Markdown (Max 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: '100%', background: 'var(--accent-gradient)' }} className="pulse-active" />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-secondary)' }}>{progressStep}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading || !file}
            >
              {isUploading ? 'Processing...' : 'Upload & Parse Pages'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
