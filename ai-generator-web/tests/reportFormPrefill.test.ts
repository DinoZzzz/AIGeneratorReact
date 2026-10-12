import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportForm } from '../src/types';

// Exercise the shared form's actual effects over successive query snapshots,
// without needing a browser or a Supabase session.
const runtime = vi.hoisted(() => ({
    cursor: 0,
    slots: [] as unknown[],
    effects: [] as (() => void)[],
    params: { id: 'new', customerId: 'customer', constructionId: 'construction' },
    duplicateId: null as string | null,
    reports: undefined as ReportForm[] | undefined,
    loadedReport: undefined as ReportForm | undefined,
    duplicateSource: undefined as ReportForm | undefined,
    restoredData: null as Partial<ReportForm> | null,
}));

vi.mock('react', () => ({
    useRef: (initial: unknown) => {
        const index = runtime.cursor++;
        runtime.slots[index] ??= { current: initial };
        return runtime.slots[index];
    },
    useState: (initial: unknown) => {
        const index = runtime.cursor++;
        if (!(index in runtime.slots)) {
            runtime.slots[index] = typeof initial === 'function' ? initial() : initial;
        }
        return [runtime.slots[index], (value: unknown) => { runtime.slots[index] = value; }];
    },
    useMemo: (calculate: () => unknown) => calculate(),
    useEffect: (effect: () => void, deps?: unknown[]) => {
        const index = runtime.cursor++;
        const previous = runtime.slots[index] as unknown[] | undefined;
        if (!deps || !previous || deps.some((dep, i) => !Object.is(dep, previous[i]))) {
            runtime.effects.push(effect);
        }
        runtime.slots[index] = deps;
    },
}));
vi.mock('react-router-dom', () => ({
    useParams: () => runtime.params,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [{ get: () => runtime.duplicateId }],
}));
vi.mock('../src/context/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({}) }));
vi.mock('../src/context/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('../src/lib/errorHandler', () => ({ errorHandler: { handle: vi.fn(), getUserMessage: vi.fn() } }));
vi.mock('../src/hooks/useUnsavedChanges', () => ({ useUnsavedChanges: vi.fn() }));
vi.mock('../src/hooks/useAutoSave', () => ({
    useAutoSave: () => ({ restoredData: runtime.restoredData, clearSavedData: vi.fn(), dismissRestore: vi.fn() }),
}));
vi.mock('../src/hooks/useReports', () => ({
    useReport: (id: string) => ({ data: id === runtime.duplicateId ? runtime.duplicateSource : runtime.loadedReport }),
    useReportsByConstruction: () => ({ data: runtime.reports, isSuccess: runtime.reports !== undefined }),
    useCreateReport: vi.fn(),
    useUpdateReport: vi.fn(),
}));

const { useReportFormShell } = await import('../src/features/reports/hooks/useReportFormShell');
const previousReport = {
    id: 'previous', type_id: 1, customer_id: 'customer', construction_id: 'construction',
    dionica: 'Previous section', temperature: 0, examination_date: '2026-09-01',
    created_at: '2026-09-01T12:00:00Z',
} as ReportForm;
let formData: Partial<ReportForm>;
const setFormData = vi.fn((update) => {
    formData = typeof update === 'function' ? update(formData) : update;
});

function render() {
    runtime.cursor = 0;
    runtime.effects = [];
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Hook runtime is mocked above to replay effects across query snapshots.
    const result = useReportFormShell({
        methodPath: 'water', typeId: 1, errorContext: 'test', formData, setFormData,
        copyStructureFields: ['pipe_diameter'],
    });
    runtime.effects.forEach((effect) => effect());
    return result;
}

beforeEach(() => {
    runtime.slots = [];
    runtime.params = { id: 'new', customerId: 'customer', constructionId: 'construction' };
    runtime.duplicateId = null;
    runtime.reports = undefined;
    runtime.loadedReport = undefined;
    runtime.duplicateSource = undefined;
    runtime.restoredData = null;
    formData = { type_id: 1, dionica: '', temperature: 20 };
    setFormData.mockClear();
});

describe('report form initialization', () => {
    it('prefills once after the construction reports finish loading, including zero temperature', () => {
        render();
        expect(setFormData).not.toHaveBeenCalled();
        runtime.reports = [previousReport];
        render();
        expect(formData).toMatchObject({ dionica: 'Previous section', temperature: 0 });
        runtime.reports = [{ ...previousReport, dionica: 'New background data' }];
        render();
        expect(formData.dionica).toBe('Previous section');
    });

    it('does not overwrite user input when the previous report arrives late', () => {
        const form = render();
        formData.dionica = 'Entered section';
        form.setHasUserEdited(true);
        runtime.reports = [previousReport];
        render();
        expect(formData.dionica).toBe('Entered section');
    });

    it.each([true, false])('gives the duplicate precedence regardless of query order (duplicate first=%s)', (duplicateFirst) => {
        runtime.duplicateId = 'duplicate';
        const duplicate = { ...previousReport, id: 'duplicate', dionica: 'Duplicated section' };
        if (duplicateFirst) runtime.duplicateSource = duplicate;
        else runtime.reports = [previousReport];
        render();
        runtime.duplicateSource = duplicate;
        runtime.reports = [previousReport];
        render();
        expect(formData.dionica).toBe('Duplicated section');
        expect(formData.id).toBeUndefined();
    });

    it('keeps a restored draft when reports arrive later', () => {
        runtime.restoredData = { dionica: 'Draft section' };
        const form = render();
        form.handleRestoreDraft();
        runtime.reports = [previousReport];
        render();
        expect(formData.dionica).toBe('Draft section');
    });

    it('does not replace edit-mode changes with background report refreshes', () => {
        runtime.params.id = 'report';
        runtime.loadedReport = { ...previousReport, id: 'report' };
        render();
        formData = { ...formData, dionica: 'Edited section' };
        runtime.loadedReport = { ...runtime.loadedReport, dionica: 'Server section' };
        render();
        expect(formData.dionica).toBe('Edited section');
    });

    it('initializes the next report when navigating between edit routes', () => {
        runtime.params.id = 'report-a';
        runtime.loadedReport = { ...previousReport, id: 'report-a' };
        render();
        runtime.params.id = 'report-b';
        runtime.loadedReport = { ...previousReport, id: 'report-b', dionica: 'Next section' };
        render();
        expect(formData).toMatchObject({ id: 'report-b', dionica: 'Next section' });
    });
});
