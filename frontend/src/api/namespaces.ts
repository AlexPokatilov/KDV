import { useQuery } from '@tanstack/react-query'
import type { NamespacesResponse } from '../types/graph'
import apiClient from './client'

export function useNamespacesQuery() {
  return useQuery({
    queryKey: ['namespaces'],
    queryFn: () =>
      apiClient.get<NamespacesResponse>('/api/namespaces').then((r) => r.data),
    staleTime: 60_000,
  })
}
