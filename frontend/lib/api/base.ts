import { apiClient } from './client'

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export const fetchApi = async <T = any>(
  endpoint: string,
  options: {
    method?: string
    body?: string
    headers?: Record<string, string>
  } = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', body, headers = {} } = options

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    data: body ? JSON.parse(body) : undefined,
  }

  try {
    const response = await apiClient({
      url: endpoint,
      ...config,
    })

    return {
      data: response.data,
      success: true,
      message: response.data?.message,
    }
  } catch (error: any) {
    throw {
      data: null,
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred',
    }
  }
}
