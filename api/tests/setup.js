/**
 * Jest Setup File
 * Configure test environment
 */

// Disable console logs during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Not implemented: HTMLFormElement.prototype.submit')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
