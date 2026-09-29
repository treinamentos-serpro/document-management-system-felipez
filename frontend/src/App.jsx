import { useState } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { UploadForm } from './components/UploadForm.jsx';
import { downloadDocument, getDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState('');
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function connect(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const items = await getDocuments(tokenInput.trim());
      setToken(tokenInput.trim());
      setDocuments(items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshDocuments() {
    setBusy(true);
    setError('');
    try {
      setDocuments(await getDocuments(token));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file) {
    setError('');
    const created = await uploadDocument(token, file);
    setDocuments((current) => [created, ...current]);
  }

  async function handleDownload(document) {
    setError('');
    try {
      await downloadDocument(token, document);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function disconnect() {
    setToken('');
    setTokenInput('');
    setDocuments([]);
    setError('');
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Arquivo, início">
          <span className="wordmark-icon" aria-hidden="true">A</span>
          <span>ARQUIVO</span>
        </a>
        {token ? (
          <button className="quiet-button" onClick={disconnect} type="button">Sair</button>
        ) : (
          <span className="connection-label">ACESSO LOCAL</span>
        )}
      </header>

      <section className="page-heading" aria-labelledby="page-title">
        <p className="eyebrow">GESTÃO DE DOCUMENTOS</p>
        <h1 id="page-title">Seus arquivos, em ordem.</h1>
        <p className="subheading">Envie e consulte documentos associados à sua conta.</p>
      </section>

      {error && <p className="notice" role="alert">{error}</p>}

      {!token ? (
        <section className="access-panel" aria-labelledby="access-title">
          <div>
            <p className="eyebrow">SESSÃO</p>
            <h2 id="access-title">Acessar documentos</h2>
          </div>
          <form className="access-form" onSubmit={connect}>
            <label htmlFor="access-token">Token de acesso</label>
            <div className="access-controls">
              <input
                autoComplete="off"
                id="access-token"
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Cole seu token"
                required
                type="password"
                value={tokenInput}
              />
              <button className="primary-button" disabled={busy} type="submit">
                {busy ? 'Verificando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <UploadForm disabled={busy} onError={setError} onUpload={handleUpload} />
          <section className="documents-section" aria-labelledby="documents-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">BIBLIOTECA</p>
                <h2 id="documents-title">Documentos</h2>
              </div>
              <button className="quiet-button" disabled={busy} onClick={refreshDocuments} type="button">
                Atualizar
              </button>
            </div>
            <DocumentList documents={documents} onDownload={handleDownload} />
          </section>
        </>
      )}
      <footer className="page-footer">ARQUIVO <span>•</span> DOCUMENTOS PRIVADOS</footer>
    </main>
  );
}