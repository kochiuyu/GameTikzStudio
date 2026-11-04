import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrowser } from './browser.js';

const plain = value => JSON.parse(JSON.stringify(value));
function setup(studio) {
  const context = loadBrowser(studio === 'matrix' ? 'payoff-matrix.js' : 'game-timing.js', 'studio-project.js');
  const app = context[studio === 'matrix' ? 'PayoffMatrixApp' : 'GameTimingApp'];
  const project = context.StudioProject.create(app, studio, { bindEvents: false });
  project.init();
  return { context, app, project };
}
for (const studio of ['matrix', 'timing']) {
  test(`${studio}: edits autosave, restore in a fresh context and remain undoable`, () => {
    const { context, app, project } = setup(studio);
    const initial = plain(app.getState());
    if (studio === 'matrix') {
      app.setDimensions(3, 3);
      app.updatePayoff(2, 2, 1, '10-c');
      app.setOption('showProbabilities', false);
      app.toggleElimination('row', 1);
    } else {
      app.addStage();
      app.updateStageProp(4, 'action', 'Saved action');
      app.moveStage(4, -1);
      app.setOption('showInformation', false);
    }
    const saved = plain(app.getState());
    const raw = context.localStorage.getItem(project.storageKey);
    assert.ok(raw);
    const fresh = loadBrowser(studio === 'matrix' ? 'payoff-matrix.js' : 'game-timing.js', 'studio-project.js');
    fresh.localStorage.setItem(project.storageKey, raw);
    const freshApp = fresh[studio === 'matrix' ? 'PayoffMatrixApp' : 'GameTimingApp'];
    const freshProject = fresh.StudioProject.create(freshApp, studio, { bindEvents: false });
    freshProject.init();
    assert.deepEqual(plain(freshApp.getState()), saved);
    assert.equal(freshProject.canUndo(), false);
    app.setOption(studio === 'matrix' ? 'showProbabilities' : 'showInformation', true);
    assert.equal(project.undo(), true);
    assert.deepEqual(plain(app.getState()), saved);
    assert.equal(project.redo(), true);
    assert.notDeepEqual(plain(app.getState()), saved);
    while (project.undo()) {}
    assert.deepEqual(plain(app.getState()), initial);
  });
  test(`${studio}: project round trip, snapshot isolation, no-ops and redo reset`, () => {
    const { app, project } = setup(studio);
    const original = project.serialize();
    app.setOption(studio === 'matrix' ? 'showProbabilities' : 'showInformation', false);
    project.load(original);
    assert.equal(project.canUndo(), true);
    assert.deepEqual(JSON.parse(project.serialize()), JSON.parse(original));
    project.undo();
    assert.equal(app.getState().options[studio === 'matrix' ? 'showProbabilities' : 'showInformation'], false);
    project.redo();
    assert.deepEqual(JSON.parse(project.serialize()), JSON.parse(original));
    project.record();
    project.undo();
    app.loadPreset(studio === 'matrix' ? 'matching-pennies' : 'principal-agent');
    // A known real edit always invalidates redo, independently of preset IDs.
    app.setOption(studio === 'matrix' ? 'neBadge' : 'showPayoffs', false);
    assert.equal(project.canRedo(), false);
    const other = setup(studio);
    other.project.load(original);
    other.app.getState().title = 'Mutated';
    assert.notEqual(other.project.serialize(), original);
    assert.notEqual(JSON.parse(original).state.title, 'Mutated');
    assert.notEqual(app.getState().title, 'Mutated');
  });
  test(`${studio}: invalid, incompatible and future files leave state and history untouched`, () => {
    const { app, project } = setup(studio);
    const original = project.serialize();
    const invalid = JSON.parse(original);
    if (studio === 'matrix') invalid.state.cells[0].pop();
    else invalid.state.stages[1].id = invalid.state.stages[0].id;
    for (const input of ['{broken', '{}', JSON.stringify(invalid), original.replace('"version":1', '"version":2'), original.replace('"studio":"' + studio + '"', '"studio":"other"'), ' '.repeat(2 * 1024 * 1024 + 1)]) {
      assert.throws(() => project.load(input));
      assert.deepEqual(JSON.parse(project.serialize()), JSON.parse(original));
      assert.equal(project.canUndo(), false);
    }
    assert.ok(app.getState().title);
  });
  test(`${studio}: corrupt autosave is preserved until an actual edit`, () => {
    const context = loadBrowser(studio === 'matrix' ? 'payoff-matrix.js' : 'game-timing.js', 'studio-project.js');
    const app = context[studio === 'matrix' ? 'PayoffMatrixApp' : 'GameTimingApp'];
    const project = context.StudioProject.create(app, studio, { bindEvents: false });
    context.localStorage.setItem(project.storageKey, '{corrupt');
    project.init();
    assert.equal(context.localStorage.getItem(project.storageKey), '{corrupt');
    app.setOption(studio === 'matrix' ? 'neBadge' : 'showPayoffs', false);
    assert.doesNotThrow(() => JSON.parse(context.localStorage.getItem(project.storageKey)));
  });
  test(`${studio}: storage errors do not break editing or project files`, () => {
    const { context, app, project } = setup(studio);
    context.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
    assert.doesNotThrow(() => app.setOption(studio === 'matrix' ? 'neBadge' : 'showPayoffs', false));
    assert.equal(project.canUndo(), true);
    assert.doesNotThrow(() => project.undo());
    assert.doesNotThrow(() => JSON.parse(project.serialize()));
  });
  test(`${studio}: unblurred input drafts are saved and typing is one undo step`, () => {
    const { context, app, project } = setup(studio);
    const path = studio === 'matrix' ? 'cells.0.0.u1' : 'stages.0.action';
    const before = project.serialize();
    project.updateDraft(path, '10');
    project.updateDraft(path, '10-');
    project.updateDraft(path, '10-c');
    const saved = JSON.parse(context.localStorage.getItem(project.storageKey));
    assert.equal(studio === 'matrix' ? saved.state.cells[0][0].u1 : saved.state.stages[0].action, '10-c');
    assert.equal(project.undo(), true);
    assert.equal(project.serialize(), before);
    assert.equal(project.canUndo(), false);
    project.redo();
    project.updateDraft('__proto__.polluted', 'bad');
    assert.equal(app.getState().polluted, undefined);
  });
}
test('project histories and autosave keys remain separate', () => {
  assert.notEqual(setup('matrix').project.storageKey, setup('timing').project.storageKey);
});
test('timing imports migrate legacy phases and reject missing stage references', () => {
  const { app, project } = setup('timing');
  const data = JSON.parse(project.serialize());
  delete data.state.phases[0].stageIds;
  project.load(JSON.stringify(data));
  assert.deepEqual(plain(app.getState().phases[0].stageIds), [app.getState().stages[0].id]);
  data.state.phases[0].stageIds = ['not-there'];
  assert.throws(() => project.load(JSON.stringify(data)), /missing stage/);
});
test('matrix manual annotations survive a project save and restore', () => {
  const { app, project } = setup('matrix');
  app.setOption('autoHighlightNE', false);
  app.toggleNE(0, 0);
  const expected = plain(app.getState());
  const saved = project.serialize();
  app.loadPreset('matching-pennies');
  project.load(saved);
  assert.deepEqual(plain(app.getState()), expected);
});
test('editor limits never create a project that cannot be restored', () => {
  const matrix = setup('matrix');
  const title = matrix.app.getState().title;
  matrix.app.updateTitle('x'.repeat(10001));
  assert.equal(matrix.app.getState().title, title);
  matrix.app.setDimensions(21, 2);
  assert.equal(matrix.app.getState().player1.strategies.length, 2);
  assert.equal(matrix.project.updateDraft('cells.0.0.u1', 'x'.repeat(10001)), false);
  assert.doesNotThrow(() => matrix.project.load(matrix.project.serialize()));
  const timing = setup('timing');
  for (let i = 0; i < 101; i++) timing.app.addStage();
  assert.equal(timing.app.getState().stages.length, 100);
  assert.doesNotThrow(() => timing.project.load(timing.project.serialize()));
});
test('same project with reordered object keys is a no-op', () => {
  for (const studio of ['matrix', 'timing']) {
    const { project } = setup(studio);
    const input = JSON.parse(project.serialize());
    input.state = Object.fromEntries(Object.entries(input.state).reverse());
    project.load(JSON.stringify(input));
    assert.equal(project.canUndo(), false);
  }
});
test('project size checks count UTF-8 bytes, not just string length', () => {
  const { app, project } = setup('matrix');
  app.setDimensions(20, 20);
  const data = JSON.parse(project.serialize());
  data.state.cells.forEach(row => row.forEach(cell => { cell.u1 = '語'.repeat(2000); }));
  const raw = JSON.stringify(data);
  assert.ok(raw.length < 2 * 1024 * 1024);
  assert.ok(new TextEncoder().encode(raw).length > 2 * 1024 * 1024);
  assert.throws(() => project.load(raw), /too large/);
});
test('history is bounded and text-field keyboard shortcuts remain native', () => {
  const { context, app } = setup('matrix');
  const events = {};
  context.document.addEventListener = (name, listener) => { events[name] = listener; };
  const project = context.StudioProject.create(app, 'matrix');
  project.init();
  for (let i = 0; i < 105; i++) app.setOption('neBadge', i % 2 === 1);
  let prevented = 0;
  events.keydown({ target: { tagName: 'INPUT' }, ctrlKey: true, key: 'z', preventDefault() { prevented++; } });
  assert.equal(prevented, 0);
  events.keydown({ target: { tagName: 'BODY' }, ctrlKey: true, key: 'z', preventDefault() { prevented++; } });
  assert.equal(prevented, 1);
  let undos = 1;
  while (project.undo()) undos++;
  assert.equal(undos, 100);
});
test('input event persistence retains unblurred edits and rejects invalid overlong drafts', () => {
  const { context, app } = setup('timing');
  const events = {};
  context.document.addEventListener = (name, listener) => { events[name] = listener; };
  const project = context.StudioProject.create(app, 'timing');
  project.init();
  const field = { value: 'New action', getAttribute: name => name === 'data-project-path' ? 'stages.0.action' : null };
  events.input({ target: field });
  assert.equal(JSON.parse(context.localStorage.getItem(project.storageKey)).state.stages[0].action, 'New action');
  field.value = 'x'.repeat(10001);
  events.input({ target: field });
  assert.equal(field.value, 'New action');
  assert.equal(app.getState().stages[0].action, 'New action');
});
test('file loading clears input and only the newest selection takes effect', async () => {
  const { app, project } = setup('matrix');
  const data = JSON.parse(project.serialize());
  let resolveFirst;
  const oldInput = { value: 'first.json', files: [{ size: 100, text: () => new Promise(resolve => { resolveFirst = resolve; }) }] };
  const first = project.loadFile(oldInput);
  data.state.title = 'Second project';
  const newInput = { value: 'second.json', files: [{ size: 100, text: async () => JSON.stringify(data) }] };
  await project.loadFile(newInput);
  data.state.title = 'First project';
  resolveFirst(JSON.stringify(data));
  await first;
  assert.equal(app.getState().title, 'Second project');
  assert.equal(oldInput.value, '');
  assert.equal(newInput.value, '');
  const state = plain(app.getState());
  await project.loadFile({ value: 'bad.json', files: [{ size: 10, text: async () => '{bad' }] });
  assert.deepEqual(plain(app.getState()), state);
});
test('project download uses JSON MIME and emits a file that loads unchanged', async () => {
  const { context, project, app } = setup('matrix');
  let blob, clicked = false, revoked = false;
  context.Blob = Blob;
  context.URL = { createObjectURL(value) { blob = value; return 'blob:project'; }, revokeObjectURL() { revoked = true; } };
  context.setTimeout = fn => fn();
  const link = { click() { clicked = true; }, remove() {} };
  context.document.createElement = () => link;
  context.document.body = { appendChild() {} };
  project.download();
  assert.equal(blob.type, 'application/json;charset=utf-8');
  assert.match(link.download, /-matrix\.json$/);
  assert.ok(clicked && revoked);
  const saved = await blob.text();
  const initial = plain(app.getState());
  app.updateTitle('Temporary');
  project.load(saved);
  assert.deepEqual(plain(app.getState()), initial);
});
test('project restore synchronizes option checkboxes and matrix size buttons', () => {
  const { context, app, project } = setup('matrix');
  const checkbox = {};
  const buttons = [2, 3].map(size => ({ size, active: false, getAttribute() { return String(size); }, classList: { toggle(name, value) { buttons.find(button => button.size === size).active = value; } } }));
  context.document.getElementById = id => id === 'chk-show-probs' ? checkbox : null;
  context.document.querySelectorAll = () => buttons;
  app.setDimensions(3, 3);
  assert.equal(buttons[1].active, true);
  project.undo();
  assert.equal(buttons[0].active, true);
  assert.equal(buttons[1].active, false);
  app.setOption('showProbabilities', false);
  assert.equal(checkbox.checked, false);
  project.undo();
  assert.equal(checkbox.checked, true);
});
