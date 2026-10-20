import { useState, useRef } from 'react'
import { Box, TextField, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { Send, Stop } from '@mui/icons-material'

export default function ChatInput({ onSend, onStop, isStreaming, disabled }) {
  const [value, setValue] = useState('')
  const textRef = useRef(null)

  function handleSend() {
    const q = value.trim()
    if (!q || isStreaming) return
    setValue('')
    onSend(q)
    // Refocus after send
    setTimeout(() => textRef.current?.focus(), 50)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Box sx={{
      px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider',
      bgcolor: 'background.paper', display: 'flex', gap: 1.5, alignItems: 'flex-end',
    }}>
      <TextField
        inputRef={textRef}
        fullWidth multiline maxRows={6}
        placeholder="Ask anything about your documents… (Enter to send, Shift+Enter for newline)"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            fontSize: '0.9rem',
            bgcolor: '#FAFAFE',
          },
        }}
      />

      {isStreaming ? (
        <Tooltip title="Stop generating">
          <IconButton onClick={onStop}
            sx={{ bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' }, flexShrink: 0 }}>
            <Stop />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Send (Enter)">
          <span>
            <IconButton onClick={handleSend}
              disabled={!value.trim() || disabled}
              sx={{
                bgcolor: 'primary.main', color: '#fff', flexShrink: 0,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: '#E4E2F0', color: '#A8A6BE' },
              }}>
              <Send sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  )
}
