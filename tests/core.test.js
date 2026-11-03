import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrowser } from './browser.js';

const plain = value => JSON.parse(JSON.stringify(value));
function equilibria(app) {
  return plain(app.getState().cells.flatMap((row, r) => row.flatMap((cell, c) => cell.isNE ? [[r, c]] : [])));
}

test('classic games have the expected pure Nash equilibria', () => {
  const { PayoffMatrixApp: app } = loadBrowser('payoff-matrix.js');
  for (const [preset, expected] of [
    ['prisoners-dilemma', [[1, 1]]],
    ['battle-of-sexes', [[0, 0], [1, 1]]],
    ['matching-pennies', []]
  ]) {
    assert.ok(app.getPresets()[preset], preset);
    app.loadPreset(preset);
    app.computeBestResponses();
    assert.deepEqual(equilibria(app), expected, preset);
  }
});

test('fractional, negative and tied payoffs retain every best response', () => {
  const { PayoffMatrixApp: app } = loadBrowser('payoff-matrix.js');
  app.getState().cells = [
    [{ u1: '1/2', u2: '-1/2' }, { u1: '-2', u2: '-1/2' }],
    [{ u1: '0.5', u2: '-3' }, { u1: '-1', u2: '-2' }]
  ];
  app.computeBestResponses();
  assert.deepEqual(equilibria(app), [[0, 0], [1, 1]]);
  assert.equal(app.getState().cells[1][0].p1Underline, true);
  app.toggleElimination('row', 1);
  assert.deepEqual(equilibria(app), [[0, 0], [0, 1]]);
  assert.equal(app.getState().cells[1][0].p1Underline, false);
});

test('symbolic payoffs do not invent numeric equilibria', () => {
  const { PayoffMatrixApp: app } = loadBrowser('payoff-matrix.js');
  app.getState().cells.forEach(row => row.forEach(cell => { cell.u1 = 'a'; cell.u2 = 'b'; }));
  app.computeBestResponses();
  assert.deepEqual(equilibria(app), []);
});

test('matrix and timing exports distinguish snippets from standalone documents', () => {
  const context = loadBrowser('payoff-matrix.js', 'game-timing.js');
  for (const app of [context.PayoffMatrixApp, context.GameTimingApp]) {
    const snippet = app.generateTikZCode(false);
    const standalone = app.generateTikZCode(true);
    assert.ok(snippet.includes('\\begin{tikzpicture}'));
    assert.ok(snippet.includes('\\end{tikzpicture}'));
    assert.ok(!snippet.includes('\\documentclass'));
    assert.ok(standalone.includes('\\usepackage{tikz}'));
    assert.ok(standalone.includes(snippet));
    assert.ok(standalone.includes('\\end{document}'));
    assert.doesNotMatch(standalone, /undefined|NaN/);
  }
  assert.ok(context.PayoffMatrixApp.generateTabularCode().includes('\\begin{tabular}'));
});

function treeFixture(context) {
  const model = new context.GameTreeModel();
  model.rootId = model.createNode({ player: 'P_1' }).id;
  model.addBranch(model.rootId, { action: 'L', type: 'terminal', payoff: '(3, 1)', isEquilibrium: true });
  model.addBranch(model.rootId, { action: 'R', type: 'terminal', payoff: '(0, 2)' });
  model.computeLayout();
  return model;
}

test('tree export preserves branches, payoffs, orientation and saved state', () => {
  const context = loadBrowser('game-tree.js');
  assert.equal(new context.GameTreeModel().generateTikZ(), '% Empty tree');
  const model = treeFixture(context);
  const vertical = model.generateTikZ();
  assert.match(vertical, /\\draw\[eq_branch\]/);
  assert.ok(vertical.includes('(3, 1)'));
  assert.ok(vertical.includes('(0, 2)'));
  assert.equal((vertical.match(/\\node\[terminal/g) || []).length, 2);
  model.orientation = 'horizontal';
  const horizontal = model.generateTikZ();
  assert.notEqual(horizontal, vertical);
  assert.match(horizontal, /right=2pt/);
  const restored = new context.GameTreeModel();
  restored.fromJSON(plain(model.toJSON()));
  assert.equal(restored.generateTikZ(), horizontal);
});

test('game-tree history restores edits, ignores no-ops and clears redo on a new edit', () => {
  const context = loadBrowser('game-tree.js', 'undo-history.js');
  context.gameTreeModel = treeFixture(context);
  const history = context.gameTreeHistory;
  history.init();
  const before = context.gameTreeModel.generateTikZ();
  history.push('No change');
  assert.equal(history.canUndo(), false);
  context.gameTreeModel.addBranch(context.gameTreeModel.rootId, { action: 'Exit', payoff: '(4, 4)' });
  history.push('Add branch');
  const after = context.gameTreeModel.generateTikZ();
  assert.equal(history.undo(), true);
  assert.equal(context.gameTreeModel.generateTikZ(), before);
  assert.equal(history.redo(), true);
  assert.equal(context.gameTreeModel.generateTikZ(), after);
  history.undo();
  context.gameTreeModel.title = 'Alternative edit';
  history.push('Rename');
  assert.equal(history.canRedo(), false);
  assert.equal(history.redo(), false);
});

test('saved tree snapshots remain independent after saving and loading', () => {
  const context = loadBrowser('game-tree.js');
  const model = treeFixture(context);
  const snapshot = model.toJSON();
  const original = plain(snapshot);
  model.nodes[model.rootId].player = 'Changed';
  assert.deepEqual(plain(snapshot), original);
  model.fromJSON(snapshot);
  model.nodes[model.rootId].player = 'Changed again';
  assert.deepEqual(plain(snapshot), original);
});

test('adding a branch after loading a tree never reuses an existing node ID', () => {
  const first = loadBrowser('game-tree.js');
  const snapshot = plain(treeFixture(first).toJSON());
  const fresh = loadBrowser('game-tree.js');
  const restored = new fresh.GameTreeModel();
  restored.fromJSON(snapshot);
  const added = restored.addBranch(restored.rootId, { action: 'New' });
  assert.equal(Object.keys(restored.nodes).length, 4);
  assert.equal(snapshot.nodes[added.id], undefined);
  assert.notEqual(added.id, restored.rootId);
});

test('history refreshes the page while suppressing recursive history entries', () => {
  const context = loadBrowser('game-tree.js', 'undo-history.js');
  context.gameTreeModel = treeFixture(context);
  const history = context.gameTreeHistory;
  history.init();
  context.gameTreeModel.title = 'Changed';
  history.push('Rename');
  let refreshed = 0;
  context.refreshGameTreeUI = () => {
    assert.equal(history.isRestoring, true);
    history.push('Render');
    refreshed++;
  };
  history.undo();
  assert.equal(refreshed, 1);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), true);
});

test('multiline matrix cells and phase ampersands produce compilable LaTeX constructs', () => {
  const context = loadBrowser('payoff-matrix.js', 'game-timing.js');
  const matrix = context.PayoffMatrixApp.generateTikZCode(true);
  assert.ok(matrix.includes('\\shortstack{Cooperate'));
  assert.ok(matrix.includes('\\shortstack{$\\underline{1}'));
  const timing = context.GameTimingApp;
  timing.getState().phases = [{ from: 0, to: 1, name: 'Signaling & Screening' }];
  assert.ok(timing.generateTikZCode(true).includes('Signaling \\& Screening'));
  timing.getState().phases[0].name = 'Already \\& escaped';
  assert.ok(timing.generateTikZCode(true).includes('Already \\& escaped'));
});

test('history limits and corrupt saved data are handled without losing usability', () => {
  const context = loadBrowser('game-tree.js', 'undo-history.js');
  context.gameTreeModel = treeFixture(context);
  const history = context.gameTreeHistory;
  history.maxHistory = 2;
  history.init();
  for (const title of ['One', 'Two', 'Three']) {
    context.gameTreeModel.title = title;
    history.push('Rename');
  }
  assert.equal(history.undoStack.length, 2);
  history.undo();
  history.undo();
  assert.equal(context.gameTreeModel.title, 'One');
  assert.equal(history.undo(), false);
  history.storageKey = 'test-history';
  context.localStorage.setItem(history.storageKey, '{broken');
  assert.equal(history.restoreFromStorage(), false);
  assert.equal(history.isRestoring, false);
});
