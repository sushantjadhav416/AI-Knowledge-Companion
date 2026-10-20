import { useState } from 'react'
import {
  Box, Grid, Typography, TextField, InputAdornment,
  Button, Chip, Stack, Skeleton, Alert, Drawer,
  IconButton, Divider,
} from '@mui/material'
import { Search, CloudUpload, FilterList, Close, Refresh } from '@mui/icons-material'
import TopBar from '../components/layout/TopBar'
import DocumentCard from '../components/document/DocumentCard'
import UploadZone from '../components/document/UploadZone'
import IngestionPoller from '../components/document/IngestionPoller'
import EmptyState from '../components/common/EmptyState'
import { useDocuments } from '../hooks/useDocuments'

const STATUS_FILTERS = ['ALL', 'READY', 'PROCESSING', 'FAILED']

export default function Library() {
  const { data: docs = [], isLoading, isError, refetch } = useDocuments()

  const [searchTerm, setSearchTerm]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('ALL')
  const [uploadDrawer, setUploadDrawer]   = useState(false)
  const [pollingIds, setPollingIds]       = useState([])

  // Docs that are still processing — keep polling
  const processingDocs = docs.filter(d => d.status === 'UPLOADING' || d.status === 'PROCESSING')

  function handleUploadSuccess(doc) {
    setPollingIds(prev => [...new Set([...prev, doc.documentId])])
    setUploadDrawer(false)
  }

  function handleReady(doc) {
    setPollingIds(prev => prev.filter(id => id !== doc.id))
  }

  // Filter
  const filtered = docs.filter(doc => {
    const matchStatus = statusFilter === 'ALL' || doc.status === statusFilter
    const matchSearch = !searchTerm
      || doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      || doc.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchStatus && matchSearch
  })

  // All unique tags for filter chips
  const allTags = [...new Set(docs.flatMap(d => d.tags ?? []))]

  const actions = (
    <Button variant="contained" startIcon={<CloudUpload />}
      onClick={() => setUploadDrawer(true)}>
      Upload Document
    </Button>
  )

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Library"
        subtitle={`${docs.length} document${docs.length !== 1 ? 's' : ''}`}
        actions={actions}
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5 }}>

        {/* Active ingestion pollers (invisible) */}
        {pollingIds.map(id => (
          <IngestionPoller key={id} documentId={id}
            onReady={handleReady} onFailed={handleReady} />
        ))}

        {/* Processing banner for docs already in list */}
        {processingDocs.map(d => (
          <IngestionPoller key={d.id} documentId={d.id}
            onReady={() => refetch()} onFailed={() => refetch()} />
        ))}

        {/* Search + filter bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name or tag…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Status filter chips */}
          <Stack direction="row" spacing={0.75}>
            {STATUS_FILTERS.map(s => (
              <Chip key={s} label={s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                onClick={() => setStatusFilter(s)}
                variant={statusFilter === s ? 'filled' : 'outlined'}
                color={statusFilter === s ? 'primary' : 'default'}
                size="small"
                sx={{ fontWeight: 500, fontSize: '0.72rem' }}
              />
            ))}
          </Stack>

          <IconButton size="small" onClick={() => refetch()} title="Refresh">
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Error state */}
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}
            action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
            Could not load documents. Is the backend running?
          </Alert>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <Grid container spacing={2}>
            {[...Array(6)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon="📚"
            title={searchTerm || statusFilter !== 'ALL' ? 'No results found' : 'No documents yet'}
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Try a different search term or filter.'
                : 'Upload your first PDF, DOCX, TXT, or Markdown file to get started.'
            }
            action={searchTerm || statusFilter !== 'ALL' ? null : () => setUploadDrawer(true)}
            actionLabel="Upload your first document"
          />
        )}

        {/* Document grid */}
        {!isLoading && filtered.length > 0 && (
          <Grid container spacing={2}>
            {filtered.map(doc => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <DocumentCard doc={doc} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Upload drawer */}
      <Drawer anchor="right" open={uploadDrawer} onClose={() => setUploadDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3, borderRadius: '16px 0 0 16px' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Typography variant="h3">Upload Document</Typography>
          <IconButton onClick={() => setUploadDrawer(false)} size="small">
            <Close />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your document will be parsed, chunked, and embedded automatically. You can chat with it once processing is complete.
        </Typography>
        <UploadZone onSuccess={handleUploadSuccess} />
      </Drawer>
    </Box>
  )
}
