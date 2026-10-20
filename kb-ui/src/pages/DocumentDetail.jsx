import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Stack, Alert,
  Divider, Paper, Chip, Tabs, Tab,
} from '@mui/material'
import {
  ArrowBack, DownloadOutlined, ChatOutlined,
  AutoAwesome, LayersOutlined,
} from '@mui/icons-material'
import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import StatusBadge from '../components/common/StatusBadge'
import PageLoader from '../components/common/PageLoader'
import SummaryPanel from '../components/intelligence/SummaryPanel'
import TagEditor from '../components/intelligence/TagEditor'
import FlashCardDeck from '../components/intelligence/FlashCardDeck'
import { useDocument } from '../hooks/useDocuments'
import { useEnrich } from '../hooks/useIntelligence'
import { formatFileSize, formatDateTime, getFileTypeIcon } from '../utils'
import documentService from '../api/documentService'

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null
}

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: doc, isLoading, isError } = useDocument(id)
  const { mutate: enrich, isPending: isEnriching } = useEnrich()
  const [tab, setTab] = useState(0)

  const actions = doc?.status === 'READY' ? (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined" size="small" startIcon={<AutoAwesome />}
        onClick={() => enrich(id)} disabled={isEnriching}>
        {isEnriching ? 'Enriching…' : 'Enrich'}
      </Button>
      <Button variant="outlined" size="small" startIcon={<DownloadOutlined />}
        onClick={() => window.open(documentService.getDownloadUrl(id), '_blank')}>
        Download
      </Button>
      <Button variant="contained" size="small" startIcon={<ChatOutlined />}
        onClick={() => navigate('/chat?documentId=' + id)}>
        Chat with this
      </Button>
    </Stack>
  ) : null

  if (isLoading) return <PageLoader message="Loading document…" />
  if (isError)   return <Alert severity="error" sx={{ m: 3 }}>Could not load document.</Alert>

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={doc?.originalName ?? 'Document'}
        subtitle={doc ? `${formatFileSize(doc.fileSizeBytes)} · ${formatDateTime(doc.createdAt)}` : ''}
        actions={actions}
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 3, maxWidth: 920 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}
          sx={{ mb: 2.5, color: 'text.secondary' }}>
          Back to Library
        </Button>

        {/* Meta card */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap alignItems="center">
            <Box sx={{
              width: 52, height: 52, borderRadius: 2,
              bgcolor: '#F5F4FC', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
            }}>
              {getFileTypeIcon(doc.fileType)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h4" sx={{ mb: 0.5 }}>{doc.originalName}</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <StatusBadge status={doc.status} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LayersOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {doc.chunkCount ?? 0} chunks
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(doc.fileSizeBytes)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(doc.createdAt)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Status warning */}
        {doc.status !== 'READY' && (
          <Alert severity={doc.status === 'FAILED' ? 'error' : 'info'} sx={{ mb: 3, borderRadius: 2 }}>
            {doc.status === 'FAILED'
              ? 'Processing failed. Please delete and re-upload this document.'
              : 'Document is still being processed. Intelligence features will be available once ready.'}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ mb: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Overview" sx={{ fontWeight: 500, fontSize: '0.875rem' }} />
          <Tab label="Flashcards" sx={{ fontWeight: 500, fontSize: '0.875rem' }} />
        </Tabs>

        {/* Overview tab */}
        <TabPanel value={tab} index={0}>
          <Stack spacing={3}>
            <SummaryPanel documentId={id} summary={doc.summary} status={doc.status} />
            <Divider />
            <TagEditor documentId={id} tags={doc.tags ?? []} status={doc.status} />
          </Stack>
        </TabPanel>

        {/* Flashcards tab */}
        <TabPanel value={tab} index={1}>
          <FlashCardDeck documentId={id} status={doc.status} />
        </TabPanel>
      </Box>
    </Box>
  )
}
