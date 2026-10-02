import { nvidiaClient } from '../apps/api/src/modules/ai/nvidia/nvidia.client.ts';
import { lynotePostProcessor } from '../apps/api/src/modules/processing/postprocessor.ts';

const testPara = `Artificial Intelligence (AI) has rapidly permeated Human Resource (HR) decision-making in Indian corporates, spanning candidate screening, psychometric profiling, video interview analysis, and performance prediction [CITATION_001]. While marketed as objective, meritocratic instruments that eliminate human cognitive limitations, these algorithms operate within historical socio-cultural stratification frameworks [CITATION_002]. In India, recruitment dynamics are intrinsically tied to caste, gender, regional, and linguistic identities. Algorithmic recruitment systems deployed across Indian enterprises frequently ingest uncurated historical hiring data, perpetuating historical discrimination under the guise of technological neutrality [CITATION_003].`;

async function testRewrite() {
  const prompt = `You are a world-class human copyeditor and author. 
Your task is to completely humanize and rewrite the provided text so it reads like it was written by an engaging, thoughtful human thinker, NOT an AI.

TRANSFORMATION RULES:
1. REPHRASE BOLDLY: Restructure sentence orders, convert passive verbs to active, and break up stiff academic rhythms.
2. VARY CADENCE: Alternate between punchy short observations and smooth flowing sentences.
3. REMOVE AI CLICHES: Eliminate stiff robotic jargon (e.g. "rapidly permeated", "intrinsically tied", "under the guise of", "meritocratic instruments"). Use vibrant, natural, authentic wording instead.
4. ABSOLUTE FIDELITY: Keep all factual points, numbers, statutory terms, scholar names, and protected citation tags (like [CITATION_001], [CITATION_002], [CITATION_003]) 100% intact.
5. Return ONLY the rewritten text directly. No JSON, no markdown fences, no pleasantries.`;

  console.log('--- ORIGINAL TEXT ---');
  console.log(testPara);

  const res = await nvidiaClient.chatCompletion({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: testPara }
    ],
    temperature: 0.85,
  });

  let rewritten = res.choices[0].message.content.trim();
  rewritten = lynotePostProcessor.process(rewritten);

  console.log('\n--- STRONGLY HUMANIZED OUTPUT ---');
  console.log(rewritten);
}

testRewrite().catch(console.error);
