import { PageState, DocumentStatus, DomainType, ExpertType, SourceType, JobStatus, ElementType, HardGateType } from './enums.js';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  totalPages: number;
  approvedPages: number;
  status: DocumentStatus;
  reconstructedPath?: string | null;
  reconstructedMimeType?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentElement {
  id: string;
  documentId: string;
  pageId: string;
  placeholder: string; // e.g. [TABLE_001], [IMAGE_001], [CITATION_001]
  type: ElementType;
  rawContent: string;
  metadata?: Record<string, unknown>;
  orderIndex: number;
  isLocked: boolean;
  createdAt: Date;
}

export interface IDocumentPage {
  id: string;
  documentId: string;
  pageNumber: number;
  state: PageState;
  originalText: string;
  currentApprovedVersionId?: string | null;
  activeCandidateId?: string | null;
  domainConfidence?: Record<string, number>;
  selectedExperts?: string[];
  totalIterations: number;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPageVersion {
  id: string;
  pageId: string;
  userId?: string | null;
  candidateId?: string | null;
  sourceType: SourceType;
  iterationNumber: number;
  text: string;
  overallScore?: number | null;
  evaluationSummary?: Record<string, unknown> | null;
  diffFromOriginal?: string | null;
  createdAt: Date;
}

export interface IEvaluationProperties {
  naturalness: number;           // 0 - 100
  clarity: number;               // 0 - 100
  sentenceVariety: number;       // 0 - 100
  repetitionReduction: number;   // 0 - 100
  styleConsistency: number;      // 0 - 100
  meaningPreservation: number;   // 0 - 100
  factualConsistency: number;    // 0 - 100
  terminologyPreservation: number; // 0 - 100
  citationPreservation: number;    // 0 - 100
  protectedElementIntegrity: number; // 0 - 100
}

export interface IHardGateCheck {
  gate: HardGateType;
  passed: boolean;
  score: number;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface IHardGateResult {
  allPassed: boolean;
  checks: IHardGateCheck[];
  failedReasons: string[];
}

export interface IEvaluationResult {
  scores: IEvaluationProperties;
  overallWeightedScore: number;
  gates: IHardGateResult;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    actionableFixes: string[];
  };
  evaluatorModel: string;
  evaluatorPromptVersion: string;
  evaluatedAt: Date;
}

export interface ICandidate {
  id: string;
  pageId: string;
  iterationNumber: number;
  expertType: ExpertType;
  secondaryExpertType?: ExpertType | null;
  model: string;
  provider: string;
  promptVersion: string;
  text: string;
  overallScore?: number | null;
  isValid: boolean;
  generationConfig: {
    temperature: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
  };
  evaluation?: IEvaluationResult | null;
  createdAt: Date;
}

export interface IScoringWeights {
  naturalness: number;           // Default: 0.25
  clarity: number;               // Default: 0.15
  sentenceVariety: number;       // Default: 0.10
  repetitionReduction: number;   // Default: 0.10
  styleConsistency: number;      // Default: 0.10
  meaningPreservation: number;   // Default: 0.15
  factualConsistency: number;    // Default: 0.10
  terminologyCitation: number;   // Default: 0.05
}

export interface IQualityThresholds {
  minMeaningPreservation: number; // e.g. 90
  minFactualConsistency: number;  // e.g. 90
  minTerminologyScore: number;    // e.g. 85
  minCitationScore: number;      // e.g. 95
  minProtectedIntegrity: number;  // e.g. 100
  targetNaturalnessScore: number; // e.g. 80
  targetOverallScore: number;     // e.g. 80
}

export interface IProcessingJob {
  id: string;
  documentId: string;
  pageId?: string | null;
  userId: string;
  jobType: 'PAGE_HUMANIZE' | 'PAGE_REFINE' | 'DOCUMENT_PARSE' | 'DOCUMENT_RECONSTRUCT';
  status: JobStatus;
  progressPercent: number;
  currentStep?: string | null;
  resultPayload?: Record<string, unknown> | null;
  errorPayload?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  userId?: string | null;
  documentId?: string | null;
  pageId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface IReconstructionIntegrityReport {
  isValid: boolean;
  originalCounts: {
    pages: number;
    tables: number;
    images: number;
    diagrams: number;
    charts: number;
    equations: number;
    citations: number;
  };
  reconstructedCounts: {
    pages: number;
    tables: number;
    images: number;
    diagrams: number;
    charts: number;
    equations: number;
    citations: number;
  };
  missingPlaceholderIds: string[];
  numericalMismatches: Array<{ expected: string; found: string; context: string }>;
  errors: string[];
}
