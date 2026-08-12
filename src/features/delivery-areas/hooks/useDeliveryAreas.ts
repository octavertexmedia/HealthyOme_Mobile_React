import { useQuery } from '@tanstack/react-query';
import { deliveryAreasApi } from '../api/deliveryAreas.api';

export const useGroupedDeliveryAreas = () => {
  return useQuery({
    queryKey: ['deliveryAreas', 'grouped'],
    queryFn: deliveryAreasApi.getGrouped,
    staleTime: 15 * 60 * 1000,
  });
};

export const useAcceptedDeliveryAreas = () => {
  return useQuery({
    queryKey: ['deliveryAreas', 'accepted'],
    queryFn: deliveryAreasApi.getAccepted,
    staleTime: 15 * 60 * 1000,
  });
};
