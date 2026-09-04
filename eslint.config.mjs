import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      "out/**",
      ".next*/**",
      ".source/**",
      "public/**",
      "examples/**",
      "packages/orbs/dist/**",
      "archive/**",
      ".empryo/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    // Pre-existing canvas pool / effect patterns across the orb library and
    // demo UI; flagged only by react-hooks v7 strictness rules.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
];

export default eslintConfig;
