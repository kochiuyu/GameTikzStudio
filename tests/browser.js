import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Load the actual browser scripts. Rendering targets are absent and page-load
// callbacks are deliberately not fired: these tests exercise model APIs only.
export function loadBrowser(...files) {
  const storage = new Map();
  const context = vm.createContext({
    console,
    TextEncoder,
    document: { readyState: 'loading', getElementById: () => null, addEventListener() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    addEventListener() {}
  });
  context.window = context;
  for (const file of files) {
    vm.runInContext(readFileSync(new URL('../js/' + file, import.meta.url), 'utf8'), context, { filename: file });
  }
  return context;
}
