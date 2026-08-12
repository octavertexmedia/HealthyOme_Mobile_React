import { useQuery } from '@tanstack/react-query';
import { legalApi } from '../api/legal.api';

export const useLegalPage = (slug: string) => {
  return useQuery({
    queryKey: ['legalPage', slug],
    queryFn: () => legalApi.getLegalPage(slug),
    staleTime: 60 * 60 * 1000,
    enabled: !!slug,
    retry: false,
  });
};

export const useLegalPages = () => {
  return useQuery({
    queryKey: ['legalPages'],
    queryFn: legalApi.getLegalPages,
    staleTime: 60 * 60 * 1000,
  });
};
