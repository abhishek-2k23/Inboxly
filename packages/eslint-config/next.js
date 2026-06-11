import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import { baseConfig } from "./base.js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

/**
 * ESLint flat config for Next.js apps.
 * @type {import("eslint").Linter.Config[]}
 */
export const nextConfig = [
  ...compat.extends("next/core-web-vitals"),
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
