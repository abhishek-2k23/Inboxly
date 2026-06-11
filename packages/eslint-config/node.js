import globals from "globals";
import { baseConfig } from "./base.js";

/**
 * ESLint flat config for Node.js / Express apps.
 * @type {import("eslint").Linter.Config[]}
 */
export const nodeConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
