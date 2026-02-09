/**
 * Background Sync Service
 * Handles syncing offline changes to the server when connection is restored
 */

import { supabase } from './supabase';
import {
  compactPendingSyncOperations,
  getPersistedSyncIdMap,
  getFailedSyncOperations,
  getSyncOperationsByStatus,
  getPendingSyncOperations,
  persistSyncIdMapping,
  markSyncOperationDiscarded,
  remapQueuedSyncReferences,
  removeSyncOperation,
  restoreDiscardedSyncOperation,
  resetSyncOperationForRetry,
  updateSyncOperationStatus,
  type SyncOperation,
  STORES,
  getByIndex,
  getMetadata,
  saveManyToStore,
  saveToStore,
  deleteFromStore,
} from './offlineDb';
import { isConflictErrorMessage } from './offlineConflict';

const MAX_RETRY_COUNT = 5;
const BASE_RETRY_DELAY_MS = 1000; // 1 second base delay
const SUPABASE_SESSION_METADATA_KEY = 'supabase_session_tokens';

/**
 * Check if an error is a network-related error
 */
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') return true;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('timeout') ||
      message.includes('abort')
    );
  }
  return false;
};

/**
 * Calculate exponential backoff delay with jitter
 */
const getRetryDelay = (retryCount: number): number => {
  const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

/**
 * Wait for specified milliseconds
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

type SyncEventCallback = (event: {
  type: 'sync_start' | 'sync_complete' | 'sync_error' | 'sync_progress';
  total?: number;
  completed?: number;
  failed?: number;
  error?: string;
}) => void;

let syncInProgress = false;
const syncListeners: Set<SyncEventCallback> = new Set();

/**
 * Subscribe to sync events
 */
export const onSyncEvent = (callback: SyncEventCallback): (() => void) => {
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
};

/**
 * Emit sync event to all listeners
 */
const emitSyncEvent = (event: Parameters<SyncEventCallback>[0]) => {
  syncListeners.forEach((listener) => listener(event));
};

/**
 * Map store names to Supabase table names
 */
const storeToTable: Record<string, string> = {
  [STORES.CUSTOMERS]: 'customers',
  [STORES.CONSTRUCTIONS]: 'constructions',
  [STORES.REPORTS]: 'report_forms',
  [STORES.APPOINTMENTS]: 'calendar_events',
  [STORES.MESSAGES]: 'messages',
  [STORES.EXAMINERS]: 'profiles',
  [STORES.MATERIALS]: 'materials',
  [STORES.SCHEME_IMAGES]: 'scheme_images',
  [STORES.CERTIFIERS]: 'certifiers',
  [STORES.REPORT_FILES]: 'report_files',
};

interface PersistedSessionTokens {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface ReportFileUploadOperation {
  kind: 'report_file_upload';
  construction_id: string;
  report_id?: string;
  file_name: string;
  description?: string;
  file_type: 'image' | 'pdf';
  mime_type?: string;
  blob: Blob;
}

interface ReportFileDeleteOperation {
  kind: 'report_file_delete';
  file_id?: string;
  file_path?: string;
}

interface ProfileAvatarUploadOperation {
  kind: 'profile_avatar_upload';
  user_id: string;
  file_name: string;
  mime_type?: string;
  blob: Blob;
}

interface CertifierSignatureUploadOperation {
  kind: 'certifier_signature_upload';
  certifier_id: string;
  file_name: string;
  mime_type?: string;
  blob: Blob;
}

interface CertifierSignatureDeleteOperation {
  kind: 'certifier_signature_delete';
  certifier_id: string;
}

interface SchemeImageUploadOperation {
  kind: 'scheme_image_upload';
  scheme_id?: string;
  scheme_number: number;
  method_type: 'water' | 'air';
  file_name: string;
  mime_type?: string;
  blob: Blob;
}

interface TemplateUploadOperation {
  kind: 'template_upload';
  file_name: string;
  mime_type?: string;
  blob: Blob;
}

type UploadOperationData =
  | ReportFileUploadOperation
  | ReportFileDeleteOperation
  | ProfileAvatarUploadOperation
  | CertifierSignatureUploadOperation
  | CertifierSignatureDeleteOperation
  | SchemeImageUploadOperation
  | TemplateUploadOperation;

interface ExaminerCreateOperationData {
  email: string;
  password: string;
  name: string;
  last_name: string;
  username: string;
  title?: string;
  gender?: 'M' | 'F';
  role?: 'admin' | 'user';
  avatar_url?: string;
  accreditations?: number[];
}

const isNumericIdString = (value: string): boolean => /^-?\d+$/.test(value);

const toLocalStoreKey = (store: string, entityId: string): IDBValidKey => {
  if (store === STORES.MATERIALS && isNumericIdString(entityId)) {
    return Number(entityId);
  }
  return entityId;
};

const toRemoteEntityId = (store: string, entityId: string): string | number => {
  if (store === STORES.MATERIALS && isNumericIdString(entityId)) {
    return Number(entityId);
  }
  return entityId;
};

const ensureBlob = (value: unknown, label: string): Blob => {
  if (value instanceof Blob) {
    return value;
  }
  throw new Error(`Missing binary payload for ${label}`);
};

const getFileExtension = (fileName: string, fallback: string): string => {
  const extension = fileName.split('.').pop()?.trim().toLowerCase();
  return extension && extension.length > 0 ? extension : fallback;
};

const mapScalarId = (value: string | number, idMap: Map<string, string>): string | number => {
  const lookupKey = String(value);
  const mappedValue = idMap.get(lookupKey);
  if (!mappedValue) {
    return value;
  }

  if (typeof value === 'number') {
    const mappedNumber = Number(mappedValue);
    return Number.isFinite(mappedNumber) ? mappedNumber : value;
  }

  return mappedValue;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
);

const deleteConstructionWithDependencies = async (constructionId: string): Promise<void> => {
  const { data: exportsData, error: exportsSelectError } = await supabase
    .from('report_exports')
    .select('id')
    .eq('construction_id', constructionId);

  if (exportsSelectError) {
    throw exportsSelectError;
  }

  const exportIds = (exportsData || [])
    .map((row) => row.id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (exportIds.length > 0) {
    const { error: exportFormsError } = await supabase
      .from('report_export_forms')
      .delete()
      .in('export_id', exportIds);

    if (exportFormsError) {
      throw exportFormsError;
    }
  }

  const { error: exportsDeleteError } = await supabase
    .from('report_exports')
    .delete()
    .eq('construction_id', constructionId);
  if (exportsDeleteError) {
    throw exportsDeleteError;
  }

  const { error: filesError } = await supabase
    .from('report_files')
    .delete()
    .eq('construction_id', constructionId);
  if (filesError) {
    throw filesError;
  }

  const { error: reportFormsError } = await supabase
    .from('report_forms')
    .delete()
    .eq('construction_id', constructionId);
  if (reportFormsError) {
    throw reportFormsError;
  }

  const { error: appointmentsError } = await supabase
    .from('calendar_events')
    .delete()
    .eq('construction_id', constructionId);
  if (appointmentsError) {
    throw appointmentsError;
  }

  const { error: constructionDeleteError } = await supabase
    .from('constructions')
    .delete()
    .eq('id', constructionId);
  if (constructionDeleteError) {
    throw constructionDeleteError;
  }
};

const deleteCustomerWithDependencies = async (customerId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('constructions')
    .select('id')
    .eq('customer_id', customerId);

  if (error) {
    throw error;
  }

  const constructionIds = (data || [])
    .map((item) => item.id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  // Keep deletions ordered to avoid FK races on tightly related rows.
  for (const constructionId of constructionIds) {
    await deleteConstructionWithDependencies(constructionId);
  }

  const { error: appointmentsError } = await supabase
    .from('calendar_events')
    .delete()
    .eq('customer_id', customerId);
  if (appointmentsError) {
    throw appointmentsError;
  }

  const { error: customerDeleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);
  if (customerDeleteError) {
    throw customerDeleteError;
  }
};

const mapEntityId = (entityId: string | undefined, idMap: Map<string, string>): string | undefined => {
  if (!entityId) return undefined;
  return idMap.get(entityId) ?? entityId;
};

const applyIdMap = (value: unknown, idMap: Map<string, string>): unknown => {
  if (typeof value === 'string') {
    return idMap.get(value) ?? value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return mapScalarId(value, idMap);
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyIdMap(item, idMap));
  }

  if (isPlainObject(value)) {
    const mappedEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => [key, applyIdMap(nestedValue, idMap)]);
    return Object.fromEntries(mappedEntries);
  }

  return value;
};

interface QueuedExportHistoryForm {
  form_id: string;
  type_id: number;
  ordinal: number;
}

interface QueuedExportHistoryData {
  exportPayload: Record<string, unknown> & {
    construction_id: string;
    customer_id: string;
    user_id: string;
    type_id: number;
    examination_date: string;
  };
  forms: QueuedExportHistoryForm[];
}

const isDbConflictError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const dbError = error as { code?: string; status?: number; message?: string; details?: string };
    const message = (dbError.message || '').toLowerCase();
    const details = (dbError.details || '').toLowerCase();
    return dbError.code === '23505' ||
      dbError.status === 409 ||
      message.includes('duplicate key') ||
      details.includes('already exists');
  }
  return false;
};

const stripOfflineFields = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = value as any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _offline_id, _is_offline, _synced, assignee_ids: _assigneeIds, id: _entityId, ...rest } = raw;
  return rest as Record<string, unknown>;
};

const syncQueuedExportHistory = async (
  rawData: unknown
): Promise<{ id: string; exportPayload: QueuedExportHistoryData['exportPayload'] } | null> => {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid export history payload');
  }

  const data = rawData as QueuedExportHistoryData;
  const exportPayload = data.exportPayload;
  const forms = Array.isArray(data.forms) ? data.forms : [];

  if (!exportPayload?.construction_id || !exportPayload?.customer_id || !exportPayload?.user_id) {
    throw new Error('Invalid export history payload: missing required ids');
  }

  const { data: insertedExport, error: insertError } = await supabase
    .from('report_exports')
    .insert(exportPayload)
    .select()
    .single();

  let resolvedExport = insertedExport as { id: string } | null;
  if (insertError) {
    if (!isDbConflictError(insertError)) {
      throw insertError;
    }

    const { data: exactExistingExport, error: exactExistingExportError } = await supabase
      .from('report_exports')
      .select('id')
      .eq('construction_id', exportPayload.construction_id)
      .eq('customer_id', exportPayload.customer_id)
      .eq('user_id', exportPayload.user_id)
      .eq('type_id', exportPayload.type_id)
      .eq('examination_date', exportPayload.examination_date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let existingExport = exactExistingExport as { id: string } | null;
    if (exactExistingExportError || !existingExport) {
      const { data: fallbackExistingExport, error: fallbackExistingExportError } = await supabase
        .from('report_exports')
        .select('id')
        .eq('construction_id', exportPayload.construction_id)
        .eq('user_id', exportPayload.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackExistingExportError || !fallbackExistingExport) {
        throw insertError;
      }
      existingExport = fallbackExistingExport as { id: string };
    }

    const { data: updatedExport, error: updateExportError } = await supabase
      .from('report_exports')
      .update(exportPayload)
      .eq('id', existingExport.id)
      .select('id')
      .single();

    if (updateExportError) throw updateExportError;
    resolvedExport = (updatedExport as { id: string } | null) || existingExport;
  }

  if (!resolvedExport || !resolvedExport.id || forms.length === 0) {
    if (!resolvedExport?.id) {
      return null;
    }
    return {
      id: resolvedExport.id,
      exportPayload,
    };
  }

  const normalizedForms = forms
    .filter((form) => typeof form.form_id === 'string' && form.form_id.length > 0)
    .map((form, index) => ({
      export_id: resolvedExport!.id,
      form_id: form.form_id,
      type_id: form.type_id,
      ordinal: form.ordinal || index + 1,
    }));

  if (normalizedForms.length === 0) {
    return;
  }

  const { error: deleteOldFormsError } = await supabase
    .from('report_export_forms')
    .delete()
    .eq('export_id', resolvedExport.id);
  if (deleteOldFormsError) throw deleteOldFormsError;

  const { error: insertFormsError } = await supabase
    .from('report_export_forms')
    .insert(normalizedForms);
  if (insertFormsError) throw insertFormsError;

  return {
    id: resolvedExport.id,
    exportPayload,
  };
};

const rehydrateSupabaseSession = async (): Promise<void> => {
  try {
    const savedSession = await getMetadata<PersistedSessionTokens | null>(SUPABASE_SESSION_METADATA_KEY);
    if (!savedSession || typeof savedSession !== 'object') {
      return;
    }

    if (
      typeof savedSession.access_token !== 'string' ||
      savedSession.access_token.length === 0 ||
      typeof savedSession.refresh_token !== 'string' ||
      savedSession.refresh_token.length === 0
    ) {
      return;
    }

    await supabase.auth.setSession({
      access_token: savedSession.access_token,
      refresh_token: savedSession.refresh_token,
    });
  } catch (error) {
    console.debug('Could not rehydrate Supabase session for sync worker', error);
  }
};

const syncCreateExaminer = async (
  operation: SyncOperation,
  idMap: Map<string, string>
): Promise<void> => {
  const mappedData = applyIdMap(operation.data, idMap);
  if (!mappedData || typeof mappedData !== 'object') {
    throw new Error('Invalid examiner create payload');
  }

  const payload = mappedData as ExaminerCreateOperationData;
  if (!payload.email || !payload.password || !payload.name || !payload.last_name || !payload.username) {
    throw new Error('Invalid examiner create payload: missing required fields');
  }

  const { data: { session: currentSession } } = await supabase.auth.getSession();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
        last_name: payload.last_name,
        username: payload.username,
      },
    },
  });

  if (authError) {
    throw authError;
  }
  if (!authData.user?.id) {
    throw new Error('Examiner sign up succeeded without user id');
  }

  if (currentSession) {
    await supabase.auth.setSession({
      access_token: currentSession.access_token,
      refresh_token: currentSession.refresh_token,
    });
  }

  const profilePayload = {
    id: authData.user.id,
    email: payload.email,
    name: payload.name,
    last_name: payload.last_name,
    username: payload.username,
    title: payload.title,
    gender: payload.gender,
    role: payload.role || 'user',
    avatar_url: payload.avatar_url,
    accreditations: Array.isArray(payload.accreditations) ? payload.accreditations : [],
  };

  const { data: profileData, error: upsertError } = await supabase
    .from('profiles')
    .upsert(profilePayload)
    .select()
    .single();

  if (upsertError) {
    throw upsertError;
  }

  if (operation.entityId && operation.entityId !== profileData.id) {
    idMap.set(operation.entityId, profileData.id);
    await persistSyncIdMapping(operation.entityId, profileData.id);
    await remapQueuedSyncReferences({ [operation.entityId]: profileData.id });
    await deleteFromStore(STORES.EXAMINERS, operation.entityId);
  }

  await saveToStore(STORES.EXAMINERS, { ...profileData, _synced: true });
};

const processUploadOperation = async (
  operation: SyncOperation,
  idMap: Map<string, string>
): Promise<void> => {
  const mappedData = applyIdMap(operation.data, idMap);
  if (!mappedData || typeof mappedData !== 'object') {
    throw new Error('Invalid upload payload');
  }

  const payload = mappedData as UploadOperationData;
  switch (payload.kind) {
    case 'report_file_upload': {
      const fileBlob = ensureBlob(payload.blob, payload.kind);
      const mappedConstructionId = mapEntityId(payload.construction_id, idMap) || payload.construction_id;
      const mappedReportId = payload.report_id ? mapEntityId(payload.report_id, idMap) : undefined;

      const fileExt = getFileExtension(payload.file_name, payload.file_type === 'pdf' ? 'pdf' : 'png');
      const storageFileName = `${mappedConstructionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { data: uploadedFile, error: uploadError } = await supabase.storage
        .from('report-files')
        .upload(storageFileName, fileBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: payload.mime_type || fileBlob.type || undefined,
        });
      if (uploadError) {
        throw uploadError;
      }

      const reportFileInsertPayload = {
        construction_id: mappedConstructionId,
        report_id: mappedReportId,
        file_path: uploadedFile.path,
        file_name: payload.file_name,
        description: payload.description || payload.file_name,
        file_type: payload.file_type,
      };

      const { data: insertedFile, error: insertError } = await supabase
        .from('report_files')
        .insert(reportFileInsertPayload)
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from('report-files').remove([uploadedFile.path]);
        throw insertError;
      }

      if (operation.entityId) {
        await deleteFromStore(STORES.REPORT_FILES, operation.entityId);
      }
      await saveToStore(STORES.REPORT_FILES, { ...insertedFile, _synced: true });
      break;
    }

    case 'report_file_delete': {
      const mappedFileId = mapEntityId(payload.file_id || operation.entityId, idMap);
      if (!mappedFileId) {
        throw new Error('Missing report file id for delete');
      }

      if (payload.file_path) {
        await supabase.storage
          .from('report-files')
          .remove([payload.file_path]);
      }

      const { error: deleteError } = await supabase
        .from('report_files')
        .delete()
        .eq('id', mappedFileId);
      if (deleteError) {
        throw deleteError;
      }
      break;
    }

    case 'profile_avatar_upload': {
      const mappedUserId = mapEntityId(payload.user_id, idMap) || payload.user_id;
      const fileBlob = ensureBlob(payload.blob, payload.kind);
      const fileExt = getFileExtension(payload.file_name, 'png');
      const filePath = `${mappedUserId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileBlob, {
          upsert: true,
          contentType: payload.mime_type || fileBlob.type || undefined,
        });
      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', mappedUserId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      await saveToStore(STORES.EXAMINERS, { ...updatedProfile, _synced: true });
      break;
    }

    case 'certifier_signature_upload': {
      const mappedCertifierId = mapEntityId(payload.certifier_id, idMap) || payload.certifier_id;
      const fileBlob = ensureBlob(payload.blob, payload.kind);
      const fileExt = getFileExtension(payload.file_name, 'png');
      const fileName = `signature-${mappedCertifierId}-${Date.now()}.${fileExt}`;

      const { data: certifierData } = await supabase
        .from('certifiers')
        .select('signature_url')
        .eq('id', mappedCertifierId)
        .maybeSingle();

      const oldFileName = certifierData?.signature_url?.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from('certifier-signatures').remove([oldFileName]);
      }

      const { error: uploadError } = await supabase.storage
        .from('certifier-signatures')
        .upload(fileName, fileBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: payload.mime_type || fileBlob.type || undefined,
        });
      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('certifier-signatures')
        .getPublicUrl(fileName);

      const { data: updatedCertifier, error: updateError } = await supabase
        .from('certifiers')
        .update({ signature_url: data.publicUrl })
        .eq('id', mappedCertifierId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      await saveToStore(STORES.CERTIFIERS, { ...updatedCertifier, _synced: true });
      break;
    }

    case 'certifier_signature_delete': {
      const mappedCertifierId = mapEntityId(payload.certifier_id, idMap) || payload.certifier_id;

      const { data: certifierData } = await supabase
        .from('certifiers')
        .select('signature_url')
        .eq('id', mappedCertifierId)
        .maybeSingle();

      const oldFileName = certifierData?.signature_url?.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from('certifier-signatures').remove([oldFileName]);
      }

      const { data: updatedCertifier, error: updateError } = await supabase
        .from('certifiers')
        .update({ signature_url: null })
        .eq('id', mappedCertifierId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      await saveToStore(STORES.CERTIFIERS, { ...updatedCertifier, _synced: true });
      break;
    }

    case 'scheme_image_upload': {
      const fileBlob = ensureBlob(payload.blob, payload.kind);
      const fileExt = getFileExtension(payload.file_name, 'png');
      const fileName = `scheme_${payload.scheme_number}_${payload.method_type}_${Date.now()}.${fileExt}`;

      if (payload.scheme_id) {
        const { data: currentScheme } = await supabase
          .from('scheme_images')
          .select('file_path')
          .eq('id', payload.scheme_id)
          .maybeSingle();

        if (currentScheme?.file_path && !currentScheme.file_path.startsWith('blob:')) {
          await supabase.storage.from('scheme-images').remove([currentScheme.file_path]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('scheme-images')
        .upload(fileName, fileBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: payload.mime_type || fileBlob.type || undefined,
        });
      if (uploadError) {
        throw uploadError;
      }

      const updateQuery = supabase
        .from('scheme_images')
        .update({
          file_path: fileName,
          updated_at: new Date().toISOString(),
        })
        .eq('scheme_number', payload.scheme_number)
        .eq('method_type', payload.method_type)
        .select()
        .single();

      const { data: updatedScheme, error: updateError } = await updateQuery;
      if (updateError) {
        await supabase.storage.from('scheme-images').remove([fileName]);
        throw updateError;
      }
      await saveToStore(STORES.SCHEME_IMAGES, { ...updatedScheme, _synced: true });
      break;
    }

    case 'template_upload': {
      const fileBlob = ensureBlob(payload.blob, payload.kind);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupName = `method1610_backup_${timestamp}.docx`;
      const { data: currentTemplateUrl } = supabase.storage
        .from('templates')
        .getPublicUrl('method1610.docx');

      if (currentTemplateUrl.publicUrl) {
        try {
          const existingTemplateResponse = await fetch(currentTemplateUrl.publicUrl);
          if (existingTemplateResponse.ok) {
            const currentTemplateBlob = await existingTemplateResponse.blob();
            await supabase.storage
              .from('templates')
              .upload(backupName, currentTemplateBlob, { upsert: false });
          }
        } catch (error) {
          console.warn('Template backup during sync failed', error);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload('method1610.docx', fileBlob, { upsert: true, contentType: payload.mime_type || fileBlob.type || undefined });
      if (uploadError) {
        throw uploadError;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, last_name')
        .eq('id', user?.id)
        .maybeSingle();

      const uploaderName = profile ? `${profile.name} ${profile.last_name}`.trim() : user?.email || 'Unknown';
      const { error: deactivateMetadataError } = await supabase
        .from('template_metadata')
        .update({ is_active: false })
        .eq('file_name', 'method1610.docx');
      if (deactivateMetadataError) {
        throw deactivateMetadataError;
      }

      const { error: insertMetadataError } = await supabase
        .from('template_metadata')
        .insert({
          file_name: 'method1610.docx',
          uploaded_by: user?.id,
          uploaded_by_name: uploaderName,
          is_active: true,
        });
      if (insertMetadataError) {
        throw insertMetadataError;
      }

      const now = new Date().toISOString();
      await saveToStore(STORES.TEMPLATE_CACHE, {
        id: 'active_template',
        value: {
          name: 'method1610.docx',
          path: 'method1610.docx',
          size: fileBlob.size,
          lastUpdated: now,
          updatedBy: uploaderName,
        },
        updated_at: now,
      });
      break;
    }

    default:
      throw new Error(`Unsupported upload sync payload: ${(payload as { kind?: string }).kind || 'unknown'}`);
  }
};

const handleOperationFailure = async (operation: SyncOperation, error: unknown): Promise<boolean> => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const normalizedError = isConflictErrorMessage(errorMessage) ? `Conflict: ${errorMessage}` : errorMessage;
  const isNetwork = isNetworkError(error);
  const nextRetryCount = operation.retryCount + 1;

  console.error('Sync operation failed:', {
    operation: operation.operation,
    store: operation.store,
    entityId: operation.entityId,
    retryCount: operation.retryCount,
    isNetworkError: isNetwork,
    error: normalizedError,
  });

  if (nextRetryCount >= MAX_RETRY_COUNT) {
    await updateSyncOperationStatus(operation.id, 'failed', normalizedError);
    emitSyncEvent({ type: 'sync_error', error: `Operation failed after ${MAX_RETRY_COUNT} retries: ${normalizedError}` });
  } else if (isNetwork) {
    const retryDelay = getRetryDelay(nextRetryCount);
    await updateSyncOperationStatus(operation.id, 'pending', normalizedError);
    await delay(retryDelay);
  } else {
    await updateSyncOperationStatus(operation.id, 'pending', normalizedError);
  }
  return false;
};

/**
 * Process a single sync operation
 */
const processSyncOperation = async (
  operation: SyncOperation,
  idMap: Map<string, string>
): Promise<boolean> => {
  try {
    await updateSyncOperationStatus(operation.id, 'in_progress');

    if (operation.store === STORES.EXPORT_HISTORY) {
      if (operation.operation === 'create') {
        const mappedData = applyIdMap(operation.data, idMap);
        const syncedExport = await syncQueuedExportHistory(mappedData);

        if (operation.entityId) {
          try {
            const cachedForms = await getByIndex<{ id: string }>(
              STORES.EXPORT_HISTORY_FORMS,
              'export_id',
              operation.entityId
            );
            await Promise.all(
              cachedForms.map((form) => deleteFromStore(STORES.EXPORT_HISTORY_FORMS, form.id))
            );
            await deleteFromStore(STORES.EXPORT_HISTORY, operation.entityId);
          } catch (deleteError) {
            console.warn('Could not delete queued export history temp record:', deleteError);
          }
        }

        if (syncedExport) {
          const forms = (
            mappedData &&
            typeof mappedData === 'object' &&
            Array.isArray((mappedData as { forms?: unknown[] }).forms)
          )
            ? (mappedData as { forms: unknown[] }).forms
            : [];

          await saveToStore(STORES.EXPORT_HISTORY, {
            id: syncedExport.id,
            ...syncedExport.exportPayload,
            forms_count: forms.length,
            _synced: true,
            updated_at: new Date().toISOString(),
          });

          await saveManyToStore(
            STORES.EXPORT_HISTORY_FORMS,
            forms.map((form, index) => ({
              id: `${syncedExport.id}:${(form as { form_id?: string }).form_id || index}:${index}`,
              export_id: syncedExport.id,
              form_id: (form as { form_id?: string }).form_id,
              type_id: (form as { type_id?: number }).type_id,
              ordinal: (form as { ordinal?: number }).ordinal || index + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          );
        }
      } else if (operation.operation === 'delete') {
        const mappedEntityId = mapEntityId(operation.entityId, idMap);
        if (!mappedEntityId) {
          throw new Error('Entity ID required for export history delete');
        }

        await supabase
          .from('report_export_forms')
          .delete()
          .eq('export_id', mappedEntityId);

        const { error: deleteExportError } = await supabase
          .from('report_exports')
          .delete()
          .eq('id', mappedEntityId);
        if (deleteExportError) throw deleteExportError;
      } else {
        throw new Error(`Unsupported export history operation: ${operation.operation}`);
      }

      await removeSyncOperation(operation.id);
      return true;
    }

    if (operation.store === STORES.UPLOADS) {
      await processUploadOperation(operation, idMap);
      await removeSyncOperation(operation.id);
      return true;
    }

    if (operation.store === STORES.EXAMINERS && operation.operation === 'create') {
      await syncCreateExaminer(operation, idMap);
      await removeSyncOperation(operation.id);
      return true;
    }

    const tableName = storeToTable[operation.store];
    if (!tableName) {
      throw new Error(`Unknown store: ${operation.store}`);
    }

    switch (operation.operation) {
      case 'create': {
        const mappedData = applyIdMap(operation.data, idMap);
        const cleanData = stripOfflineFields(mappedData);

        const { data, error } = await supabase
          .from(tableName)
          .insert([cleanData])
          .select()
          .single();

        if (error) throw error;

        // Update local store with server-assigned data
        // operation.entityId contains the temp ID used for the offline record
        if (data && operation.entityId) {
          const serverIdRaw = (data as { id?: unknown }).id;
          if ((typeof serverIdRaw === 'string' || typeof serverIdRaw === 'number') && operation.entityId !== String(serverIdRaw)) {
            const mappedServerId = String(serverIdRaw);
            idMap.set(operation.entityId, mappedServerId);
            await persistSyncIdMapping(operation.entityId, mappedServerId);
            await remapQueuedSyncReferences({ [operation.entityId]: mappedServerId });
          }

          // Remove old offline record using the temp ID
          try {
            await deleteFromStore(operation.store, toLocalStoreKey(operation.store, operation.entityId));
          } catch (deleteError) {
            console.warn('Could not delete temp record:', deleteError);
          }
          // Save the server-returned data
          await saveToStore(operation.store, { ...data, _synced: true });
        } else if (data) {
          await saveToStore(operation.store, { ...data, _synced: true });
        }
        break;
      }

      case 'update': {
        const mappedEntityId = mapEntityId(operation.entityId, idMap);
        if (!mappedEntityId) throw new Error('Entity ID required for update');
        const remoteEntityId = toRemoteEntityId(operation.store, mappedEntityId);

        const mappedData = applyIdMap(operation.data, idMap);
        const cleanData = stripOfflineFields(mappedData);

        const { data, error } = await supabase
          .from(tableName)
          .update(cleanData)
          .eq('id', remoteEntityId)
          .select()
          .single();

        if (error) throw error;

        // Update local store
        if (data) {
          await saveToStore(operation.store, { ...data, _synced: true });
        }
        break;
      }

      case 'delete': {
        const mappedEntityId = mapEntityId(operation.entityId, idMap);
        if (!mappedEntityId) throw new Error('Entity ID required for delete');

        if (operation.store === STORES.CONSTRUCTIONS) {
          await deleteConstructionWithDependencies(mappedEntityId);
          break;
        }

        if (operation.store === STORES.CUSTOMERS) {
          await deleteCustomerWithDependencies(mappedEntityId);
          break;
        }

        const remoteEntityId = toRemoteEntityId(operation.store, mappedEntityId);

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', remoteEntityId);

        if (error) throw error;
        break;
      }
    }

    // Remove from sync queue on success
    await removeSyncOperation(operation.id);
    return true;
  } catch (error) {
    return handleOperationFailure(operation, error);
  }
};

/**
 * Process all pending sync operations
 */
export const syncPendingOperations = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  if (syncInProgress) {
    return { success: 0, failed: 0, total: 0 };
  }

  syncInProgress = true;
  try {
    await rehydrateSupabaseSession();

    const persistedIdMap = await getPersistedSyncIdMap();
    if (Object.keys(persistedIdMap).length > 0) {
      await remapQueuedSyncReferences(persistedIdMap);
    }

    await compactPendingSyncOperations();

    const pendingOps = await getPendingSyncOperations();
    const total = pendingOps.length;

    if (total === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    emitSyncEvent({ type: 'sync_start', total });

    let success = 0;
    let failed = 0;
    const idMap = new Map<string, string>(Object.entries(persistedIdMap));

    for (const operation of pendingOps) {
      // Skip operations that have exceeded retry limit
      if (operation.retryCount >= MAX_RETRY_COUNT) {
        await updateSyncOperationStatus(
          operation.id,
          'failed',
          operation.error || `Operation reached retry limit (${MAX_RETRY_COUNT})`
        );
        failed++;
        emitSyncEvent({
          type: 'sync_progress',
          total,
          completed: success + failed,
          failed,
        });
        continue;
      }

      const result = await processSyncOperation(operation, idMap);
      if (result) {
        success++;
      } else {
        failed++;
      }

      emitSyncEvent({
        type: 'sync_progress',
        total,
        completed: success + failed,
        failed,
      });
    }

    emitSyncEvent({
      type: 'sync_complete',
      total,
      completed: success,
      failed,
    });

    return { success, failed, total };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Check if sync is currently in progress
 */
export const isSyncInProgress = (): boolean => syncInProgress;

/**
 * Force retry failed operations
 */
export const retryFailedOperations = async (): Promise<number> => {
  const failedOps = await getFailedSyncOperations();
  for (const op of failedOps) {
    await resetSyncOperationForRetry(op.id);
  }
  return failedOps.length;
};

/**
 * Retry a single failed operation by ID.
 */
export const retryFailedOperationById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  await resetSyncOperationForRetry(targetOperation.id);
  return true;
};

/**
 * Discard a single failed operation by ID.
 */
export const discardFailedOperationById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  await markSyncOperationDiscarded(
    targetOperation.id,
    `Marked as local-only by user on ${new Date().toISOString()}`
  );
  return true;
};

/**
 * Restore a single discarded operation back into pending sync.
 */
export const restoreDiscardedOperationById = async (operationId: string): Promise<boolean> => {
  const discardedOps = await getSyncOperationsByStatus('discarded');
  const targetOperation = discardedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  await restoreDiscardedSyncOperation(targetOperation.id);
  return true;
};

const fetchAndApplyServerState = async (
  operation: SyncOperation,
  mappedEntityId: string | undefined
): Promise<void> => {
  const tableName = storeToTable[operation.store];
  if (!tableName || !mappedEntityId) {
    return;
  }

  const remoteEntityId = toRemoteEntityId(operation.store, mappedEntityId);

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', remoteEntityId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    await saveToStore(operation.store, { ...data, _synced: true });
    return;
  }

  if (operation.entityId) {
    await deleteFromStore(operation.store, toLocalStoreKey(operation.store, operation.entityId));
  }
};

/**
 * Resolve a failed conflict by trusting current server state and removing local queued change.
 */
export const resolveConflictUseServerById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  try {
    const persistedIdMap = await getPersistedSyncIdMap();
    const mappedEntityId = targetOperation.entityId
      ? persistedIdMap[targetOperation.entityId] ?? targetOperation.entityId
      : undefined;

    if (targetOperation.store === STORES.EXPORT_HISTORY) {
      if (targetOperation.entityId) {
        await deleteFromStore(STORES.EXPORT_HISTORY, targetOperation.entityId);
      }
      await removeSyncOperation(targetOperation.id);
      return true;
    }

    const isLocalTempCreate = targetOperation.operation === 'create' &&
      !!targetOperation.entityId &&
      (
        targetOperation.entityId.startsWith('temp_') ||
        (targetOperation.store === STORES.MATERIALS &&
          isNumericIdString(targetOperation.entityId) &&
          Number(targetOperation.entityId) < 0)
      );

    if (isLocalTempCreate && targetOperation.entityId) {
      // Drop unsynced temp entity in favor of server state.
      await deleteFromStore(targetOperation.store, toLocalStoreKey(targetOperation.store, targetOperation.entityId));
    } else {
      await fetchAndApplyServerState(targetOperation, mappedEntityId);
    }

    await removeSyncOperation(targetOperation.id);
    return true;
  } catch (error) {
    console.error('Failed to resolve conflict using server version', error);
    return false;
  }
};

/**
 * Resolve a failed conflict by forcing local payload onto the server where possible.
 * Falls back to retry when force-apply is not safely possible.
 */
export const resolveConflictPreferLocalById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  try {
    const persistedIdMap = await getPersistedSyncIdMap();
    const idMap = new Map<string, string>(Object.entries(persistedIdMap));
    const mappedEntityId = targetOperation.entityId
      ? persistedIdMap[targetOperation.entityId] ?? targetOperation.entityId
      : undefined;

    if (targetOperation.store === STORES.EXPORT_HISTORY || targetOperation.store === STORES.UPLOADS) {
      await resetSyncOperationForRetry(targetOperation.id);
      return true;
    }

    const tableName = storeToTable[targetOperation.store];
    if (!tableName) {
      await resetSyncOperationForRetry(targetOperation.id);
      return true;
    }

    if (targetOperation.operation === 'delete') {
      if (!mappedEntityId) {
        throw new Error('Entity ID required for conflict delete resolution');
      }

      if (targetOperation.store === STORES.CONSTRUCTIONS) {
        await deleteConstructionWithDependencies(mappedEntityId);
      } else if (targetOperation.store === STORES.CUSTOMERS) {
        await deleteCustomerWithDependencies(mappedEntityId);
      } else {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', toRemoteEntityId(targetOperation.store, mappedEntityId));
        if (error) throw error;
      }

      if (targetOperation.entityId) {
        await deleteFromStore(
          targetOperation.store,
          toLocalStoreKey(targetOperation.store, targetOperation.entityId)
        );
      }
      await removeSyncOperation(targetOperation.id);
      return true;
    }

    const mappedData = applyIdMap(targetOperation.data, idMap);
    const cleanData = stripOfflineFields(mappedData);

    if (targetOperation.operation === 'create') {
      const isUnsyncedTempCreate = !!targetOperation.entityId &&
        (
          targetOperation.entityId.startsWith('temp_') ||
          (targetOperation.store === STORES.MATERIALS &&
            isNumericIdString(targetOperation.entityId) &&
            Number(targetOperation.entityId) < 0)
        ) &&
        !persistedIdMap[targetOperation.entityId];

      if (isUnsyncedTempCreate) {
        await resetSyncOperationForRetry(targetOperation.id);
        return true;
      }

      const forcedId = mappedEntityId
        ? toRemoteEntityId(targetOperation.store, mappedEntityId)
        : undefined;
      const upsertPayload = forcedId ? { ...cleanData, id: forcedId } : cleanData;

      const { data, error } = await supabase
        .from(tableName)
        .upsert([upsertPayload])
        .select()
        .single();
      if (error) throw error;

      if (targetOperation.entityId) {
        await deleteFromStore(
          targetOperation.store,
          toLocalStoreKey(targetOperation.store, targetOperation.entityId)
        );
      }
      await saveToStore(targetOperation.store, { ...data, _synced: true });
      await removeSyncOperation(targetOperation.id);
      return true;
    }

    if (!mappedEntityId) {
      throw new Error('Entity ID required for conflict update resolution');
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(cleanData)
      .eq('id', toRemoteEntityId(targetOperation.store, mappedEntityId))
      .select()
      .single();
    if (error) throw error;

    await saveToStore(targetOperation.store, { ...data, _synced: true });
    await removeSyncOperation(targetOperation.id);
    return true;
  } catch (error) {
    console.error('Failed to resolve conflict preferring local version', error);
    return false;
  }
};
