# Maintenance validation

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
