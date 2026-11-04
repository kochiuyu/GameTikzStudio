import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrowser } from './browser.js';

class Node {
  constructor(name, attributes = {}, children = [], value = '') {
    this.nodeName = name;
    this.nodeType = name === '#text' ? 3 : 1;
    this.nodeValue = this.nodeType === 3 ? value : null;
    this.attrs = { ...attributes };
    this.childNodes = children;
    this.value = value;
  }
  get attributes() { return Object.entries(this.attrs).map(([name, value]) => ({ name, value })); }
  get lastChild() { return this.childNodes.at(-1); }
  hasAttribute(name) { return name in this.attrs; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = value; }
  removeAttribute(name) { delete this.attrs[name]; }
  appendChild(node) { this.childNodes.push(node); }
  replaceChild(node, old) { this.childNodes[this.childNodes.indexOf(old)] = node; }
  removeChild(node) { this.childNodes.splice(this.childNodes.indexOf(node), 1); }
  cloneNode() { return new Node(this.nodeName, this.attrs, this.childNodes.map(node => node.cloneNode(true)), this.nodeType === 3 ? this.nodeValue : this.value); }
}
function fixture() {
  const context = loadBrowser('studio-project.js');
  let expected;
  context.document.createElement = name => {
    assert.equal(name, 'template');
    return { set innerHTML(markup) { assert.equal(markup, 'updated markup'); }, get content() { return expected; } };
  };
  return { context, render(container, next) { expected = next; context.StudioProject.patchControls(container, 'updated markup'); } };
}

test('text edits preserve the adjacent button identity through blur and click', () => {
  const { render } = fixture();
  const input = new Node('INPUT', { value: '3' }, [], '3');
  const label = new Node('#text', {}, [], 'NE');
  const button = new Node('BUTTON', { class: 'inactive', onclick: 'toggleNE(0,0)' }, [label]);
  const row = new Node('DIV', {}, [input, button]);
  const container = new Node('DIV', {}, [row]);
  const next = new Node('DIV', {}, [new Node('DIV', {}, [new Node('INPUT', { value: '10-c' }, [], '10-c'), new Node('BUTTON', { class: 'active', onclick: 'toggleNE(0,0)' }, [new Node('#text', {}, [], 'NE')])])]);
  render(container, next);
  assert.equal(container.childNodes[0], row);
  assert.equal(row.childNodes[0], input);
  assert.equal(row.childNodes[1], button); // Browser's pending click still targets this node.
  assert.equal(button.childNodes[0], label);
  assert.equal(button.getAttribute('class'), 'active');
  assert.equal(input.value, '10-c');
});

test('focused input keeps its value while inactive controls reflect restored state', () => {
  const { context, render } = fixture();
  const input = new Node('INPUT', {}, [], 'Typing in progress');
  const textarea = new Node('TEXTAREA', {}, [], 'Old action');
  const container = new Node('DIV', {}, [input, textarea]);
  context.document.activeElement = input;
  const next = new Node('DIV', {}, [new Node('INPUT', {}, [], 'Model value'), new Node('TEXTAREA', {}, [], 'Restored action')]);
  render(container, next);
  assert.equal(input.value, 'Typing in progress');
  assert.equal(textarea.value, 'Restored action');
  context.document.activeElement = null;
  render(container, next);
  assert.equal(input.value, 'Model value');
});

test('structural edits replace only changed node types and remove/add surplus nodes', () => {
  const { render } = fixture();
  const preserved = new Node('BUTTON', { disabled: '', onclick: 'moveStage(1,1)' }, [new Node('#text', {}, [], 'Down')]);
  const container = new Node('DIV', {}, [preserved, new Node('INPUT'), new Node('SPAN')]);
  render(container, new Node('DIV', {}, [new Node('BUTTON', { onclick: 'moveStage(0,1)' }, [new Node('#text', {}, [], 'Move down')]), new Node('TEXTAREA', {}, [], 'Action')]));
  assert.equal(container.childNodes.length, 2);
  assert.equal(container.childNodes[0], preserved);
  assert.equal(preserved.hasAttribute('disabled'), false);
  assert.equal(preserved.getAttribute('onclick'), 'moveStage(0,1)');
  assert.equal(preserved.childNodes[0].nodeValue, 'Move down');
  assert.equal(container.childNodes[1].nodeName, 'TEXTAREA');
  render(container, new Node('DIV', {}, [preserved.cloneNode(true), container.childNodes[1].cloneNode(true), new Node('BUTTON')]));
  assert.equal(container.childNodes.length, 3);
});
