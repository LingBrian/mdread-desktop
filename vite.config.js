// Plain ESM config avoids bundling imports just to load Vite's own config.
// This also makes config loading work in restricted Windows environments where
// Vite's dependency externalizer cannot spawn a helper process.
const workspace = process.cwd();
export default {
  root: `${workspace}/app`,
  clearScreen: false,
  server: { strictPort: true, port: 1420, host: '127.0.0.1' },
  build: {
    outDir: `${workspace}/dist`,
    emptyOutDir: true,
  },
};
