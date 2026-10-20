export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function truncate(str, max = 50) {
  if (!str) return ''
  return str.length <= max ? str : str.slice(0, max - 3) + '...'
}

export function getFileTypeIcon(fileType) {
  const map = { PDF: '📄', DOCX: '📝', TXT: '📃', MD: '📋' }
  return map[fileType?.toUpperCase()] ?? '📁'
}

export const STATUS_CONFIG = {
  UPLOADING:  { label: 'Uploading',  pulse: true  },
  PROCESSING: { label: 'Processing', pulse: true  },
  READY:      { label: 'Ready',      pulse: false },
  FAILED:     { label: 'Failed',     pulse: false },
}

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
}

export const ACCEPTED_EXTENSIONS = '.pdf, .docx, .txt, .md'
