import {
  DomainType,
  ExpertType,
  IDomainClassificationOutput,
  ICandidateGenerationOutput,
  IEvaluationOutput,
  IRefinementOutput,
} from '@humanizer/shared';

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
}

export interface IAIProvider {
  readonly name: string;

  classifyDomain(
    text: string,
    promptVersion?: string
  ): Promise<IDomainClassificationOutput>;

  generateCandidate(
    originalText: string,
    primaryExpert: ExpertType,
    secondaryExpert?: ExpertType | null,
    customInstructions?: string,
    options?: GenerationOptions,
    promptVersion?: string
  ): Promise<ICandidateGenerationOutput>;

  evaluateCandidate(
    originalText: string,
    candidateText: string,
    domain: DomainType,
    promptVersion?: string
  ): Promise<IEvaluationOutput>;

  refineCandidate(
    originalText: string,
    candidateText: string,
    weaknesses: string[],
    actionableFixes: string[],
    expert: ExpertType,
    options?: GenerationOptions,
    promptVersion?: string
  ): Promise<IRefinementOutput>;
}
