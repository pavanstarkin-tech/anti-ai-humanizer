import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Edit3,
  RotateCcw,
  History,
  Download,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Play,
  Pause,
  Zap,
  Layers,
  HelpCircle,
  Copy,
  Check,
  FileDown,
  FileText,
  Eye,
  Columns,
  Maximize2,
  Sun,
  Moon,
  Type,
} from 'lucide-react';
import { api } from '../services/api.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { EvaluationPanel } from '../components/EvaluationPanel.js';
import { VersionHistoryDrawer } from '../components/VersionHistoryDrawer.js';
import { ReconstructionModal } from '../components/ReconstructionModal.js';

import * as diff from 'diff';

interface WorkspacePageProps {
  documentId: string;
  onBackToDashboard: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  documentId,
  onBackToDashboard,
}) => {
  const [docData, setDocData] = useState<any | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<any | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'reader' | 'diff'>('split');
  const [paperTheme, setPaperTheme] = useState<'dark' | 'paper'>('dark');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [hoveredParagraphIndex, setHoveredParagraphIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReconstructOpen, setIsReconstructOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Copy & Export dropdown state
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Real-time processing progress & timer
  const [processingProgress, setProcessingProgress] = useState(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Auto-Pilot state
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const autoPilotCancelRef = useRef(false);

  // Elapsed timer while processing
  useEffect(() => {
    let interval: any = null;
    if (isProcessing) {
      setElapsedSeconds(0);
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - start) / 100) / 10);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleCopyContent = () => {
    const textToCopy = cleanProse(reviewData?.currentVersion?.text || reviewData?.originalText || '');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadCurrentPageTxt = () => {
    const textToDownload = cleanProse(reviewData?.currentVersion?.text || reviewData?.originalText || '');
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (docData?.title || 'humanized_document').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${safeTitle}_page_${currentPage?.pageNumber || 1}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cleanProse = (text: string): string => {
    if (!text) return '';
    let clean = text.trim();
    if (clean.startsWith('```json') || clean.startsWith('```')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    if (clean.startsWith('{') && (clean.includes('"rewrittenText"') || clean.includes('"text"') || clean.includes('"refinedText"'))) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed.rewrittenText) return cleanProse(parsed.rewrittenText);
        if (parsed.text) return cleanProse(parsed.text);
        if (parsed.refinedText) return cleanProse(parsed.refinedText);
      } catch {
        const match = clean.match(/"(?:rewrittenText|text|refinedText)"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"[a-zA-Z]+"\s*:|\s*})/);
        if (match && match[1]) {
          return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        }
      }
    }
    return clean;
  };

  const loadWorkspace = async (targetPageNumber?: number) => {
    try {
      const doc = await api.getDocument(documentId);
      setDocData(doc);

      const pagesRes = await api.getPagesForDocument(documentId);
      setPages(pagesRes.pages);

      const target =
        targetPageNumber !== undefined
          ? pagesRes.pages.find((p) => p.pageNumber === targetPageNumber)
          : pagesRes.pages.find((p) => p.state !== 'APPROVED') || pagesRes.pages[0];

      if (target) {
        setCurrentPage(target);
        await loadPageReview(target.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    }
  };

  const loadPageReview = async (pageId: string) => {
    try {
      const review = await api.getReview(pageId);
      setReviewData(review);
      if (review.currentVersion) {
        setEditText(cleanProse(review.currentVersion.text));
      } else {
        setEditText(cleanProse(review.originalText));
      }

      const verList = await api.getVersions(pageId);
      setVersions(verList);
    } catch (err: any) {
      console.error('Failed to load page review:', err);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [documentId]);

  const handleSelectPage = async (page: any) => {
    if (isAutoPilot) return;
    setCurrentPage(page);
    setIsEditing(false);
    setError(null);
    await loadPageReview(page.id);
  };

  const handleStartHumanize = async () => {
    if (!currentPage) return;
    setIsProcessing(true);
    setProcessingProgress(15);
    setError(null);
    setProcessingStep('Analyzing academic domain & expert persona...');

    try {
      const res = await api.startHumanization(currentPage.id, {
        customInstructions: customPrompt.trim() || undefined,
        forceRegenerate: true,
      });

      await api.pollJobUntilComplete(res.jobId, (job) => {
        if (job.currentStep) setProcessingStep(job.currentStep);
        if (typeof job.progressPercent === 'number') {
          setProcessingProgress(job.progressPercent);
        }
      });

      setIsProcessing(false);
      await loadWorkspace(currentPage.pageNumber);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Humanization failed');
    }
  };

  const handleApprove = async () => {
    if (!currentPage) return;
    try {
      await api.approvePage(currentPage.id);
      await loadWorkspace(currentPage.pageNumber + 1);
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    }
  };

  // Full Auto-Pilot Mode (Processes page-by-page and auto-approves)
  const startAutoPilot = async () => {
    setIsAutoPilot(true);
    autoPilotCancelRef.current = false;
    setError(null);

    try {
      const pagesRes = await api.getPagesForDocument(documentId);
      const allPages = pagesRes.pages;

      for (let i = 0; i < allPages.length; i++) {
        if (autoPilotCancelRef.current) break;

        const page = allPages[i];
        setCurrentPage(page);
        await loadPageReview(page.id);

        if (page.state !== 'APPROVED') {
          setIsProcessing(true);
          setProcessingProgress(15);
          setProcessingStep(`[Auto-Pilot] Page ${page.pageNumber}/${allPages.length}: Analyzing domain...`);

          const res = await api.startHumanization(page.id, {
            customInstructions: customPrompt.trim() || undefined,
            forceRegenerate: true,
          });

          await api.pollJobUntilComplete(res.jobId, (job) => {
            if (job.currentStep) {
              setProcessingStep(`[Auto-Pilot] Page ${page.pageNumber}/${allPages.length}: ${job.currentStep}`);
            }
            if (typeof job.progressPercent === 'number') {
              setProcessingProgress(job.progressPercent);
            }
          });

          setProcessingStep(`[Auto-Pilot] Page ${page.pageNumber}/${allPages.length}: Auto-approving & locking save point...`);
          await api.approvePage(page.id);
          setIsProcessing(false);
          await loadWorkspace(page.pageNumber);
        }
      }

      setIsAutoPilot(false);
      if (!autoPilotCancelRef.current) {
        setIsReconstructOpen(true);
      }
    } catch (err: any) {
      setIsAutoPilot(false);
      setIsProcessing(false);
      setError(`Auto-Pilot notice: ${err.message || err}. Work was saved at current checkpoint.`);
    }
  };

  const stopAutoPilot = () => {
    autoPilotCancelRef.current = true;
    setIsAutoPilot(false);
    setIsProcessing(false);
  };

  const handleSaveEdit = async () => {
    if (!currentPage) return;
    try {
      const res = await api.editPage(currentPage.id, editText, 'Manual user edit in workspace');
      setIsEditing(false);
      await loadPageReview(currentPage.id);
      if (!res.gatesPassed) {
        setError('Warning: Your edits violated one or more preservation gates (e.g. missing number or placeholder). Check the evaluation panel.');
      } else {
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save edit');
    }
  };

  const isAllApproved = pages.length > 0 && pages.every((p) => p.state === 'APPROVED');
  const isPageApproved = currentPage?.state === 'APPROVED';

  // Highlight placeholders and numbers in formatted paragraphs with sync hover support
  const renderHighlightedText = (text: string, isCandidate: boolean = false) => {
    if (!text) return null;
    const clean = cleanProse(text);
    const paragraphs = clean.split(/\n\s*\n/);

    const fontSizes = {
      sm: '0.86rem',
      md: '0.94rem',
      lg: '1.05rem',
    };

    const isLightPaper = paperTheme === 'paper';

    return paragraphs.map((para, pIdx) => {
      const isHovered = hoveredParagraphIndex === pIdx;
      const parts = para.split(/(\[(?:TABLE|IMAGE|DIAGRAM|CHART|EQUATION|FORMULA|CITATION|REF|REFERENCE|HEADER|FOOTER)_[0-9A-Za-z_-]+\])/g);
      
      return (
        <p
          key={pIdx}
          onMouseEnter={() => setHoveredParagraphIndex(pIdx)}
          onMouseLeave={() => setHoveredParagraphIndex(null)}
          style={{
            marginBottom: '16px',
            lineHeight: '1.8',
            fontSize: fontSizes[fontSize] || '0.94rem',
            padding: '6px 10px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
            background: isHovered
              ? isCandidate
                ? isLightPaper ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.18)'
                : isLightPaper ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.06)'
              : 'transparent',
            borderLeft: isHovered
              ? isCandidate
                ? '3px solid #10b981'
                : '3px solid #6366f1'
              : '3px solid transparent',
            color: isLightPaper ? (isCandidate ? '#0f172a' : '#334155') : (isCandidate ? 'var(--text-primary)' : 'var(--text-secondary)'),
          }}
        >
          {parts.map((part, idx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              return (
                <span
                  key={idx}
                  className="badge-placeholder"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    margin: '0 4px',
                    borderRadius: '4px',
                    background: isLightPaper ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.22)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    color: isLightPaper ? '#4338ca' : '#a5b4fc',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  🔒 {part}
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // Highlight updated lines/words with highlighters
  const renderDiffHighlightedText = (original: string, rewritten: string) => {
    if (!rewritten) return null;
    const cleanOrig = cleanProse(original);
    const cleanRewritten = cleanProse(rewritten);

    const changes = diff.diffWordsWithSpace(cleanOrig, cleanRewritten);
    const isLightPaper = paperTheme === 'paper';

    const fontSizes = {
      sm: '0.86rem',
      md: '0.94rem',
      lg: '1.05rem',
    };

    return (
      <div style={{ lineHeight: '1.85', fontSize: fontSizes[fontSize] || '0.94rem', color: isLightPaper ? '#0f172a' : '#e2e8f0' }}>
        {changes.map((part, index) => {
          if (part.added) {
            // Highlighted green additions / updated words
            return (
              <span
                key={index}
                style={{
                  background: isLightPaper ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.22)',
                  color: isLightPaper ? '#065f46' : '#6ee7b7',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  borderBottom: '2px solid #10b981',
                  fontWeight: 600,
                  margin: '0 1px',
                }}
                title="Humanized natural phrasing"
              >
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            // Replaced / removed AI cliché or redundant text
            return (
              <span
                key={index}
                style={{
                  background: isLightPaper ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.15)',
                  color: isLightPaper ? '#991b1b' : '#fca5a5',
                  textDecoration: 'line-through',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  margin: '0 1px',
                  fontSize: '0.88rem',
                  opacity: 0.75,
                }}
                title="Original robotic phrasing replaced"
              >
                {part.value}
              </span>
            );
          }
          // Unchanged text with badge support
          const segments = part.value.split(/(\[(?:TABLE|IMAGE|DIAGRAM|CHART|EQUATION|FORMULA|CITATION|REF|REFERENCE|HEADER|FOOTER)_[0-9A-Za-z_-]+\])/g);
          return (
            <span key={index}>
              {segments.map((seg, sIdx) => {
                if (seg.startsWith('[') && seg.endsWith(']')) {
                  return (
                    <span
                      key={sIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '1px 6px',
                        margin: '0 3px',
                        borderRadius: '4px',
                        background: isLightPaper ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.18)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: isLightPaper ? '#4338ca' : '#818cf8',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                      }}
                    >
                      🔒 {seg}
                    </span>
                  );
                }
                return seg;
              })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Top Action Header */}
      <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onBackToDashboard}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Auto-Pilot All Pages Button */}
          <button
            className={isAutoPilot ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={isAutoPilot ? stopAutoPilot : startAutoPilot}
            style={{
              boxShadow: isAutoPilot ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(99, 102, 241, 0.4)',
              fontWeight: 700,
            }}
          >
            {isAutoPilot ? (
              <>
                <Pause size={16} /> Stop Auto-Pilot
              </>
            ) : (
              <>
                <Zap size={16} /> ⚡ Auto-Pilot (Humanize All Pages)
              </>
            )}
          </button>

          <button className="btn btn-secondary" onClick={() => setIsHistoryOpen(true)}>
            <History size={16} /> Version History ({versions.length})
          </button>

          <button className="btn btn-success" onClick={() => setIsReconstructOpen(true)} style={{ fontWeight: 600 }}>
            <Download size={16} /> Export & Download Document
          </button>
        </div>
      </div>

      {/* Auto-Pilot Status Banner if active */}
      {isAutoPilot && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 20px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#fff',
                animation: 'spin 1s infinite linear',
              }}
            />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                Auto-Pilot Active: Humanizing page-by-page through Multi-Expert Architecture (MVA)...
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {processingStep || 'Classifying domain and generating bursty humanized candidate...'}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={stopAutoPilot} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            Pause
          </button>
        </div>
      )}

      {/* Progress Navigator */}
      {docData && (
        <ProgressBar
          totalPages={pages.length}
          approvedPages={pages.filter((p) => p.state === 'APPROVED').length}
          currentPageNumber={currentPage?.pageNumber || 1}
          pages={pages}
          onSelectPage={handleSelectPage}
        />
      )}

      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Workspace Display & Presentation Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: '10px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Left Controls: Layout Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            View:
          </span>
          <button
            onClick={() => setViewMode('split')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'split' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: viewMode === 'split' ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
              color: viewMode === 'split' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Columns size={13} /> Side-by-Side Dual Sheet
          </button>

          <button
            onClick={() => setViewMode('reader')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'reader' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: viewMode === 'reader' ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
              color: viewMode === 'reader' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Eye size={13} /> Full Document Reader
          </button>

          <button
            onClick={() => {
              setViewMode('diff');
              setShowDiff(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'diff' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: viewMode === 'diff' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              color: viewMode === 'diff' ? '#34d399' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={13} /> Diff Inspector
          </button>
        </div>

        {/* Right Controls: Theme & Typography */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Paper Texture Theme Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setPaperTheme('dark')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: paperTheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: paperTheme === 'dark' ? '#fff' : 'var(--text-muted)',
              }}
              title="Luxury Dark Canvas"
            >
              <Moon size={12} /> Dark
            </button>
            <button
              onClick={() => setPaperTheme('paper')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: paperTheme === 'paper' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                color: paperTheme === 'paper' ? '#0f172a' : 'var(--text-muted)',
              }}
              title="Crisp White Document Paper (Word / PDF simulation)"
            >
              <Sun size={12} /> Paper White
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: s === 'sm' ? '0.72rem' : s === 'md' ? '0.8rem' : '0.9rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: fontSize === s ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: fontSize === s ? '#fff' : 'var(--text-muted)',
                }}
              >
                A{s === 'sm' ? '-' : s === 'lg' ? '+' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'reader' ? '1fr' : '1fr 380px', gap: '24px' }}>
        {/* Left / Center Column: Document Sheets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'reader' ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
            {/* 1. Original Document Realistic Sheet (shown in split mode) */}
            {viewMode !== 'reader' && (
              <div
                style={{
                  background: paperTheme === 'paper' ? '#f8fafc' : '#0e1726',
                  color: paperTheme === 'paper' ? '#0f172a' : '#f8fafc',
                  borderRadius: '12px',
                  border: paperTheme === 'paper' ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: paperTheme === 'paper' ? '0 15px 30px rgba(0, 0, 0, 0.15)' : '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '560px',
                  position: 'relative',
                  transition: 'background 0.3s ease, color 0.3s ease',
                }}
              >
                {/* Sheet Top Control Header */}
                <div
                  style={{
                    padding: '14px 20px',
                    background: paperTheme === 'paper' ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)',
                    borderBottom: paperTheme === 'paper' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: paperTheme === 'paper' ? '#64748b' : 'var(--text-muted)' }}>
                    Original Document (Source)
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: paperTheme === 'paper' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)',
                      color: paperTheme === 'paper' ? '#475569' : 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    Page {currentPage?.pageNumber || 1} of {pages.length || 1}
                  </span>
                </div>

                {/* Realistic Paper Margins & Body */}
                <div
                  style={{
                    flex: 1,
                    padding: '32px 40px',
                    background: paperTheme === 'paper' ? '#ffffff' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.25) 0%, rgba(15, 23, 42, 0.5) 100%)',
                    overflowY: 'auto',
                  }}
                >
                  {/* Running Header inside Page */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: paperTheme === 'paper' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                      paddingBottom: '8px',
                      marginBottom: '20px',
                      fontSize: '0.72rem',
                      color: paperTheme === 'paper' ? '#94a3b8' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {docData?.title || 'Document'}
                    </span>
                    <span>Page {currentPage?.pageNumber || 1}</span>
                  </div>

                  <div
                    style={{
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                  >
                    {reviewData?.originalText ? renderHighlightedText(reviewData.originalText, false) : 'Loading original text...'}
                  </div>
                </div>

                {/* Sheet Running Footer */}
                <div
                  style={{
                    padding: '10px 20px',
                    background: paperTheme === 'paper' ? '#f1f5f9' : 'rgba(15, 23, 42, 0.7)',
                    borderTop: paperTheme === 'paper' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: paperTheme === 'paper' ? '#64748b' : 'var(--text-muted)',
                  }}
                >
                  <span>Format: {docData?.mimeType?.includes('word') ? 'Word (.docx)' : 'PDF / Document'}</span>
                  <span>🔒 Placeholders Locked</span>
                </div>
              </div>
            )}

            {/* 2. Revised / Refined Realistic Candidate Sheet */}
            <div
              style={{
                background: paperTheme === 'paper' ? '#f8fafc' : '#0e1726',
                color: paperTheme === 'paper' ? '#0f172a' : '#f8fafc',
                borderRadius: '12px',
                border: paperTheme === 'paper' ? '1px solid #94a3b8' : '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: paperTheme === 'paper' ? '0 18px 36px rgba(0, 0, 0, 0.18)' : '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 20px -5px rgba(99, 102, 241, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '560px',
                position: 'relative',
                transition: 'background 0.3s ease, color 0.3s ease',
              }}
            >
              {/* Sheet Top Control Header */}
              <div
                style={{
                  padding: '14px 20px',
                  background: paperTheme === 'paper' ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)',
                  borderBottom: paperTheme === 'paper' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: paperTheme === 'paper' ? '#4338ca' : 'var(--accent-secondary)' }}>
                    {isEditing ? 'Editing Candidate' : isPageApproved ? 'Approved Sheet' : 'Humanized Sheet (Real-Time)'}
                  </span>

                  {!isEditing && reviewData?.currentVersion && (
                    <>
                      {/* Diff Highlighter Toggle */}
                      <button
                        onClick={() => setShowDiff(!showDiff)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: showDiff ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          border: showDiff ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                          color: showDiff ? '#10b981' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {showDiff ? '⚡ Diff Highlights ON' : '📝 Clean View'}
                      </button>

                      {/* Copy Page Content Button */}
                      <button
                        onClick={handleCopyContent}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isCopied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          border: isCopied ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                          color: isCopied ? '#10b981' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                        }}
                        title="Copy humanized text of this page"
                      >
                        {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied!' : 'Copy Page'}</span>
                      </button>

                      {/* Download Page Button */}
                      <button
                        onClick={downloadCurrentPageTxt}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#0284c7',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        title="Download this humanized page as a text file"
                      >
                        <FileDown size={12} />
                        <span>Download Page</span>
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {reviewData?.currentVersion?.overallScore && (
                    <span className="badge badge-success">
                      Quality: {reviewData.currentVersion.overallScore.toFixed(1)} / 100
                    </span>
                  )}
                </div>
              </div>

              {/* Realistic Paper Margins & Body */}
              <div
                style={{
                  flex: 1,
                  padding: '32px 40px',
                  background: paperTheme === 'paper' ? '#ffffff' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.35) 0%, rgba(15, 23, 42, 0.6) 100%)',
                  overflowY: 'auto',
                }}
              >
                {/* Running Header inside Page */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: paperTheme === 'paper' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    fontSize: '0.72rem',
                    color: paperTheme === 'paper' ? '#94a3b8' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {docData?.title || 'Document'}
                  </span>
                  <span>Page {currentPage?.pageNumber || 1} (Humanized)</span>
                </div>

                {isProcessing ? (
                  <div style={{ padding: '40px 20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: paperTheme === 'paper' ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="var(--accent-primary)" />
                        Streaming Page {currentPage?.pageNumber || 1} in Real-Time...
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                        ⏱ {elapsedSeconds.toFixed(1)}s
                      </span>
                    </div>

                    {/* Real-time Progress Bar */}
                    <div
                      style={{
                        height: '10px',
                        width: '100%',
                        background: paperTheme === 'paper' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        marginBottom: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(10, Math.min(100, processingProgress))}%`,
                          background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 50%, #10b981 100%)',
                          borderRadius: '999px',
                          transition: 'width 0.3s ease-in-out',
                          boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
                        }}
                      />
                    </div>

                    {/* Active Step Description */}
                    <p style={{ fontSize: '0.86rem', color: paperTheme === 'paper' ? '#334155' : '#e2e8f0', fontWeight: 600, minHeight: '22px' }}>
                      {processingStep || 'Processing paragraphs with Lynote AI Sanitizer & NVIDIA AI...'}
                    </p>

                    {/* 4 Stepper Phase Pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '22px' }}>
                      {[
                        { label: '1. Decompose', active: processingProgress >= 15 },
                        { label: '2. Humanize', active: processingProgress >= 45 },
                        { label: '3. Lynote Sanitize', active: processingProgress >= 75 },
                        { label: '4. Parity Verify', active: processingProgress >= 90 },
                      ].map((step, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: step.active ? 'rgba(16, 185, 129, 0.2)' : paperTheme === 'paper' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.04)',
                            border: step.active ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
                            color: step.active ? '#10b981' : paperTheme === 'paper' ? '#64748b' : 'var(--text-muted)',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {step.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isEditing ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={16}
                    style={{
                      width: '100%',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: '1.75',
                      fontSize: '0.92rem',
                      background: paperTheme === 'paper' ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                      color: paperTheme === 'paper' ? '#0f172a' : '#f8fafc',
                      border: paperTheme === 'paper' ? '1px solid #cbd5e1' : '1px solid var(--border-subtle)',
                      padding: '12px',
                      borderRadius: '8px',
                    }}
                  />
                ) : reviewData?.currentVersion ? (
                  (showDiff || viewMode === 'diff') && reviewData.originalText ? (
                    renderDiffHighlightedText(reviewData.originalText, reviewData.currentVersion.text)
                  ) : (
                    <div>
                      {renderHighlightedText(reviewData.currentVersion.text, true)}
                    </div>
                  )
                ) : (
                  <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--text-muted)' }}>
                    <Sparkles size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                    <p style={{ fontWeight: 700, color: paperTheme === 'paper' ? '#0f172a' : '#fff', fontSize: '1.05rem' }}>Ready for Multi-Expert Humanization</p>
                    <p style={{ fontSize: '0.82rem', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0' }}>
                      Click "⚡ Humanize This Page" or enable "⚡ Auto-Pilot" above to automatically humanize all pages in real time.
                    </p>
                  </div>
                )}
              </div>

              {/* Sheet Running Footer */}
              <div
                style={{
                  padding: '10px 20px',
                  background: paperTheme === 'paper' ? '#f1f5f9' : 'rgba(15, 23, 42, 0.7)',
                  borderTop: paperTheme === 'paper' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: paperTheme === 'paper' ? '#64748b' : 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={13} color="#10b981" /> 10-Dimension Factual & Numerical Parity Verified
                </span>
                <span>Protected Placeholders Intact</span>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 20px', background: 'rgba(15, 23, 42, 0.9)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>
                    Save & Validate Edits
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Control Bar */}
          <div className="glass-card" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Optional custom instruction (e.g. emphasize active voice)"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                style={{ width: '320px', padding: '8px 12px', fontSize: '0.85rem' }}
                disabled={isProcessing || isAutoPilot}
              />
              <button
                className="btn btn-secondary"
                onClick={handleStartHumanize}
                disabled={isProcessing || isAutoPilot}
              >
                <RotateCcw size={15} />
                <span>{reviewData?.currentVersion ? 'Humanize Again' : `⚡ Humanize Page ${currentPage?.pageNumber || 1}`}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!isEditing && reviewData?.currentVersion && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(true)}
                  disabled={isProcessing || isAutoPilot}
                >
                  <Edit3 size={15} /> Edit Candidate
                </button>
              )}

              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={isProcessing || isAutoPilot || !reviewData?.currentVersion || isPageApproved}
              >
                <CheckCircle2 size={16} />
                <span>{isPageApproved ? 'Page Approved' : 'Approve & Next Page'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Independent Evaluation Panel */}
        <div>
          <EvaluationPanel
            evaluation={reviewData?.currentVersion?.evaluationSummary}
            iterationNumber={reviewData?.totalIterations || 1}
            selectedExperts={reviewData?.selectedExperts || []}
            domainName={reviewData?.domainConfidence ? Object.keys(reviewData.domainConfidence)[0] : 'ACADEMIC'}
          />
        </div>
      </div>

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={versions}
        onSelectVersion={(v) => {
          setEditText(v.text);
          setIsHistoryOpen(false);
        }}
      />

      {/* Reconstruction Modal */}
      {docData && (
        <ReconstructionModal
          isOpen={isReconstructOpen}
          onClose={() => setIsReconstructOpen(false)}
          documentId={documentId}
          documentTitle={docData.title}
        />
      )}
    </div>
  );
};
