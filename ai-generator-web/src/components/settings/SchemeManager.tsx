import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/useConfirm';
import {
    getSchemeImages,
    uploadSchemeImage,
    updateSchemeMetadata,
    resetSchemeImage,
    getSchemePublicUrl,
    validateSchemeImage
} from '../../services/schemeService';
import type { SchemeImage } from '../../types';
import { Image, Upload, Save, RotateCcw, Loader2, X, Check, Edit2 } from 'lucide-react';

interface SchemeCardProps {
    scheme: SchemeImage;
    onUpdate: () => void;
}

const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, onUpdate }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const confirm = useConfirm();

    const [name, setName] = useState(scheme.name);
    const [description, setDescription] = useState(scheme.description || '');
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current image URL
    const currentImageUrl = scheme.file_path
        ? getSchemePublicUrl(scheme.file_path)
        : `/assets/Scheme${scheme.scheme_number}.PNG`;

    const handleFileSelect = (file: File) => {
        const validation = validateSchemeImage(file);
        if (!validation.isValid) {
            addToast(validation.error || t('schemeManager.uploadError'), 'error');
            return;
        }

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPendingFile(file);
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
        if (!pendingFile) return;

        setUploading(true);
        try {
            const result = await uploadSchemeImage(scheme.scheme_number, pendingFile, scheme.method_type);
            if (result.success) {
                addToast(t('schemeManager.uploadSuccess'), 'success');
                setPendingFile(null);
                setPreviewUrl(null);
                onUpdate();
            } else {
                addToast(result.error || t('schemeManager.uploadError'), 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCancelUpload = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPendingFile(null);
        setPreviewUrl(null);
    };

    const handleSaveMetadata = async () => {
        setSaving(true);
        try {
            const result = await updateSchemeMetadata(scheme.scheme_number, name, description, scheme.method_type);
            if (result.success) {
                addToast(t('schemeManager.saveSuccess'), 'success');
                setIsEditing(false);
                onUpdate();
            } else {
                addToast(result.error || t('schemeManager.saveError'), 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!(await confirm({ title: t('schemeManager.resetConfirm'), variant: 'destructive' }))) return;

        setResetting(true);
        try {
            const result = await resetSchemeImage(scheme.scheme_number, scheme.method_type);
            if (result.success) {
                addToast(t('schemeManager.resetSuccess'), 'success');
                onUpdate();
            } else {
                addToast(result.error || t('schemeManager.resetError'), 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : t('common.unknownError'), 'error');
        } finally {
            setResetting(false);
        }
    };

    const handleCancelEdit = () => {
        setName(scheme.name);
        setDescription(scheme.description || '');
        setIsEditing(false);
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            {/* Image Preview */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-dashed transition-colors ${
                    isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                }`}
            >
                <img
                    src={previewUrl || currentImageUrl}
                    alt={scheme.name}
                    className="w-full h-full object-contain bg-muted/30"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `/assets/Scheme${scheme.scheme_number}.PNG`;
                    }}
                />

                {/* Upload overlay */}
                <div
                    className={`absolute inset-0 flex items-center justify-center bg-background/80 transition-opacity ${
                        isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center pointer-events-none">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t('schemeManager.dragDrop')}</p>
                    </div>
                </div>

                {/* Cloud indicator */}
                {scheme.file_path && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Cloud
                    </div>
                )}
            </div>

            {/* Pending upload actions */}
            {pendingFile && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground flex-1 truncate">{pendingFile.name}</span>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {uploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <>
                                <Check className="h-3 w-3 mr-1" />
                                {t('schemeManager.upload')}
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleCancelUpload}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={t('common.cancel')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Metadata */}
            <div className="space-y-3">
                {isEditing ? (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                {t('schemeManager.name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                {t('schemeManager.description')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveMetadata}
                                disabled={saving}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-1" />
                                        {t('schemeManager.save')}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-2 text-sm font-medium text-muted-foreground border border-input rounded-md hover:bg-accent transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground text-sm leading-tight" title={scheme.name}>{scheme.name}</h3>
                                {scheme.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3" title={scheme.description}>
                                        {scheme.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                title={t('common.edit')}
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Updated info */}
                        {scheme.updated_by_name && (
                            <p className="text-xs text-muted-foreground">
                                {t('schemeManager.updatedBy')}: {scheme.updated_by_name}
                            </p>
                        )}

                        {/* Reset button - only show if has cloud image */}
                        {scheme.file_path && (
                            <button
                                onClick={handleReset}
                                disabled={resetting}
                                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-muted-foreground border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                            >
                                {resetting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        {t('schemeManager.reset')}
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export const SchemeManager: React.FC = () => {
    const { t } = useLanguage();

    const [schemes, setSchemes] = useState<SchemeImage[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSchemes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSchemeImages();
            setSchemes(data);
        } catch (error) {
            console.error('Error loading schemes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSchemes();
    }, [loadSchemes]);

    // Group schemes by method type
    const waterSchemes = schemes.filter(s => s.method_type === 'water');
    const airSchemes = schemes.filter(s => s.method_type === 'air');

    const renderSchemeGrid = (schemeList: SchemeImage[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {schemeList.map((scheme) => (
                <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    onUpdate={loadSchemes}
                />
            ))}
        </div>
    );

    return (
        <section className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
                <Image className="h-6 w-6 text-primary" />
                <div>
                    <h2 className="text-xl font-semibold text-foreground">{t('schemeManager.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('schemeManager.subtitle')}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : schemes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {t('schemeManager.noSchemes')}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Water Method Schemes */}
                    {waterSchemes.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <h3 className="text-lg font-medium text-foreground">
                                    {t('schemeManager.waterMethod')}
                                </h3>
                                <span className="text-sm text-muted-foreground">
                                    ({waterSchemes.length})
                                </span>
                            </div>
                            {renderSchemeGrid(waterSchemes)}
                        </div>
                    )}

                    {/* Air Method Schemes */}
                    {airSchemes.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <h3 className="text-lg font-medium text-foreground">
                                    {t('schemeManager.airMethod')}
                                </h3>
                                <span className="text-sm text-muted-foreground">
                                    ({airSchemes.length})
                                </span>
                            </div>
                            {renderSchemeGrid(airSchemes)}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
