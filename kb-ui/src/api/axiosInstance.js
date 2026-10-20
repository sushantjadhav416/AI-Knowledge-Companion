import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong'
    const isPolling = err.config?.url?.includes('/status')
    if (!isPolling) toast.error(msg, { duration: 4000 })
    return Promise.reject(err)
  }
)

export default api
