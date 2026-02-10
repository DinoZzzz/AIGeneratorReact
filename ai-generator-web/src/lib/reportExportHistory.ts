import { supabase } from './supabase';

interface ExistingReportExportLookup {
  constructionId: string;
  customerId: string;
  userId: string;
  typeId: number;
  examinationDate: string;
}

interface LatestExportQuery {
  order: (column: string, options: { ascending: boolean }) => {
    limit: (count: number) => {
      maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
    };
  };
}

const getDateCandidates = (value: string | null | undefined): string[] => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) return [];

  const candidates = new Set<string>([normalized]);
  if (normalized.length >= 10) {
    candidates.add(normalized.slice(0, 10));
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    const iso = parsed.toISOString();
    candidates.add(iso);
    candidates.add(iso.slice(0, 10));
  }

  return Array.from(candidates);
};

const readExportId = (row: unknown): string | null => {
  if (!row || typeof row !== 'object') return null;
  const id = (row as { id?: unknown }).id;
  if (typeof id !== 'string' || id.length === 0) return null;
  return id;
};

const getLatestExportId = async (query: LatestExportQuery): Promise<string | null> => {
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return readExportId(data);
};

export const findExistingReportExportId = async ({
  constructionId,
  customerId,
  userId,
  typeId,
  examinationDate,
}: ExistingReportExportLookup): Promise<string | null> => {
  const dateCandidates = getDateCandidates(examinationDate);

  for (const dateCandidate of dateCandidates) {
    const exactByUserId = await getLatestExportId(
      supabase
        .from('report_exports')
        .select('id')
        .eq('construction_id', constructionId)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('type_id', typeId)
        .eq('examination_date', dateCandidate)
    );
    if (exactByUserId) return exactByUserId;

    const exactByCertifierId = await getLatestExportId(
      supabase
        .from('report_exports')
        .select('id')
        .eq('construction_id', constructionId)
        .eq('customer_id', customerId)
        .eq('certifier_id', userId)
        .eq('type_id', typeId)
        .eq('examination_date', dateCandidate)
    );
    if (exactByCertifierId) return exactByCertifierId;

    const exactWithoutIdentity = await getLatestExportId(
      supabase
        .from('report_exports')
        .select('id')
        .eq('construction_id', constructionId)
        .eq('customer_id', customerId)
        .eq('type_id', typeId)
        .eq('examination_date', dateCandidate)
    );
    if (exactWithoutIdentity) return exactWithoutIdentity;
  }

  const fallbackQueries: LatestExportQuery[] = [
    supabase
      .from('report_exports')
      .select('id')
      .eq('construction_id', constructionId)
      .eq('customer_id', customerId)
      .eq('type_id', typeId),
    supabase
      .from('report_exports')
      .select('id')
      .eq('construction_id', constructionId)
      .eq('customer_id', customerId),
    supabase
      .from('report_exports')
      .select('id')
      .eq('construction_id', constructionId)
      .eq('user_id', userId),
    supabase
      .from('report_exports')
      .select('id')
      .eq('construction_id', constructionId),
  ];

  for (const fallbackQuery of fallbackQueries) {
    const fallbackId = await getLatestExportId(fallbackQuery);
    if (fallbackId) return fallbackId;
  }

  return null;
};
