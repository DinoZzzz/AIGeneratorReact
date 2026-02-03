import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandPalette } from '../components/CommandPalette';

interface KeyboardShortcutsContextType {
    isCommandPaletteOpen: boolean;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const navigate = useNavigate();

    const openCommandPalette = useCallback(() => {
        setIsCommandPaletteOpen(true);
    }, []);

    const closeCommandPalette = useCallback(() => {
        setIsCommandPaletteOpen(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K to open command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }

            // Escape to close command palette
            if (e.key === 'Escape' && isCommandPaletteOpen) {
                e.preventDefault();
                setIsCommandPaletteOpen(false);
            }

            // Keyboard navigation shortcuts (when command palette is closed)
            if (!isCommandPaletteOpen && (e.ctrlKey || e.metaKey)) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        navigate('/');
                        break;
                    case 'u':
                        e.preventDefault();
                        navigate('/customers');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, navigate]);

    return (
        <KeyboardShortcutsContext.Provider value={{ isCommandPaletteOpen, openCommandPalette, closeCommandPalette }}>
            {children}
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={closeCommandPalette}
            />
        </KeyboardShortcutsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useKeyboardShortcuts = () => {
    const context = useContext(KeyboardShortcutsContext);
    if (context === undefined) {
        throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
    }
    return context;
};
