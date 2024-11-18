export interface GotifyMessage {
  id: number
  appid: number
  message: string
  title: string
  priority: number
  date: string
  extras?: Record<string, any>
  read?: boolean
  type: 'authentication_success' | 'authentication_error' | 'message' | 'error' | 'ping'
}