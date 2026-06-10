// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// TextEncoder/TextDecoder — absents dans jest-environment-node (Jest 27)
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder: TE, TextDecoder: TD } = require('util');
  global.TextEncoder = TE;
  global.TextDecoder = TD;
}

// crypto.subtle — jsdom 16 fournit window.crypto mais subtle est un getter qui lève
// Polyfill avec l'implémentation Node.js webcrypto
let cryptoSubtleAvailable = false;
try { cryptoSubtleAvailable = !!globalThis.crypto?.subtle; } catch {}
if (!cryptoSubtleAvailable) {
  const { webcrypto } = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}
