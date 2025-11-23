import { useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ReportFile } from '../types';

interface FileUploaderProps {
  constructionId: string;
  onUploadComplete?: (file: ReportFile) => void;
  onDelete?: (fileId: string) => void;
  files?: ReportFile[];
}

export function FileUploader({ constructionId, onUploadComplete, onDelete, files = [] }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState('');

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        alert('Samo slike (JPG, PNG) i PDF datoteke su dozvoljene');
        return;
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${constructionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { data: fileRecord, error: dbError } = await supabase
        .from('report_files')
        .insert({
          construction_id: constructionId,
          file_path: uploadData.path,
          file_name: file.name,
          description: description || file.name,
          file_type: isImage ? 'image' : 'pdf'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Clear description and notify parent
      setDescription('');
      if (onUploadComplete && fileRecord) {
        onUploadComplete(fileRecord);
      }

      alert('Datoteka uspješno učitana!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Greška pri učitavanju: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: ReportFile) => {
    if (!confirm(`Jeste li sigurni da želite obrisati ${file.file_name}?`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('report-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('report_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      if (onDelete) {
        onDelete(file.id);
      }

      alert('Datoteka obrisana!');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Greška pri brisanju: ${error.message}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Povucite datoteku ovdje ili kliknite za odabir
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Podržane datoteke: JPG, PNG, PDF
        </p>

        <div className="mt-4 space-y-2">
          <input
            type="text"
            placeholder="Opis datoteke (opcionalno)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={uploading}
          />

          <label className="inline-block">
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileInput}
              disabled={uploading}
            />
            <span className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              {uploading ? 'Učitavanje...' : 'Odaberi datoteku'}
            </span>
          </label>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Učitane datoteke</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {(file.file_type ?? file.type) === 'image' ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                    {file.description && (
                      <p className="text-xs text-gray-500">{file.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file)}
                  className="text-red-600 hover:text-red-800"
                  title="Obriši datoteku"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
