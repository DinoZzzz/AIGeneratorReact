import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { examinerService } from '../services/examinerService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Checkbox } from '../components/ui/Checkbox';
import { Camera, Loader2, FileText, PieChart, TrendingUp } from 'lucide-react';
import type { Profile, ReportType } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';

export const ProfilePage = () => {
    const { profile, user, refreshProfile } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
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
        loadReportTypes();
    }, []);

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
            const types = await examinerService.getReportTypes();
            setReportTypes(types);
        } catch (error) {
            console.error('Failed to load report types', error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (!profile?.id) return;

        setUploading(true);
        try {
            const publicUrl = await examinerService.uploadAvatar(file, profile.id);
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            toast.success(t('profile.avatarUploaded'));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error(t('profile.avatarUploadFailed'));
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
            await examinerService.saveExaminer(formData);
            await refreshProfile(); // Refresh context to update sidebar
            toast.success(t('profile.saved'));
        } catch (error) {
            console.error(error);
            toast.error(t('profile.saveFailed'));
        } finally {
            setLoading(false);
        }
    };

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
                            <div className="h-32 w-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg flex items-center justify-center">
                                {formData.avatar_url ? (
                                    <img
                                        src={formData.avatar_url}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-muted-foreground">
                                        {formData.name?.charAt(0) || user?.email?.charAt(0)}
                                    </span>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
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
