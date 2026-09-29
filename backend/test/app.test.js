const { after, before, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.DMS_STORAGE_DIR = storageDirectory;
process.env.DMS_USER_TOKENS = JSON.stringify({
  alice: 'alice-test-token',
  bob: 'bob-test-token',
});
const app = require('../src/app');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

test('upload, listagem e download são restritos ao usuário autenticado', async () => {
  const unauthorized = await fetch(`${baseUrl}/documents`);
  assert.equal(unauthorized.status, 401);

  const form = new FormData();
  form.append('file', new Blob(['conteúdo seguro']), '../relatorio.txt');
  const upload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: 'Bearer alice-test-token' },
    body: form,
  });
  assert.equal(upload.status, 201);
  const document = await upload.json();
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.owner, 'alice');
  assert.match(document.id, /^[0-9a-f-]{36}$/i);

  const aliceDocuments = await fetch(`${baseUrl}/documents`, {
    headers: { Authorization: 'Bearer alice-test-token' },
  });
  assert.deepEqual((await aliceDocuments.json()).map(({ id }) => id), [document.id]);

  const bobDocuments = await fetch(`${baseUrl}/documents`, {
    headers: { Authorization: 'Bearer bob-test-token' },
  });
  assert.deepEqual(await bobDocuments.json(), []);

  const deniedDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { Authorization: 'Bearer bob-test-token' },
  });
  assert.equal(deniedDownload.status, 404);

  const traversal = await fetch(`${baseUrl}/documents/../../etc/passwd/download`, {
    headers: { Authorization: 'Bearer alice-test-token' },
  });
  assert.notEqual(traversal.status, 200);

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { Authorization: 'Bearer alice-test-token' },
  });
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'application/octet-stream');
  assert.equal(await download.text(), 'conteúdo seguro');
});

test('rejeita uploads acima do limite', async () => {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), 'grande.bin');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: 'Bearer alice-test-token' },
    body: form,
  });

  assert.equal(response.status, 413);
  await response.body?.cancel();
});
