import { useQuery } from '@tanstack/react-query'
import type { MetadataPatch } from '@shared/contracts'

export function useMetadataPreview(url: string | null) {
  return useQuery({
    queryKey: ['metadata-preview', url],
    queryFn: (): Promise<MetadataPatch> => window.api.metadata.preview(url as string),
    enabled: Boolean(url),
    staleTime: 60_000
  })
}
