import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportForm } from '../src/types';
import {
  STORES,
  clearStore,
  getFromStore,
  getPendingSyncOperations,
  saveManyToStore,
} from '../src/lib/offlineDb';

const state = vi.hoisted(() => ({ isOnline: true }));
const updateOrder = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('../src/context/OfflineContext', () => ({
  useOffline: () => ({ isOnline: state.isOnline, triggerSync: vi.fn() }),
}));
vi.mock('../src/lib/offlineQueryFn', () => ({ useOnlineQuery: vi.fn() }));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: {} }));
vi.mock('../src/services/reportService', () => ({ reportService: { updateOrder } }));

const { useUpdateReportOrder } = await import('../src/hooks/useReports');

const reports = [
  { id: 'report-a', ordinal: 0, updated_at: '2026-09-01T08:00:00Z', dionica: 'A' },
  { id: 'report-b', ordinal: 1, updated_at: '2026-09-01T09:00:00Z', dionica: 'B' },
] as ReportForm[];

beforeEach(async () => {
  await Promise.all([clearStore(STORES.REPORTS), clearStore(STORES.SYNC_QUEUE)]);
  await saveManyToStore(STORES.REPORTS, reports.map((report) => ({ ...report, _synced: true })));
  state.isOnline = true;
  updateOrder.mockReset().mockResolvedValue(undefined);
});

describe('report ordering across online and offline mode', () => {
  it('retains an online reorder when reports are read from the offline cache', async () => {
    const mutation = useUpdateReportOrder() as unknown as { mutationFn: (rows: ReportForm[]) => Promise<void> };
    const reordered = [reports[1], reports[0]];

    await mutation.mutationFn(reordered);

    expect(updateOrder).toHaveBeenCalledWith(reordered);
    expect(await getFromStore(STORES.REPORTS, 'report-b')).toMatchObject({ ordinal: 0, dionica: 'B' });
    expect(await getFromStore(STORES.REPORTS, 'report-a')).toMatchObject({ ordinal: 1, dionica: 'A' });
    expect(await getPendingSyncOperations()).toEqual([]);
  });

  it.each([false, true])('queues the same order when offline or a connection drops (online=%s)', async (isOnline) => {
    state.isOnline = isOnline;
    if (isOnline) updateOrder.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const mutation = useUpdateReportOrder() as unknown as { mutationFn: (rows: ReportForm[]) => Promise<void> };

    await mutation.mutationFn([reports[1], reports[0]]);

    expect(await getFromStore(STORES.REPORTS, 'report-b')).toMatchObject({ ordinal: 0, _is_offline: true });
    expect(await getFromStore(STORES.REPORTS, 'report-a')).toMatchObject({ ordinal: 1, _is_offline: true });
    expect(await getPendingSyncOperations()).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: 'report-b', data: { ordinal: 0 }, baseUpdatedAt: reports[1].updated_at }),
      expect.objectContaining({ entityId: 'report-a', data: { ordinal: 1 }, baseUpdatedAt: reports[0].updated_at }),
    ]));
  });
});
