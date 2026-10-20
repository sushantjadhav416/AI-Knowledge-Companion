import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import documentService from '../api/documentService'
import toast from 'react-hot-toast'

export const DOCUMENTS_KEY = ['documents']

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: async () => {
      const res = await documentService.getAll()
      return res.data.data ?? []
    },
    staleTime: 30_000,
  })
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await documentService.getById(id)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useDocumentStatus(id, enabled = true) {
  return useQuery({
    queryKey: ['documents', id, 'status'],
    queryFn: async () => {
      const res = await documentService.getStatus(id)
      return res.data.data
    },
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'READY' || status === 'FAILED') return false
      return 3000
    },
    refetchIntervalInBackground: true,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }) => documentService.upload(file, onProgress),
    onSuccess: (res) => {
      toast.success(`"${res.data.data.originalName}" uploaded — processing started`)
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => documentService.delete(id),
    onSuccess: (_, id) => {
      toast.success('Document deleted')
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      queryClient.removeQueries({ queryKey: ['documents', id] })
    },
  })
}
