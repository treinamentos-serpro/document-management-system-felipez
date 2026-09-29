import { useState } from 'react';

export function UploadForm({ disabled, onError, onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;

    if (file.size > 10 * 1024 * 1024) {
      onError('O arquivo excede o limite de 10 MB.');
      return;
    }

    setUploading(true);
    onError('');
    try {
      await onUpload(file);
      setFile(null);
      form.reset();
    } catch (error) {
      onError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="upload-copy">
        <p className="eyebrow">NOVO DOCUMENTO</p>
        <h2 id="upload-title">Adicionar arquivo</h2>
        <p>Limite de 10 MB por arquivo.</p>
      </div>
      <form className="upload-form" onSubmit={submit}>
        <label className="file-picker" htmlFor="document-file">
          <span aria-hidden="true">＋</span>
          <span>{file ? file.name : 'Escolher arquivo'}</span>
        </label>
        <input
          className="visually-hidden"
          disabled={disabled || uploading}
          id="document-file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          type="file"
        />
        <button className="primary-button" disabled={!file || disabled || uploading} type="submit">
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}