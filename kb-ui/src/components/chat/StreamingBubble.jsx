import { Box, Avatar } from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'

export default function StreamingBubble({ text }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', flexShrink: 0, mt: 0.25 }}>
        <AutoAwesome sx={{ fontSize: 16, color: '#fff' }} />
      </Avatar>

      <Box sx={{
        px: 2.5, py: 1.75, maxWidth: '78%',
        bgcolor: 'background.paper',
        border: '0.5px solid', borderColor: 'divider',
        borderRadius: '4px 16px 16px 16px',
        boxShadow: '0 1px 3px rgba(20,18,60,0.06)',
      }}>
        <Box sx={{
          fontSize: '0.9rem', lineHeight: 1.7, color: 'text.primary',
          '& p': { m: 0, mb: 0.75 }, '& p:last-child': { mb: 0 },
          '& code': { bgcolor: '#F0EEFF', px: 0.6, py: 0.2, borderRadius: 1, fontSize: '0.82em' },
        }}>
          <ReactMarkdown>{text || ' '}</ReactMarkdown>
          {/* Blinking cursor */}
          <Box component="span" sx={{
            display: 'inline-block', width: 2, height: '1em',
            bgcolor: 'primary.main', ml: 0.25, verticalAlign: 'text-bottom',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
            animation: 'blink 1s step-end infinite',
          }} />
        </Box>
      </Box>
    </Box>
  )
}
