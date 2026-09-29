function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function DocumentList({ documents, onDownload }) {
  if (documents.length === 0) {
    return <p className="empty-state">Nenhum documento enviado.</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <span className="file-mark" aria-hidden="true">DOC</span>
          <div className="document-name">
            <span title={document.originalName}>{document.originalName}</span>
            <small>{formatDate(document.uploadedAt)}</small>
          </div>
          <span className="document-size">{formatSize(document.size)}</span>
          <button
            aria-label={`Baixar ${document.originalName}`}
            className="download-button"
            onClick={() => onDownload(document)}
            type="button"
          >
            Baixar <span aria-hidden="true">↓</span>
          </button>
        </li>
      ))}
    </ul>
  );
}