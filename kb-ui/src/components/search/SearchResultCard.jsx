import { useState } from 'react'
import {
  Box, Typography, Chip, Paper, LinearProgress,
  Collapse, IconButton, Tooltip,
} from '@mui/material'
import { ExpandMore, ExpandLess, OpenInNew, Article } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export default function SearchResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const navigate = useNavigate()

  const scorePct    = Math.round(result.score * 100)
  const scoreColor  = scorePct >= 85 ? '#0A6E52' : scorePct >= 70 ? '#A05E00' : '#5E5C72'
  const scoreBg     = scorePct >= 85 ? '#E5F7F1' : scorePct >= 70 ? '#FFF4E0' : '#F5F4FC'

  return (
    <Paper sx={{
      borderRadius: 2.5, overflow: 'hidden',
      border: '0.5px solid', borderColor: 'divider',
      boxShadow: '0 1px 3px rgba(20,18,60,0.06)',
      transition: 'box-shadow .2s',
      '&:hover': { boxShadow: '0 4px 12px rgba(20,18,60,0.10)' },
    }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.5, display: 'flex',
        alignItems: 'center', gap: 1.5,
        bgcolor: '#FAFAFE', borderBottom: expanded ? '0.5px solid' : 'none',
        borderColor: 'divider',
      }}>
        <Article sx={{ fontSize: 18, color: 'primary.light', flexShrink: 0 }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {result.documentName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Page {result.pageNumber} · Chunk #{result.chunkIndex}
          </Typography>
        </Box>

        {/* Score badge */}
        <Chip
          label={`${scorePct}% match`}
          size="small"
          sx={{
            bgcolor: scoreBg, color: scoreColor,
            fontWeight: 600, fontSize: '0.68rem', flexShrink: 0,
          }}
        />

        {/* Actions */}
        <Tooltip title="Open document">
          <IconButton size="small"
            onClick={() => navigate(`/documents/${result.documentId}`)}
            sx={{ color: 'text.disabled', flexShrink: 0 }}>
            <OpenInNew sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <IconButton size="small" onClick={() => setExpanded(e => !e)}
          sx={{ color: 'text.disabled', flexShrink: 0 }}>
          {expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>

      {/* Score bar */}
      <LinearProgress
        variant="determinate"
        value={scorePct}
        sx={{
          height: 2, bgcolor: '#F0EEFF',
          '& .MuiLinearProgress-bar': {
            bgcolor: scorePct >= 85 ? 'success.main' : scorePct >= 70 ? 'warning.main' : 'text.disabled',
          },
        }}
      />

      {/* Chunk text */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="body2" sx={{
            lineHeight: 1.8, color: 'text.primary',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result.chunkText}
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  )
}
