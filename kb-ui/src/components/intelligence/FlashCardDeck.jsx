import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, IconButton, Button, LinearProgress,
  Chip, Stack, Skeleton, Paper, Tooltip,
} from '@mui/material'
import {
  ArrowBack, ArrowForward, AutoAwesome,
  Shuffle, RestartAlt,
} from '@mui/icons-material'
import FlashCard from './FlashCard'
import { useFlashcards, useGenerateFlashcards } from '../../hooks/useIntelligence'

const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']

export default function FlashCardDeck({ documentId, status }) {
  const { data: allCards = [], isLoading } = useFlashcards(documentId)
  const { mutate: generate, isPending: isGenerating } = useGenerateFlashcards()

  const [diffFilter, setDiffFilter] = useState('ALL')
  const [cards, setCards]           = useState([])
  const [index, setIndex]           = useState(0)

  // Filter + shuffle
  useEffect(() => {
    const filtered = diffFilter === 'ALL'
      ? allCards
      : allCards.filter(c => c.difficulty === diffFilter)
    setCards(filtered)
    setIndex(0)
  }, [allCards, diffFilter])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cards.length])

  const next = useCallback(() => setIndex(i => Math.min(i + 1, cards.length - 1)), [cards.length])
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), [])

  function shuffle() {
    setCards(c => [...c].sort(() => Math.random() - 0.5))
    setIndex(0)
  }

  // Loading
  if (isLoading || isGenerating) {
    return (
      <Box>
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2 }} />
        <Skeleton width={200} height={20} sx={{ mx: 'auto' }} />
      </Box>
    )
  }

  // Empty — no flashcards yet
  if (allCards.length === 0) {
    return (
      <Paper sx={{
        p: 4, textAlign: 'center', bgcolor: '#FAFAFE',
        borderRadius: 3, border: '1px dashed', borderColor: 'divider',
      }}>
        <AutoAwesome sx={{ fontSize: 32, color: 'primary.light', mb: 1.5 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>No flashcards yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Generate study flashcards from this document using GPT-4o.
        </Typography>
        <Button
          variant="contained" startIcon={<AutoAwesome />}
          onClick={() => generate(documentId)}
          disabled={status !== 'READY'}
        >
          Generate Flashcards
        </Button>
      </Paper>
    )
  }

  const current = cards[index]
  const progress = cards.length > 1 ? ((index + 1) / cards.length) * 100 : 100

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">
          Flashcards
          <Chip label={allCards.length} size="small" sx={{ ml: 1, bgcolor: '#EEF0FF', color: '#3D32B8', fontWeight: 600 }} />
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Regenerate"><span>
            <IconButton size="small" onClick={() => generate(documentId)} disabled={status !== 'READY'}>
              <AutoAwesome sx={{ fontSize: 16 }} />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Shuffle">
            <IconButton size="small" onClick={shuffle}><Shuffle sx={{ fontSize: 16 }} /></IconButton>
          </Tooltip>
          <Tooltip title="Restart">
            <IconButton size="small" onClick={() => setIndex(0)}><RestartAlt sx={{ fontSize: 16 }} /></IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Difficulty filter */}
      <Stack direction="row" spacing={0.75} sx={{ mb: 2.5 }}>
        {DIFFICULTIES.map(d => (
          <Chip key={d}
            label={d === 'ALL' ? `All (${allCards.length})` : `${d} (${allCards.filter(c => c.difficulty === d).length})`}
            size="small"
            onClick={() => setDiffFilter(d)}
            variant={diffFilter === d ? 'filled' : 'outlined'}
            color={diffFilter === d ? 'primary' : 'default'}
            sx={{ fontWeight: 500, fontSize: '0.72rem' }}
          />
        ))}
      </Stack>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate" value={progress}
        sx={{ mb: 3, borderRadius: 4, height: 3 }}
      />

      {/* Card */}
      {current ? (
        <FlashCard card={current} index={index} total={cards.length} />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No cards match this filter.</Typography>
        </Paper>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 3 }}>
        <IconButton onClick={prev} disabled={index === 0}
          sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: '#EEF0FF' } }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {index + 1} / {cards.length}
        </Typography>
        <IconButton onClick={next} disabled={index === cards.length - 1}
          sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: '#EEF0FF' } }}>
          <ArrowForward />
        </IconButton>
      </Box>

      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
        Use ← → arrow keys to navigate · Click card to flip
      </Typography>
    </Box>
  )
}
