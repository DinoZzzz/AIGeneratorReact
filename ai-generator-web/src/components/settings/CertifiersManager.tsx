import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Edit, Star, Upload, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { certifierService, type Certifier } from '../../services/certifierService';

export const CertifiersManager = () => {
    const { t } = useLanguage();
    const { addToast } = useToast();

    const [certifiers, setCertifiers] = useState<Certifier[]>([]);
    const [certifiersLoading, setCertifiersLoading] = useState(true);
    const [isAddingCertifier, setIsAddingCertifier] = useState(false);
    const [editingCertifier, setEditingCertifier] = useState<Certifier | null>(null);
    const [certifierForm, setCertifierForm] = useState({ name: '', title: '' });

    useEffect(() => {
        fetchCertifiers();
    }, []);

    const fetchCertifiers = async () => {
        setCertifiersLoading(true);
        try {
            const data = await certifierService.getAll();
            setCertifiers(data);
        } catch (error: unknown) {
            console.warn('Error fetching certifiers:', (error as Error).message);
        } finally {
            setCertifiersLoading(false);
        }
    };

    const handleAddCertifier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certifierForm.name.trim()) return;
        try {
            await certifierService.create({
                name: certifierForm.name.trim(),
                title: certifierForm.title.trim() || undefined,
                is_default: certifiers.length === 0
            });
            addToast(t('certifiers.added'), 'success');
            setIsAddingCertifier(false);
            setCertifierForm({ name: '', title: '' });
            fetchCertifiers();
        } catch (error: unknown) {
            addToast((error as Error).message, 'error');
        }
    };

    const handleUpdateCertifier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCertifier || !certifierForm.name.trim()) return;
        try {
            await certifierService.update(editingCertifier.id, {
                name: certifierForm.name.trim(),
                title: certifierForm.title.trim() || undefined
            });
            addToast(t('certifiers.updated'), 'success');
            setEditingCertifier(null);
            setCertifierForm({ name: '', title: '' });
            fetchCertifiers();
        } catch (error: unknown) {
            addToast((error as Error).message, 'error');
        }
    };

    const handleDeleteCertifier = async (id: string) => {
        if (!window.confirm(t('certifiers.deleteConfirm'))) return;
        try {
            await certifierService.delete(id);
            addToast(t('certifiers.deleted'), 'success');
            fetchCertifiers();
        } catch (error: unknown) {
            addToast((error as Error).message, 'error');
        }
    };

    const handleSetDefaultCertifier = async (id: string) => {
        try {
            await certifierService.setDefault(id);
            addToast(t('certifiers.defaultSet'), 'success');
            fetchCertifiers();
        } catch (error: unknown) {
            addToast((error as Error).message, 'error');
        }
    };

    const handleSignatureUpload = async (certifierId: string, file: File | undefined) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            addToast(t('certifiers.invalidFileType') || 'Please upload an image file', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            addToast(t('certifiers.fileTooLarge') || 'File size must be less than 2MB', 'error');
            return;
        }
        try {
            await certifierService.uploadSignature(certifierId, file);
            addToast(t('certifiers.signatureUploaded') || 'Signature uploaded successfully', 'success');
            fetchCertifiers();
        } catch (error: unknown) {
            addToast((error as Error).message, 'error');
        }
    };

    const handleDeleteSignature = async (certifierId: string) => {
        if (!window.confirm(t('certifiers.deleteSignatureConfirm') || 'Are you sure you want to delete this signature?')) return;
        try {
            await certifierService.deleteSignature(certifierId);
            addToast(t('certifiers.signatureDeleted') || 'Signature deleted', 'success');
            fetchCertifiers();
        } catch (error: unknown) {
            addToast((error as Error).message, 'error');
        }
    };

    return (
        <section className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t('certifiers.title')}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('certifiers.description')}</p>
                </div>
                <button
                    onClick={() => {
                        setIsAddingCertifier(true);
                        setCertifierForm({ name: '', title: '' });
                        setEditingCertifier(null);
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('certifiers.add')}
                </button>
            </div>

            {certifiersLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-4">
                    {(isAddingCertifier || editingCertifier) && (
                        <form
                            onSubmit={isAddingCertifier ? handleAddCertifier : handleUpdateCertifier}
                            className="bg-muted/50 p-4 rounded-lg mb-4 border border-border"
                        >
                            <h3 className="font-medium mb-3 text-foreground">
                                {isAddingCertifier ? t('certifiers.new') : t('certifiers.edit')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        {t('certifiers.name')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={certifierForm.name}
                                        onChange={(e) => setCertifierForm({ ...certifierForm, name: e.target.value })}
                                        placeholder={t('certifiers.namePlaceholder')}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        {t('certifiers.titleLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={certifierForm.title}
                                        onChange={(e) => setCertifierForm({ ...certifierForm, title: e.target.value })}
                                        placeholder={t('certifiers.titlePlaceholder')}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    type="submit"
                                    disabled={!certifierForm.name.trim()}
                                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 w-full sm:w-auto"
                                >
                                    {t('materials.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingCertifier(false);
                                        setEditingCertifier(null);
                                        setCertifierForm({ name: '', title: '' });
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-input rounded-md hover:bg-accent hover:text-accent-foreground w-full sm:w-auto"
                                >
                                    {t('materials.cancel')}
                                </button>
                            </div>
                        </form>
                    )}

                    {certifiers.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 text-muted-foreground/50 mb-4" />
                                <p className="text-lg font-medium text-foreground">{t('certifiers.none')}</p>
                                <p className="text-sm text-muted-foreground mt-1">{t('certifiers.noneDesc')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-border rounded-md divide-y divide-border">
                            {certifiers.map((certifier) => (
                                <div key={certifier.id} className="flex flex-col p-3 sm:p-4 gap-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            {certifier.is_default && (
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <span className="font-medium text-foreground text-sm sm:text-base block truncate">
                                                    {certifierService.getDisplayName(certifier)}
                                                </span>
                                                {certifier.is_default && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({t('certifiers.default')})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                                            {!certifier.is_default && (
                                                <button
                                                    onClick={() => handleSetDefaultCertifier(certifier.id)}
                                                    className="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-md transition-colors"
                                                    title={t('certifiers.setDefault')}
                                                >
                                                    <Star className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setEditingCertifier(certifier);
                                                    setCertifierForm({
                                                        name: certifier.name,
                                                        title: certifier.title || ''
                                                    });
                                                    setIsAddingCertifier(false);
                                                }}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                title={t('materials.edit')}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCertifier(certifier.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title={t('materials.remove')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Signature Section */}
                                    <div className="flex items-center gap-3 pl-0 sm:pl-7 border-t border-border/50 pt-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">
                                            {t('certifiers.signature') || 'Potpis'}:
                                        </span>
                                        {certifier.signature_url ? (
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={certifier.signature_url}
                                                    alt={t('certifiers.signature') || 'Potpis'}
                                                    className="h-10 max-w-32 object-contain border border-border rounded bg-white"
                                                />
                                                <button
                                                    onClick={() => handleDeleteSignature(certifier.id)}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    title={t('certifiers.deleteSignature') || 'Obriši potpis'}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors">
                                                <div className="flex items-center gap-1 px-2 py-1.5 border border-dashed border-border rounded hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                                    <Upload className="h-3.5 w-3.5" />
                                                    <span>{t('certifiers.uploadSignature') || 'Učitaj potpis'}</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleSignatureUpload(certifier.id, e.target.files?.[0])}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
