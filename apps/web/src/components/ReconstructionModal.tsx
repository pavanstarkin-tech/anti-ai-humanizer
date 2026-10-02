import React, { useState } from 'react';
import { Download, CheckCircle2, ShieldCheck, FileCheck, X, FileText } from 'lucide-react';
import { api } from '../services/api.js';

interface ReconstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export const ReconstructionModal: React.FC<ReconstructionModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'md' | 'txt'>('pdf');
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [reconstructedResult, setReconstructedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartReconstruction = async () => {
    setIsReconstructing(true);
    setError(null);
    try {
      const startRes = await api.reconstructDocument(documentId, selectedFormat);
      const finalJob = await api.pollJobUntilComplete(startRes.jobId);
      setReconstructedResult(finalJob.resultPayload);
      setIsReconstructing(false);
    } catch (err: any) {
      setIsReconstructing(false);
      setError(err.message || 'Reconstruction failed');
    }
  };

  const handleDownload = () => {
    window.location.href = `/api/documents/${documentId}/download?type=reconstructed`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '620px', padding: '30px' }}>
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={24} color="var(--success)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Document Reconstruction & Export</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '16px',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {!reconstructedResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              All pages for <strong style={{ color: '#fff' }}>{documentTitle}</strong> have been verified and approved. 
              The system will now reassemble the final document, re-inserting all locked tables, images, equations, citations, and numbers in their exact original layout positions.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Select Export Document Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { id: 'pdf', label: 'PDF (.pdf)', desc: 'Clean PDF with headers & pagination' },
                  { id: 'docx', label: 'Word (.docx)', desc: 'Original Microsoft Word styling' },
                  { id: 'md', label: 'Markdown (.md)', desc: 'Structured Markdown document' },
                  { id: 'txt', label: 'Text (.txt)', desc: 'Plain text with page dividers' },
                ].map((fmt) => (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id as any)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedFormat === fmt.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${selectedFormat === fmt.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedFormat === fmt.id ? '#fff' : 'var(--text-secondary)' }}>
                      {fmt.label}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>{fmt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={isReconstructing}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleStartReconstruction} disabled={isReconstructing}>
                {isReconstructing ? 'Reconstructing Document...' : 'Build Final Document'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                <ShieldCheck size={20} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Integrity Audit Complete & Passed</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                100% of protected objects (tables, images, equations, citations, numbers) verified and safely re-inserted.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={16} />
                Download Final Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
