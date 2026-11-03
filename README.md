# GameTikzStudio

A browser-based editor for game-theory diagrams with editable TikZ/LaTeX output.

| Studio | Page | Features |
| --- | --- | --- |
| Game trees | `GameTree.html` | Decision and chance nodes, actions, terminal payoffs, information sets, vertical/horizontal layout, JSON save/load and undo/redo |
| Payoff matrices | `PayoffMatrix.html` | Bimatrix games, numeric best responses and pure Nash equilibria, strategy elimination markers, TikZ and tabular export |
| Game timing | `GameTiming.html` | Stages, players, information, actions, payoffs and phase groups, with TikZ export |

Start with `index.html`; `Help.html` contains the in-app guide. Presets provide examples for each studio. Symbolic payoffs can be displayed, but automatic best-response calculations are intended for numeric entries, including fractions. Strategy elimination markers are user-controlled; the app is not a general equilibrium solver.

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
- `npm test` runs Node's regression suite against the actual browser scripts using a small DOM stub. It covers numeric best responses, pure equilibria, fractional/tied/negative payoffs, eliminated strategies, TikZ document wrappers, tree export and serialization, and game-tree undo/redo.
- `npm run build` checks syntax and creates `dist/` using only the public HTML, CSS and JavaScript assets. It replaces the previous `dist/` directory.

Checks and builds use Node built-ins and need no dependency installation. Only the local Express server needs `npm install`. `bun.lock` is retained for existing Bun/AI Studio workflows; this change does not alter dependencies.

The maintenance workflow runs on pull requests and pushes to `main`/`master`. The existing Pages workflow runs checks before uploading `dist/`; deployment still occurs only on its existing main/master push or manual triggers. Opening a pull request does not deploy it.

## Test boundaries and manual review

The automated tests exercise model behavior, not browser drawing, clipboard/download integration or LaTeX compilation. Before merging UI or export changes:

1. Open each studio and load a preset; confirm the diagram and code panels update.
2. In the tree studio, add/edit/delete a branch, undo and redo, then save and reload JSON. Check both orientations.
3. In the matrix studio, change a payoff and toggle an eliminated strategy; confirm best-response marks and equilibrium highlights agree with the numbers.
4. In the timing studio, add, reorder and delete stages; check labels and phase braces.
5. Compile representative exports in LaTeX/Overleaf and inspect PNG/SVG exports where offered. For snippets, add TikZ and the libraries shown by the corresponding standalone export to the document preamble.

## Repository layout

- `js/game-tree.js`: tree model, presets, canvas renderer and TikZ output.
- `js/payoff-matrix.js`: matrix state, payoff comparisons, rendering and exports.
- `js/game-timing.js`: stage state, presets, rendering and TikZ output.
- `js/undo-history.js`: history engine and game-tree integration; it also retains adapters from earlier studios.
- `css/`: shared styling; `js/modern-ui.js` and other helpers provide shared UI/export behavior.
- `tests/`: behavioral regression tests; `scripts/`: syntax checking and static packaging.
- `server.js`: optional Express development server.

## Maintaining alongside Google AI Studio

Start each task from current `main` on a separate branch. Keep changes small and review the diff, especially when generated edits touch large HTML/JavaScript files. Before merging, fetch current `main`, incorporate any AI Studio commits, resolve conflicts and rerun checks and the relevant manual review. Avoid force-pushing over someone else's work. Keep tests with the behavior they protect rather than replacing expected values just to make a failing test pass.

## License

GNU General Public License v3.0; see [LICENSE](LICENSE).
