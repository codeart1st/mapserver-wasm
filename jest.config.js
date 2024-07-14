const SECONDS = 1000

module.exports = {
  testTimeout: 90 * SECONDS,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/thirdparty/',
    '/emsdk/'
  ]
}