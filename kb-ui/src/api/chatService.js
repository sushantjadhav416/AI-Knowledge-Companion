import api from './axiosInstance'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const chatService = {
  createSession(documentId, title) {
    const params = {}
    if (documentId) params.documentId = documentId
    if (title) params.title = title
    return api.post('/v1/chat/sessions', null, { params })
  },
  getSessions()            { return api.get('/v1/chat/sessions') },
  getHistory(sessionId)    { return api.get(`/v1/chat/sessions/${sessionId}/history`) },
  deleteSession(sessionId) { return api.delete(`/v1/chat/sessions/${sessionId}`) },
  chat(payload)            { return api.post('/v1/chat', payload) },

  /**
   * Streams an answer over Server-Sent Events.
   * The server sends: unnamed events holding one token each, then `event: sources` with a JSON
   * array of citations, then `event: done`.
   * Frames are split on blank lines. A token's leading space is part of the token, so only the
   * "data:" prefix is removed (never trimmed). Multi-line tokens arrive as several data lines.
   * Returns a function that cancels the stream.
   */
  chatStream(payload, { onToken, onSources, onDone, onError } = {}) {
    const controller = new AbortController()
    let finished = false
    const finish = () => { if (!finished) { finished = true; onDone?.() } }

    const dispatch = (frame) => {
      let event = 'message'
      const data = []
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5))
      }
      if (data.length === 0) return
      const text = data.join('\n')
      if (event === 'sources') {
        try { onSources?.(JSON.parse(text)) } catch { /* ignore malformed sources */ }
      } else if (event === 'done') {
        finish()
      } else {
        onToken?.(text)
      }
    }

    ;(async () => {
      try {
        const res = await fetch(`${BASE}/v1/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error(`Chat request failed (${res.status})`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
          let boundary
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            dispatch(buffer.slice(0, boundary))
            buffer = buffer.slice(boundary + 2)
          }
        }
        if (buffer.trim()) dispatch(buffer)
        finish()
      } catch (e) {
        if (e.name !== 'AbortError') onError?.(e)
      }
    })()

    return () => controller.abort()
  },
}

export default chatService
