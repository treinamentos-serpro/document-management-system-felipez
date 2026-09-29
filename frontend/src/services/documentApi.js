const API_PREFIX = '/api';

async function getErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function request(url, options = {}, token) {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
}

export async function listDocuments(token) {
  const response = await request(`${API_PREFIX}/documents`, {}, token);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  }, token);
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(id, token) {
  const response = await request(
    `${API_PREFIX}/documents/${encodeURIComponent(id)}/download`,
    {},
    token,
  );
  return response.blob();
}