import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
    test('login page has no critical a11y violations', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

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
});
