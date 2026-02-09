import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useOffline } from '../context/OfflineContext';
import { examinerService } from '../services/examinerService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Checkbox } from '../components/ui/Checkbox';
import { Camera, Loader2, FileText, PieChart, TrendingUp } from 'lucide-react';
import type { Profile, ReportType } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';
import { UserAvatar } from '../components/ui/UserAvatar';
import { errorHandler, isNetworkError } from '../lib/errorHandler';
import {
    STORES,
    addToSyncQueue,
    getAllFromStore,
    getFromStore,
    removeSyncOperationsForEntity,
    saveManyToStore,
    saveToStore
} from '../lib/offlineDb';

export const ProfilePage = () => {
    const { profile, user, refreshProfile } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const { isOnline, triggerSync } = useOffline();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
    const [formData, setFormData] = useState<Partial<Profile>>({
        name: '',
        last_name: '',
        username: '',
        email: '',
        title: '',
        gender: undefined,
        accreditations: [],
        avatar_url: ''
    });

    useEffect(() => {
        void loadReportTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    useEffect(() => {
        if (profile) {
            setFormData({
                id: profile.id,
                name: profile.name || '',
                last_name: profile.last_name || '',
                username: profile.username || '',
                email: profile.email || user?.email || '',
                title: profile.title || '',
                gender: profile.gender,
                role: profile.role,
                accreditations: profile.accreditations || [],
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile, user]);

    const loadReportTypes = async () => {
        try {
            if (isOnline) {
                try {
                    const types = await examinerService.getReportTypes();
                    setReportTypes(types);
                    await saveManyToStore(STORES.REPORT_TYPES, types);
                    return;
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                }
            }

            const offlineTypes = await getAllFromStore<ReportType>(STORES.REPORT_TYPES);
            setReportTypes(offlineTypes);
        } catch (error) {
            console.error('Failed to load report types', error);
        }
    };

    const isBlobAvatarUrl = (value: unknown): value is string => (
        typeof value === 'string' && value.startsWith('blob:')
    );

    const queueAvatarUploadOffline = async (file: File) => {
        if (!profile?.id) return;

        const blobUrl = URL.createObjectURL(file);
        const previousAvatarUrl = formData.avatar_url;
        if (isBlobAvatarUrl(previousAvatarUrl)) {
            URL.revokeObjectURL(previousAvatarUrl);
        }

        setFormData(prev => ({ ...prev, avatar_url: blobUrl }));

        const existing = await getFromStore<Profile>(STORES.EXAMINERS, profile.id);
        await saveToStore(STORES.EXAMINERS, {
            ...(existing || profile),
            avatar_url: blobUrl,
            _is_offline: true
        });

        await removeSyncOperationsForEntity(STORES.UPLOADS, profile.id);
        await addToSyncQueue(
            STORES.UPLOADS,
            'update',
            {
                kind: 'profile_avatar_upload',
                user_id: profile.id,
                file_name: file.name,
                mime_type: file.type,
                blob: file
            },
            profile.id
        );
        toast.success(t('profile.avatarUploadQueued') || 'Avatar saved offline and queued for sync');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (!profile?.id) return;

        setUploading(true);
        try {
            if (isOnline) {
                try {
                    const publicUrl = await examinerService.uploadAvatar(file, profile.id);
                    const previousAvatarUrl = formData.avatar_url;
                    if (isBlobAvatarUrl(previousAvatarUrl)) {
                        URL.revokeObjectURL(previousAvatarUrl);
                    }
                    setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
                    toast.success(t('profile.avatarUploaded'));
                    return;
                } catch (error) {
                    if (!isNetworkError(error)) {
                        throw error;
                    }
                }
            }

            await queueAvatarUploadOffline(file);
        } catch (error) {
            const appError = errorHandler.handle(error, 'Profile');
            toast.error(errorHandler.getUserMessage(appError));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.last_name || !formData.username) {
            toast.error(t('examiners.dialog.fillRequired'));
            return;
        }

        setLoading(true);
        try {
            const safeAvatarUrl = isBlobAvatarUrl(formData.avatar_url) ? undefined : formData.avatar_url;
            const profileUpdatePayload: Partial<Profile> = {
                id: formData.id,
                name: formData.name,
                last_name: formData.last_name,
                username: formData.username,
                title: formData.title,
                gender: formData.gender,
                role: formData.role,
                accreditations: formData.accreditations,
                avatar_url: safeAvatarUrl
            };
            const cleanProfileUpdatePayload = Object.fromEntries(
                Object.entries(profileUpdatePayload).filter(([, value]) => value !== undefined)
            ) as Partial<Profile>;

            const queueProfileUpdateOffline = async () => {
                if (!profile?.id) {
                    throw new Error('Profile ID is missing');
                }

                const existing = await getFromStore<Profile>(STORES.EXAMINERS, profile.id);
                const updated = {
                    ...(existing || profile),
                    ...cleanProfileUpdatePayload,
                    id: profile.id,
                    _is_offline: true
                };

                await saveToStore(STORES.EXAMINERS, updated);
                await addToSyncQueue(STORES.EXAMINERS, 'update', cleanProfileUpdatePayload, profile.id);
            };

            if (isOnline) {
                try {
                    const saved = await examinerService.saveExaminer({ ...formData, avatar_url: safeAvatarUrl });
                    await saveToStore(STORES.EXAMINERS, saved);
                    await refreshProfile();
                } catch (error) {
                    if (!isNetworkError(error)) {
                        throw error;
                    }
                    await queueProfileUpdateOffline();
                }
            } else {
                await queueProfileUpdateOffline();
            }

            toast.success(t('profile.saved'));
            if (isOnline) {
                await triggerSync();
            }
        } catch (error) {
            const appError = errorHandler.handle(error, 'Profile');
            toast.error(errorHandler.getUserMessage(appError));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (isBlobAvatarUrl(formData.avatar_url)) {
                URL.revokeObjectURL(formData.avatar_url);
            }
        };
    }, [formData.avatar_url]);

    const toggleAccreditation = (typeId: number) => {
        const current = formData.accreditations || [];
        const newAccreditations = current.includes(typeId)
            ? current.filter(id => id !== typeId)
            : [...current, typeId];

        setFormData({ ...formData, accreditations: newAccreditations });
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground">{t('profile.title')}</h2>
                    <p className="text-muted-foreground mt-1">{t('profile.subtitle')}</p>
                </div>

                <div className="p-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <UserAvatar
                                src={formData.avatar_url}
                                name={formData.name}
                                email={user?.email}
                                id={profile?.id}
                                size="xl"
                                className="border-4 border-background shadow-lg"
                            />
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
                            >
                                <Camera className="h-5 w-5" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('profile.changePhoto')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('examiners.dialog.firstName')}</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">{t('examiners.dialog.lastName')}</Label>
                                <Input
                                    id="lastName"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">{t('examiners.dialog.username')}</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">{t('examiners.dialog.title')}</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('examiners.dialog.gender')}</Label>
                            <div className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="gender-m"
                                        name="gender"
                                        value="M"
                                        checked={formData.gender === 'M'}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                                        className="h-4 w-4 text-primary focus:ring-ring"
                                    />
                                    <Label htmlFor="gender-m" className="font-normal cursor-pointer">{t('examiners.dialog.male')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="gender-f"
                                        name="gender"
                                        value="F"
                                        checked={formData.gender === 'F'}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                                        className="h-4 w-4 text-primary focus:ring-ring"
                                    />
                                    <Label htmlFor="gender-f" className="font-normal cursor-pointer">{t('examiners.dialog.female')}</Label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('examiners.dialog.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('profile.emailReadOnly')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>{t('examiners.dialog.accreditations')}</Label>
                                {profile?.role !== 'admin' && (
                                    <span className="text-xs text-muted-foreground">
                                        ({t('examiners.accessDesc')})
                                    </span>
                                )}
                            </div>
                            <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto bg-background">
                                {reportTypes.map(type => (
                                    <div key={type.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`type-${type.id}`}
                                            checked={formData.accreditations?.includes(type.id)}
                                            onCheckedChange={() => toggleAccreditation(type.id)}
                                            disabled={profile?.role !== 'admin'}
                                        />
                                        <Label
                                            htmlFor={`type-${type.id}`}
                                            className={profile?.role !== 'admin' ? 'text-muted-foreground' : ''}
                                        >
                                            {type.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('examiners.dialog.saving')}
                                    </>
                                ) : (
                                    t('examiners.dialog.save')
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Personal Analytics Section */}
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('analytics.recentActivity')}</h3>
                <ProfileAnalytics userId={profile?.id} />
            </div>
        </div>
    );
};

const ProfileAnalytics = ({ userId }: { userId?: string }) => {
    const { t } = useLanguage();
    const { stats, loading, error } = useAnalytics(userId);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t('analytics.loading')}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-destructive bg-destructive/10 rounded-md">
                {error}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('analytics.totalReports')}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{stats.totalReports}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('analytics.passRate')}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {Math.round(stats.pass ? (stats.pass / Math.max(stats.pass + stats.fail, 1)) * 100 : 0)}%
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <PieChart className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('analytics.recentActivity')}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{stats.recentReports}</p>
                        <p className="text-xs text-muted-foreground">{t('analytics.thisWeek')}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
};
