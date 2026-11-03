import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Script } from 'node:vm';

const files = ['server.js', ...['js', 'scripts', 'tests'].flatMap(dir =>
  readdirSync(dir).filter(name => name.endsWith('.js')).map(name => `${dir}/${name}`))];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
let inlineCount = 0;
for (const file of readdirSync('.').filter(name => name.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  for (const [, attributes, source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/.test(attributes) || !source.trim()) continue;
    const type = attributes.match(/\btype\s*=\s*["']([^"']+)/i)?.[1];
    if (type && !['text/javascript', 'application/javascript'].includes(type)) continue;
    new Script(source, { filename: `${file}:inline-${++inlineCount}` });
  }
}
console.log(`Syntax checked ${files.length} JavaScript files and ${inlineCount} inline scripts.`);
