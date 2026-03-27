import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow `declare global { namespace Express {} }` — the only correct way to augment Express types
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
      // Allow console.error/warn for startup crashes (before logger is available); ban console.log
      "no-console": ["error", { allow: ["error", "warn"] }],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
