import { createContext, useContext, useRef, useState, useCallback } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

export const ConfirmDialogProvider = ({ children }: { children: React.ReactNode }) => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((opts) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        resolveRef.current?.(true);
        resolveRef.current = null;
        setOptions(null);
    };

    const handleCancel = () => {
        resolveRef.current?.(false);
        resolveRef.current = null;
        setOptions(null);
    };

    return (
        <ConfirmDialogContext.Provider value={confirm}>
            {children}
            <ConfirmDialog
                open={options !== null}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                title={options?.title ?? ''}
                description={options?.description}
                confirmLabel={options?.confirmLabel}
                cancelLabel={options?.cancelLabel}
                variant={options?.variant}
            />
        </ConfirmDialogContext.Provider>
    );
};

export const useConfirm = (): ConfirmFn => {
    const ctx = useContext(ConfirmDialogContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return ctx;
};
