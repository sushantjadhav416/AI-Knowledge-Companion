import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import chatService from '../api/chatService'
import toast from 'react-hot-toast'

// ── Sessions ──────────────────────────────────────────────────────────────────
export function useSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const res = await chatService.getSessions()
      return res.data.data ?? []
    },
    staleTime: 30_000,
  })
}

export function useSessionHistory(sessionId) {
  return useQuery({
    queryKey: ['chat-history', sessionId],
    queryFn: async () => {
      const res = await chatService.getHistory(sessionId)
      return res.data.data ?? []
    },
    enabled: !!sessionId,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, title }) => chatService.createSession(documentId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-sessions'] }),
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId) => chatService.deleteSession(sessionId),
    onSuccess: () => {
      toast.success('Session deleted')
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
  })
}

// ── Blocking chat ─────────────────────────────────────────────────────────────
export function useSendMessage() {
  return useMutation({
    mutationFn: (payload) => chatService.chat(payload),
  })
}

// ── Streaming chat hook ───────────────────────────────────────────────────────
export function useStreamingChat() {
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming]     = useState(false)
  const [sources, setSources]            = useState([])
  const abortRef = useRef(null)

  const startStream = useCallback((payload, onComplete) => {
    setStreamingText('')
    setSources([])
    setIsStreaming(true)

    let accumulated = ''
    let streamSources = []

    abortRef.current = chatService.chatStream(
      payload,
      // onToken
      (token) => {
        accumulated += token
        setStreamingText(accumulated)
      },
      // onDone
      () => {
        setIsStreaming(false)
        onComplete?.(accumulated, streamSources)
      },
      // onError
      (err) => {
        setIsStreaming(false)
        toast.error('Streaming failed: ' + err.message)
      },
      (nextSources) => {
        streamSources = nextSources
        setSources(nextSources)
      }
    )
  }, [])

  const cancelStream = useCallback(() => {
    abortRef.current?.()
    setIsStreaming(false)
  }, [])

  return { streamingText, isStreaming, sources, startStream, cancelStream }
}
