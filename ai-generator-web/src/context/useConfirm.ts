import { useContext } from 'react';
import { ConfirmDialogContext, type ConfirmFn } from './confirmDialogStore';

export const useConfirm = (): ConfirmFn => {
    const ctx = useContext(ConfirmDialogContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return ctx;
};
