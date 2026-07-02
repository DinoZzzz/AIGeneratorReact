import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

interface PdfLanguageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (language: 'hr' | 'sl') => void;
    loading?: boolean;
}

export const PdfLanguageDialog = ({
    open,
    onOpenChange,
    onConfirm,
    loading = false
}: PdfLanguageDialogProps) => {
    const { t } = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState<'hr' | 'sl'>('hr');

    const handleConfirm = () => {
        onConfirm(selectedLanguage);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader onClose={() => onOpenChange(false)}>
                    <DialogTitle className="text-foreground">
                        {t('pdfLanguageDialog.title') || 'Jezik za izvoz PDF-a'}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('pdfLanguageDialog.description') || 'Odaberite jezik na kojem želite izvesti PDF izvještaje:'}
                    </p>
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-accent/50 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name="pdfLanguage"
                                value="hr"
                                checked={selectedLanguage === 'hr'}
                                onChange={() => setSelectedLanguage('hr')}
                                className="h-4 w-4 text-primary focus:ring-ring border-input"
                                disabled={loading}
                            />
                            <span className="flex-1 text-sm font-medium text-foreground">
                                🇭🇷 {t('pdfLanguageDialog.croatian') || 'Hrvatski'}
                            </span>
                        </label>
                        <label className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-accent/50 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name="pdfLanguage"
                                value="sl"
                                checked={selectedLanguage === 'sl'}
                                onChange={() => setSelectedLanguage('sl')}
                                className="h-4 w-4 text-primary focus:ring-ring border-input"
                                disabled={loading}
                            />
                            <span className="flex-1 text-sm font-medium text-foreground">
                                🇸🇮 {t('pdfLanguageDialog.slovenian') || 'Slovenski'}
                            </span>
                        </label>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        {t('pdfLanguageDialog.cancel') || 'Odustani'}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        loading={loading}
                    >
                        {t('pdfLanguageDialog.confirm') || 'Izvezi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
