import { ExpertType, ICandidateGenerationOutput, SYSTEM_CONFIG } from '@humanizer/shared';
import { IAIProvider } from '../providers/base.provider.js';
import { EXPERT_REGISTRY } from '../experts/expert.registry.js';

export interface GeneratedCandidateResult {
  text: string;
  expertType: ExpertType;
  secondaryExpertType?: ExpertType | null;
  model: string;
  provider: string;
  promptVersion: string;
  generationConfig: {
    temperature: number;
    maxTokens?: number;
    topP?: number;
  };
  outputDetails: ICandidateGenerationOutput;
}

export class CandidateGenerator {
  constructor(private provider: IAIProvider) {}

  async generateCandidates(
    originalText: string,
    assignedExperts: ExpertType[],
    count = 3,
    customInstructions?: string
  ): Promise<GeneratedCandidateResult[]> {
    const plans: Array<{
      primary: ExpertType;
      secondary?: ExpertType | null;
      temperature: number;
    }> = [];

    // Plan 1: Primary domain expert
    const primary = assignedExperts[0] || ExpertType.GENERAL_WRITING;
    const primaryDef = EXPERT_REGISTRY[primary] || EXPERT_REGISTRY[ExpertType.GENERAL_WRITING];
    plans.push({
      primary,
      secondary: assignedExperts.length > 1 ? assignedExperts[1] : ExpertType.STYLE,
      temperature: primaryDef.recommendedTemperature,
    });

    // Plan 2: General Writing + Style Expert
    plans.push({
      primary: ExpertType.GENERAL_WRITING,
      secondary: ExpertType.STYLE,
      temperature: 0.7,
    });

    // Plan 3: Conservative or Secondary Domain Expert
    if (assignedExperts.length > 1 && assignedExperts[1] !== ExpertType.GENERAL_WRITING) {
      plans.push({
        primary: assignedExperts[1],
        secondary: ExpertType.CONSERVATIVE,
        temperature: 0.4,
      });
    } else {
      plans.push({
        primary: ExpertType.CONSERVATIVE,
        secondary: null,
        temperature: 0.3,
      });
    }

    const selectedPlans = plans.slice(0, count);

    // Generate candidates concurrently
    const promises = selectedPlans.map(async (plan) => {
      const output = await this.provider.generateCandidate(
        originalText,
        plan.primary,
        plan.secondary,
        customInstructions,
        { temperature: plan.temperature },
        SYSTEM_CONFIG.PROMPT_VERSIONS.SYSTEM_HUMANIZATION
      );

      return {
        text: output.rewrittenText,
        expertType: plan.primary,
        secondaryExpertType: plan.secondary,
        model: this.provider.name,
        provider: this.provider.name,
        promptVersion: SYSTEM_CONFIG.PROMPT_VERSIONS.SYSTEM_HUMANIZATION,
        generationConfig: {
          temperature: plan.temperature,
        },
        outputDetails: output,
      };
    });

    return Promise.all(promises);
  }
}
