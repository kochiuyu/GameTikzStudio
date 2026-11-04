import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { loadBrowser } from './browser.js';

function fixture() {
  const context = loadBrowser('payoff-matrix.js');
  const app = context.PayoffMatrixApp;
  app.getState().cells = [
    [{ u1: '2', u2: '2' }, { u1: '0', u2: '1' }],
    [{ u1: '1', u2: '1' }, { u1: '2', u2: '2' }]
  ];
  const insight = { innerHTML: '' };
  context.document.getElementById = id => id === 'matrix-insight-container' ? insight : null;
  return { context, app, insight };
}

for (const value of ['10-c', '2x', '3 + 1', '1/2junk', '1/0', '1/-0', '1e309', '-Infinity', 'Infinity', 'NaN', '', ' ', '0x10', '2,5', '\\frac{1}{2}', '1 / 2 / 3', '1e', '--1', '1e309/1e309', Infinity, NaN, null, true]) {
  test(`rejects incomplete or non-finite numeric payoff ${String(value)}`, () => {
    const { app } = fixture();
    app.getState().cells[0][0].u1 = value;
    app.computeBestResponses();
    assert.equal(app.analyzePayoffs().complete, false);
    assert.equal(app.getState().cells[0][0].p1Underline, false);
    assert.equal(app.getState().cells[1][0].p1Underline, false, 'unknown alternative cannot be ignored');
  });
}

for (const value of ['2', '  +2  ', '2.0', '2.', '.2e1', '2e+0', '4 / 2', '-4 / -2', '+1.0 / .5', 2]) {
  test(`accepts complete finite numeric payoff ${String(value)}`, () => {
    const { app } = fixture();
    app.getState().cells[0][0].u1 = value;
    app.computeBestResponses();
    assert.equal(app.analyzePayoffs().complete, true);
    assert.equal(app.getState().cells[0][0].p1Underline, true);
    assert.equal(app.getState().cells[0][0].isNE, true);
  });
}

test('unknown comparisons do not suppress unrelated verified equilibria or assert uniqueness', () => {
  const { app, insight } = fixture();
  app.getState().cells[0][1].u1 = '10-c';
  app.computeBestResponses();
  assert.equal(app.getState().cells[0][0].isNE, true);
  assert.equal(app.getState().cells[1][1].isNE, false);
  assert.match(insight.innerHTML, /Numeric analysis incomplete/);
  assert.match(insight.innerHTML, /1 pure Nash equilibrium outcome\(s\) verified; other equilibria may exist/);
  assert.doesNotMatch(insight.innerHTML, /Unique Pure/);
});

test('unknown player-two alternatives invalidate the whole row comparison', () => {
  const { app } = fixture();
  app.getState().cells[0][1].u2 = '3x';
  app.computeBestResponses();
  assert.equal(app.getState().cells[0][0].p2Underline, false);
  assert.equal(app.getState().cells[0][1].p2Underline, false);
  assert.equal(app.getState().cells[1][1].p2Underline, true);
});

test('symbolic games and manual annotations never establish absence or verified equilibria', () => {
  const { app, insight } = fixture();
  app.getState().cells.forEach(row => row.forEach(cell => { cell.u1 = 'a'; cell.u2 = 'b'; }));
  app.computeBestResponses();
  app.toggleNE(0, 0);
  assert.equal(app.getState().cells[0][0].isNE, true, 'manual annotations remain supported');
  assert.match(insight.innerHTML, /absence cannot be concluded/);
  assert.doesNotMatch(insight.innerHTML, /No Pure Strategy Nash Equilibrium|Unique Pure|Mixed Strategy Game/);
  assert.equal(app.analyzePayoffs().equilibria.length, 0);
});

test('eliminated symbolic strategies are excluded; empty games have no absence claim', () => {
  const { app, insight } = fixture();
  app.getState().cells[0][0].u1 = 'a';
  app.getState().cells[0][1].u2 = 'b';
  app.toggleElimination('row', 0);
  assert.equal(app.analyzePayoffs().complete, true);
  assert.match(insight.innerHTML, /remaining active strategies/);
  app.toggleElimination('row', 1);
  assert.match(insight.innerHTML, /No active strategy outcomes/);
  assert.equal(app.analyzePayoffs().complete, false);
  assert.equal(app.analyzePayoffs().equilibria.length, 0);
});

test('complete numeric no-equilibrium game makes only supported claims', () => {
  const { app, insight } = fixture();
  app.loadPreset('matching-pennies');
  assert.match(insight.innerHTML, /No Pure Strategy Nash Equilibrium/);
  assert.doesNotMatch(insight.innerHTML, /characteristic of zero-sum|will randomize/);
});

test('reconcileState updates automatic marks without rendering or replacing state', () => {
  const { app, context } = fixture();
  const state = app.getState();
  state.cells[0][0].u1 = '2x';
  context.document.getElementById = () => { throw new Error('should not render'); };
  app.reconcileState();
  assert.equal(app.getState(), state);
  assert.equal(state.cells[0][0].isNE, false);
});

test('SVG is standalone vector markup with escaped labels, payoff annotations and eliminations', () => {
  const { app } = fixture();
  const state = app.getState();
  state.title = 'A & <script>"title"</script>\u0001';
  state.player1.name = 'Alice & Bob';
  state.player2.name = 'P<2>';
  state.player1.strategies[0] = 'Stay <safe>';
  state.player2.probabilities[0] = 'q&"';
  state.cells[0][0].u1 = '10-c < &';
  state.cells[0][0].p1Underline = true;
  state.cells[0][0].isNE = true;
  state.eliminatedRows = [1];
  const svg = app.generateSVG();
  assert.match(svg, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /<rect /);
  assert.match(svg, /<text /);
  assert.match(svg, /text-decoration="underline"/);
  assert.match(svg, /stroke-dasharray="8 6"/);
  assert.match(svg, /NE★/);
  assert.match(svg, /A &amp; &lt;script&gt;&quot;title&quot;&lt;\/script&gt;/);
  assert.match(svg, /Stay &lt;safe&gt;/);
  assert.match(svg, /10-c &lt; &amp;/);
  assert.match(svg, /q&amp;&quot;/);
  assert.doesNotMatch(svg, /<image|data:image|<script|foreignObject|\u0001/);
  assert.ok(svg.endsWith('</svg>'));
  state.options.showProbabilities = false;
  state.options.neBadge = false;
  const simple = app.generateSVG();
  assert.doesNotMatch(simple, /q&amp;&quot;|NE★/);
});

test('matrix editor escapes imported text and exposes every draft field path', () => {
  const { app, context } = fixture();
  const nodes = new Map(['p1-strategies-container', 'p2-strategies-container', 'matrix-editor-grid', 'matrix-insight-container', 'tikz-code-area', 'tikz-code-highlight'].map(id => [id, { innerHTML: '' }]));
  context.document.getElementById = id => nodes.get(id) || null;
  const attack = '"><img src=x onerror="bad()">&';
  const state = app.getState();
  state.player1.strategies[0] = attack;
  state.player2.strategies[0] = attack;
  state.player1.probabilities[0] = attack;
  state.player2.probabilities[0] = attack;
  state.cells[0][0].u1 = attack;
  state.cells[0][0].u2 = attack;
  app.renderAll();
  for (const id of ['p1-strategies-container', 'p2-strategies-container', 'matrix-editor-grid', 'tikz-code-highlight']) {
    assert.doesNotMatch(nodes.get(id).innerHTML, /<img/);
    assert.match(nodes.get(id).innerHTML, /&lt;img/);
  }
  for (const n of [1, 2]) {
    const html = nodes.get(`p${n}-strategies-container`).innerHTML;
    assert.ok(html.includes(`data-project-path="player${n}.strategies.0"`));
    assert.ok(html.includes(`data-project-path="player${n}.probabilities.0"`));
    assert.ok(nodes.get('matrix-editor-grid').innerHTML.includes(`data-project-path="cells.0.0.u${n}"`));
  }
});

test('download handler emits SVG MIME and actual vector content; PNG still uses canvas', async () => {
  const { app, context } = fixture();
  const html = readFileSync(new URL('../PayoffMatrix.html', import.meta.url), 'utf8');
  const start = html.indexOf('    function exportMatrixImage(format)');
  const end = html.indexOf('\n    function showToast', start);
  let capturedBlob, clicked = 0, pngCalls = 0, revoked;
  const link = { click() { clicked++; } };
  context.document.createElement = () => link;
  context.document.getElementById = () => ({ toDataURL(type) { assert.equal(type, 'image/png'); pngCalls++; return 'data:image/png;base64,PNG'; } });
  context.Blob = Blob;
  context.URL = { createObjectURL(blob) { capturedBlob = blob; return 'blob:vector'; }, revokeObjectURL(url) { revoked = url; } };
  context.setTimeout = callback => callback();
  context.showToast = () => {};
  vm.runInContext(html.slice(start, end), context);
  context.exportMatrixImage('svg');
  assert.equal(capturedBlob.type, 'image/svg+xml;charset=utf-8');
  assert.equal(await capturedBlob.text(), app.generateSVG());
  assert.match(link.download, /\.svg$/);
  assert.equal(link.href, 'blob:vector');
  assert.equal(pngCalls, 0);
  assert.equal(revoked, 'blob:vector');
  context.exportMatrixImage('png');
  assert.equal(pngCalls, 1);
  assert.match(link.download, /\.png$/);
  assert.equal(link.href, 'data:image/png;base64,PNG');
  context.exportMatrixImage('exe');
  assert.equal(clicked, 2);
});
