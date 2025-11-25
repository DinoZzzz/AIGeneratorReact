import React, { useEffect, useState } from 'react';
import { useTheme, primaryColors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Material } from '../types';
import { Loader2, Plus, Trash2, Edit, Lock, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ConfirmDeleteMaterialDialog } from '../components/ConfirmDeleteMaterialDialog';
import { useQueryClient } from '@tanstack/react-query';

export const Settings = () => {
    const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [addingType, setAddingType] = useState<number | null>(null); // 1=Shaft, 2=Pipe
    const [isEditing, setIsEditing] = useState<Material | null>(null);
    const [formData, setFormData] = useState({ name: '', material_type_id: 1 });
    const { addToast } = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
    const queryClient = useQueryClient();
    const [isClearing, setIsClearing] = useState(false);

    // Separate materials by type (1 = Shaft, 2 = Pipe)
    const shaftMaterials = materials.filter(m => m.material_type_id === 1);
    const pipeMaterials = materials.filter(m => m.material_type_id === 2);

    useEffect(() => {
        checkAdminStatus();
        fetchMaterials();
    }, []);

    const checkAdminStatus = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (!error && data && data.role === 'admin') {
                setIsAdmin(true);
            }
        } catch (err) {
            console.warn('Error checking admin status:', err);
        }
    };

    const fetchMaterials = async () => {
        try {
            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .order('name');

            if (error) throw error;
            setMaterials(data || []);
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !addingType) return;

        try {
            const { error } = await supabase
                .from('materials')
                .insert([{ name: formData.name, material_type_id: addingType }]);

            if (error) throw error;

            addToast(t('materials.added'), 'success');
            setAddingType(null);
            setFormData({ name: '', material_type_id: 1 });
            fetchMaterials();
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing || !formData.name.trim()) return;

        try {
            const { error } = await supabase
                .from('materials')
                .update({ name: formData.name })
                .eq('id', isEditing.id);

            if (error) throw error;

            addToast(t('materials.updated'), 'success');
            setIsEditing(null);
            setFormData({ name: '', material_type_id: 1 });
            fetchMaterials();
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    const handleDeleteClick = (material: Material) => {
        setMaterialToDelete(material);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!materialToDelete) return;

        try {
            // Check usage in report_forms
            const { data: usageData, error: usageError } = await supabase
                .from('report_forms')
                .select('id')
                .or(`pane_material_id.eq.${materialToDelete.id},pipe_material_id.eq.${materialToDelete.id}`)
                .limit(1);

            if (usageError) throw usageError;

            if (usageData && usageData.length > 0) {
                addToast(t('materials.inUseError'), 'error');
                setDeleteDialogOpen(false);
                setMaterialToDelete(null);
                return;
            }

            const { error } = await supabase
                .from('materials')
                .delete()
                .eq('id', materialToDelete.id);

            if (error) throw error;

            addToast(t('materials.removed'), 'success');
            fetchMaterials();
            setDeleteDialogOpen(false);
            setMaterialToDelete(null);
        } catch (error: any) {
            addToast(error.message, 'error');
            setDeleteDialogOpen(false);
            setMaterialToDelete(null);
        }
    };

    const renderMaterialSection = (materialList: Material[], typeId: number) => {
        const isAdding = addingType === typeId;
        const isEditingInSection = isEditing && isEditing.material_type_id === typeId;
        const title = typeId === 1 ? t('materials.shaftTitle') : t('materials.pipeTitle');
        const addLabel = typeId === 1 ? t('materials.addShaft') : t('materials.addPipe');
        const formTitle = isAdding
            ? typeId === 1
                ? t('materials.newShaft')
                : t('materials.newPipe')
            : typeId === 1
                ? t('materials.editShaft')
                : t('materials.editPipe');
        const emptyTitle = typeId === 1 ? t('materials.noneShaftTitle') : t('materials.nonePipeTitle');

        return (
            <section className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setAddingType(typeId);
                                setFormData({ name: '', material_type_id: typeId });
                            }}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {addLabel}
                        </button>
                    )}
                </div>

                {!isAdmin ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                        <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground font-medium">{t('materials.restricted')}</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(isAdding || isEditingInSection) && (
                            <form
                                onSubmit={isAdding ? handleAdd : handleUpdate}
                                className="bg-muted/50 p-4 rounded-lg mb-4 border border-border"
                            >
                                <h3 className="font-medium mb-3 text-foreground">{formTitle}</h3>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('materials.namePlaceholder')}
                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!formData.name.trim()}
                                        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {t('materials.save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingType(null);
                                            setIsEditing(null);
                                            setFormData({ name: '', material_type_id: 1 });
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
                                    >
                                        {t('materials.cancel')}
                                    </button>
                                </div>
                            </form>
                        )}

                        {materialList.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-foreground">{emptyTitle}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{t('materials.noneDesc')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-border rounded-md divide-y divide-border">
                                {materialList.map((material) => (
                                    <div key={material.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <span className="font-medium text-foreground">{material.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(material);
                                                    setFormData({ name: material.name, material_type_id: material.material_type_id });
                                                    setAddingType(null);
                                                }}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                title={t('materials.edit')}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(material)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title={t('materials.remove')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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

    const handleClearCache = async () => {
        setIsClearing(true);
        try {
            // Clear React Query cache
            queryClient.clear();

            // Clear localStorage (except auth tokens)
            const keysToPreserve = ['supabase.auth.token'];
            const storage: { [key: string]: string } = {};

            keysToPreserve.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) storage[key] = value;
            });

            localStorage.clear();

            // Restore preserved keys
            Object.entries(storage).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            // Clear sessionStorage
            sessionStorage.clear();

            addToast(t('settings.cacheCleared'), 'success');

            // Reload the page to reset all state
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Error clearing cache:', error);
            addToast('Failed to clear cache', 'error');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-foreground">{t('nav.settings')}</h1>

            {/* Language */}
            <section className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-2 text-foreground">{t('settings.language')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('settings.languageDescription')}</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setLanguage('hr')}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${language === 'hr'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                    >
                        {t('language.croatian')}
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${language === 'en'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                    >
                        {t('language.english')}
                    </button>
                </div>
            </section>

            {/* Cache Management Section */}
            <section className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-2 text-foreground">{t('settings.cacheManagement')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('settings.cacheDescription')}</p>
                <button
                    onClick={handleClearCache}
                    disabled={isClearing}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
                    {isClearing ? t('settings.clearing') : t('settings.clearCache')}
                </button>
                <p className="text-xs text-muted-foreground mt-3">
                    {t('settings.cacheWarning')}
                </p>
            </section>

            {/* Appearance Section */}
            <section className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">{t('settings.appearance')}</h2>
                <div className="space-y-4">
                    <div>
                        <p className="font-medium text-foreground mb-3">{t('settings.theme')}</p>
                        <p className="text-sm text-muted-foreground mb-4">{t('settings.themeDesc')}</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-4 rounded-lg border-2 transition-all ${theme === 'light'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{t('settings.light')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-4 rounded-lg border-2 transition-all ${theme === 'dark'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{t('settings.dark')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`p-4 rounded-lg border-2 transition-all ${theme === 'system'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-slate-900 border-2 border-gray-400"></div>
                                    <span className="text-sm font-medium text-foreground">{t('settings.system')}</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <p className="font-medium text-foreground mb-3">{t('settings.primaryColor')}</p>
                        <p className="text-sm text-muted-foreground mb-4">{t('settings.primaryColorDesc')}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                            {primaryColors.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${primaryColor.name === color.name
                                        ? 'border-primary bg-primary/10'
                                        : 'border-transparent hover:bg-muted'
                                        }`}
                                    title={color.name}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full ${color.class} shadow-sm ring-offset-background transition-transform group-hover:scale-110 ${primaryColor.name === color.name ? 'ring-2 ring-primary ring-offset-2' : ''
                                            }`}
                                    />
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                                        {color.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Shaft Materials Section */}
            {renderMaterialSection(shaftMaterials, 1)}

            {/* Pipe Materials Section */}
            {renderMaterialSection(pipeMaterials, 2)}

            {/* Delete Confirmation Dialog */}
            <ConfirmDeleteMaterialDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                materialName={materialToDelete?.name || ''}
                materialType={materialToDelete?.material_type_id === 1 ? 'shaft' : 'pipe'}
            />
        </div>
    );
};
