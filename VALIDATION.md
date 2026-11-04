# Maintenance validation

## Reliability update (2026-11-04)

Validated the local `fix/studio-reliability` changes from main `25d6d5e` using Node 24.22.1.

- `npm run check`: 93 regression tests pass, plus syntax checks for source and inline scripts.
- `npm run build`: static packaging passes and includes the new shared project module.
- Strict numeric payoff parsing, unresolved best-response comparisons, manual annotation distinctions, SVG markup/escaping/MIME, phase reorder/delete/split/rejoin and unique IDs are covered.
- Matrix/timing autosave and fresh-context restore, unblurred draft input events, JSON round trips, wrong/malformed files, corrupt storage, storage failures, undo/redo, history limits, UTF-8 size limits, file-selection races, download payloads and synchronized controls are covered with DOM stubs.
- All existing matrix and timing presets were round-tripped through project validation. Startup listener simulation confirmed saved manual annotations are not overwritten by initial numeric calculations.
- Actual LaTeX compilation passed for matrix, timing, market-entry and signaling-tree samples using TeX Live after temporary local format/font-map setup. Additional symbolic matrix and split-phase timing fixtures compiled successfully.
- Generated matrix SVG parsed as XML and was rasterized with Inkscape for visual inspection. The split-phase timing PDF was rendered and inspected; long phase names wrap within their own braces.

### Interactive browser follow-up

A supported static preview enabled real Chromium interaction tests after the initial direct-launch restriction. Matrix/timing unblurred text survived refresh; project download/load, repeated same-file loading, invalid-file rejection, option undo/redo, and timing add/reorder/delete phase associations passed. A downloaded matrix SVG contained actual XML/SVG data.

Interactive testing found that editing text then immediately clicking an adjacent NE/move/delete button lost the first click because the blur handler replaced the target element. Controls now reconcile their markup in place. Browser retests confirmed the first click works in both studios, keyboard focus stays on the target, and undo restores deleted stages with newly typed text. Three additional regressions cover node identity, focused values and structural control updates.

These are representative Chromium checks, not exhaustive browser coverage. Run the README manual checklist for future changes. LaTeX compile success does not guarantee layout for arbitrary user content. Long player labels can still crowd in the existing timing layout.

## Earlier maintenance validation

Validated locally on Windows with Node 24.18.1, the in-app Chromium browser and MiKTeX pdfTeX 1.40.25. The pull-request workflow independently runs Node 22 syntax checks, regression tests and static packaging.

## Browser checks

- Tree: add branch, undo (branch removed), redo (branch restored), horizontal rendering, reload saved session, add another branch without reusing an existing ID, undo after reload.
- Matrix: initial Prisoner's Dilemma equilibrium displayed as (Defect, Defect), numeric cell edit and automatic best-response refresh, TEX download.
- Timing: add fifth stage, move it before the payoff stage, confirm updated stage order and canvas, TEX download.
- Tree TEX and SVG downloads completed. SVG parsed as XML. PNG download completed after switching the tree download from a data URL to a Blob URL.
- Downloaded TEX files from all three studios compiled successfully. Additional market-entry and Spence signaling tree model exports compiled successfully, including chance nodes and information sets.

## Regressions fixed during verification

- Saved tree snapshots shared mutable nodes with live edits.
- Undo restored the model without refreshing the inspector, code panel and selected-node reference.
- Startup could overwrite the saved tree with the default preset before restoring it.
- Fresh sessions could reuse existing node IDs when adding to loaded trees.
- Multiline matrix headers and NE badges confused TikZ matrix row parsing; nested short stacks now contain their line breaks.
- Timing phase titles containing ampersands failed LaTeX compilation; unescaped phase-title ampersands are now escaped.

## Limits

These are representative checks, not exhaustive cross-browser or all-preset coverage. PNG/SVG downloads were exercised for the tree studio; matrix/timing image downloads and third-party Overleaf submission were not exercised. LaTeX compilation success does not guarantee perfect layout for every custom label. External fonts/math resources still require network access. Use the README manual checklist when changing rendering or exports.
