import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { AlertCircle } from 'lucide-react';
import type { Profile, ReportType } from '../../types';
import { examinerService } from '../../services/examinerService';
import { useLanguage } from '../../context/LanguageContext';
import { isWeakPasswordAuthError, validatePasswordStrength } from '../../lib/passwordValidation';

interface ExaminerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examiner: Profile | null;
    onSave: (examiner: Partial<Profile>) => Promise<void>;
}

export const ExaminerDialog = ({ open, onOpenChange, examiner, onSave }: ExaminerDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Profile> & { password?: string }>({
        name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        title: '',
        gender: undefined,
        role: 'user',
        accreditations: []
    });
    const { t } = useLanguage();

    useEffect(() => {
        loadReportTypes();
    }, []);

    useEffect(() => {
        if (open) {
            setError(null);
            if (examiner) {
                setFormData({
                    id: examiner.id,
                    name: examiner.name || '',
                    last_name: examiner.last_name || '',
                    username: examiner.username || '',
                    email: examiner.email || '',
                    password: '', // Don't populate password for security
                    title: examiner.title || '',
                    gender: examiner.gender,
                    role: examiner.role,
                    accreditations: examiner.accreditations || []
                });
            } else {
                setFormData({
                    name: '',
                    last_name: '',
                    username: '',
                    email: '',
                    password: '',
                    title: '',
                    gender: undefined,
                    role: 'user',
                    accreditations: []
                });
            }
        }
    }, [open, examiner]);

    const loadReportTypes = async () => {
        const types = await examinerService.getReportTypes();
        setReportTypes(types);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.last_name || !formData.username) {
            setError(t('examiners.dialog.fillRequired'));
            return;
        }

        if (!examiner && !formData.email) {
            setError(t('examiners.dialog.emailRequired'));
            return;
        }

        if (!examiner && !formData.password) {
            setError(t('examiners.dialog.passwordRequired'));
            return;
        }

        // Validate password strength for new users or when changing password
        const password = formData.password?.trim() || '';
        if (!examiner || password.length > 0) {
            const passwordValidation = validatePasswordStrength(password);
            if (passwordValidation === 'too_short') {
                setError(t('examiners.dialog.passwordTooShort'));
                return;
            }
            if (passwordValidation === 'weak') {
                setError(t('examiners.dialog.weakPassword'));
                return;
            }
        }

        if (formData.accreditations?.length === 0) {
            setError(t('examiners.dialog.accreditationRequired'));
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (err) {
            if (isWeakPasswordAuthError(err)) {
                setError(t('examiners.dialog.weakPassword'));
            } else {
                setError(t('examiners.dialog.saveFailed'));
            }
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader onClose={() => onOpenChange(false)}>
                    <DialogTitle>{examiner ? t('examiners.dialog.edit') : t('examiners.dialog.new')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium">{error}</p>
                                    {error === t('examiners.dialog.weakPassword') && (
                                        <ul className="mt-2 list-disc list-inside text-xs space-y-1 text-muted-foreground">
                                            <li>{t('examiners.dialog.passwordTip1')}</li>
                                            <li>{t('examiners.dialog.passwordTip2')}</li>
                                            <li>{t('examiners.dialog.passwordTip3')}</li>
                                            <li>{t('examiners.dialog.passwordTip4')}</li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="flex gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('examiners.dialog.email')} {!examiner && <span className="text-destructive">*</span>}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required={!examiner}
                                disabled={!!examiner}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {t('examiners.dialog.password')} {!examiner && <span className="text-destructive">*</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={!examiner}
                                placeholder={examiner ? t('examiners.dialog.passwordPlaceholder') : ''}
                            />
                            {examiner && (
                                <p className="text-xs text-muted-foreground">
                                    {t('examiners.dialog.passwordHint')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isAdmin"
                            checked={formData.role === 'admin'}
                            onCheckedChange={(checked: boolean) => setFormData({ ...formData, role: checked ? 'admin' : 'user' })}
                        />
                        <Label htmlFor="isAdmin">{t('examiners.dialog.admin')}</Label>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('examiners.dialog.accreditations')}</Label>
                        <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                            {reportTypes.map(type => (
                                <div key={type.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`type-${type.id}`}
                                        checked={formData.accreditations?.includes(type.id)}
                                        onCheckedChange={() => toggleAccreditation(type.id)}
                                    />
                                    <Label htmlFor={`type-${type.id}`}>{type.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('examiners.dialog.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('examiners.dialog.saving') : t('examiners.dialog.save')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
