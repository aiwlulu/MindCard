module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom/"],
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
  },
};
