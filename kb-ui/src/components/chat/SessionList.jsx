import {
  Box, List, ListItem, ListItemButton, ListItemText,
  IconButton, Typography, Tooltip, Divider, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Menu, MenuItem, ListItemIcon,
} from '@mui/material'
import { useState } from 'react'
import {
  Add, DeleteOutline, ChatOutlined, MoreVert, EditOutlined,
  ForumOutlined, AutoAwesome, SchoolOutlined, WorkOutline,
} from '@mui/icons-material'
import { useSessions, useDeleteSession } from '../../hooks/useChat'
import { formatDate, truncate } from '../../utils'
import ConfirmDialog from '../common/ConfirmDialog'

const CHAT_COLORS = [
  { name: 'Violet', value: '#5C4FE0' },
  { name: 'Blue', value: '#1976D2' },
  { name: 'Teal', value: '#0F9B74' },
  { name: 'Rose', value: '#D04F70' },
  { name: 'Amber', value: '#C97B1A' },
  { name: 'Slate', value: '#596579' },
]

const CHAT_ICONS = [
  { name: 'Chat', value: 'chat', Icon: ChatOutlined },
  { name: 'Forum', value: 'forum', Icon: ForumOutlined },
  { name: 'Ideas', value: 'ideas', Icon: AutoAwesome },
  { name: 'Study', value: 'study', Icon: SchoolOutlined },
  { name: 'Work', value: 'work', Icon: WorkOutline },
]

export default function SessionList({
  activeSessionId, onSelect, onNew, preferences, onUpdatePreference, onDeleted,
}) {
  const { data: sessions = [], isLoading } = useSessions()
  const deleteSession = useDeleteSession()
  const [editingSession, setEditingSession] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editColor, setEditColor] = useState(CHAT_COLORS[0].value)
  const [editIcon, setEditIcon] = useState(CHAT_ICONS[0].value)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuSession, setMenuSession] = useState(null)
  const [deletingSession, setDeletingSession] = useState(null)

  function openMenu(event, session) {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setMenuSession(session)
  }

  function openEditor(session) {
    const saved = preferences[session.id] ?? {}
    setEditingSession(session)
    setEditTitle(saved.title ?? session.title ?? '')
    setEditColor(saved.color ?? CHAT_COLORS[0].value)
    setEditIcon(saved.icon ?? CHAT_ICONS[0].value)
    setMenuAnchor(null)
  }

  function savePreferences() {
    if (!editingSession || !editTitle.trim()) return
    onUpdatePreference(editingSession.id, {
      title: editTitle.trim(),
      color: editColor,
      icon: editIcon,
    })
    setEditingSession(null)
  }

  function confirmDelete() {
    if (!deletingSession) return
    deleteSession.mutate(deletingSession.id, {
      onSuccess: () => {
        onDeleted(deletingSession.id)
        setDeletingSession(null)
      },
    })
  }

  return (
    <Box sx={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid', borderColor: 'divider', height: '100%',
      bgcolor: 'background.paper',
    }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Chats</Typography>
        <Tooltip title="New chat">
          <IconButton size="small" onClick={() => onNew()}
            sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}>
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />

      {/* Sessions list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 0.5 }}>
        {isLoading && (
          <Box sx={{ px: 1.5, py: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={44} sx={{ borderRadius: 2, mb: 0.5 }} />
            ))}
          </Box>
        )}

        {!isLoading && sessions.length === 0 && (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <ChatOutlined sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No chats yet. Start a new one!
            </Typography>
          </Box>
        )}

        <List dense sx={{ px: 1 }}>
          {sessions.map(s => {
            const saved = preferences[s.id] ?? {}
            const Icon = CHAT_ICONS.find(option => option.value === saved.icon)?.Icon ?? ChatOutlined
            const color = saved.color ?? CHAT_COLORS[0].value

            return (
            <ListItem key={s.id} disablePadding
              secondaryAction={
                <Tooltip title="Chat options">
                  <IconButton size="small" edge="end"
                    onClick={(e) => openMenu(e, s)}
                    sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 }, color: 'text.disabled' }}>
                    <MoreVert sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              }
              sx={{
                mb: 0.25,
                '&:hover .MuiIconButton-root': { opacity: 1 },
              }}
            >
              <ListItemButton
                selected={s.id === activeSessionId}
                onClick={() => onSelect(s)}
                sx={{
                  borderRadius: 2, pr: 4,
                  '&.Mui-selected': { bgcolor: `${color}14`, color },
                  '&.Mui-selected:hover': { bgcolor: `${color}20` },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color }}>
                  <Icon sx={{ fontSize: 17 }} />
                </ListItemIcon>
                <ListItemText
                  primary={truncate(saved.title || s.title || 'Untitled chat', 32)}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <span>{s.messageCount} messages</span>
                      <span>·</span>
                      <span>{formatDate(s.updatedAt)}</span>
                    </Box>
                  }
                  primaryTypographyProps={{
                    fontSize: '0.8125rem',
                    fontWeight: s.id === activeSessionId ? 600 : 400,
                    color: s.id === activeSessionId ? color : 'text.primary',
                  }}
                  secondaryTypographyProps={{ fontSize: '0.72rem' }}
                />
              </ListItemButton>
            </ListItem>
            )
          })}
        </List>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => openEditor(menuSession)}>
          <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
          Rename and customize
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeletingSession(menuSession)
            setMenuAnchor(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}><DeleteOutline fontSize="small" /></ListItemIcon>
          Delete chat
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Customize chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Chat name"
            value={editTitle}
            onChange={event => setEditTitle(event.target.value)}
            inputProps={{ maxLength: 80 }}
            sx={{ mt: 1, mb: 2.5 }}
          />
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Color</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
            {CHAT_COLORS.map(option => (
              <Tooltip key={option.value} title={option.name}>
                <IconButton
                  aria-label={`${option.name} color`}
                  aria-pressed={editColor === option.value}
                  onClick={() => setEditColor(option.value)}
                  sx={{
                    width: 32, height: 32, bgcolor: option.value,
                    border: editColor === option.value ? '3px solid' : '2px solid transparent',
                    borderColor: editColor === option.value ? 'text.primary' : 'transparent',
                    '&:hover': { bgcolor: option.value, opacity: 0.85 },
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Icon</Typography>
          <Stack direction="row" spacing={1}>
            {CHAT_ICONS.map(({ name, value, Icon }) => (
              <Tooltip key={value} title={name}>
                <IconButton
                  aria-label={`${name} icon`}
                  aria-pressed={editIcon === value}
                  onClick={() => setEditIcon(value)}
                  sx={{
                    color: editColor,
                    border: '1px solid',
                    borderColor: editIcon === value ? editColor : 'divider',
                    bgcolor: editIcon === value ? `${editColor}14` : 'transparent',
                  }}
                >
                  <Icon />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingSession(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={savePreferences}
            disabled={!editTitle.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingSession)}
        title="Delete chat?"
        message={`“${preferences[deletingSession?.id]?.title || deletingSession?.title || 'Untitled chat'}” and its conversation history will be permanently deleted.`}
        onCancel={() => setDeletingSession(null)}
        onConfirm={confirmDelete}
        confirmLabel={deleteSession.isPending ? 'Deleting…' : 'Delete chat'}
        confirmDisabled={deleteSession.isPending}
      />
    </Box>
  )
}
