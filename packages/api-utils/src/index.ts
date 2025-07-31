export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
}

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data
  }
}

export function createErrorResponse(error: string, message?: string): ApiErrorResponse {
  return {
    success: false,
    error,
    message
  }
}

export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return !response.success
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success
}