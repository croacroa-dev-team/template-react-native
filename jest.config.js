module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|tailwindcss)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/.expo/**",
    "!**/babel.config.js",
    "!**/jest.config.js",
    "!**/metro.config.js",
    "!**/tailwind.config.js",
    "!**/*.stories.tsx",
    "!**/.storybook/**",
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 25,
      statements: 25,
    },
  },
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "__tests__/helpers/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
