import { useQuery } from '@tanstack/react-query'
import type { GraphResponse } from '../types/graph'
import apiClient from './client'

export function useGraphQuery(namespace: string) {
  return useQuery({
    queryKey: ['graph', namespace],
    queryFn: () =>
      apiClient
        .get<GraphResponse>('/api/graph', { params: { namespace } })
        .then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
