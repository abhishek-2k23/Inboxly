import { nextConfig } from "@repo/eslint-config/next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  {
    ignores: [".next/**"],
  },
];

export default config;
