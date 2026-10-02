import fs from 'fs';
import path from 'path';
import { DocumentParser } from '../apps/api/src/modules/processing/document.parser.ts';
import { nvidiaOrchestrator } from '../apps/api/src/modules/ai/nvidia/nvidia.orchestrator.ts';
import { ExpertType } from '../packages/shared/src/index.ts';

async function processFirstTwoPages() {
  const filePath = 'C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment.docx';
  console.log(`\n======================================================`);
  console.log(`📄 PROCESSING FIRST 2 PAGES OF:`);
  console.log(`   ${filePath}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found at: ${filePath}`);
    return;
  }

  const parser = new DocumentParser();
  const parsedDoc = await parser.parse(
    filePath,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '2. Bias in AI recruitment.docx'
  );

  console.log(`✅ Parsed total pages: ${parsedDoc.totalPages}`);
  const pagesToProcess = parsedDoc.pages.slice(0, 2);

  const results: Array<{
    pageNumber: number;
    originalText: string;
    humanizedText: string;
    changesSummary: string;
    modelUsed: string;
  }> = [];

  for (const page of pagesToProcess) {
    console.log(`\n⚡ Processing Page ${page.pageNumber}...`);
    const startTime = Date.now();

    const candidate = await nvidiaOrchestrator.generateCandidate(
      page.originalText,
      ExpertType.GENERAL_WRITING,
      null,
      'Rewrite naturally, fluently, and clearly without changing facts or meaning.',
      { iteration: 1 }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Page ${page.pageNumber} completed in ${elapsed}s using model: ${candidate.modelUsed}`);

    results.push({
      pageNumber: page.pageNumber,
      originalText: page.originalText,
      humanizedText: candidate.rewrittenText,
      changesSummary: candidate.changesSummary,
      modelUsed: candidate.modelUsed,
    });
  }

  // Save the result to a text/markdown file for immediate reference
  const outputPath = 'C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment - Pages 1 and 2 (Humanized).txt';
  let fullOutput = `======================================================\nHUMANIZED FIRST 2 PAGES\nDocument: 2. Bias in AI recruitment.docx\nProcessed with: openai/gpt-oss-20b via NVIDIA integrate API\n======================================================\n\n`;

  for (const res of results) {
    fullOutput += `\n######################################################\n`;
    fullOutput += `### PAGE ${res.pageNumber}\n`;
    fullOutput += `######################################################\n\n`;
    fullOutput += `--- ORIGINAL TEXT ---\n${res.originalText}\n\n`;
    fullOutput += `--- HUMANIZED TEXT ---\n${res.humanizedText}\n\n`;
    fullOutput += `--- SUMMARY OF ENHANCEMENTS ---\n${res.changesSummary}\n\n`;
  }

  fs.writeFileSync(outputPath, fullOutput, 'utf-8');
  console.log(`\n💾 Saved humanized output to: ${outputPath}\n`);

  console.log(`=== FULL PROCESSED OUTPUT PREVIEW ===\n`);
  for (const res of results) {
    console.log(`\n------------------ PAGE ${res.pageNumber} ------------------`);
    console.log(res.humanizedText);
  }
}

processFirstTwoPages().catch(console.error);
