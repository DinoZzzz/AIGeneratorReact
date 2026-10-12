import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    denyParent: false,
    exports: ['export-1'],
    links: [{ export_id: 'export-1', form_id: 'form-1' }],
    from: vi.fn(),
}));
vi.mock('../src/lib/supabase', () => ({ supabase: { from: state.from } }));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));
import { historyService } from '../src/services/historyService';

beforeEach(() => {
    state.denyParent = false;
    state.exports = ['export-1'];
    state.links = [{ export_id: 'export-1', form_id: 'form-1' }];
    state.from.mockReset();
    state.from.mockImplementation((table: string) => ({
        delete: () => ({ eq: async (_field: string, id: string) => {
            if (table === 'report_export_forms') state.links = state.links.filter(link => link.export_id !== id);
            if (table === 'report_exports') {
                if (state.denyParent) return { error: { code: '23503', message: 'Parent deletion blocked' } };
                state.exports = state.exports.filter(exportId => exportId !== id);
                state.links = state.links.filter(link => link.export_id !== id);
            }
            return { error: null };
        } }),
    }));
});

describe('history deletion', () => {
    it('keeps export links intact when deleting the parent fails', async () => {
        state.denyParent = true;
        await expect(historyService.delete('export-1')).rejects.toMatchObject({ code: '23503' });
        expect(state.exports).toEqual(['export-1']);
        expect(state.links).toEqual([{ export_id: 'export-1', form_id: 'form-1' }]);
        expect(state.from.mock.calls).toEqual([['report_exports']]);
    });
    it('deletes only the parent and lets its existing cascade delete links', async () => {
        await historyService.delete('export-1');
        expect(state.exports).toEqual([]);
        expect(state.links).toEqual([]);
        expect(state.from.mock.calls).toEqual([['report_exports']]);
    });
});
