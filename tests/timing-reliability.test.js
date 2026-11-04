import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadBrowser } from './browser.js';

const plain = value => JSON.parse(JSON.stringify(value));
const appFixture = () => loadBrowser('game-timing.js').GameTimingApp;
const memberships = app => Object.fromEntries(app.getState().phases.map(ph => [ph.name, [...ph.stageIds].sort()]));

function threeStagePhase() {
  const app = appFixture();
  const state = app.getState();
  state.phases = [{ name: 'Grouped', from: 0, to: 2 }, { name: 'Final', from: 3, to: 3 }];
  return app;
}

test('all legacy timing presets migrate exact phase names and stage memberships', () => {
  const app = appFixture();
  for (const [id, preset] of Object.entries(app.getPresets())) {
    const original = plain(preset);
    app.loadPreset(id);
    const state = app.getState();
    assert.deepEqual(plain(app.getPhaseRanges()), original.phases);
    for (let i = 0; i < state.phases.length; i++) {
      const expected = original.stages.slice(original.phases[i].from, original.phases[i].to + 1).map(s => s.id);
      assert.deepEqual(plain(state.phases[i].stageIds), expected);
    }
    assert.deepEqual(plain(preset), original, 'migration must not mutate preset definitions');
    assert.doesNotMatch(app.generateTikZCode(true), /undefined|NaN/);
  }
});

test('reordering splits a phase without including an unrelated stage and rejoins it', () => {
  const app = appFixture();
  const before = memberships(app);
  app.moveStage(1, 1);
  assert.deepEqual(memberships(app), before);
  const group = 'Market Equilibrium & Payoffs';
  assert.deepEqual(plain(app.getPhaseRanges()).filter(ph => ph.name === group), [
    { name: group, from: 1, to: 1 }, { name: group, from: 3, to: 3 }
  ]);
  const tikz = app.generateTikZCode(false);
  assert.equal(tikz.split('Market Equilibrium \\& Payoffs').length - 1, 2);
  app.moveStage(2, -1);
  assert.deepEqual(plain(app.getPhaseRanges()).filter(ph => ph.name === group), [
    { name: group, from: 2, to: 3 }
  ]);
});

for (const [label, index] of [['first', 0], ['middle', 1], ['last', 2]]) {
  test(`deleting ${label} phase stage keeps exactly the surviving members`, () => {
    const app = threeStagePhase();
    const ids = plain(app.getState().stages.map(s => s.id));
    app.deleteStage(index);
    assert.deepEqual(plain(app.getState().phases[0].stageIds), ids.slice(0, 3).filter((_, i) => i !== index));
    assert.deepEqual(plain(app.getPhaseRanges()), [
      { name: 'Grouped', from: 0, to: 1 }, { name: 'Final', from: 2, to: 2 }
    ]);
  });
}

test('deleting the only member removes the phase, not an unrelated stage label', () => {
  const app = threeStagePhase();
  app.deleteStage(3);
  assert.deepEqual(plain(app.getPhaseRanges()), [{ name: 'Grouped', from: 0, to: 2 }]);
  assert.doesNotMatch(app.generateTikZCode(false), /\{Final\}/);
});

test('deleting an intervening stage reunites split phase runs', () => {
  const app = appFixture();
  app.moveStage(1, 1);
  app.deleteStage(2);
  assert.deepEqual(plain(app.getPhaseRanges()).filter(ph => ph.name === 'Market Equilibrium & Payoffs'), [
    { name: 'Market Equilibrium & Payoffs', from: 1, to: 2 }
  ]);
});

test('new stages stay outside existing phases, even when moved inside them', () => {
  const app = threeStagePhase();
  app.addStage();
  const added = app.getState().stages[4].id;
  app.moveStage(4, -1);
  app.moveStage(3, -1);
  assert.ok(app.getState().phases.every(ph => !ph.stageIds.includes(added)));
  assert.deepEqual(plain(app.getPhaseRanges()), [
    { name: 'Grouped', from: 0, to: 1 }, { name: 'Grouped', from: 3, to: 3 },
    { name: 'Final', from: 4, to: 4 }
  ]);
});

test('rapid adds and imported ID collisions never create duplicate stage IDs', () => {
  const context = loadBrowser('game-timing.js');
  vm.runInContext('Date.now = function() { return 123; };', context);
  const app = context.GameTimingApp;
  app.getState().stages[0].id = 'stage-added-0';
  for (let i = 0; i < 100; i++) app.addStage();
  const ids = app.getState().stages.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('JSON round trip retains discontiguous membership rather than legacy bounds', () => {
  const app = appFixture();
  app.moveStage(1, 1);
  const saved = plain(app.getState());
  const restored = appFixture();
  Object.assign(restored.getState(), saved);
  restored.renderAll();
  assert.deepEqual(plain(restored.getPhaseRanges()), plain(app.getPhaseRanges()));
  assert.equal(restored.generateTikZCode(false), app.generateTikZCode(false));
});

test('invalid stage edits are no-ops and final remaining stage cannot be deleted', () => {
  const app = appFixture();
  const before = plain(app.getState());
  for (const index of [-1, 99, 0.5, NaN, '0']) {
    app.moveStage(index, 1);
    app.deleteStage(index);
  }
  app.moveStage(0, -1);
  app.moveStage(0, 2);
  assert.deepEqual(plain(app.getState()), before);
  while (app.getState().stages.length > 1) app.deleteStage(0);
  app.deleteStage(0);
  assert.equal(app.getState().stages.length, 1);
});

test('stage editor escapes imported text and marks fields for draft persistence', () => {
  const context = loadBrowser('game-timing.js');
  const container = { innerHTML: '' };
  context.document.getElementById = id => id === 'stages-editor-list' ? container : null;
  const app = context.GameTimingApp;
  const dangerous = '\"><img src=x onerror=alert(1)></textarea><script>bad()</script>&';
  for (const prop of ['timeLabel', 'player', 'action', 'information', 'payoff']) {
    app.getState().stages[0][prop] = dangerous;
  }
  app.renderAll();
  assert.doesNotMatch(container.innerHTML, /<img|<script/);
  assert.ok(container.innerHTML.includes('&quot;&gt;&lt;img'));
  for (const prop of ['timeLabel', 'player', 'action', 'information', 'payoff']) {
    assert.ok(container.innerHTML.includes(`data-project-path="stages.0.${prop}"`));
  }
  assert.equal(app.getState().stages[0].action, dangerous);
});

test('canvas draws split phase labels over the same separate runs as TikZ', () => {
  const context = loadBrowser('game-timing.js');
  const labels = [];
  const draw = new Proxy({
    measureText: text => ({ width: text.length * 6 }),
    fillText: (text, x, y) => { if (draw.fillStyle === '#334155') labels.push({ text, x, y }); }
  }, { get: (target, key) => target[key] ?? (() => {}) });
  const canvas = { getContext: () => draw, getBoundingClientRect: () => ({ width: 820, height: 480 }) };
  context.document.getElementById = id => id === 'timing-canvas' ? canvas : null;
  context.GameTimingApp.moveStage(1, 1);
  for (const x of [100 + 590 / 3, 690]) {
    const group = labels.filter(label => label.x === x);
    assert.equal(group.map(label => label.text).join(' '), 'Market Equilibrium & Payoffs');
    assert.ok(group.length > 1);
    assert.ok(group.every(label => label.text.length * 6 <= 158));
    assert.ok(group.every(label => label.y >= 20));
  }
  const code = context.GameTimingApp.generateTikZCode(false);
  assert.equal((code.match(/text width=2\.73cm, align=center, inner xsep=0pt/g) || []).length, 4);
  const initialHeight = canvas.height;
  context.GameTimingApp.renderAll();
  assert.equal(canvas.height, initialHeight, 'repeated renders must not keep expanding');
});

test('long phase names expand canvas vertically and break long words within a run', () => {
  const context = loadBrowser('game-timing.js');
  const labels = [];
  const draw = new Proxy({
    measureText: text => ({ width: text.length * 6 }),
    fillText: (text, x, y) => { if (draw.fillStyle === '#334155') labels.push({ text, x, y }); }
  }, { get: (target, key) => target[key] ?? (() => {}) });
  const canvas = { getContext: () => draw, getBoundingClientRect: () => ({ width: 820, height: canvas.height || 480 }) };
  context.document.getElementById = id => id === 'timing-canvas' ? canvas : null;
  const app = context.GameTimingApp;
  app.getState().phases[0].name = 'LongPhaseName'.repeat(20);
  app.renderAll();
  assert.ok(canvas.height > 480);
  assert.ok(labels.every(label => label.y >= 20));
  assert.ok(labels.filter(label => label.x === 100).every(label => label.text.length * 6 <= 158));
  const height = canvas.height;
  app.renderAll();
  assert.equal(canvas.height, height);
});
