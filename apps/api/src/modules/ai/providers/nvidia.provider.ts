import {
  DomainType,
  ExpertType,
  IDomainClassificationOutput,
  ICandidateGenerationOutput,
  IEvaluationOutput,
  IRefinementOutput,
} from '@humanizer/shared';
import { IAIProvider, GenerationOptions } from './base.provider.js';
import { nvidiaOrchestrator, NvidiaMultiModelOrchestrator } from '../nvidia/nvidia.orchestrator.js';

export class NvidiaProviderAdapter implements IAIProvider {
  readonly name = 'NVIDIA';

  constructor(private orchestrator: NvidiaMultiModelOrchestrator = nvidiaOrchestrator) {}

  async classifyDomain(text: string): Promise<IDomainClassificationOutput> {
    return this.orchestrator.classifyDomain(text);
  }

  async generateCandidate(
    originalText: string,
    primaryExpert: ExpertType,
    secondaryExpert?: ExpertType | null,
    customInstructions?: string,
    options?: GenerationOptions
  ): Promise<ICandidateGenerationOutput> {
    return this.orchestrator.generateCandidate(
      originalText,
      primaryExpert,
      secondaryExpert,
      customInstructions
    );
  }

  async evaluateCandidate(
    originalText: string,
    candidateText: string,
    domain: DomainType
  ): Promise<IEvaluationOutput> {
    return this.orchestrator.evaluateCandidate(originalText, candidateText, domain);
  }

  async refineCandidate(
    originalText: string,
    candidateText: string,
    weaknesses: string[],
    actionableFixes: string[],
    expert: ExpertType
  ): Promise<IRefinementOutput> {
    return this.orchestrator.refineCandidate(
      originalText,
      candidateText,
      weaknesses,
      actionableFixes,
      expert
    );
  }
}
