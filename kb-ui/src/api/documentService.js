import api from './axiosInstance'

const documentService = {
  upload(file, onProgress) {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/v1/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
    })
  },
  getAll()       { return api.get('/v1/documents') },
  getById(id)    { return api.get(`/v1/documents/${id}`) },
  getStatus(id)  { return api.get(`/v1/documents/${id}/status`) },
  search(q)      { return api.get('/v1/documents/search', { params: { q } }) },
  delete(id)     { return api.delete(`/v1/documents/${id}`) },
  getDownloadUrl(id) {
    return `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/documents/${id}/download`
  },
}

export default documentService
