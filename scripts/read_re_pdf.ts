import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function main() {
  try {
    const dataBuffer = fs.readFileSync('C:\\Users\\shese\\Downloads\\re.pdf');
    const data = await pdf(dataBuffer);
    console.log('=== RE.PDF TEXT START ===');
    console.log(data.text);
    console.log('=== RE.PDF TEXT END ===');
  } catch (err) {
    console.error('Error reading re.pdf:', err);
  }
}

main();
