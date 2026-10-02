import { DocumentParser } from '../apps/api/src/modules/processing/document.parser.js';

async function main() {
  const parser = new DocumentParser();
  const doc = await parser.parse('C:\\Users\\shese\\Downloads\\re.pdf', 'application/pdf', 're.pdf');
  console.log('=== RE.PDF PARSED ===');
  console.log('Total pages:', doc.totalPages);
  doc.pages.forEach((p, idx) => {
    console.log(`\n--- PAGE ${p.pageNumber} ---`);
    console.log(p.originalText);
  });
}

main().catch(console.error);
