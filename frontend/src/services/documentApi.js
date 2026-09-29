const API_BASE = '/api';

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a solicitação.');
  }

  return response;
}

export async function getDocuments(token) {
  const response = await request('/documents', token);
  return response.json();
}

export async function uploadDocument(token, file) {
  const data = new FormData();
  data.append('file', file);
  const response = await request('/upload', token, { method: 'POST', body: data });
  return response.json();
}

export async function downloadDocument(token, document) {
  const response = await request(`/documents/${encodeURIComponent(document.id)}/download`, token);
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}