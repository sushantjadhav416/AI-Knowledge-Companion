import { useState } from 'react'
import {
  Box, Typography, FormControl, InputLabel, Select,
  MenuItem, Paper, Alert, Button, Stack, Chip,
} from '@mui/material'
import { Style, LibraryBooks } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import FlashCardDeck from '../components/intelligence/FlashCardDeck'
import EmptyState from '../components/common/EmptyState'
import { useDocuments } from '../hooks/useDocuments'

export default function Flashcards() {
  const navigate = useNavigate()
  const { data: documents = [], isLoading } = useDocuments()
  const [selectedDocId, setSelectedDocId] = useState('')

  const readyDocs = documents.filter(d => d.status === 'READY')
  const selectedDoc = readyDocs.find(d => d.id === selectedDocId)

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Flashcards"
        subtitle="Study your documents with AI-generated flip cards"
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 3, maxWidth: 760, mx: 'auto', width: '100%' }}>

        {/* No documents at all */}
        {!isLoading && readyDocs.length === 0 && (
          <EmptyState
            icon="🃏"
            title="No documents ready"
            description="Upload and process a document first, then come back to generate flashcards."
            action={() => navigate('/')}
            actionLabel="Go to Library"
          />
        )}

        {/* Document picker */}
        {readyDocs.length > 0 && (
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Select a document</Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Choose document to study</InputLabel>
              <Select
                value={selectedDocId}
                onChange={e => setSelectedDocId(e.target.value)}
                label="Choose document to study"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value=""><em>Select a document…</em></MenuItem>
                {readyDocs.map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Style sx={{ fontSize: 16, color: 'primary.light' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {d.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.chunkCount} chunks
                          {d.tags?.length > 0 && ` · ${d.tags.slice(0, 3).join(', ')}`}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        )}

        {/* Flashcard deck */}
        {selectedDocId && (
          <FlashCardDeck documentId={selectedDocId} status="READY" />
        )}

        {/* No doc selected placeholder */}
        {readyDocs.length > 0 && !selectedDocId && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Style sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
              Pick a document to study
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Select a document above to view or generate its flashcards.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
