import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: () => {
      const filters: Array<[string, unknown]> = [];
      const builder = {
        select: () => builder,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return builder; },
        is: (key: string, value: unknown) => { filters.push([key, value]); return builder; },
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => ({
          data: state.rows
            .filter((row) => filters.every(([key, value]) => row[key] === value))
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] ?? null,
          error: null,
        }),
      };
      return builder;
    },
  },
}));

import { findExistingReportExportId } from '../src/lib/reportExportHistory';

const lookup = {
  constructionId: 'construction-a', customerId: 'customer-a',
  userId: 'examiner-a', typeId: 1, examinationDate: '2026-10-12',
};
const matchingExport = {
  id: 'matching-export', construction_id: lookup.constructionId, customer_id: lookup.customerId,
  user_id: lookup.userId, certifier_id: lookup.userId, type_id: lookup.typeId,
  examination_date: lookup.examinationDate, created_at: '2026-10-12T12:00:00Z',
};

beforeEach(() => { state.rows = []; });

describe('export conflict recovery', () => {
  it.each([
    { examination_date: '2026-10-11' },
    { type_id: 2 },
    { customer_id: 'customer-b' },
    { user_id: 'examiner-b', certifier_id: 'examiner-b' },
    { user_id: 'examiner-b' },
  ])('does not associate a different export from the same construction: %j', async (differentFields) => {
    state.rows = [{ ...matchingExport, ...differentFields, id: 'unrelated-export' }];
    await expect(findExistingReportExportId(lookup)).resolves.toBeNull();
  });

  it('reuses the newest matching export without selecting a newer unrelated one', async () => {
    state.rows = [
      { ...matchingExport, id: 'old-match', created_at: '2026-10-12T10:00:00Z' },
      matchingExport,
      { ...matchingExport, id: 'other-type', type_id: 2, created_at: '2026-10-12T13:00:00Z' },
    ];
    await expect(findExistingReportExportId(lookup)).resolves.toBe('matching-export');
  });

  it('retains compatibility with legacy certifier-only export records', async () => {
    state.rows = [{ ...matchingExport, user_id: null }];
    await expect(findExistingReportExportId(lookup)).resolves.toBe('matching-export');
  });

  it('matches a timestamp input to the corresponding date-only record', async () => {
    state.rows = [matchingExport];
    await expect(findExistingReportExportId({ ...lookup, examinationDate: '2026-10-12T12:00:00Z' }))
      .resolves.toBe('matching-export');
  });

  it('does not recover an export if the examination date is missing', async () => {
    state.rows = [matchingExport];
    await expect(findExistingReportExportId({ ...lookup, examinationDate: '' })).resolves.toBeNull();
  });

  it('does not match the previous calendar day when normalizing a timestamp offset', async () => {
    state.rows = [{ ...matchingExport, examination_date: '2026-10-11' }];
    await expect(findExistingReportExportId({ ...lookup, examinationDate: '2026-10-12T00:00:00+02:00' }))
      .resolves.toBeNull();
  });
});
