import api from './axiosInstance'
const searchService = {
  search({ query, topK = 5, minScore = 0.70, documentId }) {
    return api.post('/v1/search', { query, topK, minScore, documentId })
  },
}
export default searchService
