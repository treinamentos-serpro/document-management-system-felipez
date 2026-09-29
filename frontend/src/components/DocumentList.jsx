import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getFileType(name) {
  const extension = name.split('.').pop();
  return extension && extension !== name
    ? extension.slice(0, 4).toUpperCase()
    : 'ARQ';
}

export default function DocumentList({ documents, token }) {
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">0</span>
        <p>Nenhum documento por aqui.</p>
      </div>
    );
  }

  return (
    <div className="document-list" role="list">
      {documents.map((document) => (
        <article className="document-row" key={document.id} role="listitem">
          <span className="file-type" aria-hidden="true">
            {getFileType(document.originalName)}
          </span>
          <div className="document-info">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <p>
              {formatFileSize(document.size)}
              <span className="detail-divider">·</span>
              {formatDate(document.uploadedAt)}
            </p>
          </div>
          <DownloadButton document={document} token={token} />
        </article>
      ))}
    </div>
  );
}