import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Select, MenuItem, FormControl,
  InputLabel, Divider, Alert, Button,
} from '@mui/material'
import { ChatOutlined, AutoAwesome, ForumOutlined, SchoolOutlined, WorkOutline } from '@mui/icons-material'
import SessionList from '../components/chat/SessionList'
import MessageBubble from '../components/chat/MessageBubble'
import StreamingBubble from '../components/chat/StreamingBubble'
import ChatInput from '../components/chat/ChatInput'
import PageLoader from '../components/common/PageLoader'
import EmptyState from '../components/common/EmptyState'
import { useCreateSession, useStreamingChat } from '../hooks/useChat'
import { useDocuments } from '../hooks/useDocuments'
import useChatPreferences from '../hooks/useChatPreferences'
import chatService from '../api/chatService'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { data: documents = [] } = useDocuments()
  const { mutateAsync: createSession } = useCreateSession()
  const { startStream, cancelStream, streamingText, isStreaming } = useStreamingChat()
  const { preferences, updatePreference, removePreference } = useChatPreferences()

  const [activeSession, setActiveSession]  = useState(null)
  const [messages, setMessages]            = useState([])
  const [scopeDocId, setScopeDocId]        = useState('')
  const [loading, setLoading]              = useState(false)

  const bottomRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Load history when session changes
  async function loadHistory(session) {
    setActiveSession(session)
    setScopeDocId(preferences[session.id]?.documentId ?? session.documentId ?? '')
    setLoading(true)
    try {
      const res = await chatService.getHistory(session.id)
      setMessages(res.data.data ?? [])
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // New session
  async function handleNewSession(initialDocumentId) {
    const docId = initialDocumentId || scopeDocId || undefined
    const res = await createSession({ documentId: docId, title: 'New Chat' })
    const session = res.data.data
    if (docId) updatePreference(session.id, { documentId: docId })
    setActiveSession(session)
    setScopeDocId(docId || '')
    setMessages([])
  }

  function handleDeleteSession(sessionId) {
    removePreference(sessionId)
    if (activeSession?.id !== sessionId) return
    cancelStream()
    setActiveSession(null)
    setMessages([])
    setScopeDocId('')
  }

  function handleScopeChange(documentId) {
    setScopeDocId(documentId)
    if (activeSession) updatePreference(activeSession.id, { documentId })
  }

  // Auto-create session if ?documentId= param present and no session active
  useEffect(() => {
    const docId = searchParams.get('documentId')
    if (docId && !activeSession) {
      setScopeDocId(docId)
      handleNewSession(docId)
    }
  }, [])

  // Send message via streaming
  const handleSend = useCallback(async (question) => {
    if (!activeSession) return

    // Optimistically add user message
    const userMsg = { id: Date.now(), role: 'USER', content: question, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    startStream(
      { question, sessionId: activeSession.id, documentId: scopeDocId || undefined },
      // onComplete — add final assistant message
      (fullAnswer, sources) => {
        const assistantMsg = {
          id: Date.now() + 1, role: 'ASSISTANT',
          content: fullAnswer, sources, createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMsg])
      }
    )
  }, [activeSession, scopeDocId, startStream])

  const readyDocs = documents.filter(d => d.status === 'READY')
  const activePreferences = activeSession ? preferences[activeSession.id] ?? {} : {}
  const chatIcons = {
    chat: ChatOutlined,
    forum: ForumOutlined,
    ideas: AutoAwesome,
    study: SchoolOutlined,
    work: WorkOutline,
  }
  const ActiveChatIcon = chatIcons[activePreferences.icon] ?? ChatOutlined
  const activeColor = activePreferences.color ?? 'primary.main'

  return (
    <Box sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* Session sidebar */}
      <SessionList
        activeSessionId={activeSession?.id}
        onSelect={loadHistory}
        onNew={handleNewSession}
        preferences={preferences}
        onUpdatePreference={updatePreference}
        onDeleted={handleDeleteSession}
      />

      {/* Main chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <Box sx={{
          px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2,
          minHeight: 56,
        }}>
          <ActiveChatIcon sx={{ color: activeColor }} />
          <Typography variant="h5" sx={{ flex: 1 }}>
            {activePreferences.title || activeSession?.title || 'Chat'}
          </Typography>

          {/* Document scope selector */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Scope to document</InputLabel>
            <Select
              value={scopeDocId}
              onChange={e => handleScopeChange(e.target.value)}
              label="Scope to document"
              sx={{ borderRadius: 2, fontSize: '0.8125rem' }}
            >
              <MenuItem value=""><em>All documents</em></MenuItem>
              {readyDocs.map(d => (
                <MenuItem key={d.id} value={d.id}>
                  {d.originalName.length > 35 ? d.originalName.slice(0, 35) + '…' : d.originalName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Messages area */}
        {!activeSession ? (
          <EmptyState
            icon="💬"
            title="Start a conversation"
            description="Select an existing chat from the sidebar or start a new one."
            action={() => handleNewSession()}
            actionLabel="New Chat"
          />
        ) : loading ? (
          <PageLoader message="Loading conversation…" />
        ) : (
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>

            {/* No documents warning */}
            {readyDocs.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}
                action={<Button size="small" onClick={() => navigate('/')}>Go to Library</Button>}>
                No ready documents yet. Upload one to chat with your knowledge base.
              </Alert>
            )}

            {/* Empty session */}
            {messages.length === 0 && !isStreaming && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ChatOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
                  Ask anything about your documents
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  KnowBuddy will search your uploaded documents and answer with cited sources.
                </Typography>
              </Box>
            )}

            {/* Message history */}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id || i}
                message={msg}
                sources={msg.role === 'ASSISTANT' ? msg.sources ?? [] : []}
              />
            ))}

            {/* Streaming response */}
            {isStreaming && <StreamingBubble text={streamingText} />}

            <div ref={bottomRef} />
          </Box>
        )}

        {/* Input */}
        {activeSession && (
          <ChatInput
            onSend={handleSend}
            onStop={cancelStream}
            isStreaming={isStreaming}
            disabled={loading}
          />
        )}
      </Box>
    </Box>
  )
}
