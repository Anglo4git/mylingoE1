// Forward-compatible ESLint flat config (ESLint 9+).
//
// NOT currently runnable in this sandbox: there is no network egress here,
// so `npm install eslint` fails (registry 403) and this config is inert
// until installed in an environment with registry access (CI, or a dev
// machine). The actually-enforced gate right now is `npm run lint`, which
// runs scripts/lint.js — a dependency-free scanner with equivalent intent.
// This file exists so upgrading is a one-line `npm install -D eslint` away
// rather than a from-scratch config exercise.
//
// Scope mirrors scripts/lint.js: production JS lives under site/ and
// scripts/; tests/**/*.js plus the two root config files are test/tooling
// code and get the relaxed rule set.
module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist-release/**",
      "**/vendor/**",
      "**/vendors/**",
      "**/*.min.js",
    ],
  },
  {
    files: ["site/**/*.js", "scripts/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        indexedDB: "readonly",
        fetch: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
  {
    files: ["tests/**/*.{js,mjs}", "playwright.config.js", "vitest.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "no-debugger": "error",
      "no-unused-vars": "warn",
    },
  },
];
