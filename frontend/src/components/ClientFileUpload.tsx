import { useState, useRef } from 'react';
import { UploadSimple, FileText, X, CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic',
  '.pdf', '.doc', '.docx', '.txt',
  '.ai', '.psd', '.sketch', '.fig',
  '.mp4', '.mov',
  '.zip',
];

const ACCEPT_STRING = ALLOWED_EXTENSIONS.join(',');

interface ClientFileUploadProps {
  token: string;
  onUploadComplete: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function ClientFileUpload({ token, onUploadComplete }: ClientFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (selectedFiles: File[]): string | null => {
    if (selectedFiles.length > 5) {
      return 'Maximum 5 files per upload';
    }
    const oversized = selectedFiles.filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      return `${oversized[0].name} exceeds the 50MB limit`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validationError = validateFiles([...files, ...selectedFiles]);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFiles(prev => {
      const combined = [...prev, ...selectedFiles];
      return combined.slice(0, 5); // cap at 5
    });
    setError('');
    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    const validationError = validateFiles([...files, ...droppedFiles]);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFiles(prev => [...prev, ...droppedFiles].slice(0, 5));
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const res = await fetch(`${API_URL}/api/portal/${token}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || result.error || 'Upload failed');
      }

      setUploadedCount(result.files?.length || files.length);
      setUploaded(true);
      setFiles([]);

      // Reset after 3 seconds and notify parent
      setTimeout(() => {
        setUploaded(false);
        setUploadedCount(0);
        onUploadComplete();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6" data-testid="client-file-upload">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
          <UploadSimple weight="bold" className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">UploadSimple Files</h3>
          <p className="text-sm text-text-tertiary">
            Share reference images, signed contracts, or other files
          </p>
        </div>
      </div>

      {uploaded ? (
        <div className="text-center py-8" data-testid="upload-success">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle weight="duotone" className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-green-700 mb-1">Files Uploaded!</p>
          <p className="text-sm text-text-tertiary">
            {uploadedCount} file{uploadedCount > 1 ? 's' : ''} sent successfully.
          </p>
        </div>
      ) : (
        <>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            onChange={handleFileSelect}
            className="hidden"
            data-testid="client-file-input"
          />

          {/* Drop zone / file picker */}
          {files.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`w-full border-2 border-dashed rounded-xl p-8 cursor-pointer text-center transition-all ${
                dragOver
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
              data-testid="client-dropzone"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UploadSimple className="w-6 h-6 text-text-secondary" />
              </div>
              <p className="font-medium text-gray-700 mb-1">
                Click to upload or drag & drop
              </p>
              <p className="text-sm text-text-secondary">
                Max 5 files, 50MB each &middot; Images, PDFs, Documents, Videos, Design files
              </p>
            </div>
          ) : (
            <>
              {/* Selected files list */}
              <div className="space-y-2 mb-4" data-testid="selected-files-list">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    data-testid={`selected-file-${index}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-text-tertiary">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors ml-2"
                      data-testid={`remove-file-${index}`}
                    >
                      <X className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {files.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                    data-testid="add-more-files-btn"
                  >
                    Add More
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="upload-files-btn"
                >
                  {uploading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadSimple weight="bold" className="w-4 h-4" />
                      UploadSimple {files.length} File{files.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2" data-testid="upload-error">
              <WarningCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
