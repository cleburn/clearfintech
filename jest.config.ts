import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: [
    "<rootDir>/shared",
    "<rootDir>/gateway",
    "<rootDir>/onboarding",
    "<rootDir>/payments",
    "<rootDir>/compliance",
    "<rootDir>/customers",
    "<rootDir>/dashboard",
  ],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/shared/$1",
    "^@gateway/(.*)$": "<rootDir>/gateway/$1",
    "^@onboarding/(.*)$": "<rootDir>/onboarding/$1",
    "^@payments/(.*)$": "<rootDir>/payments/$1",
    "^@compliance/(.*)$": "<rootDir>/compliance/$1",
    "^@customers/(.*)$": "<rootDir>/customers/$1",
    "^@dashboard/(.*)$": "<rootDir>/dashboard/$1",
  },
  collectCoverageFrom: [
    "**/src/**/*.ts",
    "!**/node_modules/**",
    "!**/dist/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
};

export default config;
