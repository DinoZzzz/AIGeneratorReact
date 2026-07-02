import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Trash2, Edit, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { supabase } from '../../lib/supabase';
import { isNetworkError } from '../../lib/errorHandler';
import { focusOnMount } from '../../lib/utils';
import type { Material } from '../../types';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
    STORES,
    addToSyncQueue,
    deleteFromStore,
    getAllFromStore,
    getFromStore,
    removeSyncOperationsForEntity,
    saveManyToStore,
    saveToStore
} from '../../lib/offlineDb';

interface MaterialsManagerProps {
    isAdmin: boolean;
}

export const MaterialsManager = ({ isAdmin }: MaterialsManagerProps) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const { isOnline, triggerSync } = useOffline();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingType, setAddingType] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState<Material | null>(null);
    const [formData, setFormData] = useState({ name: '', material_type_id: 1 });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

    const shaftMaterials = materials.filter(m => m.material_type_id === 1);
    const pipeMaterials = materials.filter(m => m.material_type_id === 2);

    const fetchMaterials = useCallback(async () => {
        try {
            if (isOnline) {
                try {
                    const { data, error } = await supabase
                        .from('materials')
                        .select('*')
                        .order('name');

                    if (error) throw error;
                    const fetchedMaterials = (data || []) as Material[];
                    setMaterials(fetchedMaterials);
                    await saveManyToStore(STORES.MATERIALS, fetchedMaterials);
                    return;
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                }
            }

            const offlineMaterials = await getAllFromStore<Material>(STORES.MATERIALS);
            setMaterials(offlineMaterials.sort((left, right) => left.name.localeCompare(right.name)));
        } catch (error) {
            addToast(error instanceof Error ? error.message : String(error), 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, isOnline]);

    useEffect(() => {
        void fetchMaterials();
    }, [fetchMaterials]);

    const updateMaterialOffline = async (materialId: number, name: string) => {
        const existing = await getFromStore<Material>(STORES.MATERIALS, materialId);
        if (!existing) {
            throw new Error('Material is not available offline');
        }

        const updated = {
            ...existing,
            id: materialId,
            name,
            _is_offline: true
        };

        await saveToStore(STORES.MATERIALS, updated);
        await addToSyncQueue(STORES.MATERIALS, 'update', { name }, String(materialId));
    };

    const createMaterialOffline = async (name: string, materialTypeId: number) => {
        const tempMaterialId = -Math.floor(Date.now() + Math.random() * 1000);
        const offlineMaterial = {
            id: tempMaterialId,
            name,
            material_type_id: materialTypeId,
            _is_offline: true
        } as Material & { _is_offline: boolean };

        await saveToStore(STORES.MATERIALS, offlineMaterial);
        await addToSyncQueue(
            STORES.MATERIALS,
            'create',
            { name, material_type_id: materialTypeId },
            String(tempMaterialId)
        );
    };

    const deleteMaterialOffline = async (materialId: number) => {
        await deleteFromStore(STORES.MATERIALS, materialId);
        if (materialId < 0) {
            await removeSyncOperationsForEntity(STORES.MATERIALS, String(materialId));
            return;
        }
        await addToSyncQueue(STORES.MATERIALS, 'delete', null, String(materialId));
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !addingType) return;
        try {
            if (isOnline) {
                try {
                    const { data, error } = await supabase
                        .from('materials')
                        .insert([{ name: formData.name, material_type_id: addingType }])
                        .select()
                        .single();

                    if (error) throw error;
                    await saveToStore(STORES.MATERIALS, data as Material);
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                    await createMaterialOffline(formData.name.trim(), addingType);
                }
            } else {
                await createMaterialOffline(formData.name.trim(), addingType);
            }

            addToast(t('materials.added'), 'success');
            setAddingType(null);
            setFormData({ name: '', material_type_id: 1 });
            await fetchMaterials();
            await triggerSync();
        } catch (error) {
            addToast(error instanceof Error ? error.message : String(error), 'error');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing || !formData.name.trim()) return;
        try {
            if (isOnline) {
                try {
                    const { data, error } = await supabase
                        .from('materials')
                        .update({ name: formData.name })
                        .eq('id', isEditing.id)
                        .select()
                        .single();

                    if (error) throw error;
                    await saveToStore(STORES.MATERIALS, data as Material);
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                    await updateMaterialOffline(isEditing.id, formData.name);
                }
            } else {
                await updateMaterialOffline(isEditing.id, formData.name);
            }

            addToast(t('materials.updated'), 'success');
            setIsEditing(null);
            setFormData({ name: '', material_type_id: 1 });
            await fetchMaterials();
            if (isOnline) {
                await triggerSync();
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : String(error), 'error');
        }
    };

    const handleDeleteClick = (material: Material) => {
        setMaterialToDelete(material);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!materialToDelete) return;
        try {
            if (isOnline) {
                try {
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
                    await deleteFromStore(STORES.MATERIALS, materialToDelete.id);
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                    const cachedReports = await getAllFromStore<{ pane_material_id?: number; pipe_material_id?: number }>(STORES.REPORTS);
                    const isInUseOffline = cachedReports.some((report) =>
                        report.pane_material_id === materialToDelete.id || report.pipe_material_id === materialToDelete.id
                    );
                    if (isInUseOffline) {
                        addToast(t('materials.inUseError'), 'error');
                        setDeleteDialogOpen(false);
                        setMaterialToDelete(null);
                        return;
                    }
                    await deleteMaterialOffline(materialToDelete.id);
                }
            } else {
                const cachedReports = await getAllFromStore<{ pane_material_id?: number; pipe_material_id?: number }>(STORES.REPORTS);
                const isInUseOffline = cachedReports.some((report) =>
                    report.pane_material_id === materialToDelete.id || report.pipe_material_id === materialToDelete.id
                );
                if (isInUseOffline) {
                    addToast(t('materials.inUseError'), 'error');
                    setDeleteDialogOpen(false);
                    setMaterialToDelete(null);
                    return;
                }
                await deleteMaterialOffline(materialToDelete.id);
            }

            addToast(t('materials.removed'), 'success');
            await fetchMaterials();
            setDeleteDialogOpen(false);
            setMaterialToDelete(null);
            if (isOnline) {
                await triggerSync();
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : String(error), 'error');
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
            ? typeId === 1 ? t('materials.newShaft') : t('materials.newPipe')
            : typeId === 1 ? t('materials.editShaft') : t('materials.editPipe');
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
                                        ref={focusOnMount}
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

    return (
        <>
            {renderMaterialSection(shaftMaterials, 1)}
            {renderMaterialSection(pipeMaterials, 2)}

            <ConfirmDialog
                open={deleteDialogOpen}
                onConfirm={() => { handleDeleteConfirm(); setDeleteDialogOpen(false); }}
                onCancel={() => setDeleteDialogOpen(false)}
                title={t('materials.deleteDialogTitle')}
                description={t('materials.deleteDialogMessage')}
                confirmLabel={t('materials.confirmDelete')}
                cancelLabel={t('materials.cancel')}
                variant="destructive"
            >
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{t('materials.materialType')}:</p>
                    <p className="font-semibold text-foreground">
                        {materialToDelete?.material_type_id === 1
                            ? t('materials.shaftSingular') || 'material for shaft'
                            : t('materials.pipeSingular') || 'material for pipe'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 mb-1">{t('materials.materialName')}:</p>
                    <p className="font-semibold text-foreground">{materialToDelete?.name || ''}</p>
                </div>
                <p className="text-destructive font-medium mt-3">{t('materials.deleteWarning')}</p>
            </ConfirmDialog>
        </>
    );
};
