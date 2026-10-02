import { nvidiaClient } from '../apps/api/src/modules/ai/nvidia/nvidia.client.ts';

const textToRewrite = `Breaking the Algorithmic Bias: Examining DEI Gaps in AI‑Assisted HR Decision‑Making in Indian Corporates

Abstract

Artificial Intelligence (AI) has swept into Human Resource (HR) decision-making in Indian corporates, automating critical functions like resume screening, candidate ranking, performance appraisal, and promotion recommendations. However, beneath the surface of efficiency and objectivity, a disturbing trend has emerged. Algorithmic systems, trained on historically biased HR data, are perpetuating and amplifying Diversity, Equity, and Inclusion (DEI) gaps. These gaps are particularly pronounced along dimensions of gender, caste, regional origin, religion, and disability status – dimensions uniquely salient in the Indian socio-cultural context.

This study employed Fuzzy Decision-Making Trial and Evaluation Laboratory (Fuzzy DEMATEL) analysis to examine the causal interrelationships among twelve critical factors governing algorithmic bias in AI-assisted HR decision-making in Indian organizations. Expert inputs were gathered from 22 DEI practitioners, HR technology auditors, and organizational behavior researchers across sectors. Fuzzy DEMATEL results reveal that Historical Training Data Bias (D-R = +1.247) and Lack of Algorithmic Transparency (D-R = +1.083) are the most prominent net cause factors driving algorithmic DEI gaps. Conversely, Discriminatory Hiring Outcomes (D-R = -1.312) and Inequitable Promotion Decisions (D-R = -1.187) emerge as the primary net effect manifestations.

The analysis establishes a three-tier bias propagation mechanism: Foundational Bias Drivers, Algorithmic Amplifiers, and Structural DEI Outcomes. Based on these empirical findings, we propose the FAIR-AI Framework (Fairness Auditing, Algorithmic Transparency, Inclusive Data Engineering, and Regulatory Compliance) as an actionable governance blueprint for Indian corporates deploying AI in HR functions. The study provides critical insights for corporate HR leaders, AI developers, and policy makers navigating the intersection of artificial intelligence and workplace equity in India.

Keywords: Algorithmic Bias, Artificial Intelligence in HR, Diversity Equity and Inclusion (DEI), Fuzzy DEMATEL, Indian Corporates, Gender Bias, Caste Discrimination, AI Ethics, Multi-Criteria Decision-Making (MCDM), Algorithmic Fairness.`;

async function testExtremeAntiAI() {
  const systemPrompt = `You are a world-class human academic author. Your goal is to rewrite the text so that it registers 0% AI on AI detectors (Quillbot, ZeroGPT, GPTZero, Turnitin) while preserving 100% of facts, data, numbers, and meaning.

CRITICAL ANTI-AI DETECTION RULES:
1. DESTROY LLM N-GRAMS & FORMULAS:
   - NEVER start with "Artificial Intelligence (AI) has..." or "In today's fast-paced world..."
   - NEVER use the phrase "Although X is touted for Y, growing evidence shows..." or "However, beneath the surface..."
   - NEVER use list templates like "from X to Y, Z, and W".
   - NEVER use "The findings have important implications for..." or "The study provides critical insights for...".
   - NEVER use doublet adjectives/verbs like "perpetuating and amplifying", "efficiency and objectivity".

2. IRREGULAR HUMAN CADENCE (BURSTINESS & PERPLEXITY):
   - Human scholars write with irregular rhythm. Insert short, confident sentences (3-7 words) right next to long, nuanced sentences (25-35 words) with parenthetical thoughts, em-dashes (—), or colons.
   - Use active verbs: "ran", "ranked", "steered", "baked", "exposed".
   - Vary sentence beginnings (e.g. start with prepositional phrases, participle clauses, or direct nouns).

3. EXACT FACT & NUMBER PRESERVATION:
   - 22 DEI practitioners / experts
   - D-R = +1.247, D-R = +1.083
   - D-R = -1.312, D-R = -1.187
   - Fuzzy DEMATEL, FAIR-AI Framework
   - Gender, caste, regional origin, religion, disability.

Output ONLY valid JSON with {"rewrittenText": "..."}`;

  const res = await nvidiaClient.chatCompletion({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: textToRewrite }
    ],
    temperature: 0.85,
    top_p: 0.92,
    max_tokens: 3000
  });

  console.log('--- REASONING ---');
  console.log(res.choices[0].message.reasoning_content);
  console.log('--- REWRITTEN OUTPUT ---');
  console.log(res.choices[0].message.content);
}

testExtremeAntiAI().catch(console.error);
