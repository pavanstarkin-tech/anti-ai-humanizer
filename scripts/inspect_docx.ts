import fs from 'fs';
import JSZip from 'jszip';

async function inspectDocx() {
  const filePath = 'C:\\Users\\shese\\Downloads\\2. Bias in AI recruitment.docx';
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);

  console.log('--- ALL FILES INSIDE ORIGINAL DOCX ARCHIVE ---');
  Object.keys(zip.files).forEach((name) => console.log('📁 ' + name));

  const docXml = await zip.file('word/document.xml')?.async('string');
  if (docXml) {
    console.log('\n--- DOCUMENT XML STATS ---');
    console.log('Total XML size:', docXml.length, 'characters');
    console.log('Tables (<w:tbl>):', (docXml.match(/<w:tbl[\s>]/g) || []).length);
    console.log('Drawings/Figures (<w:drawing>):', (docXml.match(/<w:drawing[\s>]/g) || []).length);
    console.log('Embedded Images (<w:pict>):', (docXml.match(/<w:pict[\s>]/g) || []).length);
    console.log('Page Breaks (<w:lastRenderedPageBreak> / <w:br w:type="page">):', (docXml.match(/w:lastRenderedPageBreak|<w:br[^>]*w:type="page"/g) || []).length);
    console.log('Paragraphs count (<w:p[ >]):', (docXml.match(/<w:p[ >]/g) || []).length);
  }
}

inspectDocx().catch(console.error);
