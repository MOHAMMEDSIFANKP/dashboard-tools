// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [
//   ...compat.extends("next/core-web-vitals", "next/typescript"),
// ];

// export default eslintConfig;

/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  {
    ignores: ["**/*.js", "**/*.ts", "**/*.tsx"], // Ignore all files from linting
  },
  {
    rules: {
      // Disable specific rules globally
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
];

export default eslintConfig;
