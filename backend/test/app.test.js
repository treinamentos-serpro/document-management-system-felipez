const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

// Garante que o app Express fica disponível para montagem e teste.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});
