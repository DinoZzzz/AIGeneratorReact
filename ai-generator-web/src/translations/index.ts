import { hr } from './hr';
import { en } from './en';

export type Language = 'hr' | 'en';
export type TranslationDictionary = Record<string, string>;

export const translations: Record<Language, TranslationDictionary> = {
    hr,
    en,
};

export { hr, en };
