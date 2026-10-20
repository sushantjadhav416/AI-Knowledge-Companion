import { useState, useRef } from 'react'
import {
  Box, Typography, TextField, InputAdornment, IconButton,
  Slider, FormControl, InputLabel, Select, MenuItem,
  Stack, Chip, Alert, Skeleton, Divider, Paper, Button,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon, Close, TuneOutlined,
} from '@mui/icons-material'
import TopBar from '../components/layout/TopBar'
import SearchResultCard from '../components/search/SearchResultCard'
import EmptyState from '../components/common/EmptyState'
import { useSemanticSearch } from '../hooks/useSearch'
import { useDocuments } from '../hooks/useDocuments'

export default function Search() {
  const { results, isLoading, error, query: lastQuery, search, clear } = useSemanticSearch()
  const { data: documents = [] } = useDocuments()

  const [queryText, setQueryText]   = useState('')
  const [topK, setTopK]             = useState(5)
  const [minScore, setMinScore]     = useState(0.70)
  const [docFilter, setDocFilter]   = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const inputRef = useRef(null)

  const readyDocs = documents.filter(d => d.status === 'READY')

  function handleSearch() {
    if (!queryText.trim()) return
    search({ query: queryText.trim(), topK, minScore, documentId: docFilter || undefined })
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSearch()
  }

  function handleClear() {
    setQueryText('')
    clear()
    inputRef.current?.focus()
  }

  // Group results by document
  const grouped = results.reduce((acc, r) => {
    const key = r.documentId
    if (!acc[key]) acc[key] = { name: r.documentName, results: [] }
    acc[key].results.push(r)
    return acc
  }, {})

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Semantic Search" subtitle="Search across all your documents using AI" />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 3, maxWidth: 860 }}>

        {/* Search bar */}
        <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(20,18,60,0.08)' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              placeholder="Ask a question or search by concept…"
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              onKeyDown={handleKey}
              size="small"
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontSize: '0.9375rem' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: queryText && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClear}>
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!queryText.trim() || isLoading}
              sx={{ px: 3, borderRadius: 2.5, flexShrink: 0 }}
            >
              {isLoading ? 'Searching…' : 'Search'}
            </Button>
            <Tooltip title="Search filters">
              <IconButton
                onClick={() => setShowFilters(s => !s)}
                sx={{
                  flexShrink: 0,
                  color: showFilters ? 'primary.main' : 'text.secondary',
                  bgcolor: showFilters ? '#EEF0FF' : 'transparent',
                }}
              >
                <TuneOutlined />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Filters panel */}
          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '0.5px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
                {/* Top K slider */}
                <Box sx={{ flex: 1, minWidth: 160 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Results to return: <strong>{topK}</strong>
                  </Typography>
                  <Slider
                    value={topK} min={1} max={20} step={1}
                    onChange={(_, v) => setTopK(v)}
                    size="small" color="primary"
                    marks={[{ value: 1, label: '1' }, { value: 10, label: '10' }, { value: 20, label: '20' }]}
                    sx={{ mt: 1 }}
                  />
                </Box>

                {/* Min score slider */}
                <Box sx={{ flex: 1, minWidth: 160 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Min similarity: <strong>{Math.round(minScore * 100)}%</strong>
                  </Typography>
                  <Slider
                    value={minScore} min={0.40} max={0.99} step={0.01}
                    onChange={(_, v) => setMinScore(v)}
                    size="small" color="secondary"
                    marks={[
                      { value: 0.40, label: '40%' },
                      { value: 0.70, label: '70%' },
                      { value: 0.99, label: '99%' },
                    ]}
                    sx={{ mt: 1 }}
                  />
                </Box>

                {/* Document scope */}
                <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
                  <InputLabel>Scope to document</InputLabel>
                  <Select
                    value={docFilter}
                    onChange={e => setDocFilter(e.target.value)}
                    label="Scope to document"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value=""><em>All documents</em></MenuItem>
                    {readyDocs.map(d => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.originalName.length > 32
                          ? d.originalName.slice(0, 32) + '…'
                          : d.originalName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <Stack spacing={1.5}>
            {[...Array(topK > 3 ? 3 : topK)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2.5 }} />
            ))}
          </Stack>
        )}

        {/* No results yet */}
        {!isLoading && !lastQuery && results.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Search your knowledge base"
            description="Type a question or concept above. KnowBuddy uses vector similarity to find the most relevant passages from your documents."
          />
        )}

        {/* No results for query */}
        {!isLoading && lastQuery && results.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
              No results for "{lastQuery}"
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Try lowering the minimum similarity threshold or broadening your query.
            </Typography>
          </Box>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <Box>
            {/* Result summary */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for
              </Typography>
              <Chip
                label={`"${lastQuery}"`}
                size="small"
                onDelete={handleClear}
                sx={{ fontStyle: 'italic', fontSize: '0.75rem', maxWidth: 300 }}
              />
            </Box>

            {/* Grouped by document */}
            {Object.entries(grouped).map(([docId, group]) => (
              <Box key={docId} sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.disabled"
                  sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  {group.name} — {group.results.length} match{group.results.length !== 1 ? 'es' : ''}
                </Typography>
                <Stack spacing={1.5}>
                  {group.results.map((result, i) => (
                    <SearchResultCard key={i} result={result} index={i} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
