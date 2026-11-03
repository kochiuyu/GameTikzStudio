import { cpSync, mkdirSync, rmSync } from 'node:fs';

// Only public application assets belong in the Pages artifact.
const output = new URL('../dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
for (const entry of ['index.html', 'GameTree.html', 'PayoffMatrix.html', 'GameTiming.html', 'Help.html', 'css', 'js', '.nojekyll']) {
  cpSync(new URL('../' + entry, import.meta.url), new URL(entry, output), { recursive: true });
}
console.log('Static site built in dist/');
