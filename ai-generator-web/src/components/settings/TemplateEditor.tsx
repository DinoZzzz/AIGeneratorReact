import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/useConfirm';
import {
    getActiveTemplate,
    validateTemplate,
    uploadTemplate,
    listTemplateVersions,
    rollbackTemplate,
    deleteTemplateBackup
} from '../../services/templateService';
import type { TemplateInfo, TemplateValidationResult } from '../../types';
import { FileText, Upload, Check, AlertTriangle, X, RotateCcw, Loader2, Trash2, Eye, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const TemplateEditor: React.FC = () => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const confirm = useConfirm();

    const [activeTemplate, setActiveTemplate] = useState<TemplateInfo | null>(null);
    const [versions, setVersions] = useState<TemplateInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validation, setValidation] = useState<TemplateValidationResult | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [template, templateVersions] = await Promise.all([
                getActiveTemplate(),
                listTemplateVersions()
            ]);
            setActiveTemplate(template);
            setVersions(templateVersions);
        } catch (error) {
            console.error('Error loading template data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFileSelect = async (file: File) => {
        setPendingFile(file);
        setValidating(true);
        setValidation(null);

        try {
            const result = await validateTemplate(file);
            setValidation(result);
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        } finally {
            setValidating(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!pendingFile || !validation?.isValid) return;

        setUploading(true);
        try {
            const result = await uploadTemplate(pendingFile);
            if (result.success) {
                addToast(t('templateEditor.uploadSuccess'), 'success');
                setPendingFile(null);
                setValidation(null);
                await loadData();
            } else {
                addToast(result.error || t('templateEditor.uploadError'), 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleRollback = async (version: TemplateInfo) => {
        if (!(await confirm({ title: t('templateEditor.rollbackConfirm') }))) return;

        setLoading(true);
        try {
            const result = await rollbackTemplate(version.path);
            if (result.success) {
                addToast(t('templateEditor.rollbackSuccess'), 'success');
                await loadData();
            } else {
                addToast(result.error || t('templateEditor.rollbackError'), 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBackup = async (version: TemplateInfo) => {
        if (!(await confirm({ title: t('templateEditor.deleteBackupConfirm'), variant: 'destructive' }))) return;

        try {
            const result = await deleteTemplateBackup(version.path);
            if (result.success) {
                addToast(t('templateEditor.deleteBackupSuccess'), 'success');
                await loadData();
            } else {
                addToast(result.error || t('templateEditor.deleteBackupError'), 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        }
    };

    const handlePreview = async () => {
        // Download template for preview in external app
        const { data } = supabase.storage
            .from('templates')
            .getPublicUrl('method1610.docx');

        if (data.publicUrl) {
            window.open(data.publicUrl, '_blank');
        }
    };

    const handleCancelUpload = () => {
        setPendingFile(null);
        setValidation(null);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString('hr-HR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <section className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">{t('templateEditor.title')}</h2>
                </div>
                {activeTemplate && (
                    <button
                        onClick={handlePreview}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('templateEditor.previewBtn')}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Current Template Info */}
                    {activeTemplate && (
                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                {t('templateEditor.currentTemplate')}
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="font-medium text-foreground">{activeTemplate.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatFileSize(activeTemplate.size)} • {t('templateEditor.lastUpdated')}: {formatDate(activeTemplate.lastUpdated)}
                                            {activeTemplate.updatedBy && (
                                                <span> • {t('templateEditor.updatedBy')}: {activeTemplate.updatedBy}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={supabase.storage.from('templates').getPublicUrl('method1610.docx').data.publicUrl}
                                    download="method1610.docx"
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    {t('templateEditor.download')}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-foreground font-medium mb-1">
                            {t('templateEditor.uploadNew')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {t('templateEditor.supportedFormat')}
                        </p>
                    </div>

                    {/* Pending File & Validation */}
                    {pendingFile && (
                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-medium text-foreground">{pendingFile.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatFileSize(pendingFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCancelUpload}
                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                    aria-label={t('common.cancel')}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {validating ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{t('templateEditor.validating')}</span>
                                </div>
                            ) : validation && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-foreground">
                                        {t('templateEditor.validation')}
                                    </h4>

                                    {/* Errors */}
                                    {validation.errors.length > 0 && (
                                        <div className="space-y-1">
                                            {validation.errors.map((error, i) => (
                                                <div key={i} className="flex items-center gap-2 text-destructive text-sm">
                                                    <X className="h-4 w-4 flex-shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Missing Tags */}
                                    {validation.missingTags.length > 0 && (
                                        <div className="space-y-1">
                                            {validation.missingTags.map((tag, i) => (
                                                <div key={i} className="flex items-center gap-2 text-destructive text-sm">
                                                    <X className="h-4 w-4 flex-shrink-0" />
                                                    <span>{`{${tag}}`} - {t('templateEditor.tagMissing')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Found Tags */}
                                    {validation.foundTags.length > 0 && validation.errors.length === 0 && (
                                        <div className="space-y-1">
                                            {validation.foundTags.slice(0, 5).map((tag, i) => (
                                                <div key={i} className="flex items-center gap-2 text-green-600 text-sm">
                                                    <Check className="h-4 w-4 flex-shrink-0" />
                                                    <span>{`{${tag}}`} - {t('templateEditor.tagFound')}</span>
                                                </div>
                                            ))}
                                            {validation.foundTags.length > 5 && (
                                                <p className="text-sm text-muted-foreground ml-6">
                                                    +{validation.foundTags.length - 5} {t('templateEditor.moreTags')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Unrecognized Tags */}
                                    {validation.unrecognizedTags.length > 0 && (
                                        <div className="space-y-1">
                                            {validation.unrecognizedTags.map((tag, i) => (
                                                <div key={i} className="flex items-center gap-2 text-yellow-600 text-sm">
                                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                    <span>{`{${tag}}`} - {t('templateEditor.unrecognized')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {validation.warnings.length > 0 && (
                                        <div className="space-y-1">
                                            {validation.warnings.map((warning, i) => (
                                                <div key={i} className="flex items-center gap-2 text-yellow-600 text-sm">
                                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                    <span>{warning}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <div className="pt-3 border-t border-border">
                                        <button
                                            onClick={handleUpload}
                                            disabled={!validation.isValid || uploading}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t('templateEditor.uploading')}
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {t('templateEditor.activateBtn')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Version History */}
                    {versions.length > 0 && (
                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">
                                {t('templateEditor.previousVersions')}
                            </h3>
                            <div className="space-y-2">
                                {versions.map((version) => (
                                    <div
                                        key={version.path}
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{version.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(version.lastUpdated)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRollback(version)}
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                                            >
                                                <RotateCcw className="h-3 w-3 mr-1" />
                                                {t('templateEditor.restore')}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBackup(version)}
                                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                                aria-label={t('common.delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
