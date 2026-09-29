const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const appModule = require('../src/app');

async function createTestServer(t) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-storage-'));
  const app = appModule.createApp({ storageDir, maxFileSizeBytes: 5 });
  const server = app.listen(0, '127.0.0.1');

  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  return {
    storageDir,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  };
}

function createUploadForm(name, content) {
  const form = new FormData();
  form.append('file', new Blob([content]), name);
  return form;
}

test('upload, listagem e download respeitam o contrato', async (t) => {
  const { baseUrl, storageDir } = await createTestServer(t);

  const emptyListResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(emptyListResponse.status, 200);
  assert.deepEqual(await emptyListResponse.json(), { documents: [] });

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('relatorio.txt', 'hello'),
  });
  assert.equal(uploadResponse.status, 201);

  const { document } = await uploadResponse.json();
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, 5);
  assert.equal(document.owner, 'local');
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));

  const files = await fs.readdir(storageDir);
  assert.equal(files.length, 1);
  assert.notEqual(files[0], document.originalName);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.deepEqual(await listResponse.json(), { documents: [document] });

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.equal(await downloadResponse.text(), 'hello');
});

test('upload valida arquivo ausente, vazio e acima do limite', async (t) => {
  const { baseUrl, storageDir } = await createTestServer(t);

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const emptyFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('empty.txt', ''),
  });
  assert.equal(emptyFileResponse.status, 400);
  assert.equal((await emptyFileResponse.json()).error.code, 'FILE_EMPTY');
  assert.deepEqual(await fs.readdir(storageDir), []);

  const oversizedFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('large.txt', '123456'),
  });
  assert.equal(oversizedFileResponse.status, 413);
  assert.equal((await oversizedFileResponse.json()).error.code, 'FILE_TOO_LARGE');
  assert.deepEqual(await fs.readdir(storageDir), []);
});

test('download de documento inexistente retorna 404', async (t) => {
  const { baseUrl } = await createTestServer(t);
  const response = await fetch(`${baseUrl}/documents/not-a-document/download`);

  assert.equal(response.status, 404);
  assert.deepEqual((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});