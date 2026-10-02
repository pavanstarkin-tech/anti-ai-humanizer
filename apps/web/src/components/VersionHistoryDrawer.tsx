import React from 'react';
import { History, X, Check, Clock, User, Sparkles } from 'lucide-react';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: any[];
  onSelectVersion: (version: any) => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  onSelectVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '420px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-strong)',
      zIndex: 90,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
    }}>
      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Version History</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {versions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No version history recorded yet.</p>
        ) : (
          versions.map((ver, idx) => {
            const isApproved = ver.sourceType === 'APPROVED';
            const isUserEdit = ver.sourceType === 'USER_EDITED';
            const isAi = ver.sourceType === 'AI_GENERATED';

            return (
              <div
                key={ver.id}
                onClick={() => onSelectVersion(ver)}
                className="glass-card"
                style={{
                  padding: '14px',
                  cursor: 'pointer',
                  border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span className={`badge ${isApproved ? 'badge-success' : isUserEdit ? 'badge-info' : 'badge-warning'}`}>
                    {isApproved && <Check size={10} />}
                    {isUserEdit && <User size={10} />}
                    {isAi && <Sparkles size={10} />}
                    {ver.sourceType.replace('_', ' ')}
                  </span>
                  {ver.overallScore && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Score: {ver.overallScore.toFixed(1)}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {new Date(ver.createdAt).toLocaleTimeString()} • Iteration {ver.iterationNumber}
                </p>

                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {ver.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
