module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    node: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "google"],
  // ← add these at the top level:
  rules: {
    camelcase: "off",
    "require-jsdoc": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: { mocha: true },
      // you can keep per-test overrides here if you still need them
    },
  ],
};
