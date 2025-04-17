// WebSocket connection management
let socket: WebSocket | null = null;
let reconnectInterval: number | null = null;
const eventListeners: Record<string, Set<(data: any) => void>> = {};

// Initialize WebSocket connection
export function initializeWebSocket(userId: string): WebSocket {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }
  
  closeWebSocketConnection();
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    
    // Authenticate the connection
    socket.send(JSON.stringify({
      type: 'AUTHENTICATE',
      userId: userId
    }));
    
    // Clear any reconnect interval
    if (reconnectInterval !== null) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Handle specific message types
      if (message.type && eventListeners[message.type]) {
        eventListeners[message.type].forEach(listener => {
          listener(message.data);
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = (event) => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Set up reconnection if not a clean close
    if (event.code !== 1000) {
      reconnectInterval = window.setInterval(() => {
        if (socket?.readyState !== WebSocket.OPEN) {
          initializeWebSocket(userId);
        }
      }, 5000);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return socket;
}

// Close WebSocket connection
export function closeWebSocketConnection(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectInterval !== null) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

// Add event listener for a specific message type
export function addWebSocketListener(
  eventType: string, 
  callback: (data: any) => void
): () => void {
  if (!eventListeners[eventType]) {
    eventListeners[eventType] = new Set();
  }
  
  eventListeners[eventType].add(callback);
  
  // Return a function to remove this specific listener
  return () => {
    if (eventListeners[eventType]) {
      eventListeners[eventType].delete(callback);
    }
  };
}

// Send a message through the WebSocket
export function sendWebSocketMessage(type: string, data: any): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type,
      data
    }));
  } else {
    console.error('WebSocket not connected');
  }
}

// Check if WebSocket is connected
export function isWebSocketConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}
