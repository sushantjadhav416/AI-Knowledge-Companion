import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#5C4FE0', light: '#8578E8', dark: '#3D32B8', contrastText: '#fff' },
    secondary:  { main: '#0F9B74', contrastText: '#fff' },
    error:      { main: '#D84040' },
    warning:    { main: '#C97B1A' },
    success:    { main: '#0F9B74' },
    background: { default: '#F5F4FC', paper: '#FFFFFF' },
    text:       { primary: '#1A1830', secondary: '#5E5C72', disabled: '#A8A6BE' },
    divider:    '#E4E2F0',
  },
  typography: {
    fontFamily: '"Inter","Segoe UI",system-ui,-apple-system,sans-serif',
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1rem',   fontWeight: 600 },
    h5: { fontSize: '0.875rem',fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button:  { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '7px 16px' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(92,79,224,.25)' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(20,18,60,.08),0 0 0 1px rgba(20,18,60,.05)',
          transition: 'box-shadow .2s',
          '&:hover': { boxShadow: '0 4px 16px rgba(20,18,60,.12),0 0 0 1px rgba(92,79,224,.15)' },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: '#FFFFFF', borderRight: '1px solid #E4E2F0' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, margin: '1px 0',
          '&.Mui-selected': { backgroundColor: '#EEF0FF', color: '#3D32B8',
            '&:hover': { backgroundColor: '#E6E8FF' } },
        },
      },
    },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F4FC', scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { background: '#C8C6DC', borderRadius: 3 },
        },
      },
    },
  },
})

export default theme
