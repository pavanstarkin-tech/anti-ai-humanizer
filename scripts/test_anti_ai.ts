import { nvidiaOrchestrator, cleanProseText } from '../apps/api/src/modules/ai/nvidia/nvidia.orchestrator.js';
import { ExpertType } from '../packages/shared/src/enums.js';

async function test() {
  const sample = `Breaking the Algorithmic Bias: Unraveling DEI Gaps in AI-Powered HR Decision-Making in Indian Corporates

Human Resource (HR) professionals in Indian corporates are facing a daunting challenge: AI has taken over, automating critical functions such as resume screening, candidate ranking, and performance appraisal. But what's the cost? While AI promises objectivity and efficiency, a disturbing trend is emerging: algorithmic systems trained on biased HR data are perpetuating and amplifying Diversity, Equity, and Inclusion (DEI) gaps. The consequences are particularly severe along dimensions of gender, caste, regional origin, religion, and disability status – a uniquely Indian socio-cultural context.

To better understand this complex issue, we employed Fuzzy Decision-Making Trial and Evaluation Laboratory (Fuzzy DEMATEL)...`;

  const start = Date.now();
  const res = await nvidiaOrchestrator.generateCandidate(sample, ExpertType.ACADEMIC, ExpertType.STYLE);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log('--- TIME ---', elapsed + 's');
  console.log('--- RESULT ---');
  console.log(cleanProseText(res.rewrittenText));
}

test().catch(console.error);
