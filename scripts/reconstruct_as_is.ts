import fs from 'fs';
import path from 'path';
import { DocumentParser } from '../apps/api/src/modules/processing/document.parser.ts';
import { DocumentReconstructor } from '../apps/api/src/modules/processing/document.reconstructor.ts';

const page1Humanized = `Challenging Algorithmic Bias: Exploring DEI Gaps in AI‑Assisted HR Decision‑Making within Indian Corporations.

Abstract

AI has quickly become a staple in HR decision‑making across Indian companies, handling everything from resume screening and candidate ranking to performance appraisals and promotion recommendations. Although AI promises greater objectivity and speed, mounting evidence shows that algorithms trained on historically biased HR data not only preserve but often widen DEI gaps—especially along gender, caste, regional origin, religion, and disability lines that are especially salient in India’s socio‑cultural landscape. To investigate these dynamics, we used a Fuzzy Decision‑Making Trial and Evaluation Laboratory (Fuzzy DEMATEL) analysis to map the causal links among twelve key factors that drive algorithmic bias in AI‑assisted HR practices. We gathered expert views from 22 DEI professionals, HR technology auditors and organizational‑behavior scholars from across the country. The analysis flagged Historical Training Data Bias (D‑R = +1.247) and Lack of Algorithmic Transparency (D‑R = +1.083) as the main cause‑group drivers of DEI gaps, while Discriminatory Hiring Outcomes (D‑R = −1.312) and Inequitable Promotion Decisions (D‑R = −1.187) emerged as the most severely affected effect‑group outcomes. Our findings uncover a three‑tiered structure of bias propagation—Structural Bias Sources, Process‑Level Amplifiers, and Outcome‑Level Manifestations—and we propose a FAIR‑AI framework (Fairness Auditing, Inclusive Data Design, Regulatory Compliance, Representation Monitoring) for a systematic way to reduce DEI bias in India’s corporate AI‑HR space. These results have important implications for corporate DEI policy, HR technology governance, and the country’s nascent AI regulatory framework.

Keywords: Fuzzy DEMATEL, Algorithmic Bias, DEI, AI in HR, Indian Corporates, Gender Bias, Caste Discrimination, MCDM, FAIR-AI Framework, HR Technology Governance

1. Introduction`;

const page2Humanized = `India's corporate world is at a central moment in how AI is woven into HR decisions. By 2024, more than 78% of Fortune India 500 firms already use some AI‑driven recruitment or performance‑management tool [CITATION_001]. Yet the pace of adopting these algorithmic HR solutions has outstripped the creation of governance structures, fairness‑audit guidelines, and regulatory safeguards. This mismatch means that tools billed as objective, bias‑free are, in practice, amplifying long‑standing inequities at a far greater speed and scale.

Algorithmic bias in HR means that AI decision systems systematically produce outcomes that unfairly disadvantage people or groups because of protected characteristics such as gender, caste, religion, regional origin, disability, or age (Barocas & Selbst, 2016). In India, these factors carry particular weight. Although caste discrimination is illegal under the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989, AI models trained on historical hiring data still show a bias against Dalit, Adivasi, and OBC candidates, who are underrepresented in senior positions. Likewise, AI‑based performance appraisals often undervalue women’s contributions compared with men in similar roles [CITATION_002]. Regional and linguistic bias also appears in NLP‑driven screening tools, which penalise applicants whose written English reflects a non‑metropolitan educational background.

Although India has long pledged to uphold equality and implements affirmative‑action policies, AI‑assisted HR systems in Indian companies often serve as highly advanced techniques that disguise historical discrimination behind algorithmic authority. Eubanks (2018) calls this phenomenon "automating inequality" and it demands immediate scholarly scrutiny as well as practical interventions from HR professionals. Multi‑criteria decision‑making techniques, such as Fuzzy DEMATEL, can map the network of factors that drive algorithmic bias, enabling HR leaders to pinpoint use points within this complex web of biases [CITATION_003].`;

async function main() {
  const sourcePath = 'C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment.docx';
  const parser = new DocumentParser();
  const parsed = await parser.parse(
    sourcePath,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '2. Bias in AI recruitment.docx'
  );

  const originalPages = parsed.pages.map((p) => ({ pageNumber: p.pageNumber, originalText: p.originalText }));
  const approvedPages = parsed.pages.map((p) => {
    let text = p.originalText;
    if (p.pageNumber === 1) text = page1Humanized;
    if (p.pageNumber === 2) text = page2Humanized;
    return { pageNumber: p.pageNumber, text, pageId: 'p_' + p.pageNumber };
  });

  const reconstructor = new DocumentReconstructor();
  const outDir = 'C:\\Users\\shese\\Downloads';
  const res = await reconstructor.reconstructDocument(
    outDir,
    '2. Bias in AI recruitment (Humanized As-Is)',
    originalPages,
    approvedPages,
    [],
    'docx'
  );

  console.log('✅ Reconstructed full document at:', res.filePath);
}

main().catch(console.error);
