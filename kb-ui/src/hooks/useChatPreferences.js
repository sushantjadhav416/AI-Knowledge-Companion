import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'knowbuddy.chat-preferences.v1'

function readPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    const parsed = JSON.parse(saved)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    toast.error('Saved chat preferences have an invalid format.')
    return {}
  } catch {
    toast.error('Could not load saved chat preferences.')
    return {}
  }
}

function persistPreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    return true
  } catch {
    toast.error('Could not save chat preferences.')
    return false
  }
}

export default function useChatPreferences() {
  const [preferences, setPreferences] = useState(readPreferences)

  const updatePreference = useCallback((sessionId, updates) => {
    const next = {
      ...preferences,
      [sessionId]: { ...preferences[sessionId], ...updates },
    }

    if (persistPreferences(next)) setPreferences(next)
  }, [preferences])

  const removePreference = useCallback((sessionId) => {
    const next = { ...preferences }
    delete next[sessionId]

    if (persistPreferences(next)) setPreferences(next)
  }, [preferences])

  return { preferences, updatePreference, removePreference }
}
