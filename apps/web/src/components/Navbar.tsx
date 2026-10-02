import React from 'react';
import { Sparkles, FileText, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigateHome }) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 24px'
    }}>
      <div className="flex-between" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div 
          onClick={onNavigateHome}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Humanize<span style={{ color: 'var(--accent-secondary)' }}>Pro</span>
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Domain-Aware Multi-Expert Humanization Platform
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.8rem',
            color: 'var(--success)'
          }}>
            <ShieldCheck size={14} />
            <span style={{ fontWeight: 600 }}>Hard Preservation Active</span>
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}>
                <UserIcon size={14} color="var(--accent-secondary)" />
                <span style={{ fontWeight: 600 }}>{user.name}</span>
              </div>

              <button 
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                title="Log Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
