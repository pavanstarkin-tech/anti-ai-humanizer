import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const page1 = `Breaking the Algorithmic Bias: Examining DEI Gaps in AI‑Assisted HR Decision‑Making in Indian Corporates

Abstract

Artificial Intelligence (AI) has quickly become a staple in HR processes across Indian companies, automating tasks from resume screening to candidate ranking, performance reviews, and promotion suggestions. Although AI is touted for its objectivity and speed, growing evidence shows that algorithmic systems trained on historically biased HR data often repeat and even amplify gaps in Diversity, Equity, and Inclusion (DEI). These gaps are especially pronounced along lines of gender, caste, regional origin, religion, and disability—factors that are uniquely relevant in India’s socio‑cultural landscape.

This study uses Fuzzy Decision‑Making Trial and Evaluation Laboratory (Fuzzy DEMATEL) analysis to map the causal links between twelve key factors that drive algorithmic bias in AI‑assisted HR decision‑making in Indian firms. We gathered expert views from 22 DEI professionals, HR technology auditors, and organizational‑behavior scholars from various industries. The Fuzzy DEMATEL results point to Historical Training Data Bias (D‑R = +1.247) and Lack of Algorithmic Transparency (D‑R = +1.083) as the main cause‑group drivers of DEI gaps. On the effect side, Discriminatory Hiring Outcomes (D‑R = -1.312) and Inequitable Promotion Decisions (D‑R = -1.187) emerge as the most severe resultants.

The research uncovers a three‑tiered bias‑propagation architecture: Structural Bias Sources, Process‑Level Amplifiers, and Outcome‑Level Manifestations. To address these, we propose a FAIR‑AI Framework—Fairness Auditing, Inclusive Data Design, Regulatory Compliance, and Representation Monitoring—for systematic DEI bias mitigation in Indian corporate AI‑HR ecosystems. The findings have important implications for corporate DEI policy, HR technology governance, and India’s evolving AI regulatory landscape.

Keywords: Fuzzy DEMATEL, Algorithmic Bias, DEI, AI in HR, Indian Corporates, Gender Bias, Caste Discrimination, MCDM, FAIR‑AI Framework, HR Technology Governance

1. Introduction`;

const page2 = `India's corporate sector is at a critical inflection point as it integrates AI into HR decision‑making. By 2024, more than 78% of Fortune India 500 companies already use some form of AI‑driven recruitment or performance‑management tool [CITATION_001]. The speed and scale of algorithmic HR adoption have outpaced the development of governance frameworks, fairness‑audit standards, and regulatory oversight. This mismatch means that AI systems marketed as objective and bias‑free can actually propagate historical inequities at an unprecedented scale and speed.

Algorithmic bias in HR refers to the consistent tendency of AI decision systems to produce outcomes that disadvantage people or groups based on protected characteristics—gender, caste, religion, regional origin, disability, or age (Barocas & Selbst, 2016). In India, these dimensions are especially significant. Caste discrimination, which the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989 forbids, is still evident in AI systems trained on past hiring data that underrepresent Dalit, Adivasi, and OBC candidates in senior roles. Gender bias in AI performance appraisals consistently undervalues women’s contributions compared to men in the same roles [CITATION_002]. Regional and linguistic bias in NLP‑based screening tools penalizes candidates whose written English reflects non‑metropolitan educational backgrounds.

India has long championed equality and affirmative action, yet AI‑assisted HR systems in corporates can act as sophisticated mechanisms that mask historical discrimination as algorithmic authority. Eubanks (2018) calls this ‘automating inequality,’ and it demands urgent attention from scholars and practical solutions from HR professionals. Multi‑criteria decision‑making (MCDM) methods, such as Fuzzy DEMATEL, can help uncover the structure of factors that drive algorithmic bias, giving HR decision‑makers leverage points within this complex web [CITATION_003].`;

async function main() {
  const p1Pars = page1.split('\n\n').map((p) => new Paragraph({
    children: [new TextRun({ text: p, font: 'Calibri', size: 24 })],
    spacing: { after: 200 },
  }));

  const p2Pars = page2.split('\n\n').map((p) => new Paragraph({
    children: [new TextRun({ text: p, font: 'Calibri', size: 24 })],
    spacing: { after: 200 },
  }));

  const doc = new Document({
    sections: [
      {
        children: [
          ...p1Pars,
          new Paragraph({ pageBreakBefore: true, children: [] }),
          ...p2Pars,
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = 'C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment (Pages 1-2 Humanized).docx';
  fs.writeFileSync(outPath, buf);
  console.log('✅ Created DOCX successfully at:', outPath);
}

main().catch(console.error);
