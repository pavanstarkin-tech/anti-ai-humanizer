import { IScoringWeights, IQualityThresholds } from './interfaces.js';

export const DEFAULT_SCORING_WEIGHTS: IScoringWeights = {
  naturalness: 0.25,
  clarity: 0.15,
  sentenceVariety: 0.10,
  repetitionReduction: 0.10,
  styleConsistency: 0.10,
  meaningPreservation: 0.15,
  factualConsistency: 0.10,
  terminologyCitation: 0.05,
};

export const DEFAULT_QUALITY_THRESHOLDS: IQualityThresholds = {
  minMeaningPreservation: 85,
  minFactualConsistency: 85,
  minTerminologyScore: 80,
  minCitationScore: 90,
  minProtectedIntegrity: 100,
  targetNaturalnessScore: 80,
  targetOverallScore: 80,
};

export const SYSTEM_CONFIG = {
  MAX_ITERATIONS: 5,
  CANDIDATES_PER_ITERATION: 3,
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  SUPPORTED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
  ],
  PLACEHOLDER_REGEX: /\[(TABLE|IMAGE|DIAGRAM|CHART|EQUATION|CITATION|HEADER|FOOTER)_[0-9A-Za-z_-]+\]/g,
  NUMBER_REGEX: /(?:\$\d+(?:,\d{3})*(?:\.\d+)?|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\b\d+(?:\.\d+)?%?)/g,
  PROMPT_VERSIONS: {
    SYSTEM_HUMANIZATION: 'v1.4.0',
    DOMAIN_CLASSIFIER: 'v1.2.0',
    EVALUATION: 'v1.5.0',
    REFINEMENT: 'v1.3.0',
  },
};
