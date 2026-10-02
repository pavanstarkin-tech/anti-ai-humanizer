import React, { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle2, Clock, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import { UploadModal } from '../components/UploadModal.js';

interface DashboardPageProps {
  onOpenWorkspace: (documentId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenWorkspace }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await api.listDocuments();
      setDocuments(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to list documents:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document and all its page history?')) {
      try {
        await api.deleteDocument(docId);
        fetchDocuments();
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  return (
    <div className="app-container">
      {/* Top Banner */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Document Workspace</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
            Transform documents with domain-aware routing, independent property evaluations, and page-by-page human-in-the-loop review.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
          <Plus size={18} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Documents
          </span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '6px' }}>{documents.length}</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Active Documents
          </span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '6px' }}>
            {documents.filter((d) => d.status === 'IN_PROGRESS' || d.status === 'PARSING').length}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Completed & Reconstructed
          </span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', marginTop: '6px' }}>
            {documents.filter((d) => d.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Your Documents</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card" style={{ padding: '50px 20px', textAlign: 'center' }}>
            <FileText size={48} color="var(--accent-primary)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No documents uploaded yet</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '8px auto 20px' }}>
              Upload your research report, clinical study, or technical documentation to start page-aware humanization.
            </p>
            <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
              <Plus size={16} />
              <span>Upload Your First Document</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {documents.map((doc) => {
              const isCompleted = doc.status === 'COMPLETED';
              const progressPct = doc.totalPages > 0 ? Math.round((doc.approvedPages / doc.totalPages) * 100) : 0;

              return (
                <div
                  key={doc.id}
                  className="glass-card"
                  onClick={() => onOpenWorkspace(doc.id)}
                  style={{
                    padding: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div className="flex-between" style={{ marginBottom: '10px' }}>
                      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-info'}`}>
                        {doc.status}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                      {doc.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {doc.originalFilename} • {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div>
                    <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Page Approvals</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {doc.approvedPages} of {doc.totalPages} ({progressPct}%)
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progressPct}%`,
                          background: isCompleted ? 'var(--success)' : 'var(--accent-gradient)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                      Open Review <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(doc) => {
          fetchDocuments();
          onOpenWorkspace(doc.id);
        }}
      />
    </div>
  );
};
