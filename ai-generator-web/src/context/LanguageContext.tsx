import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type Language } from '../translations';

interface LanguageContextValue {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const stored = localStorage.getItem('language') as Language | null;
        return stored || 'hr';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = (lang: Language) => setLanguageState(lang);

    const t = (key: string) => translations[language][key] || translations.hr[key] || key;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const value = useMemo(() => ({ language, setLanguage, t }), [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};
