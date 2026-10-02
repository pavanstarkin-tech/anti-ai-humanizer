import { nvidiaOrchestrator } from '../apps/api/src/modules/ai/nvidia/nvidia.orchestrator.js';
import { ExpertType } from '../packages/shared/src/enums.js';

async function testHumanization() {
  console.log('Testing NVIDIA multi-expert anti-AI humanization...');
  
  const sampleAIText = `Artificial intelligence in recruitment plays a pivotal role in modern talent acquisition. Furthermore, it is crucial to note that machine learning algorithms can delve into candidate resumes to optimize hiring workflows. Moreover, the ever-evolving landscape of recruitment technology serves as a testament to transformative innovation, fostering a 45.2% increase in hiring speed across 1,200 organizations in 2025. In conclusion, AI technology is a game-changer that seamlessly empowers HR professionals. [TABLE_001]`;
  
  console.log('\n--- ORIGINAL AI INPUT TEXT ---');
  console.log(sampleAIText);

  const candidate = await nvidiaOrchestrator.generateCandidate(
    sampleAIText,
    ExpertType.GENERAL_WRITING,
    ExpertType.STYLE,
    'Ensure natural human tone, high burstiness, and eliminate all AI clichés while preserving all percentages and tags.'
  );

  console.log('\n--- HUMANIZED REWRITTEN OUTPUT ---');
  console.log(candidate.rewrittenText);
  console.log('\n--- PRESERVED PLACEHOLDERS ---');
  console.log(candidate.preservedPlaceholders);
  console.log('\n--- STYLISTIC CHOICES ---');
  console.log(candidate.stylisticChoices);
}

testHumanization().catch(console.error);
