import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadBrowser } from '../tests/browser.js';

// Optional integration check: requires pdflatex and the packages used by the app.
// Keep logs/PDFs in the printed temporary directory for inspection.
const output = mkdtempSync(join(tmpdir(), 'gametikz-latex-'));
const app = loadBrowser('game-tree.js', 'payoff-matrix.js', 'game-timing.js');
const documents = {
  matrix: app.PayoffMatrixApp.generateTikZCode(true),
  timing: app.GameTimingApp.generateTikZCode(true)
};
for (const name of ['market-entry', 'spence-signaling']) {
  documents[`tree-${name}`] = '\\documentclass{article}\n\\usepackage{tikz}\n' +
    '\\usepackage{amsmath,amssymb}\n\\begin{document}\n' +
    app.GameTreePresets[name]().generateTikZ() + '\n\\end{document}\n';
}
console.log(`LaTeX validation output: ${output}`);
for (const [name, source] of Object.entries(documents)) {
  writeFileSync(join(output, `${name}.tex`), source);
  const result = spawnSync('pdflatex', ['-no-shell-escape', '-interaction=nonstopmode',
    '-halt-on-error', `${name}.tex`], { cwd: output, encoding: 'utf8', timeout: 60000 });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message || result.stdout || result.stderr);
    process.exit(1);
  }
  console.log(`Compiled ${name}.pdf`);
}
