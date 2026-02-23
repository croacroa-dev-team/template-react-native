module.exports = {
  root: true,
  extends: [
    "expo",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Prettier
    "prettier/prettier": "error",

    // TypeScript
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",

    // React
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",

    // General
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
  },
  overrides: [
    {
      files: ["__tests__/**/*", "jest.setup.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "dist/",
    "coverage/",
    "*.config.js",
    "babel.config.js",
    "metro.config.js",
    ".storybook/",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
};
