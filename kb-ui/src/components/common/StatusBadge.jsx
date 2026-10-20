import { Chip, Box } from '@mui/material'

const CONFIG = {
  UPLOADING:  { label: 'Uploading',  color: '#3D32B8', bg: '#EEF0FA', dot: '#5C4FE0', pulse: true  },
  PROCESSING: { label: 'Processing', color: '#A05E00', bg: '#FFF4E0', dot: '#C97B1A', pulse: true  },
  READY:      { label: 'Ready',      color: '#0A6E52', bg: '#E5F7F1', dot: '#0F9B74', pulse: false },
  FAILED:     { label: 'Failed',     color: '#B52929', bg: '#FDEAEA', dot: '#D84040', pulse: false },
}

export default function StatusBadge({ status }) {
  if (!status) return null
  const c = CONFIG[status] ?? { label: status, color: '#444', bg: '#eee', dot: '#aaa', pulse: false }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
      <Box sx={{
        width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot, flexShrink: 0,
        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        animation: c.pulse ? 'pulse 1.4s ease-in-out infinite' : 'none',
      }} />
      <Chip label={c.label} size="small" sx={{
        height: 20, fontSize: '0.68rem', fontWeight: 600,
        color: c.color, bgcolor: c.bg, letterSpacing: '0.02em',
      }} />
    </Box>
  )
}
