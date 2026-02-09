import { certifierService, type Certifier } from '../services/certifierService';
import { getAllFromStore, saveManyToStore, STORES } from '../lib/offlineDb';
import { useOnlineQuery } from '../lib/offlineQueryFn';

export const certifierKeys = {
  all: ['certifiers'] as const,
};

export const useCertifiers = () => {
  return useOnlineQuery<Certifier[]>(
    certifierKeys.all,
    () => certifierService.getAll(),
    () => getAllFromStore<Certifier>(STORES.CERTIFIERS),
    {
      cacheFn: (data) => saveManyToStore(STORES.CERTIFIERS, data),
      staleTime: 30 * 60 * 1000,
    },
  );
};
