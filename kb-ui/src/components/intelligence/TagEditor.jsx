import { Box, Typography, Chip, Button, Skeleton, Paper } from '@mui/material'
import { LocalOffer, AutoAwesome } from '@mui/icons-material'
import { useGenerateTags } from '../../hooks/useIntelligence'

export default function TagEditor({ documentId, tags = [], status }) {
  const { mutate: generateTags, isPending } = useGenerateTags()
  const canGenerate = status === 'READY'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="h5">Tags</Typography>
        <Button
          size="small" variant="outlined"
          startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
          onClick={() => generateTags(documentId)}
          disabled={!canGenerate || isPending}
          sx={{ fontSize: '0.75rem', py: 0.4 }}
        >
          {isPending ? 'Generating…' : tags.length > 0 ? 'Regenerate' : 'Generate Tags'}
        </Button>
      </Box>

      {isPending && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[60, 80, 50, 90, 70].map((w, i) => (
            <Skeleton key={i} width={w} height={24} variant="rounded" sx={{ borderRadius: 4 }} />
          ))}
        </Box>
      )}

      {!isPending && tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {tags.map(tag => (
            <Chip
              key={tag} label={tag} size="small"
              icon={<LocalOffer sx={{ fontSize: '12px !important' }} />}
              sx={{
                bgcolor: '#EEF0FF', color: '#3D32B8',
                fontWeight: 500, fontSize: '0.75rem',
                '& .MuiChip-icon': { color: '#5C4FE0' },
              }}
            />
          ))}
        </Box>
      )}

      {!isPending && tags.length === 0 && (
        <Paper sx={{
          p: 2.5, textAlign: 'center', bgcolor: '#FAFAFE',
          borderRadius: 2, border: '1px dashed', borderColor: 'divider',
        }}>
          <Typography variant="body2" color="text.secondary">
            No tags yet. Auto-generate topic tags using GPT-4o.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
