import { 
  addMessage, 
  setConnectionStatus, 
  setError 
} from '@store/features/notificationSlice'
import { store } from '@store/store'

export class GotifyWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts: number = 0
  private readonly maxReconnectAttempts: number = 5
  private readonly connectionTimeout: number = 15000

  constructor(url: string, token: string) {
    if (!url || !token) {
      throw new Error('Gotify URL and token are required')
    }

    // Direkte URL-Verwendung für initiales Testing
    this.url = 'wss://gotify.dev-ff.q23.de'
    this.token = token

    console.log('Initializing Gotify service with:', {
      url: this.url,
      tokenLength: token.length // Log token length for debugging
    })
  }

  public async connect(): Promise<void> {
    console.log('Connect called, current state:', {
      hasExistingWs: !!this.ws,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts
    });
  
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected to Gotify');
      return;
    }
  
    store.dispatch(setConnectionStatus('connecting'));
  
    try {
      // Token als Query-Parameter an die URL anhängen
      const wsUrl = `${this.url}/stream?token=${this.token}`;
      console.log('Attempting connection to:', wsUrl);
  
      this.ws = new WebSocket(wsUrl);
      console.log('WebSocket instance created');
  
      const connectionTimeoutId = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.log('Connection timed out');
          this.ws.close();
          this.scheduleReconnect();
        }
      }, this.connectionTimeout);
  
      this.setupWebSocketHandlers(connectionTimeoutId);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      store.dispatch(setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      this.scheduleReconnect();
    }
  }
  
  private setupWebSocketHandlers(connectionTimeoutId: NodeJS.Timeout): void {
    if (!this.ws) {
      console.error('No WebSocket instance available')
      return
    }

    this.ws.onopen = () => {
      console.log('WebSocket connection opened, sending authorization')
      
      try {
        // Send authorization immediately
        this.ws?.send(JSON.stringify({
          type: 'Authorization',
          token: `Bearer ${this.token}`
        }))
        
        console.log('Authorization sent')
      } catch (error) {
        console.error('Failed to send authorization:', error)
      }
    }

    this.ws.onmessage = (event) => {
      console.log('Received message:', event.data)
      
      try {
        const message = JSON.parse(event.data)
        console.log('Parsed message:', message)
        
        store.dispatch(addMessage(message))
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', {
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean
      })

      clearTimeout(connectionTimeoutId)
      store.dispatch(setConnectionStatus('disconnected'))
      this.scheduleReconnect()
    }

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event)
      store.dispatch(setConnectionStatus('error'))
      store.dispatch(setError('Connection error occurred'))
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect()
    }, delay)
  }

  public disconnect(): void {
    console.log('Disconnect called')
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.reconnectAttempts = 0
    store.dispatch(setConnectionStatus('disconnected'))
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}