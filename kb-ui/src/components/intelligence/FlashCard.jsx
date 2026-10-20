import { useState } from 'react'
import { Box, Typography, Chip } from '@mui/material'

const DIFF_COLOR = { EASY: '#0A6E52', MEDIUM: '#A05E00', HARD: '#B52929' }
const DIFF_BG    = { EASY: '#E5F7F1', MEDIUM: '#FFF4E0', HARD: '#FDEAEA' }

export default function FlashCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <Box
      onClick={() => setFlipped(f => !f)}
      sx={{
        perspective: '1200px', cursor: 'pointer',
        width: '100%', maxWidth: 560, mx: 'auto',
        height: 280, userSelect: 'none',
      }}
    >
      <Box sx={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Front — Question */}
        <Box sx={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          bgcolor: '#FFFFFF', borderRadius: 3,
          border: '0.5px solid', borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(20,18,60,0.10)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          p: 4, textAlign: 'center',
        }}>
          <Typography variant="caption" color="text.disabled" sx={{ mb: 2, letterSpacing: '0.08em' }}>
            {index + 1} / {total} · QUESTION
          </Typography>
          <Typography variant="h4" sx={{ lineHeight: 1.5, color: 'text.primary' }}>
            {card.question}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 3 }}>
            Click to reveal answer
          </Typography>
        </Box>

        {/* Back — Answer */}
        <Box sx={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          bgcolor: '#5C4FE0', borderRadius: 3,
          boxShadow: '0 4px 20px rgba(92,79,224,0.25)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          p: 4, textAlign: 'center',
        }}>
          <Typography variant="caption" sx={{ mb: 2, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
            ANSWER
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#FFFFFF', fontWeight: 500 }}>
            {card.answer}
          </Typography>
          <Chip
            label={card.difficulty}
            size="small"
            sx={{
              mt: 3, bgcolor: DIFF_BG[card.difficulty],
              color: DIFF_COLOR[card.difficulty], fontWeight: 600, fontSize: '0.7rem',
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
