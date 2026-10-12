import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { convertPdfToImages } from '../src/lib/pdfToImage';

const mocks = vi.hoisted(() => ({
    render: vi.fn(),
    destroy: vi.fn(async () => {}),
    cleanup: vi.fn(),
}));

vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: {},
    getDocument: () => ({ promise: Promise.resolve({
        numPages: 2,
        getPage: async () => ({
            getViewport: () => ({ width: 100, height: 200 }),
            render: mocks.render,
            cleanup: mocks.cleanup,
        }),
        destroy: mocks.destroy,
    }) }),
}));

describe('PDF attachment conversion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.render.mockImplementation(() => ({ promise: Promise.resolve() }));
        vi.stubGlobal('document', { createElement: () => ({
            getContext: () => ({}),
            toDataURL: () => 'data:image/png;base64,aW1hZ2U=',
        }) });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('renders every page with its canvas and releases the worker', async () => {
        expect(await convertPdfToImages(new Blob(['pdf']))).toHaveLength(2);
        expect(mocks.render.mock.calls[0][0].canvas).toBeDefined();
        expect(mocks.cleanup).toHaveBeenCalledTimes(2);
        expect(mocks.destroy).toHaveBeenCalledOnce();
    });

    it('releases the worker when rendering fails', async () => {
        mocks.render.mockImplementation(() => ({ promise: Promise.reject(new Error('Render failed')) }));
        await expect(convertPdfToImages(new Blob(['pdf']))).rejects.toThrow('Render failed');
        expect(mocks.destroy).toHaveBeenCalledOnce();
    });
});
