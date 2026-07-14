module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom/"],
  moduleNameMapper: {
    "^@/lib/firebase$": "<rootDir>/test/mocks/firebase.ts",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^firebase/firestore/lite$": "<rootDir>/test/mocks/firestore-lite.ts",
    "^firebase/auth$": "<rootDir>/test/mocks/firebase-auth.ts",
  },
};
