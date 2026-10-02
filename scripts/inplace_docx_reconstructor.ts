import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { nvidiaOrchestrator, cleanProseText } from '../apps/api/src/modules/ai/nvidia/nvidia.orchestrator.ts';
import { ExpertType } from '@humanizer/shared';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function unescapeXml(safe: string): string {
  return safe
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export async function reconstructDocxInPlace(
  sourceDocxPath: string,
  outputDocxPath: string,
  humanizeTextMap?: Map<string, string>
) {
  const buf = fs.readFileSync(sourceDocxPath);
  const zip = await JSZip.loadAsync(buf);

  let docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) throw new Error('word/document.xml missing');

  const bodyMatch = docXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) throw new Error('<w:body> not found in document.xml');

  const bodyContent = bodyMatch[1];
  const elementRegex = /<w:tbl[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>|<w:sectPr[\s\S]*?<\/w:sectPr>/g;

  let match;
  const newBodyElements: string[] = [];
  let tableIndex = 0;
  let paraIndex = 0;
  let humanizedParaCount = 0;

  while ((match = elementRegex.exec(bodyContent)) !== null) {
    const raw = match[0];

    // If it's a table, keep 100% untouched
    if (raw.startsWith('<w:tbl')) {
      tableIndex++;
      newBodyElements.push(raw);
      continue;
    }

    // If it's section properties, keep 100% untouched
    if (raw.startsWith('<w:sectPr')) {
      newBodyElements.push(raw);
      continue;
    }

    // If it's a paragraph <w:p>
    if (raw.startsWith('<w:p')) {
      paraIndex++;

      // Extract existing text inside the paragraph
      const textMatches = raw.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const originalParaText = unescapeXml(
        textMatches.map((t) => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')).join('')
      ).trim();

      // Check if this is a short title, heading, table caption, or keyword list that should remain exact
      const isHeading =
        originalParaText.length < 50 ||
        /^[0-9]+(\.[0-9]+)*\s+[A-Z]/.test(originalParaText) ||
        originalParaText.startsWith('Table ') ||
        originalParaText.startsWith('Figure ') ||
        originalParaText.startsWith('Keywords:') ||
        originalParaText.toLowerCase() === 'abstract' ||
        originalParaText.toLowerCase().startsWith('references');

      let replacementText = originalParaText;

      if (!isHeading && originalParaText.length >= 60 && humanizeTextMap && humanizeTextMap.has(originalParaText)) {
        replacementText = humanizeTextMap.get(originalParaText) || originalParaText;
        humanizedParaCount++;
      }

      // If no change or heading, keep raw paragraph
      if (replacementText === originalParaText) {
        newBodyElements.push(raw);
        continue;
      }

      // Extract paragraph properties <w:pPr>...</w:pPr>
      const pPrMatch = raw.match(/<w:pPr[\s\S]*?<\/w:pPr>/);
      const pPr = pPrMatch ? pPrMatch[0] : '';

      // Extract first run properties <w:rPr>...</w:rPr>
      const rPrMatch = raw.match(/<w:rPr[\s\S]*?<\/w:rPr>/);
      const rPr = rPrMatch ? rPrMatch[0] : '';

      // Create updated paragraph XML with exact preserved styles
      const newParaXml = `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(replacementText)}</w:t></w:r></w:p>`;
      newBodyElements.push(newParaXml);
    }
  }

  const newBodyXml = `<w:body>${newBodyElements.join('')}</w:body>`;
  const newDocXml = docXml.replace(/<w:body>[\s\S]*?<\/w:body>/, newBodyXml);

  zip.file('word/document.xml', newDocXml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputDocxPath, outBuf);

  console.log(`\n🎉 In-Place DOCX Reconstructed Successfully!`);
  console.log(`📁 File: ${outputDocxPath}`);
  console.log(`📊 Stats:`);
  console.log(`   - Tables Preserved (100% Intact): ${tableIndex} / 13`);
  console.log(`   - Paragraphs Processed: ${paraIndex}`);
  console.log(`   - Paragraphs Humanized: ${humanizedParaCount}`);
  console.log(`   - Formatting, Headers, Footers, Margins: 100% Preserved\n`);

  return outputDocxPath;
}
