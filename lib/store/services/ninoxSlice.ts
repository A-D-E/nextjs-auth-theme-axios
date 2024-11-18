import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { RootState } from '../store'

// Types
interface RequestOptions {
  filterId?: string
  endpoint2?: string
  urlVars?: string
}

interface LoginResponse {
  jwt: string
  user_id: string
}

interface RegisterResponse {
  jwt: string
  user_id: string
}

interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.authorization = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(error)
  }
)

// API slice with enhanced error handling
export const ninoxSlice = createApi({
  reducerPath: 'ninoxApi',
  tagTypes: ['User', 'Data'],
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', token)
      }
      return headers
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { mail: string; password: string }>({
      query: (credentials) => ({
        url: constructUrl('auth', 'login'),
        method: 'POST',
        body: credentials,
      }),
      transformErrorResponse: (response: FetchBaseQueryError) => {
        if ('status' in response) {
          switch (response.status) {
            case 401:
              return 'Invalid credentials'
            case 404:
              return 'Service not available'
            default:
              return 'Login failed. Please try again.'
          }
        }
        return 'Network error occurred'
      },
    }),
    register: builder.mutation<
      RegisterResponse,
      { mail: string; password: string; name: string }
    >({
      query: (userData) => ({
        url: constructUrl('auth', 'register'),
        method: 'POST',
        body: userData,
      }),
      transformErrorResponse: (response: FetchBaseQueryError) => {
        if ('status' in response) {
          switch (response.status) {
            case 409:
              return 'User already exists'
            case 422:
              return 'Invalid input data'
            default:
              return 'Registration failed. Please try again.'
          }
        }
        return 'Network error occurred'
      },
    }),
    // place for more endpoints
  }),
})

// Helper function to construct URLs
function constructUrl(
  cat: string,
  endpoint: string,
  options?: RequestOptions
): string {
  let url = `/${cat}/${endpoint}`

  if (options?.filterId != null) {
    url += `/${options.filterId}`
    if (options?.endpoint2 != null) {
      url += `/${options.endpoint2}`
    }
  }

  if (options?.urlVars != null) {
    url += options.urlVars
  }

  return url
}

// Generic API methods using axios for custom requests
export const apiService = {
  async getData<T>(
    cat: string,
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = constructUrl(cat, endpoint, options)
      const response = await axiosInstance.get<ApiResponse<T>>(url)
      return response.data.data
    } catch (error) {
      throw handleError(error as AxiosError<ApiErrorResponse>)
    }
  },

  async postData<T, U>(
    content: U,
    cat: string,
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = constructUrl(cat, endpoint, options)
      const response = await axiosInstance.post<ApiResponse<T>>(url, content)
      return response.data.data
    } catch (error) {
      throw handleError(error as AxiosError<ApiErrorResponse>)
    }
  },

  async patchData<T, U>(
    content: U,
    cat: string,
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = constructUrl(cat, endpoint, options)
      const response = await axiosInstance.patch<ApiResponse<T>>(url, content)
      return response.data.data
    } catch (error) {
      throw handleError(error as AxiosError<ApiErrorResponse>)
    }
  },

  async putData<T, U>(
    content: U,
    cat: string,
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = constructUrl(cat, endpoint, options)
      const response = await axiosInstance.put<ApiResponse<T>>(url, content)
      return response.data.data
    } catch (error) {
      throw handleError(error as AxiosError<ApiErrorResponse>)
    }
  },

  async deleteData(
    cat: string,
    endpoint: string,
    filterId: string
  ): Promise<void> {
    try {
      const url = constructUrl(cat, endpoint, { filterId })
      await axiosInstance.delete(url)
    } catch (error) {
      throw handleError(error as AxiosError<ApiErrorResponse>)
    }
  },

  // Upload file method
  async uploadFile(file: File, cat: string, endpoint: string): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      const url = constructUrl(cat, endpoint)
      const response = await axiosInstance.post<ApiResponse<string>>(
        url,
        formData,
        config
      )
      return response.data.data
    } catch (error) {
      throw handleError(error as AxiosError<ApiErrorResponse>)
    }
  },
}

// Error handling helper with specific error types
interface ApiErrorResponse {
  message: string
  code?: string
  details?: any
}

function handleError(error: AxiosError<ApiErrorResponse>): Error {
  console.error('API Error:', error)

  if (error.response) {
    const message = error.response.data?.message
    switch (error.response.status) {
      case 400:
        return new Error(message || 'Bad request')
      case 401:
        return new Error(message || 'Unauthorized access')
      case 403:
        return new Error(message || 'Forbidden access')
      case 404:
        return new Error(message || 'Resource not found')
      case 409:
        return new Error(message || 'Conflict error')
      case 422:
        return new Error(message || 'Validation error')
      case 500:
        return new Error(message || 'Internal server error')
      default:
        return new Error(message || 'An unexpected error occurred')
    }
  }

  if (error.request) {
    return new Error('No response received from server')
  }

  return new Error('Request configuration error')
}

// Export hooks for endpoints
export const { useLoginMutation, useRegisterMutation } = ninoxSlice

// Export additional utility functions if needed
export const selectNinoxApi = (state: RootState) =>
  state[ninoxSlice.reducerPath]
