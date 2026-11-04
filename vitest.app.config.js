const workspace = process.cwd();
export default {
  root: `${workspace}/app`,
  test: {
    include: ["test/**/*.test.js"],
    environment: "node",
  },
};
