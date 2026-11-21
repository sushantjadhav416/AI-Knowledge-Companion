import { Box, Typography, Avatar, Chip, Collapse, IconButton } from '@mui/material'
import { ExpandMore, ExpandLess, AutoAwesome, Person } from '@mui/icons-material'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { formatSourceLabel } from '../../utils'

export default function MessageBubble({ message, sources = [] }) {
  const isUser = message.role === 'USER'
  const [showSources, setShowSources] = useState(false)

  return (
    <Box sx={{
      display: 'flex', gap: 1.5, mb: 2.5,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <Avatar sx={{
        width: 32, height: 32, flexShrink: 0, mt: 0.25,
        bgcolor: isUser ? '#EEF0FF' : 'primary.main',
        color: isUser ? 'primary.main' : '#fff',
      }}>
        {isUser ? <Person sx={{ fontSize: 16 }} /> : <AutoAwesome sx={{ fontSize: 16 }} />}
      </Avatar>

      <Box sx={{ maxWidth: '78%', minWidth: 0 }}>
        {/* Bubble */}
        <Box sx={{
          px: 2.5, py: 1.75,
          bgcolor: isUser ? '#EEF0FF' : 'background.paper',
          border: '0.5px solid',
          borderColor: isUser ? '#C8C2F8' : 'divider',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          boxShadow: isUser ? 'none' : '0 1px 3px rgba(20,18,60,0.06)',
        }}>
          <Box sx={{
            fontSize: '0.9rem', lineHeight: 1.7,
            color: isUser ? '#3D32B8' : 'text.primary',
            '& p': { m: 0, mb: 0.75 }, '& p:last-child': { mb: 0 },
            '& code': { bgcolor: '#F0EEFF', px: 0.6, py: 0.2, borderRadius: 1, fontSize: '0.82em', fontFamily: 'monospace' },
            '& pre': { bgcolor: '#1A1830', color: '#E8E6FF', p: 1.5, borderRadius: 2, overflowX: 'auto', fontSize: '0.82em' },
            '& ul, & ol': { pl: 2.5, mb: 0 }, '& li': { mb: 0.25 },
            '& strong': { fontWeight: 600 },
          }}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        </Box>

        {/* Sources (assistant only) */}
        {!isUser && sources.length > 0 && (
          <Box sx={{ mt: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.disabled">
                {sources.length} source{sources.length > 1 ? 's' : ''}
              </Typography>
              <IconButton size="small" onClick={() => setShowSources(s => !s)}
                sx={{ p: 0.25, color: 'text.disabled' }}>
                {showSources ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
              </IconButton>
            </Box>
            <Collapse in={showSources}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {sources.map((src, i) => (
                  <Chip key={i} size="small"
                    label={formatSourceLabel(src)}
                    sx={{
                      fontSize: '0.68rem', height: 20,
                      bgcolor: '#F5F4FC', color: 'text.secondary',
                    }}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        <Typography variant="caption" color="text.disabled" sx={{
          display: 'block', mt: 0.5, textAlign: isUser ? 'right' : 'left',
        }}>
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit',
          }) : ''}
        </Typography>
      </Box>
    </Box>
  )
}
