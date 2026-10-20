import api from './axiosInstance'
const intelligenceService = {
  summarize(id)         { return api.post(`/v1/documents/${id}/intelligence/summarize`) },
  generateTags(id)      { return api.post(`/v1/documents/${id}/intelligence/tags`) },
  generateFlashcards(id){ return api.post(`/v1/documents/${id}/intelligence/flashcards`) },
  getFlashcards(id)     { return api.get(`/v1/documents/${id}/intelligence/flashcards`) },
  enrich(id)            { return api.post(`/v1/documents/${id}/intelligence/enrich`) },
}
export default intelligenceService
