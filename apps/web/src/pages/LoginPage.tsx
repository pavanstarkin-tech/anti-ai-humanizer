import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { api } from '../services/api.js';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@humanizer.ai');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('Dr. Alex Morgan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({ email, password, name });
        onLoginSuccess(res.user);
      } else {
        const res = await api.login({ email, password });
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
            marginBottom: '16px'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Humanize<span style={{ color: 'var(--accent-secondary)' }}>Pro</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Domain-Aware Multi-Expert Humanization Platform
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="author@organization.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In to Workspace'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
