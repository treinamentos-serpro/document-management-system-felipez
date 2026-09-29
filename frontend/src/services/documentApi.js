const API_PREFIX = '/api';

async function getErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
}

export async function listDocuments() {
  const response = await request(`${API_PREFIX}/documents`);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(id) {
  const response = await request(
    `${API_PREFIX}/documents/${encodeURIComponent(id)}/download`,
  );
  return response.blob();
}