module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
