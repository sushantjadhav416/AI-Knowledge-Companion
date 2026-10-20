import { Box, Typography, Button } from '@mui/material'

export default function EmptyState({ icon, title, description, action, actionLabel }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', py: 10, px: 4, textAlign: 'center',
    }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: '50%', bgcolor: '#EEF0FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
      }}>
        <Box sx={{ fontSize: 36, lineHeight: 1 }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ mb: 1 }}>{title}</Typography>
      <Typography variant="body2" sx={{ mb: 3, maxWidth: 360, color: 'text.secondary' }}>
        {description}
      </Typography>
      {action && <Button variant="contained" onClick={action}>{actionLabel}</Button>}
    </Box>
  )
}
