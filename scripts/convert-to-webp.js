const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const GALLERY_DIR = path.join(__dirname, 'public', 'assets', 'images');
const QUALITY = 82;

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

async function convertToWebP(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const outPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  if (fs.existsSync(outPath)) {
    console.log('  SKIP: ' + path.relative(GALLERY_DIR, outPath));
    skipped++;
    return;
  }

  const statBefore = fs.statSync(filePath).size;
  await sharp(filePath).webp({ quality: QUALITY }).toFile(outPath);
  const statAfter = fs.statSync(outPath).size;

  totalBefore += statBefore;
  totalAfter += statAfter;
  converted++;

  const saved = ((1 - statAfter / statBefore) * 100).toFixed(1);
  const beforeKB = (statBefore / 1024).toFixed(0);
  const afterKB = (statAfter / 1024).toFixed(0);
  console.log('  OK  ' + path.basename(filePath).padEnd(32) + beforeKB.padStart(6) + 'KB -> ' + afterKB.padStart(5) + 'KB  (' + saved + '% saved)');
}

async function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log('\n[' + path.relative(GALLERY_DIR, full) + ']');
      await walkDir(full);
    } else {
      await convertToWebP(full);
    }
  }
}

(async () => {
  console.log('Starting WebP conversion  quality=' + QUALITY + '\n');
  const t0 = Date.now();
  await walkDir(GALLERY_DIR);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const savedMB = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(1);
  const savedPct = totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;
  console.log('\n------------------------------------------------------------');
  console.log('Converted : ' + converted + ' files');
  console.log('Skipped   : ' + skipped + ' files');
  console.log('Before    : ' + (totalBefore / 1024 / 1024).toFixed(1) + ' MB');
  console.log('After     : ' + (totalAfter / 1024 / 1024).toFixed(1) + ' MB');
  console.log('Saved     : ' + savedMB + ' MB (' + savedPct + '%)');
  console.log('Time      : ' + elapsed + 's');
  console.log('------------------------------------------------------------');
  console.log('Original files kept. Delete them after verifying the site.');
})();
