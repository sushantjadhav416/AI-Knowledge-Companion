import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Box, Typography, LinearProgress, Button } from '@mui/material'
import { CloudUpload, CheckCircle } from '@mui/icons-material'
import { useUploadDocument } from '../../hooks/useDocuments'
import { ACCEPTED_FILE_TYPES, ACCEPTED_EXTENSIONS, formatFileSize } from '../../utils'

export default function UploadZone({ onSuccess }) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done, setDone]     = useState(false)
  const { mutateAsync: upload } = useUploadDocument()

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return
    const file = accepted[0]
    setUploading(true)
    setDone(false)
    setProgress(0)
    try {
      const res = await upload({ file, onProgress: setProgress })
      setDone(true)
      onSuccess?.(res.data.data)
    } finally {
      setUploading(false)
      setTimeout(() => setDone(false), 3000)
    }
  }, [upload, onSuccess])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled: uploading,
  })

  return (
    <Box>
      <Box {...getRootProps()} sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : done ? 'success.main' : 'divider',
        borderRadius: 3,
        p: 4, textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
        bgcolor: isDragActive ? '#F0EEFF' : done ? '#E5F7F1' : 'background.paper',
        transition: 'all .2s ease',
        '&:hover': { borderColor: 'primary.main', bgcolor: '#F8F7FF' },
      }}>
        <input {...getInputProps()} />

        {done ? (
          <>
            <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" color="success.main">Uploaded! Processing in background…</Typography>
          </>
        ) : (
          <>
            <CloudUpload sx={{ fontSize: 40, color: isDragActive ? 'primary.main' : 'text.disabled', mb: 1 }} />
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              {isDragActive ? 'Drop it here!' : 'Drag & drop a document'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to browse — supports {ACCEPTED_EXTENSIONS} · max 50 MB
            </Typography>
            <Button variant="outlined" size="small" disabled={uploading}>Browse files</Button>
          </>
        )}
      </Box>

      {uploading && (
        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Uploading…</Typography>
            <Typography variant="caption" color="text.secondary">{progress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4 }} />
        </Box>
      )}

      {fileRejections.length > 0 && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {fileRejections[0].errors[0].message}
        </Typography>
      )}
    </Box>
  )
}
