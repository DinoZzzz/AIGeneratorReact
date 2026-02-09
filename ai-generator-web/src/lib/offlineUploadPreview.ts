import { getAllSyncOperations, STORES } from './offlineDb';

export type QueuedUploadKind =
  | 'report_file_upload'
  | 'profile_avatar_upload'
  | 'certifier_signature_upload'
  | 'scheme_image_upload'
  | 'template_upload';

interface UploadBlobEntry {
  entityId: string;
  kind: QueuedUploadKind;
  blob: Blob;
  timestamp: number;
}

const isQueuedUploadKind = (value: unknown): value is QueuedUploadKind => {
  return value === 'report_file_upload' ||
    value === 'profile_avatar_upload' ||
    value === 'certifier_signature_upload' ||
    value === 'scheme_image_upload' ||
    value === 'template_upload';
};

const toUploadBlobEntry = (operation: {
  store: string;
  entityId?: string;
  timestamp: number;
  data: unknown;
}): UploadBlobEntry | null => {
  if (operation.store !== STORES.UPLOADS) {
    return null;
  }

  if (!operation.entityId || typeof operation.entityId !== 'string') {
    return null;
  }

  if (!operation.data || typeof operation.data !== 'object' || Array.isArray(operation.data)) {
    return null;
  }

  const rawKind = (operation.data as { kind?: unknown }).kind;
  const rawBlob = (operation.data as { blob?: unknown }).blob;

  if (!isQueuedUploadKind(rawKind)) {
    return null;
  }

  if (!(rawBlob instanceof Blob)) {
    return null;
  }

  return {
    entityId: operation.entityId,
    kind: rawKind,
    blob: rawBlob,
    timestamp: operation.timestamp,
  };
};

/**
 * Build a map of latest queued upload blobs by entity id for a specific upload kind.
 */
export const getQueuedUploadBlobMap = async (
  kind: QueuedUploadKind
): Promise<Map<string, Blob>> => {
  const operations = await getAllSyncOperations();
  const latestByEntity = new Map<string, UploadBlobEntry>();

  for (const operation of operations) {
    const entry = toUploadBlobEntry(operation);
    if (!entry || entry.kind !== kind) {
      continue;
    }

    const existing = latestByEntity.get(entry.entityId);
    if (!existing || entry.timestamp > existing.timestamp) {
      latestByEntity.set(entry.entityId, entry);
    }
  }

  const blobMap = new Map<string, Blob>();
  for (const [entityId, entry] of latestByEntity.entries()) {
    blobMap.set(entityId, entry.blob);
  }
  return blobMap;
};

/**
 * Build object URLs for queued upload blobs. Caller is responsible for revoking returned URLs.
 */
export const createQueuedUploadPreviewUrlMap = async (
  kind: QueuedUploadKind
): Promise<Map<string, string>> => {
  const blobMap = await getQueuedUploadBlobMap(kind);
  const urlMap = new Map<string, string>();

  for (const [entityId, blob] of blobMap.entries()) {
    urlMap.set(entityId, URL.createObjectURL(blob));
  }

  return urlMap;
};

export const revokePreviewUrls = (urls: Iterable<string>): void => {
  for (const url of urls) {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
};
