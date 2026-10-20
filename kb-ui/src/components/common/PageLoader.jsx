import { Box, CircularProgress, Typography } from '@mui/material'

export default function PageLoader({ message = 'Loading...' }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 300, gap: 2,
    }}>
      <CircularProgress size={36} thickness={4} />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  )
}
