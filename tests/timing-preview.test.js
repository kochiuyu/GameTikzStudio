import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrowser } from './browser.js';

function previewFixture({ width = 654, height = 514, dpr = 1 } = {}) {
  const context = loadBrowser('game-timing.js');
  const commands = [];
  const draw = new Proxy({ measureText: text => ({ width: text.length * 6 }) }, {
    get: (target, key) => target[key] ?? ((...args) => commands.push([key, ...args]))
  });
  const canvas = {
    style: {}, getContext: () => draw,
    getBoundingClientRect() { throw new Error('Drawing must not depend on the zoomed canvas'); }
  };
  const viewport = { offsetWidth: width, offsetHeight: height, scrollLeft: 0, scrollTop: 0 };
  const elements = {
    'timing-canvas': canvas,
    'timing-preview-viewport': viewport,
    'timing-preview-zoom': {},
    'timing-preview-zoom-in': {},
    'timing-preview-zoom-out': {},
    'timing-preview-fit': { setAttribute(key, value) { this[key] = value; } }
  };
  context.document.getElementById = id => elements[id] || null;
  context.devicePixelRatio = dpr;
  const app = context.GameTimingApp;
  app.renderAll();
  return { app, canvas, viewport, elements, commands };
}

test('preview fits the full diagram inside both viewport dimensions', () => {
  const { canvas, viewport, elements } = previewFixture();
  assert.equal(canvas.width, 820);
  assert.equal(canvas.height, 480);
  assert.equal(parseFloat(canvas.style.width), viewport.offsetWidth - 34);
  assert.ok(parseFloat(canvas.style.height) <= viewport.offsetHeight - 34);
  assert.equal(elements['timing-preview-zoom'].textContent, '76%');
  assert.equal(elements['timing-preview-fit']['aria-pressed'], 'true');
});

test('first-stage wrapped labels remain inside the canvas border', () => {
  const { commands } = previewFixture();
  const labels = commands.filter(([method, , x]) => method === 'fillText' && x === 100);
  assert.ok(labels.length > 0);
  assert.ok(labels.every(([, text, x]) => x - text.length * 6 / 2 >= 10));
});

test('zoom changes only presentation, retaining full export pixels, model and TikZ', () => {
  const { app, canvas, commands } = previewFixture({ dpr: 2 });
  const model = JSON.stringify(app.getState());
  const code = app.generateTikZCode(true);
  const drawing = JSON.stringify(commands);
  app.resetPreviewZoom();
  assert.equal(canvas.style.width, '820px');
  assert.equal(canvas.style.height, '480px');
  app.zoomPreview(1);
  app.zoomPreview(1);
  assert.equal(canvas.style.width, '1281.25px');
  assert.equal(canvas.width, 1640);
  assert.equal(canvas.height, 960);
  assert.equal(JSON.stringify(commands), drawing, 'zoom must not redraw or resize backing pixels');
  commands.length = 0;
  app.renderAll();
  assert.equal(JSON.stringify(commands), drawing, 'rendering while zoomed must preserve export geometry');
  assert.equal(canvas.style.width, '1281.25px');
  assert.equal(JSON.stringify(app.getState()), model);
  assert.equal(app.generateTikZCode(true), code);
});

test('zoom limits disable the matching controls and reset restores the origin', () => {
  const { app, canvas, viewport, elements } = previewFixture();
  for (let i = 0; i < 50; i++) app.zoomPreview(1);
  assert.equal(elements['timing-preview-zoom'].textContent, '300%');
  assert.equal(elements['timing-preview-zoom-in'].disabled, true);
  assert.equal(elements['timing-preview-fit']['aria-pressed'], 'false');
  for (let i = 0; i < 50; i++) app.zoomPreview(-1);
  assert.equal(elements['timing-preview-zoom'].textContent, '10%');
  assert.equal(elements['timing-preview-zoom-out'].disabled, true);
  assert.equal(elements['timing-preview-zoom-in'].disabled, false);
  viewport.scrollLeft = 100;
  viewport.scrollTop = 200;
  app.resetPreviewZoom();
  assert.equal(canvas.style.width, '820px');
  assert.equal(viewport.scrollLeft, 0);
  assert.equal(viewport.scrollTop, 0);
  assert.equal(elements['timing-preview-zoom-out'].disabled, false);
});

test('zoom preserves the point in the middle of a scrolled preview', () => {
  const { app, viewport } = previewFixture();
  app.resetPreviewZoom();
  viewport.scrollLeft = 80;
  app.zoomPreview(1);
  assert.equal(viewport.scrollLeft, 177.5);
  assert.equal(viewport.scrollTop, 60);
  app.zoomPreview(-1);
  assert.equal(viewport.scrollLeft, 80);
  assert.equal(viewport.scrollTop, 0);
});

test('Fit recovers the complete diagram after scrolling, resizing and model edits', () => {
  const { app, canvas, viewport, elements } = previewFixture();
  app.zoomPreview(1);
  viewport.scrollLeft = 250;
  viewport.scrollTop = 150;
  viewport.offsetWidth = 354;
  viewport.offsetHeight = 274;
  app.fitPreview();
  assert.ok(parseFloat(canvas.style.width) <= 320);
  assert.ok(parseFloat(canvas.style.height) <= 240);
  assert.equal(viewport.scrollLeft, 0);
  assert.equal(viewport.scrollTop, 0);
  app.getState().phases[0].name = 'LongPhaseName'.repeat(50);
  app.renderAll();
  assert.ok(canvas.height > 480);
  assert.ok(parseFloat(canvas.style.height) <= 240);
  assert.equal(elements['timing-preview-fit']['aria-pressed'], 'true');
  const height = canvas.height;
  app.renderAll();
  assert.equal(canvas.height, height, 'fit must not compound dimensions on rerender');
});

test('large panels use viewport dimensions rather than a previously zoomed canvas', () => {
  const { app, canvas, viewport } = previewFixture({ width: 1234, height: 514 });
  assert.equal(canvas.width, 1200);
  app.resetPreviewZoom();
  app.zoomPreview(1);
  assert.equal(canvas.style.width, '1500px');
  app.renderAll();
  assert.equal(canvas.width, 1200);
  viewport.offsetWidth = 1034;
  app.renderAll();
  assert.equal(canvas.width, 1000);
  assert.equal(canvas.style.width, '1250px');
});

test('very tall diagrams can fit below the manual minimum without zooming out upwards', () => {
  const { app, canvas, elements } = previewFixture({ height: 274 });
  app.getState().phases[0].name = 'LongPhaseName'.repeat(500);
  app.renderAll();
  const fitHeight = canvas.style.height;
  assert.ok(parseInt(elements['timing-preview-zoom'].textContent) < 10);
  app.zoomPreview(-1);
  assert.equal(canvas.style.height, fitHeight);
  assert.equal(elements['timing-preview-fit']['aria-pressed'], 'true');
  app.zoomPreview(1);
  assert.equal(elements['timing-preview-zoom'].textContent, '10%');
});
