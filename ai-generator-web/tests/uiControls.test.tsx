import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Select } from '../src/components/ui/Select';

vi.mock('../src/context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key }),
}));

describe('form controls', () => {
    it('keeps a loading button disabled when its caller passes disabled=false', () => {
        const markup = renderToStaticMarkup(<Button loading disabled={false}>Save</Button>);
        expect(markup).toMatch(/<button[^>]* disabled=""/);
    });

    it('gives repeated input labels distinct targets', () => {
        const markup = renderToStaticMarkup(<><Input label="Length" /><Input label="Length" /></>);
        const targets = [...markup.matchAll(/<label for="([^"]+)"/g)].map(match => match[1]);
        const ids = [...markup.matchAll(/<input id="([^"]+)"/g)].map(match => match[1]);
        expect(new Set(ids).size).toBe(2);
        expect(targets).toEqual(ids);
    });

    it('associates a select label even without an explicit id', () => {
        const markup = renderToStaticMarkup(<Select name="material" label="Material" options={[]} />);
        const target = markup.match(/<label for="([^"]+)"/)?.[1];
        expect(target).toBeTruthy();
        expect(markup).toContain(`<select id="${target}"`);
    });
});
