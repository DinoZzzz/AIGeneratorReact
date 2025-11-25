import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface SupportRequestFormData {
    requestType: 'changeRequest' | 'bug' | 'feature' | '';
    title: string;
    description: string;
}

export const SupportRequestForm = () => {
    const { t } = useLanguage();
    const toast = useToast();
    const { user, profile } = useAuth();

    const [formData, setFormData] = useState<SupportRequestFormData>({
        requestType: '',
        title: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof SupportRequestFormData, string>>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof SupportRequestFormData, string>> = {};

        if (!formData.requestType) {
            newErrors.requestType = t('help.support.validation.requestType');
        }
        if (!formData.title.trim()) {
            newErrors.title = t('help.support.validation.title');
        }
        if (!formData.description.trim()) {
            newErrors.description = t('help.support.validation.description');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Get user info
            const userEmail = user?.email || 'unknown';
            const userName = profile?.name && profile?.last_name
                ? `${profile.name} ${profile.last_name}`
                : userEmail;

            const requestTypeLabels = {
                changeRequest: t('help.support.requestType.changeRequest'),
                bug: t('help.support.requestType.bug'),
                feature: t('help.support.requestType.feature')
            };

            const templateParams = {
                from_name: userName,
                from_email: userEmail,
                request_type: requestTypeLabels[formData.requestType as keyof typeof requestTypeLabels],
                title: formData.title,
                message: formData.description,
                attachment_info: 'Attachments disabled'
            };

            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            if (!serviceId || !templateId || !publicKey) {
                throw new Error('EmailJS configuration is missing');
            }

            await emailjs.send(serviceId, templateId, templateParams, publicKey);

            // Show success message
            toast.success(t('help.support.success'));

            // Reset form
            setFormData({
                requestType: '',
                title: '',
                description: ''
            });
            setErrors({});

        } catch (error) {
            console.error('Error submitting support request:', error);
            toast.error(t('help.support.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground">{t('help.support.title')}</h2>
                    <p className="text-muted-foreground mt-1">{t('help.support.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Request Type */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('help.support.requestType')} <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={formData.requestType}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, requestType: e.target.value as any }));
                                setErrors(prev => ({ ...prev, requestType: undefined }));
                            }}
                            className={cn(
                                "w-full px-4 py-2 border rounded-lg bg-background text-foreground",
                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                errors.requestType ? "border-destructive" : "border-border"
                            )}
                        >
                            <option value="">{t('help.support.requestType.placeholder')}</option>
                            <option value="changeRequest">{t('help.support.requestType.changeRequest')}</option>
                            <option value="bug">{t('help.support.requestType.bug')}</option>
                            <option value="feature">{t('help.support.requestType.feature')}</option>
                        </select>
                        {errors.requestType && (
                            <p className="text-destructive text-sm mt-1">{errors.requestType}</p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('help.support.title.label')} <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, title: e.target.value }));
                                setErrors(prev => ({ ...prev, title: undefined }));
                            }}
                            placeholder={t('help.support.title.placeholder')}
                            className={cn(
                                "w-full px-4 py-2 border rounded-lg bg-background text-foreground",
                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                errors.title ? "border-destructive" : "border-border"
                            )}
                        />
                        {errors.title && (
                            <p className="text-destructive text-sm mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('help.support.description.label')} <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, description: e.target.value }));
                                setErrors(prev => ({ ...prev, description: undefined }));
                            }}
                            placeholder={t('help.support.description.placeholder')}
                            rows={8}
                            className={cn(
                                "w-full px-4 py-2 border rounded-lg bg-background text-foreground resize-none",
                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                errors.description ? "border-destructive" : "border-border"
                            )}
                        />
                        {errors.description && (
                            <p className="text-destructive text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "px-6 py-3 rounded-lg font-medium transition-colors",
                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? t('help.support.submitting') : t('help.support.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
