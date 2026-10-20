import { AppBar, Toolbar, Typography, Box, Chip } from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'

export default function TopBar({ title, subtitle, actions }) {
  return (
    <AppBar position="static" elevation={0} sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      color: 'text.primary',
    }}>
      <Toolbar sx={{ gap: 2, minHeight: '56px !important', px: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Toolbar>
    </AppBar>
  )
}
