import { z } from 'zod';
import { DomainType, ExpertType, PageState, DocumentStatus, ElementType, HardGateType, SourceType } from './enums.js';

// ==========================================
// AI STRUCTURED OUTPUT SCHEMAS
// ==========================================

export const DomainClassificationOutputSchema = z.object({
  primaryDomain: z.nativeEnum(DomainType),
  secondaryDomain: z.nativeEnum(DomainType).optional().nullable(),
  confidenceScores: z.record(z.string(), z.number().min(0).max(1)),
  detectedProtectedTerms: z.array(z.string()).default([]),
  detectedKeyNumbers: z.array(z.string()).default([]),
  reasoning: z.string().default(''),
});

export type IDomainClassificationOutput = z.infer<typeof DomainClassificationOutputSchema>;

export const CandidateGenerationOutputSchema = z.object({
  rewrittenText: z.string().min(1),
  changesSummary: z.string().default(''),
  preservedPlaceholders: z.array(z.string()).default([]),
  preservedTechnicalTerms: z.array(z.string()).default([]),
  stylisticChoices: z.string().default(''),
});

export type ICandidateGenerationOutput = z.infer<typeof CandidateGenerationOutputSchema>;

export const EvaluationPropertyScoresSchema = z.object({
  naturalness: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  sentenceVariety: z.number().min(0).max(100),
  repetitionReduction: z.number().min(0).max(100),
  styleConsistency: z.number().min(0).max(100),
  meaningPreservation: z.number().min(0).max(100),
  factualConsistency: z.number().min(0).max(100),
  terminologyPreservation: z.number().min(0).max(100),
  citationPreservation: z.number().min(0).max(100),
  protectedElementIntegrity: z.number().min(0).max(100),
});

export const HardGateCheckSchema = z.object({
  gate: z.nativeEnum(HardGateType),
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  reason: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

export const EvaluationOutputSchema = z.object({
  scores: EvaluationPropertyScoresSchema,
  gates: z.object({
    allPassed: z.boolean(),
    checks: z.array(HardGateCheckSchema),
    failedReasons: z.array(z.string()),
  }),
  feedback: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    actionableFixes: z.array(z.string()),
  }),
});

export type IEvaluationOutput = z.infer<typeof EvaluationOutputSchema>;

export const RefinementOutputSchema = z.object({
  refinedText: z.string().min(1),
  addressedWeaknesses: z.array(z.string()),
  preservedPlaceholdersCheck: z.boolean(),
  rationale: z.string(),
});

export type IRefinementOutput = z.infer<typeof RefinementOutputSchema>;

// ==========================================
// REST API REQUEST SCHEMAS
// ==========================================

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const DocumentUploadMetadataSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

export const PageHumanizeRequestSchema = z.object({
  forceRegenerate: z.boolean().default(false),
  customInstructions: z.string().max(1000).optional(),
  targetNaturalness: z.number().min(50).max(100).optional(),
  maxIterations: z.number().min(1).max(10).optional(),
});

export const PageEditRequestSchema = z.object({
  text: z.string().min(1),
  editSummary: z.string().max(500).optional(),
});

export const PageApproveRequestSchema = z.object({
  candidateId: z.string().uuid().optional(),
  pageVersionId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const DocumentReconstructRequestSchema = z.object({
  format: z.enum(['original', 'docx', 'pdf', 'txt', 'md']).default('original'),
});

// ==========================================
// REST API RESPONSE SCHEMAS
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
