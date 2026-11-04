# GameTikzStudio

A browser-based editor for game-theory diagrams with editable TikZ/LaTeX output.

| Studio | Page | Features |
| --- | --- | --- |
| Game trees | `GameTree.html` | Decision and chance nodes, actions, terminal payoffs, information sets, vertical/horizontal layout, JSON save/load and undo/redo |
| Payoff matrices | `PayoffMatrix.html` | Bimatrix games, numeric best responses and pure Nash equilibria, strategy elimination markers, SVG/PNG/TikZ/tabular export, autosave, JSON save/load and undo/redo |
| Game timing | `GameTiming.html` | Stages, players, information, actions, payoffs and phase groups, with TikZ export, autosave, JSON save/load and undo/redo |

Start with `index.html`; `Help.html` contains the in-app guide. Presets provide examples for each studio. Symbolic payoffs can be displayed, but automatic best-response calculations require complete finite numbers (including decimals, scientific notation and fractions). Expressions such as `10-c` are not evaluated. An unknown payoff leaves its entire comparison unresolved; the analysis panel reports incomplete analysis rather than claiming uniqueness or no equilibrium. Manual marks remain annotations, not verified results. Strategy elimination markers are user-controlled; the app is not a general equilibrium solver.

## Keep your work

The matrix and timing studios autosave model edits in this browser, including text still being typed before it loses focus. Each studio has its own saved project. Refresh restores that project; changing a preset is undoable.

- **Save Project** downloads a versioned JSON backup. **Load Project** validates a file before replacing the current model; loading can be undone. Open files in the matching studio.
- **Undo / Redo** keeps up to 100 recent edits in the current session. Typing is grouped, and a new edit clears redo. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y) work outside text fields; text fields keep native editing shortcuts. History itself does not survive refresh.
- Autosave is local, not cloud sync. Clearing browser data, private browsing or storage restrictions can remove/prevent it. A status beside the project buttons warns when autosave is unavailable. Keep downloaded backups for important work.
- Projects are limited to 2 MB of UTF-8 JSON, 20 strategies per player, 100 timing stages and 10,000 characters per text field. Edits exceeding those limits are rejected rather than saved as an unreadable project.
- Timing phases belong to stage IDs. Moving or deleting a stage preserves the surviving members; a group split by an unrelated stage gets separate braces. Newly added stages are initially ungrouped.
- Matrix SVG downloads contain editable vector text and shapes, not embedded PNG data. SVG uses a scalable layout, so it is not pixel-identical to the canvas; LaTeX expressions remain literal text as in the canvas.

## Run locally

Use Node.js 22 or newer. Google AI Studio is an editing environment, not a runtime requirement. No AI API key is required by the application.

```sh
git clone https://github.com/kochiuyu/GameTikzStudio.git
cd GameTikzStudio
npm install
npm run dev
```

Open <http://localhost:3000>. The Express development server serves the source files; refresh the browser after editing (there is no hot reload). The static pages can also be hosted without Express. Some fonts and math-rendering resources load from CDNs and require internet access.

## Checks and static build

```sh
npm run check
npm run build
```

- `npm run lint` checks JavaScript syntax in source, tooling, tests and classic inline HTML scripts. It is not a style or semantic linter.
- `npm test` runs Node's regression suite against the actual browser scripts using a small DOM stub. It covers numeric best responses, pure equilibria, fractional/tied/negative payoffs, eliminated strategies, TikZ document wrappers, tree export and serialization, game-tree undo/redo, strict symbolic-payoff handling, SVG markup/download MIME, timing phase membership, and matrix/timing persistence, import validation and history.
- `npm run build` checks syntax and creates `dist/` using only the public HTML, CSS and JavaScript assets. It replaces the previous `dist/` directory.

Checks and builds use Node built-ins and need no dependency installation. Only the local Express server needs `npm install`. `bun.lock` is retained for existing Bun/AI Studio workflows; this change does not alter dependencies.

For an optional real compilation check, install a working TeX distribution with `pdflatex`, TikZ, standalone and AMS packages, then run `npm run test:latex`. It compiles matrix, timing, market-entry and signaling-tree samples, prints the output directory, and retains PDFs/logs for inspection. This optional check is separate from the dependency-free CI suite.

The maintenance workflow runs on pull requests and pushes to `main`/`master`. The existing Pages workflow runs checks before uploading `dist/`; deployment still occurs only on its existing main/master push or manual triggers. Opening a pull request does not deploy it.

## Test boundaries and manual review

The automated tests exercise model behavior, not browser drawing, clipboard/download integration or LaTeX compilation. Before merging UI or export changes:

1. Open each studio and load a preset; confirm the diagram and code panels update.
2. In the tree studio, add/edit/delete a branch, undo and redo, then save and reload JSON. Check both orientations.
3. In the matrix studio, change a payoff and toggle an eliminated strategy; confirm best-response marks and equilibrium highlights agree with the numbers.
4. In the timing studio, add, reorder and delete stages; check labels and phase braces.
5. In matrix and timing, type without blurring and refresh; check restored edits. Test Save/Load Project, invalid files, undo/redo, options and loading the same file twice.
6. Compile representative exports in LaTeX/Overleaf and inspect PNG/SVG exports where offered. For snippets, add TikZ and the libraries shown by the corresponding standalone export to the document preamble.

## Repository layout

- `js/game-tree.js`: tree model, presets, canvas renderer and TikZ output.
- `js/payoff-matrix.js`: matrix state, payoff comparisons, rendering and exports.
- `js/game-timing.js`: stage state, presets, rendering and TikZ output.
- `js/studio-project.js`: shared matrix/timing autosave, JSON validation, project downloads and undo/redo.
- `js/undo-history.js`: history engine and game-tree integration; it also retains adapters from earlier studios.
- `css/`: shared styling; `js/modern-ui.js` and other helpers provide shared UI/export behavior.
- `tests/`: behavioral regression tests; `scripts/`: syntax checking and static packaging.
- `server.js`: optional Express development server.

## Maintaining alongside Google AI Studio

Start each task from current `main` on a separate branch. Keep changes small and review the diff, especially when generated edits touch large HTML/JavaScript files. Before merging, fetch current `main`, incorporate any AI Studio commits, resolve conflicts and rerun checks and the relevant manual review. Avoid force-pushing over someone else's work. Keep tests with the behavior they protect rather than replacing expected values just to make a failing test pass.

## License

GNU General Public License v3.0; see [LICENSE](LICENSE).
