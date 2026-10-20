import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Box, Typography, LinearProgress, Alert } from '@mui/material'
import { useDocumentStatus } from '../../hooks/useDocuments'
import { DOCUMENTS_KEY } from '../../hooks/useDocuments'

/**
 * Invisible polling component — mounts after upload, polls status every 3s,
 * invalidates the documents list query when status reaches READY or FAILED.
 */
export default function IngestionPoller({ documentId, onReady, onFailed }) {
  const queryClient = useQueryClient()
  const { data: doc } = useDocumentStatus(documentId, true)

  useEffect(() => {
    if (!doc) return
    if (doc.status === 'READY') {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      onReady?.(doc)
    }
    if (doc.status === 'FAILED') {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      onFailed?.(doc)
    }
  }, [doc?.status])

  if (!doc) return null

  if (doc.status === 'PROCESSING') {
    return (
      <Box sx={{ mt: 1.5, p: 2, bgcolor: '#FFF4E0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" fontWeight={500} color="warning.dark">
            Processing "{doc.originalName}"…
          </Typography>
          <Typography variant="caption" color="warning.dark">
            {doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : 'Chunking & embedding'}
          </Typography>
        </Box>
        <LinearProgress color="warning" sx={{ borderRadius: 4 }} />
      </Box>
    )
  }

  if (doc.status === 'FAILED') {
    return (
      <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
        Processing failed for "{doc.originalName}". Try uploading again.
      </Alert>
    )
  }

  return null
}
