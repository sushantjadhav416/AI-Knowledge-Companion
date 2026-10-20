import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Tooltip, IconButton,
} from '@mui/material'
import {
  LibraryBooks, Chat, Search, Style,
  Settings, AutoAwesome, ChevronLeft, ChevronRight,
} from '@mui/icons-material'

const DRAWER_FULL = 240
const DRAWER_MINI = 64

const NAV = [
  { label: 'Library',    path: '/',           icon: <LibraryBooks /> },
  { label: 'Chat',       path: '/chat',        icon: <Chat />         },
  { label: 'Search',     path: '/search',      icon: <Search />       },
  { label: 'Flashcards', path: '/flashcards',  icon: <Style />        },
  { label: 'Settings',   path: '/settings',    icon: <Settings />     },
]

export default function Sidebar() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const width = collapsed ? DRAWER_MINI : DRAWER_FULL

  return (
    <Drawer variant="permanent" sx={{
      width, flexShrink: 0,
      '& .MuiDrawer-paper': {
        width, boxSizing: 'border-box',
        overflow: 'hidden', transition: 'width .22s ease',
        borderRight: '1px solid', borderColor: 'divider',
      },
    }}>
      {/* Logo */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: 2.2, minHeight: 64,
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <AutoAwesome sx={{ color: 'primary.main', fontSize: 26, flexShrink: 0 }} />
        {!collapsed && (
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '-0.02em' }}>
            KnowBuddy
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {NAV.map(({ label, path, icon }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path))
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
              <Tooltip title={collapsed ? label : ''} placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => navigate(path)}
                  sx={{ borderRadius: 2, px: collapsed ? 1.5 : 1.5, py: 1 }}
                >
                  <ListItemIcon sx={{
                    minWidth: collapsed ? 0 : 38, color: active ? 'primary.main' : 'text.secondary',
                  }}>
                    {icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                        color: active ? 'primary.main' : 'text.primary',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}
      </List>

      {/* Collapse toggle */}
      <Divider />
      <Box sx={{ p: 1, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <IconButton size="small" onClick={() => setCollapsed(c => !c)}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
    </Drawer>
  )
}
