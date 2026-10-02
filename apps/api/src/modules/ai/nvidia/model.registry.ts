import { ENV } from '../../../config/env.js';
import { NVIDIAModelDiscoveryService } from './discovery.service.js';

export interface ModelRoleMapping {
  role: string;
  primaryModelId: string;
  fallbackModelIds: string[];
}

export class ModelRegistry {
  private roleMappings: Map<string, ModelRoleMapping> = new Map();

  constructor(private discoveryService?: NVIDIAModelDiscoveryService) {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings() {
    const fastPrimary = 'meta/llama-3.2-11b-vision-instruct';
    const fallbackList = ['meta/llama-3.2-90b-vision-instruct'];

    this.setMapping('classifier', ENV.NVIDIA_CLASSIFIER_MODEL || fastPrimary, fallbackList);
    this.setMapping('generalWriter', ENV.NVIDIA_GENERAL_WRITER_MODEL || fastPrimary, fallbackList);
    this.setMapping('medicalExpert', ENV.NVIDIA_MEDICAL_MODEL || fastPrimary, fallbackList);
    this.setMapping('scientificExpert', ENV.NVIDIA_SCIENTIFIC_MODEL || fastPrimary, fallbackList);
    this.setMapping('legalExpert', ENV.NVIDIA_LEGAL_MODEL || fastPrimary, fallbackList);
    this.setMapping('technicalExpert', ENV.NVIDIA_TECHNICAL_MODEL || fastPrimary, fallbackList);
    this.setMapping('naturalnessEvaluator', ENV.NVIDIA_NATURALNESS_EVALUATOR_MODEL || fastPrimary, fallbackList);
    this.setMapping('meaningEvaluator', ENV.NVIDIA_MEANING_EVALUATOR_MODEL || fastPrimary, fallbackList);
    this.setMapping('factEvaluator', ENV.NVIDIA_FACT_EVALUATOR_MODEL || fastPrimary, fallbackList);
    this.setMapping('finalEvaluator', ENV.NVIDIA_MEANING_EVALUATOR_MODEL || fastPrimary, fallbackList);
    this.setMapping('refinement', ENV.NVIDIA_REFINEMENT_MODEL || fastPrimary, fallbackList);
  }

  public setMapping(role: string, primaryModelId: string, fallbackModelIds: string[] = []) {
    this.roleMappings.set(role, {
      role,
      primaryModelId,
      fallbackModelIds,
    });
  }

  public getMapping(role: string): ModelRoleMapping | undefined {
    return this.roleMappings.get(role);
  }

  public getAllMappings(): Record<string, ModelRoleMapping> {
    const result: Record<string, ModelRoleMapping> = {};
    for (const [k, v] of this.roleMappings.entries()) {
      result[k] = v;
    }
    return result;
  }

  public getModelForTask(
    task: string,
    domain?: string
  ): {
    selectedModelId: string;
    role: string;
    fallbackModels: string[];
  } {
    let role = 'generalWriter';

    if (task === 'CLASSIFY') {
      role = 'classifier';
    } else if (task === 'EVALUATE_MEANING') {
      role = 'meaningEvaluator';
    } else if (task === 'EVALUATE_FACTS') {
      role = 'factEvaluator';
    } else if (task === 'EVALUATE_NATURALNESS') {
      role = 'naturalnessEvaluator';
    } else if (task === 'REFINE') {
      role = 'refinement';
    } else if (task === 'REWRITE') {
      const d = (domain || '').toUpperCase();
      if (d === 'MEDICAL') role = 'medicalExpert';
      else if (d === 'SCIENTIFIC') role = 'scientificExpert';
      else if (d === 'LEGAL') role = 'legalExpert';
      else if (d === 'TECHNICAL' || d === 'ENGINEERING') role = 'technicalExpert';
      else role = 'generalWriter';
    }

    const mapping = this.roleMappings.get(role) || {
      role,
      primaryModelId: ENV.NVIDIA_GENERAL_WRITER_MODEL,
      fallbackModelIds: [],
    };

    return {
      selectedModelId: mapping.primaryModelId,
      role: mapping.role,
      fallbackModels: mapping.fallbackModelIds,
    };
  }
}
