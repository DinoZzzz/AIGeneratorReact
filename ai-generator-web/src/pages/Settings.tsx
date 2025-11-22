import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Material } from '../types';
import { Loader2, Plus, Trash2, Edit, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState<Material | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const { addToast } = useToast();

    useEffect(() => {
        checkAdminStatus();
        fetchMaterials();
    }, []);

    const checkAdminStatus = async () => {
        if (!user) return;

        // Check if the user exists in the admin_users table
        // We try to fetch a record where user_id matches current user
        // Note: 'admin_users' table name is an assumption based on user request.
        // If table doesn't exist, this will error, which we catch.
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', user.id)
                .limit(1);

            if (!error && data && data.length > 0) {
                setIsAdmin(true);
            } else {
                // Fallback: Check user metadata just in case
                const metaRole = user.user_metadata?.role || user.app_metadata?.role;
                if (metaRole === 'admin') {
                    setIsAdmin(true);
                }
            }
        } catch (err) {
            console.warn('Error checking admin status (table might not exist):', err);
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
        if (!formData.name.trim()) return;

        try {
            // Fetch material_types first to get a valid ID
            const { data: types } = await supabase
                .from('material_types')
                .select('id')
                .limit(1);

            // Default to 1 if fetch fails or empty, but prefer actual ID
            const typeId = (types && types.length > 0) ? types[0].id : 1;

            const { error } = await supabase
                .from('materials')
                .insert([{ name: formData.name, material_type_id: typeId }]);

            if (error) throw error;

            addToast('Material added successfully', 'success');
            setIsAdding(false);
            setFormData({ name: '' });
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

            addToast('Material updated successfully', 'success');
            setIsEditing(null);
            setFormData({ name: '' });
            fetchMaterials();
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this material?')) return;

        try {
            // Check usage in report_forms
            // We check both pane_material_id and pipe_material_id
            const { data: usageData, error: usageError } = await supabase
                .from('report_forms')
                .select('id')
                .or(`pane_material_id.eq.${id},pipe_material_id.eq.${id}`)
                .limit(1);

            if (usageError) throw usageError;

            if (usageData && usageData.length > 0) {
                addToast('Cannot remove material because it is used in reports.', 'error');
                return;
            }

            const { error } = await supabase
                .from('materials')
                .delete()
                .eq('id', id);

            if (error) throw error;

            addToast('Material removed successfully', 'success');
            fetchMaterials();
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>

            {/* Appearance Section */}
            <section className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Appearance</h2>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="font-medium text-foreground">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Toggle dark mode for the application</p>
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${theme === 'dark' ? 'bg-primary' : 'bg-input'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </section>

            {/* Materials Section */}
            <section className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Materials</h2>
                    {isAdmin && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Material
                        </button>
                    )}
                </div>

                {!isAdmin ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                        <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground font-medium">Material management is restricted to administrators.</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(isAdding || isEditing) && (
                            <form
                                onSubmit={isAdding ? handleAdd : handleUpdate}
                                className="bg-muted/50 p-4 rounded-lg mb-4 border border-border"
                            >
                                <h3 className="font-medium mb-3 text-foreground">
                                    {isAdding ? 'Add New Material' : 'Edit Material'}
                                </h3>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Material name"
                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!formData.name.trim()}
                                        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setIsEditing(null);
                                            setFormData({ name: '' });
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {materials.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-foreground">No materials found</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Add materials to be used in reports.
                                    </p>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Material
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="border border-border rounded-md divide-y divide-border">
                                {materials.map((material) => (
                                    <div key={material.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <span className="font-medium text-foreground">{material.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(material);
                                                    setFormData({ name: material.name });
                                                    setIsAdding(false);
                                                }}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(material.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title="Remove"
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
        </div>
    );
};
