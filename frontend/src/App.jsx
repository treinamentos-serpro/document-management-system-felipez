import { useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  async function handleConnect(event) {
    event.preventDefault();
    const suppliedToken = tokenInput.trim();
    setIsConnecting(true);
    setConnectionError('');

    try {
      const loadedDocuments = await listDocuments(suppliedToken);
      setDocuments(loadedDocuments);
      setToken(suppliedToken);
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    setToken('');
    setTokenInput('');
    setDocuments([]);
    setConnectionError('');
  }

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id),
    ]);
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
        {token ? (
          <div className="session-controls">
            <span className="storage-indicator">
              <span className="status-dot" />
              Armazenamento local
            </span>
            <button className="session-button" onClick={handleDisconnect} type="button">
              Sair
            </button>
          </div>
        ) : (
          <span className="storage-indicator">Acesso protegido</span>
        )}
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

        {!token ? (
          <section className="access-panel" aria-labelledby="access-title">
            <div>
              <p className="eyebrow">SESSÃO</p>
              <h2 id="access-title">Acessar documentos</h2>
            </div>
            <form className="access-form" onSubmit={handleConnect}>
              <label htmlFor="access-token">Token de acesso</label>
              <div className="access-controls">
                <input
                  autoComplete="off"
                  id="access-token"
                  onChange={(event) => setTokenInput(event.target.value)}
                  required
                  type="password"
                  value={tokenInput}
                />
                <button className="primary-button" disabled={isConnecting} type="submit">
                  {isConnecting ? 'Verificando...' : 'Entrar'}
                </button>
              </div>
              {connectionError && <p className="form-message error-message" role="alert">{connectionError}</p>}
            </form>
          </section>
        ) : (
          <>
            <UploadComponent onUploaded={handleUploaded} token={token} />
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
                token={token}
              />
            </section>
          </>
        )}
      </div>
      <footer className="app-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>Catálogo da sessão atual</span>
      </footer>
    </main>
  );
}