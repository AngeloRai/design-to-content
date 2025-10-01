// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// Ultra-minimal flat ESLint config focused on flagging *undefined variables/functions*.
// Keeps things simple: no Next.js presets, no import plugin, just core checks.

export default [// Ignore build artifacts & generated output
{
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
  ],
}, // Optional: If you prefer to let TypeScript handle TS files, uncomment below to disable no-undef for TS
// {
//   files: ['**/*.{ts,tsx}'],
//   rules: { 'no-undef': 'off' }
// }
{
  files: ["**/*.{js,mjs,cjs,ts,tsx}"],
  languageOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
    globals: {
      // Common Node + modern runtime globals so they are not wrongly flagged
      process: "readonly",
      console: "readonly",
      Buffer: "readonly",
      __dirname: "readonly",
      __filename: "readonly",
      // Runtime web-like globals available in modern Node
      fetch: "readonly",
      URL: "readonly",
      URLSearchParams: "readonly",
    },
  },
  rules: {
    // Core requirement: underline anything not declared
    "no-undef": "error",
    // Keep a light unused vars warning (prefix _ to intentionally ignore)
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
}, ...storybook.configs["flat/recommended"]];
