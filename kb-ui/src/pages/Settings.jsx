import { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, TextField, Button,
  Divider, Stack, Slider, Alert, Chip,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Switch, InputAdornment, Snackbar,
} from '@mui/material'
import {
  SaveOutlined, RestoreOutlined, CheckCircleOutline,
  ApiOutlined, TuneOutlined, StorageOutlined,
} from '@mui/icons-material'
import TopBar from '../components/layout/TopBar'

const DEFAULTS = {
  apiBaseUrl:  '/api',
  chunkSize:   400,
  chunkOverlap: 80,
  maxResults:  5,
  minScore:    0.70,
  flashcardCount: 10,
  maxTags:     8,
  streamingEnabled: true,
}

export default function Settings() {
  const [values, setValues]   = useState(() => {
    try {
      const saved = localStorage.getItem('kb_settings')
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS
    } catch { return DEFAULTS }
  })
  const [saved, setSaved]     = useState(false)
  const [testStatus, setTestStatus] = useState(null) // null | 'ok' | 'fail'
  const [testing, setTesting] = useState(false)

  function set(key, value) {
    setValues(v => ({ ...v, [key]: value }))
  }

  function handleSave() {
    localStorage.setItem('kb_settings', JSON.stringify(values))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleReset() {
    setValues(DEFAULTS)
    localStorage.removeItem('kb_settings')
  }

  async function testConnection() {
    setTesting(true)
    setTestStatus(null)
    try {
      const base = values.apiBaseUrl.replace(/\/$/, '')
      const res = await fetch(`${base}/actuator/health`)
      setTestStatus(res.ok ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Settings"
        subtitle="Configure your KnowBuddy instance"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" startIcon={<RestoreOutlined />}
              onClick={handleReset}>
              Reset defaults
            </Button>
            <Button variant="contained" size="small" startIcon={<SaveOutlined />}
              onClick={handleSave}>
              Save settings
            </Button>
          </Stack>
        }
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 3, maxWidth: 700 }}>

        {/* API Configuration */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <ApiOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h4">API Configuration</Typography>
          </Box>

          <Stack spacing={2.5}>
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                Backend Base URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth size="small"
                  value={values.apiBaseUrl}
                  onChange={e => set('apiBaseUrl', e.target.value)}
                  placeholder="http://localhost:8085/api"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: 'monospace', fontSize: '0.875rem' } }}
                />
                <Button
                  variant="outlined" size="small"
                  onClick={testConnection} disabled={testing}
                  sx={{ flexShrink: 0, borderRadius: 2 }}
                >
                  {testing ? 'Testing…' : 'Test'}
                </Button>
              </Box>
              {testStatus === 'ok' && (
                <Alert severity="success" sx={{ mt: 1, py: 0.5, borderRadius: 2 }}>
                  Connected — backend is healthy
                </Alert>
              )}
              {testStatus === 'fail' && (
                <Alert severity="error" sx={{ mt: 1, py: 0.5, borderRadius: 2 }}>
                  Could not reach backend. Is Spring Boot running?
                </Alert>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                Vite proxy: requests to <code>/api</code> are forwarded to <code>localhost:8085</code> during development.
                Only change this for production deployments.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* RAG Pipeline */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <TuneOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h4">RAG Pipeline</Typography>
          </Box>

          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Max search results: <Chip label={values.maxResults} size="small" color="primary" sx={{ ml: 0.5 }} />
              </Typography>
              <Slider value={values.maxResults} min={1} max={20} step={1}
                onChange={(_, v) => set('maxResults', v)}
                marks={[{ value: 1, label: '1' }, { value: 10, label: '10' }, { value: 20, label: '20' }]}
                size="small" sx={{ mt: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Number of chunks retrieved from AstraDB per query.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Minimum similarity score: <Chip label={`${Math.round(values.minScore * 100)}%`} size="small" color="secondary" sx={{ ml: 0.5 }} />
              </Typography>
              <Slider value={values.minScore} min={0.40} max={0.99} step={0.01}
                onChange={(_, v) => set('minScore', v)}
                marks={[{ value: 0.40, label: '40%' }, { value: 0.70, label: '70%' }, { value: 0.99, label: '99%' }]}
                size="small" sx={{ mt: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Chunks below this cosine similarity score are filtered out.
                Lower = more results but less relevant.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Intelligence */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <StorageOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h4">Intelligence (GPT-4o)</Typography>
          </Box>

          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Flashcards to generate: <Chip label={values.flashcardCount} size="small" color="primary" sx={{ ml: 0.5 }} />
              </Typography>
              <Slider value={values.flashcardCount} min={5} max={30} step={1}
                onChange={(_, v) => set('flashcardCount', v)}
                marks={[{ value: 5, label: '5' }, { value: 15, label: '15' }, { value: 30, label: '30' }]}
                size="small" sx={{ mt: 1 }} />
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Max auto-tags: <Chip label={values.maxTags} size="small" color="primary" sx={{ ml: 0.5 }} />
              </Typography>
              <Slider value={values.maxTags} min={3} max={15} step={1}
                onChange={(_, v) => set('maxTags', v)}
                marks={[{ value: 3, label: '3' }, { value: 8, label: '8' }, { value: 15, label: '15' }]}
                size="small" sx={{ mt: 1 }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight={500}>Streaming chat (SSE)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Show tokens as they arrive. Disable to use blocking mode.
                </Typography>
              </Box>
              <Switch
                checked={values.streamingEnabled}
                onChange={e => set('streamingEnabled', e.target.checked)}
                color="primary"
              />
            </Box>
          </Stack>
        </Paper>

        {/* App info */}
        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FAFAFE' }}>
          <Typography variant="h5" sx={{ mb: 1.5 }}>About KnowBuddy</Typography>
          <List dense disablePadding>
            {[
              ['Version',          '1.0.0'],
              ['Backend',          'Spring Boot 3.2.5 + LangChain4j 0.31.0'],
              ['LLM',              'OpenAI GPT-4o'],
              ['Embeddings',       'text-embedding-3-small (1536 dims)'],
              ['Vector store',     'DataStax AstraDB'],
              ['Metadata store',   'PostgreSQL 16'],
              ['File storage',     'Local disk (./uploads)'],
            ].map(([label, value]) => (
              <ListItem key={label} disableGutters sx={{ py: 0.4 }}>
                <ListItemText
                  primary={label}
                  secondary={value}
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Settings saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  )
}
