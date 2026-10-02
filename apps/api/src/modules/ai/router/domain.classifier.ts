import { DomainType, ExpertType, IDomainClassificationOutput } from '@humanizer/shared';
import { IAIProvider } from '../providers/base.provider.js';

export class DomainClassifier {
  constructor(private provider: IAIProvider) {}

  async classify(text: string): Promise<IDomainClassificationOutput & { assignedExperts: ExpertType[] }> {
    const classification = await this.provider.classifyDomain(text);

    const assignedExperts: ExpertType[] = [];

    // Map domain to expert
    switch (classification.primaryDomain) {
      case DomainType.MEDICAL:
        assignedExperts.push(ExpertType.MEDICAL);
        break;
      case DomainType.SCIENTIFIC:
        assignedExperts.push(ExpertType.SCIENTIFIC);
        break;
      case DomainType.LEGAL:
        assignedExperts.push(ExpertType.LEGAL);
        break;
      case DomainType.TECHNICAL:
        assignedExperts.push(ExpertType.TECHNICAL);
        break;
      case DomainType.ENGINEERING:
        assignedExperts.push(ExpertType.ENGINEERING);
        break;
      case DomainType.ACADEMIC:
        assignedExperts.push(ExpertType.ACADEMIC);
        break;
      case DomainType.FINANCIAL:
        assignedExperts.push(ExpertType.FINANCIAL);
        break;
      default:
        assignedExperts.push(ExpertType.GENERAL_WRITING);
    }

    // Include secondary expert if present
    if (classification.secondaryDomain) {
      if (classification.secondaryDomain === DomainType.SCIENTIFIC && !assignedExperts.includes(ExpertType.SCIENTIFIC)) {
        assignedExperts.push(ExpertType.SCIENTIFIC);
      } else if (classification.secondaryDomain === DomainType.TECHNICAL && !assignedExperts.includes(ExpertType.TECHNICAL)) {
        assignedExperts.push(ExpertType.TECHNICAL);
      }
    }

    // Always ensure General Writing and Style are available in the candidate pool
    if (!assignedExperts.includes(ExpertType.GENERAL_WRITING)) {
      assignedExperts.push(ExpertType.GENERAL_WRITING);
    }

    return {
      ...classification,
      assignedExperts,
    };
  }
}
