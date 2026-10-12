import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { primaryColors } from '../src/context/ThemeContext';

test.describe('Accessibility', () => {
    for (const preference of ['default', 'saved-green', 'saved-blue', 'invalid'] as const) {
    test(`login page has no critical a11y violations (${preference})`, async ({ page }) => {
        await page.addInitScript((storedPreference) => {
            if (storedPreference === 'saved-green') {
                localStorage.setItem('vite-ui-primary-color', JSON.stringify({
                    name: 'Green', value: '142 71% 45%', foreground: '210 40% 98%', class: 'bg-green-600',
                }));
            } else if (storedPreference === 'saved-blue') {
                localStorage.setItem('vite-ui-primary-color', JSON.stringify({
                    name: 'Blue', value: '221 83% 53%', foreground: '210 40% 98%', class: 'bg-blue-600',
                }));
            } else if (storedPreference === 'invalid') {
                localStorage.setItem('vite-ui-primary-color', 'null');
                localStorage.setItem('vite-ui-theme', 'invalid theme');
            }
        }, preference);
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('input').first()).toBeVisible();

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const criticalViolations = results.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        if (criticalViolations.length > 0) {
            console.log('A11y violations:', JSON.stringify(criticalViolations, null, 2));
        }

        expect(criticalViolations).toEqual([]);
    });
    }

    for (const theme of ['light', 'dark'] as const) {
        for (const color of primaryColors) {
            test(`primary palette contrast (${theme}, ${color.name})`, async ({ page }) => {
                await page.addInitScript(({ theme, color }) => {
                    localStorage.setItem('vite-ui-theme', theme);
                    // Old saved preferences must receive the current palette corrections.
                    localStorage.setItem('vite-ui-primary-color', JSON.stringify({
                        name: color.name, value: color.value, foreground: '210 40% 98%',
                    }));
                }, { theme, color });
                await page.goto('/login', { waitUntil: 'domcontentloaded' });
                const button = page.locator('button[type="submit"]');
                await expect(button).toBeVisible();
                await expect(page.locator('html')).toHaveClass(new RegExp(theme));

                // Exercise the same tokens used by links, selected navigation,
                // and report results without requiring an authenticated fixture.
                await page.evaluate(() => {
                    const samples = document.createElement('section');
                    samples.setAttribute('aria-label', 'Palette samples');
                    for (const surface of ['bg-background', 'bg-card', 'bg-primary/10']) {
                        const row = document.createElement('div');
                        row.className = `${surface} p-2`;
                        for (const textClass of ['text-primary', 'text-primary/80']) {
                            const text = document.createElement('span');
                            text.className = `${textClass} text-sm`;
                            text.textContent = 'Primary accent text ';
                            row.append(text);
                        }
                        samples.append(row);
                    }
                    document.body.append(samples);
                });

                for (const hovered of [false, true]) {
                    if (hovered) {
                        await button.hover();
                        // Sample the settled hover color, not an intermediate transition.
                        await button.evaluate(element => Promise.all(
                            element.getAnimations().map(animation => animation.finished.catch(() => {}))
                        ));
                    }
                    const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
                    const failures = result.violations.flatMap(violation => violation.nodes.map(node => ({
                        target: node.target, message: node.failureSummary,
                    })));
                    expect(failures, `${color.name}/${theme}, hovered=${hovered}`).toEqual([]);
                }
            });
        }
    }

    test('accent text follows system theme changes without reloading', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => localStorage.setItem('vite-ui-theme', 'system'));
        await page.goto('/login');
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        const lightColor = await page.evaluate(() => {
            const sample = document.createElement('span');
            sample.id = 'system-theme-accent';
            sample.className = 'text-primary';
            sample.textContent = 'Primary accent text';
            document.body.append(sample);
            return getComputedStyle(sample).color;
        });
        await page.emulateMedia({ colorScheme: 'dark' });
        await expect(page.locator('html')).toHaveClass(/dark/);
        // A changed color can be the first frame of the theme cross-fade.
        // Audit the settled palette, as the hover checks above do.
        await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
        await expect.poll(() => page.locator('#system-theme-accent').evaluate(element =>
            getComputedStyle(element).color
        )).not.toBe(lightColor);
        const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
        expect(result.violations).toEqual([]);
    });
});
