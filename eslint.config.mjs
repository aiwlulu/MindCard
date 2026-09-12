import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "web-bundles/**",
      "next-env.d.ts",
      "coverage/**",
    ],
  },
  {
    rules: {
      // Existing prop/route reset effects are tracked as warnings until each
      // one is migrated to derived state.
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
];

export default config;
