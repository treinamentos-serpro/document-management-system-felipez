const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const appModule = require('../src/app');

const userTokens = {
  local: 'local-test-token-00000000000000000000',
  alice: 'alice-test-token-00000000000000000000',
  bob: 'bob-test-token-00000000000000000000',
};

function authHeaders(user = 'local') {
  return { Authorization: `Bearer ${userTokens[user]}` };
}

async function createTestServer(t, options = {}) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-storage-'));
  const app = appModule.createApp({
    storageDir,
    maxFileSizeBytes: 5,
    userTokens,
    ...options,
  });
  assert.equal((await fs.stat(storageDir)).mode & 0o777, 0o700);
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

  const emptyListResponse = await fetch(`${baseUrl}/documents`, {
    headers: authHeaders(),
  });
  assert.equal(emptyListResponse.status, 200);
  assert.deepEqual(await emptyListResponse.json(), { documents: [] });

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: createUploadForm('../../relatorio.txt', 'hello'),
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

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: authHeaders(),
  });
  assert.deepEqual(await listResponse.json(), { documents: [document] });

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: authHeaders(),
  });
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.equal(await downloadResponse.text(), 'hello');

  const traversalResponse = await fetch(
    `${baseUrl}/documents/%2e%2e%2f..%2fetc%2fpasswd/download`,
    { headers: authHeaders() },
  );
  assert.notEqual(traversalResponse.status, 200);
});

test('upload valida arquivo ausente, vazio e acima do limite', async (t) => {
  const { baseUrl, storageDir } = await createTestServer(t);

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: new FormData(),
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const emptyFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: createUploadForm('empty.txt', ''),
  });
  assert.equal(emptyFileResponse.status, 400);
  assert.equal((await emptyFileResponse.json()).error.code, 'FILE_EMPTY');
  assert.deepEqual(await fs.readdir(storageDir), []);

  const oversizedFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: createUploadForm('large.txt', '123456'),
  });
  assert.equal(oversizedFileResponse.status, 413);
  assert.equal((await oversizedFileResponse.json()).error.code, 'FILE_TOO_LARGE');
  assert.deepEqual(await fs.readdir(storageDir), []);
});

test('download de documento inexistente retorna 404', async (t) => {
  const { baseUrl } = await createTestServer(t);
  const response = await fetch(`${baseUrl}/documents/not-a-document/download`, {
    headers: authHeaders(),
  });

  assert.equal(response.status, 404);
  assert.deepEqual((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('autenticação é obrigatória e documentos não são visíveis entre usuários', async (t) => {
  const { baseUrl } = await createTestServer(t);
  const anonymousResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(anonymousResponse.status, 401);
  const invalidTokenResponse = await fetch(`${baseUrl}/documents`, {
    headers: { Authorization: 'Bearer incorrect-token' },
  });
  assert.equal(invalidTokenResponse.status, 401);

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders('alice'),
    body: createUploadForm('privado.txt', 'alice'),
  });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();

  const bobList = await fetch(`${baseUrl}/documents`, { headers: authHeaders('bob') });
  assert.deepEqual(await bobList.json(), { documents: [] });

  const bobDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: authHeaders('bob'),
  });
  assert.equal(bobDownload.status, 404);
});

test('cota de armazenamento remove uploads excedentes', async (t) => {
  const { baseUrl, storageDir } = await createTestServer(t, { maxStorageBytes: 5 });

  const firstUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: createUploadForm('first.txt', '12345'),
  });
  assert.equal(firstUpload.status, 201);

  const excessUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: createUploadForm('excess.txt', 'x'),
  });
  assert.equal(excessUpload.status, 413);
  assert.equal((await excessUpload.json()).error.code, 'STORAGE_QUOTA_EXCEEDED');
  assert.equal((await fs.readdir(storageDir)).length, 1);
});

test('cota de armazenamento inclui arquivos órfãos de reinicializações anteriores', async (t) => {
  const { baseUrl, storageDir } = await createTestServer(t, { maxStorageBytes: 5 });
  await fs.writeFile(
    path.join(storageDir, '11111111-1111-4111-8111-111111111111'),
    '12345',
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: createUploadForm('extra.txt', 'x'),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'STORAGE_QUOTA_EXCEEDED');
  assert.equal((await fs.readdir(storageDir)).length, 1);
});