/** Local-only project files, autosave and bounded undo for matrix/timing studios. */
(function (window) {
  'use strict';
  var MAX_FILE_SIZE = 2 * 1024 * 1024;
  function byteLength(value) { return new TextEncoder().encode(value).length; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function stableJSON(value) {
    return JSON.stringify(value, function (key, item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
      var sorted = {};
      Object.keys(item).sort().forEach(function (name) { sorted[name] = item[name]; });
      return sorted;
    });
  }
  function requireValue(ok, message) { if (!ok) throw new Error(message); }
  function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function text(value) { return typeof value === 'string' && value.length <= 10000; }
  function color(value) { return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value); }
  function textArray(value, length) { return Array.isArray(value) && value.length === length && value.every(text); }
  function pickOptions(value, defaults) {
    requireValue(object(value), 'Missing display options.');
    var result = clone(defaults);
    Object.keys(defaults).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) return;
      requireValue(typeof value[key] === typeof defaults[key], 'Invalid display option: ' + key);
      if (typeof value[key] === 'number') requireValue(Number.isFinite(value[key]) && value[key] > 0 && value[key] <= 100, 'Invalid display scale.');
      if (typeof value[key] === 'string') requireValue(text(value[key]), 'Invalid display text.');
      result[key] = value[key];
    });
    if ('neHighlightColor' in result) requireValue(color(result.neHighlightColor), 'Invalid highlight color.');
    if ('matrixStyle' in result) requireValue(['boxed', 'brackets', 'academic', 'clean'].indexOf(result.matrixStyle) >= 0, 'Invalid matrix style.');
    return result;
  }
  function validateState(studio, input, defaults) {
    requireValue(object(input) && text(input.title), 'Invalid project title.');
    var result = { title: input.title };
    result.options = pickOptions(input.options, defaults.options);
    if (studio === 'matrix') {
      ['player1', 'player2'].forEach(function (key) {
        var player = input[key];
        requireValue(object(player) && text(player.name) && Array.isArray(player.strategies) && player.strategies.length > 0 && player.strategies.length <= 20 && player.strategies.every(text), 'Invalid player or strategies (maximum 20 per player).');
        requireValue(textArray(player.probabilities, player.strategies.length) && color(player.color), 'Invalid player probabilities or color.');
        result[key] = { name: player.name, color: player.color, strategies: player.strategies.slice(), probabilities: player.probabilities.slice() };
        if (player.tikzColor !== undefined) {
          requireValue(text(player.tikzColor), 'Invalid TikZ color.');
          result[key].tikzColor = player.tikzColor;
        }
      });
      var rows = result.player1.strategies.length;
      var cols = result.player2.strategies.length;
      requireValue(Array.isArray(input.cells) && input.cells.length === rows, 'Payoff rows do not match strategies.');
      result.cells = input.cells.map(function (row) {
        requireValue(Array.isArray(row) && row.length === cols, 'Payoff columns do not match strategies.');
        return row.map(function (cell) {
          requireValue(object(cell) && text(cell.u1) && text(cell.u2), 'Invalid payoff.');
          var next = { u1: cell.u1, u2: cell.u2 };
          ['p1Underline', 'p2Underline', 'isNE'].forEach(function (key) {
            requireValue(typeof cell[key] === 'boolean', 'Invalid payoff annotation.');
            next[key] = cell[key];
          });
          return next;
        });
      });
      ['eliminatedRows', 'eliminatedCols'].forEach(function (key) {
        var limit = key === 'eliminatedRows' ? rows : cols;
        requireValue(Array.isArray(input[key]) && input[key].every(function (i) { return Number.isInteger(i) && i >= 0 && i < limit; }), 'Invalid eliminated strategy.');
        result[key] = Array.from(new Set(input[key]));
      });
    } else {
      requireValue(text(input.axisLabel) && ['arrow', 'double-arrow', 'discrete'].indexOf(input.axisStyle) >= 0, 'Invalid timing axis.');
      result.axisLabel = input.axisLabel;
      result.axisStyle = input.axisStyle;
      requireValue(Array.isArray(input.stages) && input.stages.length > 0 && input.stages.length <= 100, 'A timing project needs 1–100 stages.');
      var ids = new Set();
      result.stages = input.stages.map(function (stage) {
        requireValue(object(stage) && text(stage.id) && stage.id.length > 0 && !ids.has(stage.id), 'Stage IDs must be nonempty and unique.');
        ids.add(stage.id);
        var next = { id: stage.id };
        ['timeLabel', 'player', 'action', 'information', 'payoff', 'phase'].forEach(function (key) {
          requireValue(text(stage[key]), 'Invalid stage field: ' + key);
          next[key] = stage[key];
        });
        requireValue(color(stage.playerColor), 'Invalid stage color.');
        next.playerColor = stage.playerColor;
        return next;
      });
      requireValue(Array.isArray(input.phases) && input.phases.length <= 100, 'Invalid phase groups.');
      result.phases = input.phases.map(function (phase) {
        requireValue(object(phase) && text(phase.name), 'Invalid phase name.');
        if (phase.stageIds !== undefined) {
          requireValue(Array.isArray(phase.stageIds) && phase.stageIds.length > 0 && phase.stageIds.every(function (id) { return ids.has(id); }), 'A phase references a missing stage.');
          return { name: phase.name, stageIds: Array.from(new Set(phase.stageIds)) };
        }
        requireValue(Number.isInteger(phase.from) && Number.isInteger(phase.to) && phase.from >= 0 && phase.to >= phase.from && phase.to < result.stages.length, 'Invalid phase range.');
        return { name: phase.name, from: phase.from, to: phase.to };
      });
    }
    return result;
  }

  // Keep controls alive during blur/change. Replacing innerHTML can remove the
  // button under the pointer between mousedown and click, swallowing that click.
  function patchControls(container, markup) {
    var template = document.createElement('template');
    template.innerHTML = markup;
    function reconcile(parent, expected) {
      var wanted = Array.from(expected.childNodes);
      wanted.forEach(function (next, index) {
        var current = parent.childNodes[index];
        if (!current) { parent.appendChild(next.cloneNode(true)); return; }
        if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
          parent.replaceChild(next.cloneNode(true), current);
          return;
        }
        if (current.nodeType !== 1) {
          if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
          return;
        }
        Array.from(current.attributes).forEach(function (attribute) {
          if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
        });
        Array.from(next.attributes).forEach(function (attribute) {
          if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
        });
        if (current.nodeName === 'INPUT' || current.nodeName === 'TEXTAREA') {
          if (document.activeElement !== current && current.value !== next.value) current.value = next.value;
        } else {
          reconcile(current, next);
        }
      });
      while (parent.childNodes.length > wanted.length) parent.removeChild(parent.lastChild);
    }
    reconcile(container, template.content);
  }

  function create(app, studio, settings) {
    settings = settings || {};
    var defaults = clone(app.getState());
    var storageKey = 'gametikz.' + studio + '.project.v1';
    var current, past = [], future = [], restoring = false, initialized = false;
    var lastGroup = null, lastTime = 0, loadSequence = 0;
    var status = 'Autosave is local to this browser. Save a project file for a backup.';
    function snapshot() { return clone(app.getState()); }
    function envelope(state) { return { format: 'GameTikzStudio', version: 1, studio: studio, state: state }; }
    function updateUI() {
      var undo = document.getElementById('project-undo');
      var redo = document.getElementById('project-redo');
      var label = document.getElementById('project-status');
      if (undo) undo.disabled = !past.length;
      if (redo) redo.disabled = !future.length;
      if (label) label.textContent = status;
      var options = app.getState().options;
      Object.keys(options).forEach(function (key) {
        var input = document.getElementById('project-option-' + key);
        if (input) input.checked = options[key];
      });
      if (studio === 'matrix') {
        if (document.querySelectorAll) document.querySelectorAll('.matrix-size-btn').forEach(function (button) {
          button.classList.toggle('active', Number(button.getAttribute('data-matrix-rows')) === app.getState().player1.strategies.length && Number(button.getAttribute('data-matrix-cols')) === app.getState().player2.strategies.length);
        });
        var optionIds = { showProbabilities: 'chk-show-probs', showDiagonalHeader: 'chk-diag-header', autoHighlightNE: 'chk-auto-ne', neBadge: 'chk-ne-badge' };
        Object.keys(optionIds).forEach(function (key) {
          var input = document.getElementById(optionIds[key]);
          if (input) input.checked = options[key];
        });
      }
    }
    function checkedJSON(state) {
      validateState(studio, state, defaults);
      var raw = JSON.stringify(envelope(state));
      requireValue(byteLength(raw) <= MAX_FILE_SIZE, 'Project exceeds 2 MB. Shorten text or remove stages before saving.');
      return raw;
    }
    function save() {
      try {
        window.localStorage.setItem(storageKey, checkedJSON(current));
        status = 'Saved in this browser. Save a project file for a portable backup.';
      } catch (error) {
        status = 'Browser autosave unavailable. Use Save Project to keep your work.';
      }
      updateUI();
    }
    function restore(state) {
      var target = app.getState();
      Object.keys(target).forEach(function (key) { delete target[key]; });
      Object.assign(target, clone(state));
      if (app.normalizePhases) app.normalizePhases();
      app.renderAll();
      updateUI();
    }
    function parse(raw) {
      requireValue(typeof raw === 'string' && byteLength(raw) <= MAX_FILE_SIZE, 'Project file is too large (maximum 2 MB).');
      var project;
      try { project = JSON.parse(raw); } catch (error) { throw new Error('This is not a valid JSON project file.'); }
      requireValue(object(project) && project.format === 'GameTikzStudio' && project.version === 1, 'Unsupported project format or version.');
      requireValue(project.studio === studio, 'Open this project in the ' + (project.studio === 'matrix' ? 'matrix' : project.studio === 'timing' ? 'timing' : 'matching') + ' studio.');
      return validateState(studio, project.state, defaults);
    }
    function record(group) {
      if (!initialized || restoring) return;
      var next = snapshot();
      if (stableJSON(next) === stableJSON(current)) return;
      var now = Date.now();
      if (!group || group !== lastGroup || now - lastTime > 1000) {
        past.push(current);
        if (past.length > 100) past.shift();
      }
      current = next;
      future = [];
      lastGroup = group || null;
      lastTime = now;
      save();
    }
    var project = {
      storageKey: storageKey,
      init: function () {
        if (initialized) return;
        try {
          var raw = window.localStorage.getItem(storageKey);
          if (raw) { restore(parse(raw)); status = 'Restored the project saved in this browser.'; }
        } catch (error) {
          status = 'Could not restore browser autosave. Existing data was not overwritten; load a project backup if available.';
        }
        current = snapshot();
        initialized = true;
        updateUI();
      },
      record: record,
      canUndo: function () { return past.length > 0; },
      canRedo: function () { return future.length > 0; },
      undo: function () {
        if (!past.length) return false;
        future.push(current);
        current = past.pop();
        restoring = true;
        try { restore(current); } finally { restoring = false; }
        lastGroup = null;
        save();
        return true;
      },
      redo: function () {
        if (!future.length) return false;
        past.push(current);
        current = future.pop();
        restoring = true;
        try { restore(current); } finally { restoring = false; }
        lastGroup = null;
        save();
        return true;
      },
      serialize: function () { return checkedJSON(snapshot()); },
      load: function (raw) {
        var next = parse(raw); // Validate completely before touching the live document.
        restoring = true;
        try { restore(next); } finally { restoring = false; }
        record();
        updateUI();
      },
      updateDraft: function (path, value) {
        var matrixPath = /^(player[12]\.(strategies|probabilities)\.\d+|cells\.\d+\.\d+\.u[12])$/;
        var timingPath = /^stages\.\d+\.(timeLabel|player|action|information|payoff)$/;
        if (!(studio === 'matrix' ? matrixPath : timingPath).test(path)) return false;
        if (!text(value)) {
          if (window.showToast) window.showToast('Text is limited to 10,000 characters.');
          return false;
        }
        var parts = path.split('.'), target = app.getState();
        for (var i = 0; i < parts.length - 1; i++) {
          if (!Object.prototype.hasOwnProperty.call(target, parts[i])) return;
          target = target[parts[i]];
        }
        var key = parts[parts.length - 1];
        if (!Object.prototype.hasOwnProperty.call(target, key)) return;
        var previous = snapshot();
        target[key] = value;
        try { checkedJSON(app.getState()); } catch (error) {
          target[key] = parts.reduce(function (item, part) { return item[part]; }, previous);
          if (window.showToast) window.showToast(error.message);
          return false;
        }
        if (studio === 'matrix' && path.indexOf('cells.') === 0 && app.getState().options.autoHighlightNE && app.reconcileState) app.reconcileState();
        record('draft:' + path);
        return true;
      },
      download: function () {
        var blob = new Blob([project.serialize()], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = (app.getState().title || studio).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + studio + '.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      },
      loadFile: async function (input) {
        var file = input.files && input.files[0];
        var sequence = ++loadSequence;
        input.value = ''; // Selecting the same file again must still work.
        if (!file) return;
        try {
          requireValue(file.size <= MAX_FILE_SIZE, 'Project file is too large (maximum 2 MB).');
          var raw = await file.text();
          if (sequence !== loadSequence) return;
          project.load(raw);
          if (window.showToast) window.showToast('Project loaded. Undo restores the previous project.');
        } catch (error) {
          if (sequence === loadSequence && window.showToast) window.showToast('Project not loaded: ' + error.message);
        }
      }
    };
    var mutations = studio === 'matrix'
      ? ['loadPreset', 'setDimensions', 'computeBestResponses', 'updateTitle', 'updatePlayerName', 'updateStrategyName', 'updateStrategyProb', 'updatePayoff', 'toggleUnderline', 'toggleNE', 'toggleElimination', 'setOption']
      : ['loadPreset', 'updateStageProp', 'addStage', 'moveStage', 'deleteStage', 'setOption'];
    mutations.forEach(function (name) {
      var original = app[name];
      if (typeof original !== 'function') return;
      app[name] = function () {
        var previous = snapshot();
        var result = original.apply(app, arguments);
        try { checkedJSON(app.getState()); } catch (error) {
          restore(previous);
          if (window.showToast) window.showToast('Edit not applied: ' + error.message);
          return;
        }
        var group = /^update/.test(name) ? name + ':' + Array.prototype.slice.call(arguments, 0, -1).join(':') : null;
        record(group);
        updateUI();
        return result;
      };
    });
    if (settings.bindEvents !== false) {
      document.addEventListener('input', function (event) {
        var path = event.target.getAttribute && event.target.getAttribute('data-project-path');
        if (path && project.updateDraft(path, event.target.value) === false) {
          var previous = path.split('.').reduce(function (item, part) { return item && item[part]; }, app.getState());
          if (typeof previous === 'string') event.target.value = previous;
        }
      });
      document.addEventListener('change', function () { lastGroup = null; });
      document.addEventListener('keydown', function (event) {
        var target = event.target;
        if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
        if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
        var key = event.key.toLowerCase();
        if (key === 'z' || key === 'y') {
          event.preventDefault();
          if (key === 'y' || event.shiftKey) project.redo(); else project.undo();
        }
      });
    }
    return project;
  }
  window.StudioProject = { create: create, patchControls: patchControls };
  window.addEventListener('DOMContentLoaded', function () {
    var app = window.PayoffMatrixApp || window.GameTimingApp;
    if (!app) return;
    window.studioProject = create(app, window.PayoffMatrixApp ? 'matrix' : 'timing');
    window.studioProject.init();
  });
})(window);
