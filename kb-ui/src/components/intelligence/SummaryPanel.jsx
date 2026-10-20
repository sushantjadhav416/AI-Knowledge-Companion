import { useState } from 'react'
import {
  Box, Typography, Button, Paper, Skeleton,
  Collapse, IconButton, Tooltip,
} from '@mui/material'
import {
  AutoAwesome, ExpandMore, ExpandLess, Refresh,
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { useSummarize } from '../../hooks/useIntelligence'

export default function SummaryPanel({ documentId, summary, status }) {
  const [expanded, setExpanded] = useState(true)
  const { mutate: summarize, isPending } = useSummarize()

  const canGenerate = status === 'READY'

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="h5">Summary</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {summary && (
            <>
              <Tooltip title="Regenerate">
                <span>
                  <IconButton size="small" onClick={() => summarize(documentId)} disabled={isPending}>
                    <Refresh sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton size="small" onClick={() => setExpanded(e => !e)}>
                {expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* Loading skeleton */}
      {isPending && (
        <Box>
          {[80, 95, 70, 60].map((w, i) => (
            <Skeleton key={i} width={`${w}%`} height={16} sx={{ mb: 0.75 }} />
          ))}
        </Box>
      )}

      {/* Summary content */}
      {!isPending && summary && (
        <Collapse in={expanded}>
          <Paper sx={{ p: 2.5, bgcolor: '#FAFAFE', borderRadius: 2, border: '0.5px solid', borderColor: 'divider' }}>
            <Box sx={{
              fontSize: '0.875rem', lineHeight: 1.8, color: 'text.primary',
              '& p': { m: 0, mb: 1 }, '& p:last-child': { mb: 0 },
            }}>
              <ReactMarkdown>{summary}</ReactMarkdown>
            </Box>
          </Paper>
        </Collapse>
      )}

      {/* Empty state */}
      {!isPending && !summary && (
        <Paper sx={{
          p: 3, textAlign: 'center', bgcolor: '#FAFAFE',
          borderRadius: 2, border: '1px dashed', borderColor: 'divider',
        }}>
          <AutoAwesome sx={{ fontSize: 28, color: 'primary.light', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No summary yet. Generate one using GPT-4o.
          </Typography>
          <Button
            variant="contained" size="small"
            startIcon={<AutoAwesome />}
            onClick={() => summarize(documentId)}
            disabled={!canGenerate || isPending}
          >
            {canGenerate ? 'Generate Summary' : 'Processing…'}
          </Button>
        </Paper>
      )}
    </Box>
  )
}
