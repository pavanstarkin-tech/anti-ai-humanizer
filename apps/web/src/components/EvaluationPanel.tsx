import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle, Sparkles, Award } from 'lucide-react';

interface EvaluationPanelProps {
  evaluation: any;
  iterationNumber?: number;
  selectedExperts?: string[];
  domainName?: string;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  evaluation,
  iterationNumber = 1,
  selectedExperts = [],
  domainName = 'GENERAL',
}) => {
  if (!evaluation || !evaluation.scores) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No evaluation available. Initiate humanization to inspect independent property scores.</p>
      </div>
    );
  }

  const { scores, gates, feedback, overallWeightedScore } = evaluation;

  const scoreItems = [
    { label: 'Naturalness', value: scores.naturalness, isGate: false, weight: '25%' },
    { label: 'Clarity', value: scores.clarity, isGate: false, weight: '15%' },
    { label: 'Sentence Variety', value: scores.sentenceVariety, isGate: false, weight: '10%' },
    { label: 'Repetition Reduction', value: scores.repetitionReduction, isGate: false, weight: '10%' },
    { label: 'Style Consistency', value: scores.styleConsistency, isGate: false, weight: '10%' },
    { label: 'Meaning Preservation', value: scores.meaningPreservation, isGate: true, weight: '15%' },
    { label: 'Factual Consistency', value: scores.factualConsistency, isGate: true, weight: '10%' },
    { label: 'Terminology Preservation', value: scores.terminologyPreservation, isGate: true, weight: '5%' },
    { label: 'Citation Preservation', value: scores.citationPreservation, isGate: true, weight: 'Gate' },
    { label: 'Protected Element Integrity', value: scores.protectedElementIntegrity, isGate: true, weight: 'Gate' },
  ];

  const getScoreColor = (val: number, isGate: boolean) => {
    if (isGate && val < 85) return 'var(--danger)';
    if (val >= 85) return 'var(--success)';
    if (val >= 75) return 'var(--info)';
    return 'var(--warning)';
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Overall Score & Gates */}
      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            Audited Quality Score
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {overallWeightedScore?.toFixed(1) || scores.naturalness}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>/ 100</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            Preservation Gate Status
          </span>
          <div style={{ marginTop: '6px' }}>
            {gates?.allPassed ? (
              <span className="badge badge-success">
                <ShieldCheck size={14} /> All Gates Passed
              </span>
            ) : (
              <span className="badge badge-danger">
                <ShieldAlert size={14} /> Gate Violation
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta tags: Domain, Experts, Iterations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span className="badge badge-info">Domain: {domainName}</span>
        {selectedExperts.map((exp, idx) => (
          <span key={idx} className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            Expert: {exp}
          </span>
        ))}
        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
          Iteration {iterationNumber}
        </span>
      </div>

      {/* 10 Independent Score Bars */}
      <div>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          10 Independent Property Evaluations
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scoreItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: item.isGate ? '#e2e8f0' : 'var(--text-secondary)' }}>
                  {item.isGate && <span style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem' }}>🔒</span>}
                  {item.label}
                </span>
                <span style={{ fontWeight: 700, color: getScoreColor(item.value, item.isGate) }}>
                  {item.value} / 100
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, item.value))}%`,
                    background: getScoreColor(item.value, item.isGate),
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses Feedback */}
      {feedback && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Key Strengths
              </span>
              <ul style={{ listStyle: 'none', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {feedback.strengths.map((str: string, i: number) => (
                  <li key={i} style={{ marginBottom: '2px' }}>• {str}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.actionableFixes && feedback.actionableFixes.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> Auditor Feedback & Actions
              </span>
              <ul style={{ listStyle: 'none', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {feedback.actionableFixes.map((fix: string, i: number) => (
                  <li key={i} style={{ marginBottom: '2px' }}>• {fix}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
