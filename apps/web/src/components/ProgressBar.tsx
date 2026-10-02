import React from 'react';
import { Check, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProgressBarProps {
  totalPages: number;
  approvedPages: number;
  currentPageNumber: number;
  pages: any[];
  onSelectPage: (page: any) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalPages,
  approvedPages,
  currentPageNumber,
  pages,
  onSelectPage,
}) => {
  const percent = totalPages > 0 ? Math.round((approvedPages / totalPages) * 100) : 0;
  const remainingPages = totalPages - approvedPages;

  return (
    <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Progress Header Statistics */}
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOCUMENT WORKSPACE PROGRESS</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
            Page {currentPageNumber} of {totalPages}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPROVED</span>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>{approvedPages}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT</span>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{currentPageNumber}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>REMAINING</span>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{remainingPages}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: 'var(--accent-gradient)',
            borderRadius: '4px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Page Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
        {pages.map((p) => {
          const isCurrent = p.pageNumber === currentPageNumber;
          const isApproved = p.state === 'APPROVED';
          const isReady = p.state === 'READY_FOR_REVIEW' || p.state === 'EDITED';
          const isFailed = p.state === 'FAILED';

          let bg = 'rgba(255, 255, 255, 0.04)';
          let border = 'var(--border-subtle)';
          let textColor = 'var(--text-secondary)';

          if (isApproved) {
            bg = 'rgba(16, 185, 129, 0.15)';
            border = 'rgba(16, 185, 129, 0.4)';
            textColor = 'var(--success)';
          } else if (isCurrent) {
            bg = 'rgba(99, 102, 241, 0.25)';
            border = 'var(--accent-primary)';
            textColor = '#fff';
          } else if (isReady) {
            bg = 'rgba(56, 189, 248, 0.15)';
            border = 'rgba(56, 189, 248, 0.4)';
            textColor = 'var(--info)';
          } else if (isFailed) {
            bg = 'rgba(239, 68, 68, 0.15)';
            border = 'rgba(239, 68, 68, 0.4)';
            textColor = 'var(--danger)';
          }

          return (
            <button
              key={p.id}
              onClick={() => onSelectPage(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: bg,
                border: `1px solid ${border}`,
                color: textColor,
                fontSize: '0.82rem',
                fontWeight: isCurrent ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isApproved && <Check size={12} />}
              {isReady && !isApproved && <Clock size={12} />}
              {isFailed && <AlertTriangle size={12} />}
              <span>Page {p.pageNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
