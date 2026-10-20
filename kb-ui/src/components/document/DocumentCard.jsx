import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, CardContent, CardActionArea, Box, Typography,
  IconButton, Tooltip, Chip, Menu, MenuItem, ListItemIcon,
} from '@mui/material'
import {
  MoreVert, DeleteOutline, DownloadOutlined,
  LayersOutlined, ChatOutlined,
} from '@mui/icons-material'
import StatusBadge from '../common/StatusBadge'
import ConfirmDialog from '../common/ConfirmDialog'
import { useDeleteDocument } from '../../hooks/useDocuments'
import { getFileTypeIcon, formatFileSize, formatDate, truncate } from '../../utils'
import documentService from '../../api/documentService'

export default function DocumentCard({ doc }) {
  const navigate = useNavigate()
  const { mutate: deleteDoc } = useDeleteDocument()

  const [anchorEl, setAnchorEl]     = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuOpen = Boolean(anchorEl)

  function handleMenuClick(e) {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  function handleDownload(e) {
    e.stopPropagation()
    window.open(documentService.getDownloadUrl(doc.id), '_blank')
    setAnchorEl(null)
  }

  function handleChat(e) {
    e.stopPropagation()
    navigate(`/chat?documentId=${doc.id}`)
    setAnchorEl(null)
  }

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <CardActionArea
          onClick={() => navigate(`/documents/${doc.id}`)}
          sx={{ flexGrow: 1, alignItems: 'flex-start', display: 'flex', flexDirection: 'column', p: 0 }}
        >
          {/* Header strip */}
          <Box sx={{
            width: '100%', px: 2, pt: 2, pb: 1.5,
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
          }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: '#F5F4FC', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 24,
            }}>
              {getFileTypeIcon(doc.fileType)}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ mb: 0.25, lineHeight: 1.3 }}>
                {truncate(doc.originalName, 40)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(doc.fileSizeBytes)} · {formatDate(doc.createdAt)}
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ pt: 0, pb: '12px !important', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <StatusBadge status={doc.status} />
              {doc.status === 'READY' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LayersOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {doc.chunkCount} chunks
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Tags */}
            {doc.tags?.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {doc.tags.slice(0, 3).map(tag => (
                  <Chip key={tag} label={tag} size="small" sx={{
                    height: 18, fontSize: '0.65rem',
                    bgcolor: '#EEF0FF', color: '#3D32B8', fontWeight: 500,
                  }} />
                ))}
                {doc.tags.length > 3 && (
                  <Chip label={`+${doc.tags.length - 3}`} size="small"
                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#F0F0F0' }} />
                )}
              </Box>
            )}

            {/* Summary preview — FIX: removed duplicate display key */}
            {doc.summary && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mt: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {doc.summary}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>

        {/* Action menu button */}
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, color: 'text.disabled' }}
        >
          <MoreVert fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={anchorEl} open={menuOpen}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: 3 } }}
        >
          <MenuItem onClick={handleChat} disabled={doc.status !== 'READY'}>
            <ListItemIcon><ChatOutlined fontSize="small" /></ListItemIcon>
            Chat about this
          </MenuItem>
          <MenuItem onClick={handleDownload}>
            <ListItemIcon><DownloadOutlined fontSize="small" /></ListItemIcon>
            Download
          </MenuItem>
          <MenuItem
            onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); setAnchorEl(null) }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete document?"
        message={`"${doc.originalName}" and all its vectors will be permanently deleted.`}
        onConfirm={() => { deleteDoc(doc.id); setConfirmOpen(false) }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
