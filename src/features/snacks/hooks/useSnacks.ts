import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { snacksApi } from '../api/snacks.api';

export const useInfiniteSnacks = (params: {
  search?: string;
  category?: number;
  dietary_type?: string;
  ordering?: string;
}) => {
  return useInfiniteQuery({
    queryKey: [
      'snacks',
      'infinite',
      params.search ?? '',
      params.category ?? null,
      params.dietary_type ?? '',
      params.ordering ?? '',
    ],
    queryFn: ({ pageParam }) =>
      snacksApi.getSnacksPage({
        page: pageParam as number,
        search: params.search,
        category: params.category,
        dietary_type: params.dietary_type,
        ordering: params.ordering,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage,
    staleTime: 60 * 1000,
  });
};

export const useSnack = (id: number) => {
  return useQuery({
    queryKey: ['snack', id],
    queryFn: () => snacksApi.getSnack(id),
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
};

export const useSnackCategories = () => {
  return useQuery({
    queryKey: ['snackCategories'],
    queryFn: snacksApi.getSnackCategories,
    staleTime: 15 * 60 * 1000,
  });
};
