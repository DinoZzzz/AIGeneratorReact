import { useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ReportFile } from '../types';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmDialogContext';
import { useLanguage } from '../context/LanguageContext';
import { errorHandler } from '../lib/errorHandler';

interface FileUploaderProps {
  constructionId: string;
  onUploadComplete?: (file: ReportFile) => void;
  onDelete?: (fileId: string) => void;
  files?: ReportFile[];
}

export function FileUploader({ constructionId, onUploadComplete, onDelete, files = [] }: FileUploaderProps) {
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const confirm = useConfirm();
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
        showError(t('fileUploader.invalidFileType'));
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

      showSuccess(t('fileUploader.uploadSuccess'));
    } catch (error) {
      const appError = errorHandler.handle(error, 'FileUploader');
      showError(errorHandler.getUserMessage(appError));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: ReportFile) => {
    if (!(await confirm({ title: t('fileUploader.deleteConfirm').replace('{name}', file.file_name), variant: 'destructive' }))) {
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

      showSuccess(t('fileUploader.deleteSuccess'));
    } catch (error) {
      const appError = errorHandler.handle(error, 'FileUploader');
      showError(errorHandler.getUserMessage(appError));
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
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-input hover:border-input'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t('fileUploader.dragDrop')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('fileUploader.supportedFiles')}
        </p>

        <div className="mt-4 space-y-2">
          <input
            type="text"
            placeholder={t('fileUploader.fileDescription')}
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
            <span className="cursor-pointer inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-50">
              {uploading ? t('fileUploader.uploading') : t('fileUploader.selectFile')}
            </span>
          </label>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">{t('fileUploader.uploadedFiles')}</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {(file.file_type ?? file.type) === 'image' ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.file_name}</p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground">{file.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file)}
                  className="text-red-600 hover:text-red-800"
                  title={t('fileUploader.deleteFile')}
                  aria-label={t('fileUploader.deleteFile')}
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
