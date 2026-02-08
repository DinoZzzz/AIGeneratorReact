import { useQuery } from '@tanstack/react-query';
import { certifierService, type Certifier } from '../services/certifierService';

export const certifierKeys = {
  all: ['certifiers'] as const,
};

export const useCertifiers = () => {
  return useQuery<Certifier[]>({
    queryKey: certifierKeys.all,
    queryFn: () => certifierService.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes — certifiers rarely change
  });
};
