import { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SupportRequestFormData {
    requestType: 'changeRequest' | 'bug' | 'feature' | '';
    title: string;
    description: string;
    files: File[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const SupportRequestForm = () => {
    const { t } = useLanguage();
    const toast = useToast();
    const { user, profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<SupportRequestFormData>({
        requestType: '',
        title: '',
        description: '',
        files: []
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles: File[] = [];

        for (const file of selectedFiles) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(t('help.support.validation.fileSize'));
                continue;
            }
            validFiles.push(file);
        }

        setFormData(prev => ({
            ...prev,
            files: [...prev.files, ...validFiles]
        }));
    };

    const removeFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
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

            // Create email body
            const requestTypeLabels = {
                changeRequest: t('help.support.requestType.changeRequest'),
                bug: t('help.support.requestType.bug'),
                feature: t('help.support.requestType.feature')
            };

            const emailBody = `
Support Request from: ${userName} (${userEmail})
Request Type: ${requestTypeLabels[formData.requestType as keyof typeof requestTypeLabels]}
Title: ${formData.title}

Description:
${formData.description}

Attachments: ${formData.files.length} file(s)
${formData.files.map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')}

Sent from AIGenerator Help System
            `.trim();

            // Create mailto link with subject and body
            const subject = encodeURIComponent(`[${requestTypeLabels[formData.requestType as keyof typeof requestTypeLabels]}] ${formData.title}`);
            const body = encodeURIComponent(emailBody);
            const mailtoLink = `mailto:info@digitando.net?subject=${subject}&body=${body}`;

            // Open mail client
            window.location.href = mailtoLink;

            // Show success message
            toast.success(t('help.support.success'));

            // Reset form
            setFormData({
                requestType: '',
                title: '',
                description: '',
                files: []
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

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('help.support.attachments.label')}
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                            {t('help.support.attachments.help')}
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                        >
                            <Upload className="h-4 w-4" />
                            {t('help.support.attachments.button')}
                        </button>

                        {/* File List */}
                        {formData.files.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {formData.files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {file.type.startsWith('image/') ? (
                                                <ImageIcon className="h-5 w-5 text-primary" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-primary" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <X className="h-4 w-4 text-destructive" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-sm text-muted-foreground">
                                    {formData.files.length} {t('help.support.attachments.selected')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Note about attachments */}
                    {formData.files.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                {t('language.croatian') === 'Hrvatski'
                                    ? 'Napomena: Prilozi će biti priloženi samo ako vaš email klijent podržava tu funkciju. Za slanje velikih datoteka, možete ih dodati ručno nakon otvaranja emaila.'
                                    : 'Note: Attachments will only be included if your email client supports this feature. For large files, you can attach them manually after the email opens.'}
                            </p>
                        </div>
                    )}

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
