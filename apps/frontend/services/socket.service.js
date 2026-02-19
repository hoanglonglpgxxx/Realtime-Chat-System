import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    /**
     * Kết nối Socket.IO
     * @param {string} userId - ID của user hiện tại
     */
    connect(userId) {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return this.socket;
        }

        // Use relative path to go through Nginx proxy
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

        console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            path: '/socket.io',
            auth: {
                userId: userId,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            upgrade: true,
            rememberUpgrade: true,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
            this.connected = true;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Join room để nhận tin nhắn
     * @param {string} roomId 
     */
    joinRoom(roomId) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        console.log(`\n🔗 [SOCKET-SERVICE] Emitting joinRoom event for: ${roomId}`);
        this.socket.emit('joinRoom', { roomId });
    }

    /**
     * Leave room
     * @param {string} roomId 
     */
    leaveRoom(roomId) {
        if (!this.socket) return;

        this.socket.emit('leaveRoom', { roomId });
        console.log(`👋 Leaving room: ${roomId}`);
    }

    /**
     * Lắng nghe tin nhắn mới
     * @param {Function} callback 
     */
    onNewMessage(callback) {
        if (!this.socket) return;

        console.log('🎧 [SOCKET-SERVICE] Registering listener for: new_message');

        this.socket.on('new_message', (data) => {
            console.log('🔔 [SOCKET-SERVICE] Raw event received: new_message');
            console.log('📦 [SOCKET-SERVICE] Raw data:', data);
            callback(data);
        });
    }

    /**
     * Lắng nghe user typing
     * @param {Function} callback 
     */
    onTyping(callback) {
        if (!this.socket) return;

        this.socket.on('typing', (data) => {
            callback(data);
        });
    }

    /**
     * Lắng nghe user stop typing
     * @param {Function} callback 
     */
    onStopTyping(callback) {
        if (!this.socket) return;

        this.socket.on('stop_typing', (data) => {
            callback(data);
        });
    }

    /**
     * Emit typing event
     * @param {string} roomId 
     */
    sendTyping(roomId) {
        if (!this.socket) return;

        this.socket.emit('typing', { roomId });
    }

    /**
     * Emit stop typing event
     * @param {string} roomId 
     */
    sendStopTyping(roomId) {
        if (!this.socket) return;

        this.socket.emit('stop_typing', { roomId });
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    /**
     * Get socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.socket?.connected;
    }
}

// Export class (not singleton) to allow multiple instances if needed
export default SocketService;
