import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      try {
        const loadedDocuments = await listDocuments();
        if (isMounted) {
          setDocuments(loadedDocuments);
          setListError('');
        }
      } catch (error) {
        if (isMounted) {
          setListError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id),
    ]);
    setListError('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>DMS</span>
        </a>
        <span className="storage-indicator">
          <span className="status-dot" />
          Armazenamento local
        </span>
      </header>

      <div className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ARQUIVOS</p>
            <h1 id="page-title">Documentos</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-number">{documents.length}</span>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </section>

        <UploadComponent onUploaded={handleUploaded} />

        <section className="library-section" aria-labelledby="library-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2 id="library-title">Todos os arquivos</h2>
            </div>
            <span className="library-total">
              {documents.length.toString().padStart(2, '0')}
            </span>
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={listError}
          />
        </section>
      </div>
      <footer className="app-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>Catálogo da sessão atual</span>
      </footer>
    </main>
  );
}