import React, { useState } from 'react';
import { Upload, X, Sparkles } from 'lucide-react';

interface DropzoneUploadProps {
  imageUrl: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  statusText?: string;
}

export function DropzoneUpload({ imageUrl, onFileSelect, onClear, statusText }: DropzoneUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  if (imageUrl) {
    return (
      <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', maxHeight: '280px', backgroundColor: '#0f172a' }}>
        <img src={imageUrl} alt="Uploaded Chart" style={{ width: '100%', height: '280px', objectFit: 'contain' }} />
        <button
          type="button"
          onClick={onClear}
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15,23,42,0.75)', color: '#ffffff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        border: isDragOver ? '2px dashed #0ea5e9' : '1.5px dashed #cbd5e1',
        borderRadius: '20px',
        padding: '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: isDragOver ? '#f0f9ff' : '#ffffff',
        transition: 'all 0.2s ease',
        textAlign: 'center'
      }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <Upload size={22} strokeWidth={1.75} />
      </div>

      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
        Drag & drop or click to upload
      </span>
      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
        image/*, .png, .jpg, .webp • Max 10.0 MB
      </span>

      {statusText && (
        <span style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
          <Sparkles size={13} /> {statusText}
        </span>
      )}
      <input type="file" accept="image/*" onChange={handleInputChange} style={{ display: 'none' }} />
    </label>
  );
}
