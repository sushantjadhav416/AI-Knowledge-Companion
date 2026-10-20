import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import intelligenceService from '../api/intelligenceService'
import toast from 'react-hot-toast'

export function useFlashcards(documentId) {
  return useQuery({
    queryKey: ['flashcards', documentId],
    queryFn: async () => {
      const res = await intelligenceService.getFlashcards(documentId)
      return res.data.data ?? []
    },
    enabled: !!documentId,
    staleTime: 60_000,
  })
}

export function useGenerateFlashcards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId) => intelligenceService.generateFlashcards(documentId),
    onSuccess: (res, documentId) => {
      toast.success(res.data.data?.length + ' flashcards generated')
      queryClient.invalidateQueries({ queryKey: ['flashcards', documentId] })
    },
    onError: () => toast.error('Failed to generate flashcards'),
  })
}

export function useSummarize() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId) => intelligenceService.summarize(documentId),
    onSuccess: (_, documentId) => {
      toast.success('Summary generated')
      queryClient.invalidateQueries({ queryKey: ['documents', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Failed to generate summary'),
  })
}

export function useGenerateTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId) => intelligenceService.generateTags(documentId),
    onSuccess: (_, documentId) => {
      toast.success('Tags generated')
      queryClient.invalidateQueries({ queryKey: ['documents', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Failed to generate tags'),
  })
}

export function useEnrich() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId) => intelligenceService.enrich(documentId),
    onSuccess: (_, documentId) => {
      toast.success('Document enriched — summary and tags ready')
      queryClient.invalidateQueries({ queryKey: ['documents', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Enrichment failed'),
  })
}
