import fs from 'fs';
import JSZip from 'jszip';

async function analyzeDocumentXml() {
  const filePath = 'C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment.docx';
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);

  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) return;

  // Let's parse top-level elements inside <w:body>...</w:body>
  const bodyMatch = docXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) {
    console.log('No body found');
    return;
  }

  const bodyContent = bodyMatch[1];
  console.log('Body XML length:', bodyContent.length);

  // Match all top-level elements: either <w:p>...</w:p> or <w:tbl>...</w:tbl> or <w:sectPr>...</w:sectPr>
  const elementRegex = /<w:tbl[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>|<w:sectPr[\s\S]*?<\/w:sectPr>/g;
  let match;
  let tableCount = 0;
  let paraCount = 0;
  let sectCount = 0;

  const topElements: Array<{ type: string; raw: string; text?: string }> = [];

  while ((match = elementRegex.exec(bodyContent)) !== null) {
    const raw = match[0];
    if (raw.startsWith('<w:tbl')) {
      tableCount++;
      topElements.push({ type: 'table', raw });
    } else if (raw.startsWith('<w:sectPr')) {
      sectCount++;
      topElements.push({ type: 'sectPr', raw });
    } else if (raw.startsWith('<w:p')) {
      paraCount++;
      // Extract text inside paragraph
      const textMatches = raw.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = textMatches.map((t) => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')).join('');
      topElements.push({ type: 'paragraph', raw, text });
    }
  }

  console.log(`Top-level elements: ${topElements.length} total.`);
  console.log(`  - Paragraphs: ${paraCount}`);
  console.log(`  - Tables: ${tableCount}`);
  console.log(`  - Section properties (layouts/margins): ${sectCount}`);

  // Sample some paragraphs
  console.log('\n--- FIRST 5 PARAGRAPHS EXTRACTED FROM WORDPROCESSINGML ---');
  topElements
    .filter((e) => e.type === 'paragraph' && e.text && e.text.trim().length > 0)
    .slice(0, 5)
    .forEach((p, idx) => {
      console.log(`[Para ${idx + 1}] (${p.text?.length} chars): ${p.text?.slice(0, 100)}...`);
    });
}

analyzeDocumentXml().catch(console.error);
