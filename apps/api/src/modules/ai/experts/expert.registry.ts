import { ExpertType, DomainType } from '@humanizer/shared';

export interface IExpertDefinition {
  type: ExpertType;
  domain: DomainType;
  title: string;
  description: string;
  systemPrompt: string;
  recommendedTemperature: number;
}

export const EXPERT_REGISTRY: Record<ExpertType, IExpertDefinition> = {
  [ExpertType.GENERAL_WRITING]: {
    type: ExpertType.GENERAL_WRITING,
    domain: DomainType.GENERAL,
    title: 'General Writing Expert',
    description: 'Improves readability, flow, sentence variety, word choice, and natural human expression.',
    systemPrompt: 'Transform text into lively, natural, human prose with varied sentence lengths. Use active voice, crisp phrasing, and natural transitions. Strictly avoid repetitive LLM formulas and buzzwords.',
    recommendedTemperature: 0.75,
  },
  [ExpertType.MEDICAL]: {
    type: ExpertType.MEDICAL,
    domain: DomainType.MEDICAL,
    title: 'Medical Domain Expert',
    description: 'Protects clinical terminology, therapeutic context, and medical accuracy while improving natural prose.',
    systemPrompt: 'Preserve clinical terms, dosage units, diagnostic naming, and patient outcome descriptions with 100% fidelity. Ensure prose flows naturally without robotic biomedical clichés.',
    recommendedTemperature: 0.55,
  },
  [ExpertType.SCIENTIFIC]: {
    type: ExpertType.SCIENTIFIC,
    domain: DomainType.SCIENTIFIC,
    title: 'Scientific Research Expert',
    description: 'Protects research terminology, methodological precision, and evidence statements.',
    systemPrompt: 'Preserve statistical figures, hypothesis phrasing, sample data, and scientific nomenclature precisely. Present research findings with authentic scholarly clarity and varied syntax.',
    recommendedTemperature: 0.55,
  },
  [ExpertType.LEGAL]: {
    type: ExpertType.LEGAL,
    domain: DomainType.LEGAL,
    title: 'Legal Domain Expert',
    description: 'Protects defined terms, statutory references, qualification phrasing, and legal obligations.',
    systemPrompt: 'Preserve defined capitalized terms, conditions precedent, liability bounds, and statutory references with absolute fidelity while improving readability and eliminating artificial fluff.',
    recommendedTemperature: 0.45,
  },
  [ExpertType.TECHNICAL]: {
    type: ExpertType.TECHNICAL,
    domain: DomainType.TECHNICAL,
    title: 'Technical & Systems Expert',
    description: 'Protects technical specifications, architectural names, protocols, and engineering metrics.',
    systemPrompt: 'Preserve technical parameter names, code references, protocol identifiers, and unit measurements. Write clear, direct technical documentation with natural human cadence.',
    recommendedTemperature: 0.55,
  },
  [ExpertType.ENGINEERING]: {
    type: ExpertType.ENGINEERING,
    domain: DomainType.ENGINEERING,
    title: 'Engineering Expert',
    description: 'Protects specifications, tolerances, engineering terminology, and mechanical relationships.',
    systemPrompt: 'Preserve engineering tolerances, dimensions, material names, and technical constraints. Use direct, clear, pragmatic engineering prose.',
    recommendedTemperature: 0.55,
  },
  [ExpertType.ACADEMIC]: {
    type: ExpertType.ACADEMIC,
    domain: DomainType.ACADEMIC,
    title: 'Academic Prose Expert',
    description: 'Maintains scholarly rigor, academic tone, and disciplinary convention without robotic phrasing.',
    systemPrompt: 'Maintain scholarly precision, nuance, and academic tone while eliminating clunky filler, artificial transitions (moreover, furthermore), and robotic passive voice.',
    recommendedTemperature: 0.65,
  },
  [ExpertType.FINANCIAL]: {
    type: ExpertType.FINANCIAL,
    domain: DomainType.FINANCIAL,
    title: 'Financial & Fiscal Expert',
    description: 'Protects financial metrics, currencies, fiscal periods, and accounting terminology.',
    systemPrompt: 'Preserve fiscal years, currency symbols, percentages, EBITDA, balance terms, and accounting ratios exactly. Frame insights in sharp, executive-level financial prose.',
    recommendedTemperature: 0.45,
  },
  [ExpertType.STYLE]: {
    type: ExpertType.STYLE,
    domain: DomainType.GENERAL,
    title: 'Style & Tone Polisher',
    description: 'Ensures consistent voice, seamless transitions, and elevated stylistic elegance.',
    systemPrompt: 'Inject high burstiness, rhythmic variety, and memorable human phrasing. Break repetitive patterns and eliminate all AI clichés.',
    recommendedTemperature: 0.75,
  },
  [ExpertType.CONSERVATIVE]: {
    type: ExpertType.CONSERVATIVE,
    domain: DomainType.GENERAL,
    title: 'Conservative Rewrite Expert',
    description: 'Performs minimal essential changes, focusing solely on obvious awkwardness while staying closest to source.',
    systemPrompt: 'Make only minimal, essential refinements to fix stiffness. Keep sentence structure faithful to original intent while eliminating robotic phrases.',
    recommendedTemperature: 0.35,
  },
};
