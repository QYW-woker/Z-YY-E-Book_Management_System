import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建axios实例
const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是 blob 响应，直接返回完整 response
    if (response.config.responseType === 'blob') {
      return response
    }

    const data = response.data as ApiResponse

    // 业务错误处理
    if (data.code !== 0) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    return data.data
  },
  async (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          // Token过期，尝试刷新
          const authStore = useAuthStore()
          const refreshed = await authStore.refreshAuthToken()
          if (refreshed) {
            // 重试原请求
            return instance.request(error.config)
          }
          // 刷新失败，跳转登录
          ElMessage.error('登录已过期，请重新登录')
          authStore.logout()
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error(data?.message || '服务器错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config)
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch(url, data, config)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config)
  },

  // 文件上传
  upload<T = any>(url: string, file: File | FormData, onProgress?: (progress: number) => void): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      formData.append('file', file)
    }

    return instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },

  // 文件下载
  async download(url: string, filename?: string): Promise<void> {
    const response = await instance.get(url, {
      responseType: 'blob',
    })

    // 从响应头获取文件名
    const contentDisposition = response.headers?.['content-disposition']
    let downloadFilename = filename
    if (!downloadFilename && contentDisposition) {
      const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)['"]?/i)
      if (match) {
        downloadFilename = decodeURIComponent(match[1])
      }
    }

    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = downloadFilename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  },
}

export default instance
