// Keep the project tests on the installed workspace toolchain, not the upstream clone's config bundler.
const workspace = process.cwd();
export default {
  root: `${workspace}/reference/mdread`,
  test: {
    include: ["test/**/*.test.js"],
    environment: "node",
  },
};
