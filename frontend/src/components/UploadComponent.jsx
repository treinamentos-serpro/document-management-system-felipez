import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  function handleFileChange(event) {
    setFile(event.target.files?.[0] ?? null);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const document = await uploadDocument(file);
      onUploaded(document);
      setSuccess('Upload concluído.');
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="upload-panel-copy">
        <span className="upload-symbol" aria-hidden="true">+</span>
        <div>
          <p className="eyebrow">NOVO ARQUIVO</p>
          <h2 id="upload-title">Adicionar documento</h2>
        </div>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className={`file-picker${file ? ' has-file' : ''}`}>
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <span className="file-picker-main">
            {file ? file.name : 'Selecionar arquivo'}
          </span>
          <span className="file-picker-meta">
            {file ? formatFileSize(file.size) : 'Escolher do dispositivo'}
          </span>
        </label>
        <button className="primary-button" type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </form>

      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {success && <p className="form-message success-message" role="status">{success}</p>}
    </section>
  );
}