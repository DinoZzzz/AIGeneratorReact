import { useRef, useState, useCallback } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ConfirmDialogContext, type ConfirmFn, type ConfirmOptions } from './confirmDialogStore';

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
