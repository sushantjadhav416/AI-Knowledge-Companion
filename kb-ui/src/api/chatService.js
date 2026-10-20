import api from './axiosInstance'
const BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const chatService = {
  createSession(documentId, title) {
    const params = {}
    if (documentId) params.documentId = documentId
    if (title) params.title = title
    return api.post('/v1/chat/sessions', null, { params })
  },
  getSessions()              { return api.get('/v1/chat/sessions') },
  getHistory(sessionId)      { return api.get(`/v1/chat/sessions/${sessionId}/history`) },
  deleteSession(sessionId)   { return api.delete(`/v1/chat/sessions/${sessionId}`) },
  chat(payload)              { return api.post('/v1/chat', payload) },
  chatStream(payload, onToken, onDone, onError, onSources) {
    const ctrl = new AbortController()
    fetch(`${BASE}/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Chat stream failed (${res.status})`)
      }
      if (!res.body) throw new Error('Chat stream returned an empty response.')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventName = 'message'
      let eventData = []
      let completed = false
      let failed = false

      const failStream = (error) => {
        if (failed) return
        failed = true
        onError?.(error)
      }

      const publishSources = (value) => {
        const isSource = (item) => item && typeof item === 'object' &&
          ('documentId' in item || 'documentName' in item) &&
          ('pageNumber' in item || 'score' in item)
        const sources = Array.isArray(value)
          ? value
          : isSource(value)
            ? [value]
            : value?.sources ?? value?.citations
        if (Array.isArray(sources)) onSources?.(sources)
      }

      const publishData = (data) => {
        if (failed || completed) return

        if (eventName === 'done' || data === '[DONE]') {
          completed = true
          onDone?.()
          return
        }

        if (eventName === 'error') {
          failStream(new Error(data || 'The chat stream returned an error.'))
          return
        }

        if (eventName === 'sources' || eventName === 'citation' || eventName === 'citations') {
          try {
            publishSources(JSON.parse(data))
          } catch {
            failStream(new Error('Chat stream returned invalid source metadata.'))
          }
          return
        }

        let value = data
        try {
          value = JSON.parse(data)
        } catch {
          // Plain text SSE data is the common token format.
        }

        if (typeof value === 'string') {
          onToken(value)
          return
        }

        if (Array.isArray(value)) {
          const looksLikeSources = value.every(item =>
            item && typeof item === 'object' &&
            ('documentId' in item || 'documentName' in item) &&
            ('pageNumber' in item || 'score' in item)
          )
          if (looksLikeSources) publishSources(value)
          else onToken(data)
          return
        }

        if (value && typeof value === 'object') {
          publishSources(value)
          const token = value.token ?? value.content ?? value.delta ??
            value.answer ?? value.response ?? value.text ?? value.message
          if (typeof token === 'string') onToken(token)
          return
        }

        onToken(data)
      }

      const dispatchEvent = () => {
        if (eventData.length) publishData(eventData.join('\n'))
        eventName = 'message'
        eventData = []
      }

      const processLine = (line) => {
        if (!line) {
          dispatchEvent()
          return
        }
        if (line.startsWith(':')) return

        const separator = line.indexOf(':')
        const field = separator === -1 ? line : line.slice(0, separator)
        const fieldValue = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '')

        if (field === 'event') eventName = fieldValue
        if (field === 'data') eventData.push(fieldValue)
      }

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        let lineEnd
        while ((lineEnd = buffer.search(/[\r\n]/)) !== -1) {
          if (buffer[lineEnd] === '\r' && lineEnd === buffer.length - 1 && !done) break
          const line = buffer.slice(0, lineEnd)
          const delimiterLength = buffer[lineEnd] === '\r' && buffer[lineEnd + 1] === '\n' ? 2 : 1
          buffer = buffer.slice(lineEnd + delimiterLength)
          processLine(line)
        }
        if (done) break
      }

      if (buffer) processLine(buffer)
      dispatchEvent()
      if (!completed && !failed) {
        completed = true
        onDone?.()
      }
    }).catch((e) => {
      if (e.name !== 'AbortError') onError?.(e)
    })
    return () => ctrl.abort()
  },
}
export default chatService
