import { useEffect } from 'react';

/**
 * Hook that warns users when they attempt to leave the page with unsaved changes.
 * Registers a `beforeunload` event handler when `isDirty` is true.
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export const useUnsavedChanges = (isDirty: boolean) => {
    useEffect(() => {
        if (!isDirty) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);
};
