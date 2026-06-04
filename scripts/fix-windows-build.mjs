// eslint-disable-next-line no-restricted-imports
import fs from 'fs';
import path from 'path';

function fixWindowsBuild(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('__next.')) {
        // Check if it contains __PAGE__.txt
        const pageTxtPath = path.join(fullPath, '__PAGE__.txt');
        if (fs.existsSync(pageTxtPath)) {
          const newFilePath = fullPath + '.__PAGE__.txt';
          console.log(`Fixing Windows build bug: Moving ${pageTxtPath} to ${newFilePath}`);
          fs.renameSync(pageTxtPath, newFilePath);
          fs.rmdirSync(fullPath); // remove the empty directory
          continue;
        }
      }
      fixWindowsBuild(fullPath);
    }
  }
}

const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  console.log('Running Windows build fix on out directory...');
  fixWindowsBuild(outDir);
  console.log('Build fix complete.');
}
